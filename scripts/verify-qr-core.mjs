/**
 * cd-qrcode 编码核心校验
 * ---------------------------------------------------------------
 * 自研二维码最容易出的故障不是「画不出来」，而是**画得出来但扫不出来**：
 * 码字交织错位、掩模翻到了功能图案上、格式位写错位置……图都长得像二维码，
 * 只有扫码枪知道它是废的。这类问题肉眼绝对看不出来，只能逐位比对。
 *
 * 所以这个脚本把 npm 上的 `qrcode` 包当参照实现：
 *   1. **逐个掩模**比对（mask 0~7 全比）—— 只要有一个掩模对不上，
 *      就说明是编码/排布错了，而不是「惩罚算法选了不同掩模」；
 *   2. 再比一次**自动选掩模**的结果，确认惩罚算法也与参照一致。
 *
 * 用法（项目根目录）：
 *   node scripts/verify-qr-core.mjs
 * 依赖：仅在 /tmp/qrref 装了 qrcode（用 QR_REF 环境变量覆盖路径）。
 *      这个依赖不进 package.json —— 它只服务于开发期校验，不能污染使用者。
 */
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { encode } from '../src/uni_modules/codedog-ui/components/cd-qrcode/qr-core.js'

const REF_DIR = process.env.QR_REF || '/tmp/qrref'
if (!existsSync(REF_DIR)) {
  console.error(`缺少参照实现。先在临时目录装一下：\n  mkdir -p ${REF_DIR} && cd ${REF_DIR} && npm init -y && npm i qrcode`)
  process.exit(2)
}
const require = createRequire(`${REF_DIR}/`)
const QR = require('qrcode')

/**
 * 参照实现的矩阵：qrcode.create().modules 是 { size, data: Uint8Array }
 *
 * ⚠️ 必须显式指定 `mode: 'byte'`。参照实现默认会做「模式优选」：
 *    'AB1' 走字母数字、'13800138000' 走数字，和本库强制的字节模式不是一回事，
 *    直接传字符串比对会全军覆没，且看起来像编码 bug（第一版脚本就被这个骗了）。
 */
function refMatrix(text, level, mask) {
  const qr = QR.create([{ data: text, mode: 'byte' }], {
    errorCorrectionLevel: level,
    maskPattern: mask,
  })
  const size = qr.modules.size
  const data = qr.modules.data
  const m = []
  for (let y = 0; y < size; y++) {
    const row = []
    for (let x = 0; x < size; x++) row.push(data[y * size + x] === 1)
    m.push(row)
  }
  return { size, version: qr.version, m }
}

function diff(a, b) {
  let n = 0
  let first = null
  for (let y = 0; y < a.length; y++) {
    for (let x = 0; x < a.length; x++) {
      if (a[y][x] !== b[y][x]) {
        n += 1
        if (!first) first = `(${x},${y})`
      }
    }
  }
  return { n, first }
}

const CASES = [
  { text: 'https://ui.codedog.tech', level: 'M' },
  { text: 'HELLO WORLD', level: 'L' },
  { text: 'https://doc.codedog.tech/components/button.html', level: 'Q' },
  { text: 'CodeDogUI 跨四端组件库', level: 'H' },
  { text: '13800138000', level: 'M' },
  { text: 'A', level: 'H' },
  { text: 'WIFI:T:WPA;S:CodeDog;P:12345678;;', level: 'M' },
  { text: 'x'.repeat(120), level: 'L' }, // 逼近版本 10 / L 的边界
  { text: '短', level: 'Q' },
  { text: '订单号 20261004-8837，请在 15 分钟内完成支付。', level: 'M' },
]

let fail = 0
let checked = 0

console.log('逐个掩模比对（mask 0~7 全比）')
for (const c of CASES) {
  /* 先确认两边挑的版本一致，否则矩阵尺寸不同无从比较 */
  const auto = encode(c.text, c.level)
  const refAuto = refMatrix(c.text, c.level, undefined)
  if (auto.version !== refAuto.version) {
    fail += 1
    console.log(`  ✗  ${c.level} "${c.text.slice(0, 20)}"：版本不一致 我方 v${auto.version} / 参照 v${refAuto.version}`)
    continue
  }

  let worst = 0
  let worstMask = -1
  for (let mask = 0; mask < 8; mask++) {
    checked += 1
    const mine = encode(c.text, c.level, mask).modules
    const ref = refMatrix(c.text, c.level, mask).m
    const d = diff(mine, ref)
    if (d.n > worst) {
      worst = d.n
      worstMask = mask
    }
  }

  /* 自动掩模是否也一致 */
  const autoDiff = diff(auto.modules, refAuto.m)
  const ok = worst === 0 && autoDiff.n === 0
  if (!ok) fail += 1
  console.log(
    `  ${ok ? '✓' : '✗'}  ${c.level} v${auto.version} "${c.text.slice(0, 24)}"  ` +
      `指定掩模最大差异 ${worst}${worst > 0 ? ` (mask ${worstMask})` : ''} / 自动掩模差异 ${autoDiff.n}` +
      `${autoDiff.n ? ` 首个不同 ${autoDiff.first}` : ''}` +
      `  自动选中的掩模 我方 ${auto.mask} / 参照 ${refAuto.version ? '' : ''}`.trimEnd(),
  )
}

console.log(`\n比对 ${checked} 组矩阵，${fail ? `失败 ${fail} 例` : '全部一致 ✓'}`)
process.exit(fail ? 1 : 0)
