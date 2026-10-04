/**
 * 权威校验：用 Vue 官方 @vue/compiler-sfc 解析 md / vue 源码，
 * 报出真实的编译错误与模板标签错误。
 * 不要再用手写的「开闭标签计数」去猜 —— 那份计数会把跨行属性写成
 * `/>` 的情况算错，也会漏掉属性里的语法错误（本轮就误报了 cd-navbar）。
 *
 * 用法：node scripts/check-sfc-syntax.mjs [组件名...]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { parse, compileTemplate } = require('@vue/compiler-sfc')

const COMP_DIR = join(process.cwd(), 'src/uni_modules/codedog-ui/components')
const only = process.argv.slice(2)

const comps = readdirSync(COMP_DIR).filter((d) => {
  if (only.length && !only.includes(d)) return false
  return statSync(join(COMP_DIR, d)).isDirectory() && d.startsWith('cd-')
})

let bad = 0
let ok = 0
for (const c of comps) {
  const file = join(COMP_DIR, c, `${c}.vue`)
  let source
  try {
    source = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  const { descriptor, errors } = parse(source, { filename: file })
  const issues = [...errors]

  if (descriptor.template && descriptor.template.content) {
    const res = compileTemplate({
      source: descriptor.template.content,
      filename: file,
      id: c,
      compilerOptions: { whitespace: 'condense' },
    })
    issues.push(...(res.errors || []))
  }

  if (issues.length) {
    bad += 1
    console.log(`  ✗  ${c}`)
    for (const e of issues.slice(0, 3)) {
      const msg = typeof e === 'string' ? e : e.message || String(e)
      console.log(`       ${msg.split('\n')[0]}`)
    }
  } else {
    ok += 1
  }
}

console.log(`\nSFC 编译：通过 ${ok} 个 / 失败 ${bad} 个`)
process.exit(bad ? 1 : 0)
