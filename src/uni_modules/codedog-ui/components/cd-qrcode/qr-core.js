/**
 * 二维码编码核心（零依赖、纯计算）
 * ---------------------------------------------------------------
 * 为什么自己写而不是引 qrcode / qrcodejs：
 *   1. 本库对「新增运行时依赖」有硬约束 —— 装到业务工程里，多一个依赖就多一份
 *      版本冲突与体积负担，而二维码是个**封闭规范**（ISO/IEC 18004），
 *      实现一次就永久固定，没有值得付给别人的持续维护成本；
 *   2. 第三方库的默认输出形态是 canvas / DOM 节点，四端各有各的坑
 *      （见 cd-progress 那条「不用 canvas」的结论）。这里只输出
 *      **布尔矩阵**，渲染方式由 cd-qrcode.vue 决定 —— 计算与渲染彻底解耦。
 *
 * 覆盖范围（刻意裁剪）：
 *   - 版本 1 ~ 10（模块数 21 ~ 57）。版本 10 / M 档可放 213 字节，
 *     短链、口令、Wi-Fi 配置、支付串都在射程内。更长的文本本就不该塞进二维码。
 *   - 纠错档 L / M / Q / H 全支持。
 *   - 只做**字节模式**（UTF-8）。数字/汉字压缩模式的收益是「同一版本多放几个
 *     字符」，代价是多两套编码分支与测试面，不划算。
 *
 * 校验：见 scripts/verify-qr-core.mjs —— 与 npm 上的 qrcode 包**逐个掩模**
 *       逐位比对矩阵，覆盖 4 个纠错档 × 中英数混合 × 长度边界。改这个文件必跑。
 *
 * 实现参照 Nayuki 的 QR Code generator（公有领域），掩模惩罚算法与其保持一致
 * —— 惩罚值只影响「选八个掩模里的哪一个」，任何掩模都能扫，
 * 但与权威实现对齐后，比对脚本才能给出有意义的通过/失败信号。
 */

/* ------------------------------------------------------------------ *
 * 1. 伽罗瓦域 GF(256)
 * ------------------------------------------------------------------ */

/** 本原多项式 0x11d（x^8 + x^4 + x^3 + x^2 + 1） */
const PRIMITIVE = 0x11d

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
;(function initGf() {
  let x = 1
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= PRIMITIVE
  }
  /* 索引翻倍：乘法里的下标相加最大到 254+254，取模省一次分支 */
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255]
})()

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0
  return EXP[LOG[a] + LOG[b]]
}

/**
 * Reed–Solomon 生成多项式：∏(x − α^i)，i ∈ [0, degree)
 * 系数按**降幂**排列，poly[0] 是最高次项系数（恒为 1）。
 */
function rsGenerator(degree) {
  let poly = [1]
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j] // 乘 x：整体左移一位
      next[j + 1] ^= gfMul(poly[j], EXP[i])
    }
    poly = next
  }
  return poly
}

/** 求 data 的 RS 余式（即纠错码字） */
function rsRemainder(data, ecLen) {
  const gen = rsGenerator(ecLen)
  const buf = new Uint8Array(data.length + ecLen)
  buf.set(data)
  for (let i = 0; i < data.length; i += 1) {
    const factor = buf[i]
    if (factor === 0) continue
    for (let j = 0; j < gen.length; j += 1) {
      buf[i + j] ^= gfMul(gen[j], factor)
    }
  }
  return Array.from(buf.subarray(data.length))
}

/* ------------------------------------------------------------------ *
 * 2. 版本参数表
 * ------------------------------------------------------------------ */

/** 版本 1~10 的**总码字数**（含纠错） */
const TOTAL_CODEWORDS = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346]

/**
 * 纠错表。每项是 [每块纠错码字数, 一组块数, 二组块数]。
 *
 * ⚠️ 规范里两组块的**纠错码字数相同**，差别在**数据码字**：二组比一组多 1 个。
 *    这一点极易记反 —— 记反后码字总数依然对得上、图也能画出来，但扫不出来。
 *    所以下面只存三个数，数据码字数一律现算：
 *      数据码字总数 = 总码字 − 每块纠错数 × 总块数
 *      一组每块数据 = (数据码字总数 − 二组块数) / 总块数
 */
