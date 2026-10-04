/**
 * 站点文案自检 —— 防止官网上的「版本号 / 组件数」再次停在旧值。
 * -------------------------------------------------------------------------------
 * 起因：v0.5.3 都发完了，官网标题后面还挂着 **v0.5.0**，组件数写着 68（实际 80）。
 * 两处都是写死的字面量，改版时没人会想起它们。
 *
 * 对策：版本号改成从 package.json 取（不可能过期），组件数收敛到一个常量，
 * 由本脚本在每次发版前把常量与**真实组件目录数**比对，对不上就拦下。
 *
 * 用法：
 *   node scripts/check-site-facts.mjs        # 检查
 *   npm run check:site                       # 同上
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const ok = (s) => console.log(`\x1b[32m✔\x1b[0m ${s}`)
const bad = (s) => console.log(`\x1b[31m✘\x1b[0m ${s}`)

const PKG = join(root, 'src/uni_modules/codedog-ui/package.json')
const SITE = join(root, 'src/pages/site/index.vue')
const COMPONENTS = join(root, 'src/uni_modules/codedog-ui/components')

if (!existsSync(PKG) || !existsSync(SITE) || !existsSync(COMPONENTS)) {
  bad('缺少待检文件，请在项目根目录执行')
  process.exit(1)
}

const pkg = JSON.parse(readFileSync(PKG, 'utf8'))
const site = readFileSync(SITE, 'utf8')

let failed = 0

/* ---- 1. 版本号必须来自 package.json，不允许再出现写死的 vX.Y.Z ---- */
if (!/import\s+pkg\s+from\s+['"][^'"]*\/codedog-ui\/package\.json['"]/.test(site)) {
  bad('站点没有从 package.json 读取版本，版本号一旦写死必然过期')
  failed += 1
} else {
  ok(`版本取自 package.json（当前 ${pkg.version}）`)
}

// template/script 里残留的 v0.5.0 之类字面量（排除向导注释里的说明文字）
const stale = [...site.matchAll(/>\s*v\d+\.\d+\.\d+\s*</g)].map((m) => m[0].trim())
if (stale.length) {
  bad(`模板里还有写死的版本号：${stale.join(' / ')}`)
  failed += 1
} else {
  ok('模板中无写死的版本号')
}

/* ---- 2. 组件数常量必须等于真实组件目录数 ---- */
const actual = readdirSync(COMPONENTS, { withFileTypes: true }).filter(
  (d) => d.isDirectory() && d.name.startsWith('cd-'),
).length

const m = site.match(/const\s+COMPONENT_COUNT\s*=\s*(\d+)/)
if (!m) {
  bad('找不到 COMPONENT_COUNT 常量，站点组件数是否为写死？')
  failed += 1
} else if (Number(m[1]) !== actual) {
  bad(`COMPONENT_COUNT=${m[1]}，实际组件目录 ${actual} 个 —— 站点数字已过期`)
  failed += 1
} else {
  ok(`组件数一致：${actual}`)
}

/* ---- 3. 页面文案里不应残留旧的组件数（里程碑是**历史陈述**，带 timestamp 的行跳过）---- */
const leftovers = site
  .split('\n')
  .filter((line) => !line.includes('timestamp:'))
  .flatMap((line) => [...line.matchAll(/[^\d](\d{2})\s*个组件/g)].map((x) => x[1]))
  .filter((n) => Number(n) !== actual)
if (leftovers.length) {
  bad(`页面文案里还有旧的组件数：${[...new Set(leftovers)].join(' / ')} 个`)
  failed += 1
} else {
  ok('文案中无过期的组件数（里程碑历史陈述已豁免）')
}

console.log(failed ? `\n站点文案自检：${failed} 项不通过` : '\n站点文案自检：全部通过')
process.exit(failed ? 1 : 0)
