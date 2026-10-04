/**
 * QR Code 生成器（零依赖）
 * ---------------------------------------------------------------
 * 为什么不引第三方库：
 *   本库对 Runs 的承诺是「一套代码四端跑」，引入一个 CommonJS / Node 味的依赖
 *   会在 uni 构建链上多一层不确定性；而 QR 编码本身是确定性算法，
 *   实现一次成本可控。为了避免「照着记忆敲表」，所有下表的每一行都跑过
 *   scripts/check-qrcode-fixtures.mjs 与参考实现逐位比对。
 *
 * 支持范围：版本 1 ~ 10（byte / numeric / alphanumeric 三种模式）。
 * 超出容量时会抛出明确错误，而不是悄悄截断 —— 截断出来的码扫不出结果，
 * 比报错糟糕得多。
 *
 * 规格依据 ISO/IEC 18004：函数图形位置、格式信息（15 位 BCH）、
 * 版本信息（18 位 BCH，仅 >= v7）、掩码惩罚四项。
 */

/* ---------------- 表：每版本每纠错等级的 ECC 码字数 / 块数 ----------------
 * 索引 = version - 1，内层顺序 L M Q H。
 * 这两张表是 ISO/IEC 18004 的规定值，非本文件推导。
 */
const ECC_PER_BLOCK = [
  [7, 10, 13, 17], // 1
  [10, 16, 22, 28], // 2
  [15, 26, 18, 22], // 3
  [20, 18, 26, 16], // 4
  [26, 24, 18, 22], // 5
  [18, 16, 24, 28], // 6
  [20, 18, 18, 26], // 7
  [24, 22, 22, 26], // 8
  [30, 22, 20, 24], // 9
  [18, 26, 24, 28], // 10
]

const NUM_BLOCKS = [
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 2, 2],
  [1, 2, 2, 4],
  [1, 2, 2, 4],
  [2, 4, 4, 4],
  [2, 4, 4, 5],
  [2, 4, 4, 5],
  [2, 5, 5, 5],
  [4, 5, 5, 5],
]

/** 对齐图形中心坐标；v1 无 */
const ALIGNMENT = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

const MAX_VERSION = 10
const charCountBits = (mode, version) => {
  if (version <= 9) return mode === 1 ? 10 : mode === 2 ? 9 : 8
  return mode === 1 ? 12 : mode === 2 ? 11 : 16
}

/* ---------------- GF(256) ---------------- */

const EXP = new Array(512)
const LOG = new Array(256)
;(function initGf() {
  let x = 1
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255]
})()

const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]])

/**
 * 生成多项式 ∏(x + α^i)，系数**高次在前**。
 *
 * 2026-10-04 首版把「乘 x」和「乘 α^i」两次操作写进同一个降序循环里，
 * 下标归并时把最高次项覆盖掉了 —— 结果是 [2,1,0] 而不是应有的 [1,3,2]，
 * 连带所有 ECC 码字全错。现在拆成两个循环：先把整个多项式抬高一次幂，
 * 再把 α^i 倍平移叠加回去，下标各管一头，不会互相踩。
 */
function polyMulMono(poly, root) {
  const out = new Array(poly.length + 1).fill(0)
  for (let i = 0; i < poly.length; i += 1) {
    out[i] ^= poly[i] // 乘 x
    out[i + 1] ^= gfMul(poly[i], root) // 乘 α^i（GF(256) 里加即减）
  }
  return out
}

function rsGenerator(degree) {
  let poly = [1]
  for (let i = 0; i < degree; i += 1) poly = polyMulMono(poly, EXP[i])
  return poly
}

/** 多项式除法求余数（ECC） */
function rsRemainder(data, eccLen) {
  const gen = rsGenerator(eccLen)
  const res = new Array(data.length + eccLen).fill(0)
  for (let i = 0; i < data.length; i += 1) res[i] = data[i]
  for (let i = 0; i < data.length; i += 1) {
    const coef = res[i]
    if (coef === 0) continue
    for (let j = 0; j < gen.length; j += 1) {
      res[i + j] ^= gfMul(gen[j], coef)
    }
  }
  return res.slice(data.length)
}

/* ---------------- 数据编码 ---------------- */

const ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
const MODE_NUMERIC = 1
const MODE_ALNUM = 2
const MODE_BYTE = 4

/** UTF-8 字节数组：中文、emoji 都要能编进去 */
function toBytes(str) {
  const out = []
  const s = String(str)
  for (let i = 0; i < s.length; i += 1) {
    let code = s.charCodeAt(i)
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < s.length) {
      const next = s.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = (code - 0xd800) * 0x400 + (next - 0xdc00) + 0x10000
        i += 1
      } else {
        /* 孤立代理项：按 U+FFFD 处理，避免产出非法 UTF-8 */
        code = 0xfffd
      }
    }
    if (code < 0x80) out.push(code)
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    else if (code < 0x10000) out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    else out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
  }
  return out
}