const EC_TABLE = {
  L: [
    [7, 1, 0],
    [10, 1, 0],
    [15, 1, 0],
    [20, 1, 0],
    [26, 1, 0],
    [18, 2, 0],
    [20, 2, 0],
    [24, 2, 0],
    [30, 2, 0],
    [18, 2, 2],
  ],
  M: [
    [10, 1, 0],
    [16, 1, 0],
    [26, 1, 0],
    [18, 2, 0],
    [24, 2, 0],
    [16, 4, 0],
    [18, 4, 0],
    [22, 2, 2],
    [22, 3, 2],
    [26, 4, 1],
  ],
  Q: [
    [13, 1, 0],
    [22, 1, 0],
    [18, 2, 0],
    [26, 2, 0],
    [18, 2, 2],
    [24, 4, 0],
    [18, 2, 4],
    [22, 4, 2],
    [20, 4, 4],
    [24, 6, 2],
  ],
  H: [
    [17, 1, 0],
    [28, 1, 0],
    [22, 2, 0],
    [16, 4, 0],
    [22, 2, 2],
    [28, 4, 0],
    [26, 4, 1],
    [26, 4, 2],
    [24, 4, 4],
    [28, 6, 2],
  ],
}

/** 纠错档 → 格式信息里的 2 bit 编码 */
const LEVEL_BITS = { L: 1, M: 0, Q: 3, H: 2 }

/** 版本 2~10 的对齐图案中心坐标（版本 1 没有） */
const ALIGN_POS = {
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
}

/* ------------------------------------------------------------------ *
 * 3. 位流与文本编码
 * ------------------------------------------------------------------ */

function createBitBuffer() {
  const bits = []
  return {
    put(value, length) {
      for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1)
    },
    get length() {
      return bits.length
    },
    /** 末尾补 0 到字节边界 */
    padToByte() {
      while (bits.length % 8 !== 0) bits.push(0)
    },
    /**
     * 按字节读出，不足处填交替填充字节 0xEC / 0x11。
     * 交替（而不是全 0）是规范要求的：全 0 会在图上留下大面积同色块，
     * 干扰掩模惩罚的评估。
     */
    toBytes(targetLen) {
      const out = []
      for (let i = 0; i < bits.length; i += 8) {
        let b = 0
        for (let j = 0; j < 8; j += 1) b = (b << 1) | (bits[i + j] || 0)
        out.push(b)
      }
      let flip = false
      while (out.length < targetLen) {
        out.push(flip ? 0x11 : 0xec)
        flip = !flip
      }
      return out
    },
  }
}

/** UTF-8 编码。小程序端没有 TextEncoder 也不影响：手写一份更可控 */
function utf8Bytes(text) {
  const out = []
  for (let i = 0; i < text.length; i += 1) {
    let code = text.charCodeAt(i)
    /* 代理对：U+D800~U+DBFF 配 U+DC00~U+DFFF */
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = (code - 0xd800) * 0x400 + (next - 0xdc00) + 0x10000
        i += 1
      }
    }
    if (code < 0x80) {
      out.push(code)
    } else if (code < 0x800) {
      out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    } else if (code < 0x10000) {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    } else {
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      )
    }
  }
  return out
}

/* ------------------------------------------------------------------ *
 * 4. 分块与交织
 * ------------------------------------------------------------------ */

function buildCodewords(dataBytes, version, level) {
  const idx = version - 1
  const [ecw, b1, b2] = EC_TABLE[level][idx]
  const totalBlocks = b1 + b2
  const dataTotal = TOTAL_CODEWORDS[idx] - ecw * totalBlocks
  const perBlock1 = (dataTotal - b2) / totalBlocks
  const perBlock2 = perBlock1 + 1

  const dataBlocks = []
  const ecBlocks = []
  let offset = 0
  for (let i = 0; i < totalBlocks; i += 1) {
    const len = i < b1 ? perBlock1 : perBlock2
    const chunk = dataBytes.slice(offset, offset + len)
    offset += len
    dataBlocks.push(chunk)
    ecBlocks.push(rsRemainder(chunk, ecw))
  }

  /* 交织：先按列取数据码字，再按列取纠错码字。
     这样突发污损（比如二维码被蹭掉一块）只会打散到不同块里，仍可纠错。 */
  const out = []
  for (let i = 0; i < perBlock2; i += 1) {
    for (const block of dataBlocks) {
      if (i < block.length) out.push(block[i])
    }
  }
  for (let i = 0; i < ecw; i += 1) {
    for (const block of ecBlocks) out.push(block[i])
  }
  return out
}

