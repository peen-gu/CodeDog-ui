/**
 * 比对 index.d.ts 声明的运行时符号 与 index.js 实际导出的符号。
 * 目的：找出「类型说有、运行时是 undefined」的幽灵符号 ——
 * TS 用户按类型写 import 不会报错，运行时拿到 undefined，属于最难查的一类坑。
 *
 * 用法（在项目根目录执行）：
 *   node scripts/check-exports.mjs
 *
 * 双向都查：既查「声明了但没有」，也查「运行时有但类型没写」。
 * 有任何一方不为 0 就该补 —— 要么补导出，要么补声明。
 */
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as esbuild from 'esbuild'

const OUT = join(tmpdir(), 'cdui-index-bundle.mjs')

/** 只保留 H5 分支（与 uni 编译器行为一致） */
function keepH5(src) {
  const out = []
  let mode = null
  for (const line of src.split(/\r?\n/)) {
    if (/^\s*\/\*\s*#ifdef\s+H5\s*\*\/\s*$/.test(line)) { mode = 'keep'; continue }
    if (/^\s*\/\*\s*#ifndef\s+H5\s*\*\/\s*$/.test(line)) { mode = 'drop'; continue }
    if (/^\s*\/\*\s*#endif\s*\*\/\s*$/.test(line)) { mode = null; continue }
    if (mode === 'drop') continue
    out.push(line)
  }
  return out.join('\n')
}

const ifdefPlugin = {
  name: 'ifdef-h5',
  setup(build) {
    build.onLoad({ filter: /service[\\/]index\.js$/ }, (args) => ({
      contents: keepH5(readFileSync(args.path, 'utf8')),
      loader: 'js',
    }))
  },
}

await esbuild.build({
  entryPoints: ['src/uni_modules/codedog-ui/index.js'],
  bundle: true,
  format: 'esm',
  outfile: OUT,
  loader: { '.vue': 'text' },
  plugins: [ifdefPlugin],
  logLevel: 'error',
})

const mod = await import(`file://${OUT}`)
const runtime = new Set(Object.keys(mod))

const dts = readFileSync('src/uni_modules/codedog-ui/index.d.ts', 'utf8')
const declared = new Set()
for (const m of dts.matchAll(/^export\s+(?:declare\s+)?(?:const|function|class|let|var)\s+(\w+)/gm)) {
  declared.add(m[1])
}

const ghosts = [...declared].filter((n) => !runtime.has(n)).sort()
const undeclared = [...runtime].filter((n) => !declared.has(n)).sort()

console.log(`运行时导出 ${runtime.size} 个 / 类型声明 ${declared.size} 个`)
console.log('\n=== 声明了但运行时不存在（幽灵符号，' + ghosts.length + '）===')
console.log(ghosts.length ? ghosts.join('\n') : '(无)')
console.log('\n=== 运行时有但类型没声明（' + undeclared.length + '）===')
console.log(undeclared.length ? undeclared.join('\n') : '(无)')
process.exit(ghosts.length || undeclared.length ? 1 : 0)