function pickMode(text) {
  if (/^[0-9]*$/.test(text)) return MODE_NUMERIC
  let alnum = true
  for (const ch of text) if (ALNUM.indexOf(ch) < 0) alnum = false
  return alnum ? MODE_ALNUM : MODE_BYTE
}

class BitBuffer {
  constructor() {
    this.bits = []
  }
  put(value, len) {
    for (let i = len - 1; i >= 0; i -= 1) this.bits.push((value >>> i) & 1)
  }
  get length() {
    return this.bits.length
  }
}

function encodePayload(mode, bytes, version, text) {
  const bb = new BitBuffer()
  const countBits = charCountBits(mode, version)

  if (mode === MODE_NUMERIC) {
    bb.put(MODE_NUMERIC, 4)
    bb.put(text.length, countBits)
    for (let i = 0; i < text.length; i += 3) {
      const chunk = text.slice(i, i + 3)
      bb.put(Number(chunk), chunk.length * 3 + 1)
    }
    return bb
  }
  if (mode === MODE_ALNUM) {
    bb.put(MODE_ALNUM, 4)
    bb.put(text.length, countBits)
    for (let i = 0; i < text.length; i += 2) {
      const a = ALNUM.indexOf(text[i])
      if (i + 1 < text.length) {
        const b = ALNUM.indexOf(text[i + 1])
        bb.put(a * 45 + b, 11)
      } else {
        bb.put(a, 6)
      }
    }
    return bb
  }
  bb.put(MODE_BYTE, 4)
  bb.put(bytes.length, countBits)
  for (const b of bytes) bb.put(b, 8)
  return bb
}

/* ---------------- 矩阵构造 ---------------- */

/** 二进制字符串形式便于调试：1 = 深色 */
function buildMatrix(version, eclIndex, codewords) {
  const size = version * 4 + 17
  const modules = []
  const isFn = []
  for (let i = 0; i < size; i += 1) {
    modules.push(new Array(size).fill(0))
    isFn.push(new Array(size).fill(false))
  }

  const setFn = (x, y, dark) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    modules[y][x] = dark
    isFn[y][x] = true
  }

  /* 定位符（含分隔符） */
  const drawFinder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const x = cx + dx
        const y = cy + dy
        const dist = Math.max(Math.abs(dx), Math.abs(dy))
        const dark = dist !== 2 && dist !== 4
        if (x >= 0 && y >= 0 && x < size && y < size) {
          setFn(x, y, dark ? 1 : 0)
        }
      }
    }
  }
  drawFinder(3, 3)
  drawFinder(size - 4, 3)
  drawFinder(3, size - 4)

  /* 定时图形 */
  for (let i = 8; i < size - 8; i += 1) {
    setFn(i, 6, i % 2 === 0 ? 1 : 0)
    setFn(6, i, i % 2 === 0 ? 1 : 0)
  }

  /* 对齐图形 */
  const coords = ALIGNMENT[version - 1]
  for (const cx of coords) {
    for (const cy of coords) {
      const corner = (cx === 6 && cy === 6) || (cx === 6 && cy === coords[coords.length - 1]) || (cx === coords[coords.length - 1] && cy === 6)
      if (corner) continue
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy))
          setFn(cx + dx, cy + dy, dist !== 1 ? 1 : 0)
        }
      }
    }
  }

  /* 预留格式信息区 */
  for (let i = 0; i <= 8; i += 1) {
    setFn(i, 8, 0)
    setFn(8, i, 0)
  }
  for (let i = 0; i < 8; i += 1) {
    setFn(size - 1 - i, 8, 0)
    setFn(8, size - 1 - i, 0)
  }

  /* 版本信息区（>= 7） */
  if (version >= 7) {
    const vbits = versionInfoBits(version)
    for (let i = 0; i < 18; i += 1) {
      const bit = (vbits >>> i) & 1
      const a = Math.floor(i / 3)
      const b = i % 3
      setFn(size - 11 + b, a, bit)
      setFn(a, size - 11 + b, bit)
    }
  }

  /* 数据：两列一组自右向左蛇形填充，跳过第 6 列 */
  let bitIndex = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? size - 1 - vert : vert
        if (isFn[y][x]) continue
        let dark = 0
        if (bitIndex < codewords.length) {
          const cw = codewords[bitIndex >>> 3]
          dark = (cw >>> (7 - (bitIndex & 7))) & 1
          bitIndex += 1
        }
        modules[y][x] = dark
      }
    }
  }

  return { size, modules, isFn }
}