/* ------------------------------------------------------------------ *
 * 5. 矩阵构建
 * ------------------------------------------------------------------ */

/** BCH(18,6) 版本信息位。现算而不是抄表 —— 少一处抄错的机会 */
function versionBits(version) {
  let rem = version
  for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
  return (version << 12) | (rem & 0xfff)
}

/** BCH(15,5) 格式信息位 */
function formatBits(level, mask) {
  const data = (LEVEL_BITS[level] << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  return ((data << 10) | (rem & 0x3ff)) ^ 0x5412
}

function buildMatrix(version, codewords) {
  const size = version * 4 + 17
  /* 0 = 未设置，1 = 深，2 = 浅。用三个值是为了区分「还没排」与「排了浅色」，
     掩模阶段只翻转已排的数据位，靠 reserved 表识别 */
  const m = []
  const reserved = []
  for (let i = 0; i < size; i += 1) {
    m.push(new Array(size).fill(0))
    reserved.push(new Array(size).fill(false))
  }
  const setFn = (x, y, dark) => {
    m[y][x] = dark ? 1 : 2
    reserved[y][x] = true
  }

  /* ---- 定时图案：第 6 行 / 列深浅交替（先画，定位图案随后覆盖重叠处）---- */
  for (let i = 0; i < size; i += 1) {
    setFn(6, i, i % 2 === 0)
    setFn(i, 6, i % 2 === 0)
  }

  /* ---- 三个定位图案（回字）+ 外圈分隔符：一个循环搞定 ---- */
  const drawFinder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const x = cx + dx
        const y = cy + dy
        if (x < 0 || y < 0 || x >= size || y >= size) continue
        const d = Math.max(Math.abs(dx), Math.abs(dy))
        setFn(x, y, d !== 2 && d !== 4)
      }
    }
  }
  drawFinder(3, 3)
  drawFinder(size - 4, 3)
  drawFinder(3, size - 4)

  /* ---- 对齐图案：5×5，外圈深、内圈浅、中心深 ---- */
  const pos = ALIGN_POS[version] || []
  const last = pos.length - 1
  for (let i = 0; i <= last; i += 1) {
    for (let j = 0; j <= last; j += 1) {
      /* 三个角上的位置被定位图案占了，规范就是跳过这三个 */
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue
      const cx = pos[j]
      const cy = pos[i]
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          setFn(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
        }
      }
    }
  }

  /* ---- 格式信息区先全部置浅（真实值选定掩模后才写）+ 左下角恒深模块 ----
     ⚠️ 必须跳过下标 6：第 6 行 / 第 6 列是定时图案，那两格不属于格式信息区。
        第一版没跳，把 (6,8) 与 (8,6) 写成了浅色 —— 只错 2 格，肉眼看不出来，
        但扫不出来。比对脚本就是为这种「差一点点」而存在的。 */
  for (let i = 0; i <= 8; i += 1) {
    if (i !== 6) setFn(i, 8, false)
    if (i !== 6) setFn(8, i, false)
  }
  for (let i = 0; i < 8; i += 1) setFn(size - 1 - i, 8, false)
  for (let i = 0; i < 8; i += 1) setFn(8, size - 1 - i, false)
  setFn(8, size - 8, true)

  /* ---- 版本信息区（版本 ≥ 7）：右上 3×6 与左下 6×3 两份拷贝 ---- */
  if (version >= 7) {
    const bits = versionBits(version)
    for (let i = 0; i < 18; i += 1) {
      const dark = ((bits >> i) & 1) === 1
      const a = size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      setFn(a, b, dark)
      setFn(b, a, dark)
    }
  }

  /* ---- 数据位：从右下角起，两列一组蛇形向上 / 向下 ---- */
  let bitIndex = 0
  const total = codewords.length * 8
  for (let right = size - 1; right >= 1; right -= 2) {
    /* 第 6 列是定时图案，整列跳过：改成往左挪一格，
       后续迭代从 5 继续（4→2→…），序列才是 (5,4)(3,2)(1,0)。 */
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? size - 1 - vert : vert
        /* 判据用 m 本身（0 = 还没排过）而不是 reserved：
           reserved 的语义是「功能图案」，掩模阶段靠它决定哪些格子不许翻。
           如果把数据格也标成 reserved，掩模就一格都不会翻 ——
           图能画出来、看着也像二维码，但扫不出来。这个坑踩过一次。 */
        if (m[y][x] !== 0) continue
        let bit = 0
        if (bitIndex < total) {
          bit = (codewords[bitIndex >>> 3] >> (7 - (bitIndex & 7))) & 1
          bitIndex += 1
        }
        m[y][x] = bit ? 1 : 2
      }
    }
  }

  return { m, reserved, size }
}

/* ------------------------------------------------------------------ *
 * 6. 掩模与惩罚
 * ------------------------------------------------------------------ */

/** 八个掩模函数。参数 (x, y) = (列, 行) —— 规范里的 (i, j) 是 (行, 列)，别混 */
const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

function applyFormat(m, size, level, mask) {
  const bits = formatBits(level, mask)
  const put = (x, y, i) => {
    m[y][x] = ((bits >> i) & 1) === 1 ? 1 : 2
  }
  /* 位置是规范写死的：左上绕一圈，右下拆成两段 */
  for (let i = 0; i <= 5; i += 1) put(8, i, i)
  put(8, 7, 6)
  put(8, 8, 7)
  put(7, 8, 8)
  for (let i = 9; i < 15; i += 1) put(14 - i, 8, i)
  for (let i = 0; i < 8; i += 1) put(size - 1 - i, 8, i)
  for (let i = 8; i < 15; i += 1) put(8, size - 15 + i, i)
  m[size - 8][8] = 1 // 恒深模块，不参与格式位
}

/**
 * 掩模惩罚：四条规则，值越小越好。
 *
 * 惩罚值**只决定选八个掩模里的哪一个** —— 任何一个掩模扫出来都一样，
 * 差别只在可读性（大块同色、类定位图案越少越好）。所以这里不需要纠结
 * 「哪家算法更正宗」，但必须与参照实现（npm qrcode 包）取同一套，
 * 否则 scripts/verify-qr-core.mjs 的自动掩模比对会永远差一口气。
 */
function penalty(m, size) {
  let score = 0

  /* ---- 规则 1：同色连续 ≥ 5，3 分 + 超出部分每格 1 分 ---- */
  const scanRuns = (get) => {
    let runLen = 0
    let last = null
    for (let i = 0; i < size; i += 1) {
      const v = get(i)
      if (v === last) {
        runLen += 1
      } else {
        if (runLen >= 5) score += 3 + (runLen - 5)
        last = v
        runLen = 1
      }
    }
    if (runLen >= 5) score += 3 + (runLen - 5)
  }
  for (let y = 0; y < size; y += 1) scanRuns((i) => m[y][i] === 1)
  for (let x = 0; x < size; x += 1) scanRuns((i) => m[i][x] === 1)

  /* ---- 规则 2：2×2 同色块，每块 3 分 ---- */
  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const v = m[y][x]
      if (v === m[y][x + 1] && v === m[y + 1][x] && v === m[y + 1][x + 1]) score += 3
    }
  }

  /* ---- 规则 3：出现「1:1:3:1:1 且一侧有 4 格浅色」，每处 40 分 ----
     实现成一个 11 位的滑动窗口，命中 10111010000 或 00001011101 即计一次。
     比「游程比对」直观得多，且与参照实现逐位一致。 */
  let n3 = 0
  for (let i = 0; i < size; i += 1) {
    let bitsRow = 0
    let bitsCol = 0
    for (let j = 0; j < size; j += 1) {
      bitsRow = ((bitsRow << 1) & 0x7ff) | (m[i][j] === 1 ? 1 : 0)
      if (j >= 10 && (bitsRow === 0x5d0 || bitsRow === 0x05d)) n3 += 1
      bitsCol = ((bitsCol << 1) & 0x7ff) | (m[j][i] === 1 ? 1 : 0)
      if (j >= 10 && (bitsCol === 0x5d0 || bitsCol === 0x05d)) n3 += 1
    }
  }
  score += n3 * 40

  /* ---- 规则 4：深色占比偏离 50% 的程度，每 5% 记 10 分 ---- */
  let dark = 0
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) if (m[y][x] === 1) dark += 1
  }
  const percent = (dark * 100) / (size * size)
  score += Math.abs(Math.ceil(percent / 5) - 10) * 10

  return score
}