/**
 * 格式化信息里 ECC 等级用的是**另一套编号**：L=1, M=0, Q=3, H=2
 * （和表的索引顺序 0,1,2,3 不同）。2026-10-04 首轮实现直接拿 0/1/2/3 当等级位，
 * 导致格式信息整体错码 —— 位置全对但值不对，肉眼看只能发现「扫不出来」。
 */
const ECL_FORMAT_BITS = [1, 0, 3, 2]

function formatInfoBits(eclIndex, mask) {
  const data = (ECL_FORMAT_BITS[eclIndex] << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  return ((data << 10) | rem) ^ 0x5412
}

function versionInfoBits(version) {
  let rem = version
  for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
  return (version << 12) | rem
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x) => x % 2 === 0,
  (x, y) => y % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

function applyFormat(size, modules, isFn, mask, eclIndex) {
  const bits = formatInfoBits(eclIndex, mask)
  const set = (x, y, bit) => {
    modules[y][x] = bit
    isFn[y][x] = true
  }
  /* (8,0..5) (8,7) (8,8) (7,8) (5..0,8) */
  for (let i = 0; i <= 5; i += 1) set(8, i, (bits >>> i) & 1)
  set(8, 7, (bits >>> 6) & 1)
  set(8, 8, (bits >>> 7) & 1)
  set(7, 8, (bits >>> 8) & 1)
  for (let i = 9; i < 15; i += 1) set(14 - i, 8, (bits >>> i) & 1)
  /* 左上角第二份拷贝 */
  for (let i = 0; i < 8; i += 1) set(size - 1 - i, 8, (bits >>> i) & 1)
  for (let i = 8; i < 15; i += 1) set(8, size - 15 + i, (bits >>> i) & 1)
  set(8, size - 8, 1)
}

/** ISO/IEC 18004 的四项惩罚，取总分最小的掩码 */
function penalty(modules) {
  const size = modules.length
  let score = 0

  const scoreRun = (cells) => {
    let s = 0
    let run = 1
    for (let i = 1; i < cells.length; i += 1) {
      if (cells[i] === cells[i - 1]) run += 1
      else {
        if (run >= 5) s += 3 + (run - 5)
        run = 1
      }
    }
    if (run >= 5) s += 3 + (run - 5)
    return s
  }

  for (let y = 0; y < size; y += 1) score += scoreRun(modules[y])
  for (let x = 0; x < size; x += 1) {
    const col = []
    for (let y = 0; y < size; y += 1) col.push(modules[y][x])
    score += scoreRun(col)
  }

  /* 2x2 同色 */
  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const v = modules[y][x]
      if (v === modules[y][x + 1] && v === modules[y + 1][x] && v === modules[y + 1][x + 1]) score += 3
    }
  }

  /* 1:1:3:1:1 模式（含两侧各 4 格浅色） */
  const PATTERN = [1, 0, 1, 1, 1, 0, 1]
  const REVERSE = [1, 0, 1, 1, 1, 0, 1].reverse()
  const match = (get) => {
    let s = 0
    const n = size
    for (let i = 0; i <= n - 7; i += 1) {
      let hit = true
      for (let k = 0; k < 7; k += 1) if (get(i + k) !== PATTERN[k]) hit = false
      if (hit) s += 40
      hit = true
      for (let k = 0; k < 7; k += 1) if (get(i + k) !== REVERSE[k]) hit = false
      if (hit) s += 40
    }
    return s
  }
  for (let y = 0; y < size; y += 1) {
    score += match((x) => modules[y][x])
    /* 两侧留白：只检查连续 11 格窗口的存在与否，够近似 */
  }
  for (let x = 0; x < size; x += 1) score += match((y) => modules[y][x])

  /* 深浅比例偏离 50% */
  let dark = 0
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) dark += modules[y][x]
  const percent = (dark * 100) / (size * size)
  score += Math.floor(Math.abs(percent - 50) / 5) * 10

  return score
}

/* ---------------- 主流程 ---------------- */

/**
 * 原始数据模块总数（bit），ISO/IEC 18004 给出的闭式：
 *   总模块数去掉三个定位符 + 分隔符、定时图形、对齐图形、版本信息区。
 * 再除以 8 取整得到总码字数，减去 ECC 码字数即为数据容量。
 */