/* ------------------------------------------------------------------ *
 * 7. 对外出口
 * ------------------------------------------------------------------ */

/**
 * 生成二维码矩阵。
 * @param {string} text 待编码文本
 * @param {'L'|'M'|'Q'|'H'} level 纠错档
 * @param {number} [forceMask] 指定掩模（0~7），仅测试用
 * @returns {{ size:number, version:number, mask:number, modules:boolean[][] }}
 * @throws 文本超出版本 10 容量时抛错 —— 宁可让调用方看到明确报错，
 *         也不要画一个扫不出来的图（这点比「永远不报错」重要）
 */
export function encode(text, level = 'M', forceMask = -1) {
  const bytes = utf8Bytes(String(text))

  /* 挑版本：字节模式的字符计数指示符在版本 < 10 是 8 bit，否则 16 bit */
  let version = 0
  let dataTotal = 0
  for (let v = 1; v <= 10; v += 1) {
    const [ecw, b1, b2] = EC_TABLE[level][v - 1]
    const cap = TOTAL_CODEWORDS[v - 1] - ecw * (b1 + b2)
    if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= cap * 8) {
      version = v
      dataTotal = cap
      break
    }
  }
  if (!version) {
    throw new Error(
      `[CodeDogUI] cd-qrcode：内容过长（${bytes.length} 字节），超出版本 10 / ${level} 档的容量`,
    )
  }

  const buf = createBitBuffer()
  buf.put(0b0100, 4) // 字节模式
  buf.put(bytes.length, version < 10 ? 8 : 16)
  for (const b of bytes) buf.put(b, 8)
  buf.put(0, Math.min(4, dataTotal * 8 - buf.length)) // 结束符
  buf.padToByte()

  const codewords = buildCodewords(buf.toBytes(dataTotal), version, level)
  const { m, reserved, size } = buildMatrix(version, codewords)

  let best = null
  let bestMask = 0
  let bestScore = Infinity
  for (let mask = 0; mask < 8; mask += 1) {
    if (forceMask >= 0 && mask !== forceMask) continue
    /* 掩模只翻数据位：命中就 1↔2（异或 3），功能图案保持原样 */
    const candidate = m.map((row, y) =>
      row.map((v, x) => (reserved[y][x] ? v : MASKS[mask](x, y) ? v ^ 3 : v)),
    )
    applyFormat(candidate, size, level, mask)
    const score = penalty(candidate, size)
    if (score < bestScore) {
      bestScore = score
      bestMask = mask
      best = candidate
    }
  }

  return {
    size,
    version,
    mask: bestMask,
    modules: best.map((row) => row.map((v) => v === 1)),
  }
}

/**
 * 把矩阵压成「每行若干段」。
 * 直接按格渲染，一个 33×33 的码要 1089 个节点；合并同色连续段后通常只剩
 * 200~300 个 —— 在小程序里，这个差距就是滚动卡顿与丝滑的区别。
 */
export function toRuns(modules) {
  const rows = []
  for (const row of modules) {
    const runs = []
    let start = -1
    for (let x = 0; x <= row.length; x += 1) {
      const on = x < row.length && row[x]
      if (on && start < 0) start = x
      if (!on && start >= 0) {
        runs.push({ x: start, len: x - start })
        start = -1
      }
    }
    rows.push(runs)
  }
  return rows
}