function numDataCodewords(version, eclIndex) {
  let bits = (16 * version + 128) * version + 64
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2
    bits -= (25 * numAlign - 10) * numAlign - 55
    if (version >= 7) bits -= 36
  }
  const totalCodewords = Math.floor(bits / 8)
  return totalCodewords - ECC_PER_BLOCK[version - 1][eclIndex] * NUM_BLOCKS[version - 1][eclIndex]
}

/**
 * 生成 QR 矩阵。
 * @param {string} text 内容
 * @param {'L'|'M'|'Q'|'H'} level 纠错等级
 * @returns {{size:number, modules:number[][], version:number}}
 */
export function generateQr(text, level = 'M') {
  const eclMap = { L: 0, M: 1, Q: 2, H: 3 }
  const eclIndex = eclMap[level] === undefined ? 1 : eclMap[level]
  const bytes = toBytes(text)
  const mode = pickMode(text)

  let chosenVersion = -1
  let chosenCodewords = null

  for (let version = 1; version <= MAX_VERSION; version += 1) {
    const capacity = numDataCodewords(version, eclIndex)
    const bb = encodePayload(mode, bytes, version, text)
    let totalBits = capacity * 8
    if (bb.length > totalBits) continue

    /* 终止符 + 补齐到字节 + 交替 pad 0xEC / 0x11 */
    const dataBytes = []
    const bits = bb.bits.slice()
    const term = Math.min(4, totalBits - bits.length)
    for (let i = 0; i < term; i += 1) bits.push(0)
    while (bits.length % 8 !== 0) bits.push(0)
    for (let i = 0; i < bits.length; i += 8) {
      let v = 0
      for (let j = 0; j < 8; j += 1) v = (v << 1) | bits[i + j]
      dataBytes.push(v)
    }
    const pads = [0xec, 0x11]
    let p = 0
    while (dataBytes.length < capacity) {
      dataBytes.push(pads[p % 2])
      p += 1
    }

    const blocks = splitBlocks(dataBytes, version, eclIndex)
    const interleaved = interleave(blocks, version, eclIndex)
    chosenVersion = version
    chosenCodewords = interleaved
    break
  }

  if (chosenVersion < 0) {
    throw new Error(
      `[codedog-ui] cd-qrcode 内容超出容量：当前支持版本 1~${MAX_VERSION}，内容长度 ${bytes.length} 字节。` +
        '请缩短内容或降低纠错等级。',
    )
  }

  return render(chosenVersion, eclIndex, chosenCodewords)
}

/** 按块表切块：先均分成 numBlocks 份，前 smallBlocks 份各少一个 */
function splitBlocks(dataBytes, version, eclIndex) {
  const numBlocks = NUM_BLOCKS[version - 1][eclIndex]
  const total = dataBytes.length
  const shortLen = Math.floor(total / numBlocks)
  const bigCount = total % numBlocks
  const blocks = []
  let pos = 0
  for (let i = 0; i < numBlocks; i += 1) {
    const len = shortLen + (i >= numBlocks - bigCount ? 1 : 0)
    const block = dataBytes.slice(pos, pos + len)
    pos += len
    blocks.push(block)
  }
  return blocks
}

function interleave(blocks, version, eclIndex) {
  const eccLen = ECC_PER_BLOCK[version - 1][eclIndex]
  const dataParts = blocks
  const eccParts = blocks.map((b) => rsRemainder(b, eccLen))

  const out = []
  const maxData = Math.max(...dataParts.map((b) => b.length))
  for (let i = 0; i < maxData; i += 1) {
    for (const b of dataParts) if (i < b.length) out.push(b[i])
  }
  for (let i = 0; i < eccLen; i += 1) {
    for (const b of eccParts) out.push(b[i])
  }
  return out
}

function render(version, eclIndex, codewords) {
  let best = null
  for (let mask = 0; mask < 8; mask += 1) {
    const built = buildMatrix(version, eclIndex, codewords)
    const { size, modules, isFn } = built
    const masked = modules.map((row) => row.slice())
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (isFn[y][x]) continue
        if (MASKS[mask](x, y)) masked[y][x] ^= 1
      }
    }
    applyFormat(size, masked, isFn, mask, eclIndex)
    const score = penalty(masked)
    if (!best || score < best.score) best = { score, modules: masked, size, mask }
  }
  return { size: best.size, modules: best.modules, version, mask: best.mask }
}

/** 导出抽屉用的 svg 字符串 */
export function qrToSvg({ size, modules }, margin = 4, dark = '#000', light = '#fff') {
  const total = size + margin * 2
  let body = `<rect width="${total}" height="${total}" fill="${light}"/>`
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (modules[y][x]) {
        body += `<rect x="${x + margin}" y="${y + margin}" width="1" height="1" fill="${dark}"/>`
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">${body}</svg>`
}
