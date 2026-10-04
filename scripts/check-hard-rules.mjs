/**
 * CodeDogUI / 跨端硬约束静态门禁
 * ---------------------------------------------------------------
 * 把「9 条跨端硬约束」里能用正则查出来的部分做成脚本，
 * 免得每次靠人肉 review —— 人一定会漏，尤其是新组件集中加的时候。
 *
 * 用法（项目根目录）：
 *   node scripts/check-hard-rules.mjs                 # 查全部组件
 *   node scripts/check-hard-rules.mjs cd-swiper       # 只查指定组件（可传多个）
 *
 * 退出码：有违规为 1，全过为 0。
 *
 * 说明：这里只查**能被静态判定**的项。像「小程序端 window 是否判空」
 * 这类需要语义理解的，仍然靠 review —— 脚本不假装自己查得了。
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const COMP_DIR = join(ROOT, 'src/uni_modules/codedog-ui/components')

/** 每条规则：命中即违规。pos 决定它只在模板 / 样式 / 全文里生效 */
const RULES = [
  {
    id: 'no-rpx',
    why: 'rpx 是小程序专用单位，H5 PC 与 Electron 下换算不可控',
    where: 'all',
    re: /\d+(\.\d+)?rpx\b/g,
  },
  {
    id: 'no-structural-pseudo',
    why: 'nth-child / last-child 等结构伪类在小程序 WXSS 支持不可靠，改用相邻兄弟 A + B',
    where: 'style',
    re: /:(nth-child|nth-last-child|nth-of-type|nth-last-of-type|first-child|last-child|first-of-type|last-of-type|only-child|only-of-type)\b/g,
  },
  {
    id: 'no-attr-selector',
    why: 'WXSS 不支持属性选择器',
    where: 'style',
    re: /\[\s*[a-zA-Z-]+\s*(?:[~^$*|]?=|\])/g,
  },
  {
    /* 只认「选择器位置」上的星号：后面紧跟 { , . # : [ 之一。
       scss 块注释的行首 ` * `、以及 `$a * 2` 这类乘法都不该算违规 */
    id: 'no-universal-selector',
    why: 'WXSS 不支持通配符选择器',
    where: 'style',
    re: /(?:^|[\s,>])\*(?=\s*(?:[{,.:#\[]))/gm,
  },
  {
    id: 'no-slot-vbind',
    why: '作用域插槽禁止 <slot v-bind="obj">，必须逐项展开（小程序端解析不稳定）',
    where: 'template',
    re: /<slot\b[^>]*v-bind\s*=/g,
  },
  {
    id: 'no-lookahead',
    why: '小程序端正则不支持 lookahead',
    where: 'script',
    re: /\(\?[=!]/g,
  },
  {
    /* 只查样式块：注释里常拿 `calc(var(--x) / -2)` 当反例，全文查会误报 */
    id: 'no-css-var-division',
    why: 'CSS 变量参与 calc 除法在部分端会算错',
    where: 'style',
    re: /calc\([^)]*var\([^)]*\)\s*\/\s*[^)]*\)/g,
  },
  {
    /* 2026-10-03 实测：uni 5.26 / mp-weixin 编译器直接报
       X_DYNAMIC_COMPONENT_NOT_SUPPORTED —— 编译期失败，不是运行时降级。
       表单引擎一类「schema 驱动」需求必须走「枚举 v-if」，不能靠动态组件。 */
    id: 'no-dynamic-component',
    why: 'mp-weixin 不支持 <component :is>（X_DYNAMIC_COMPONENT_NOT_SUPPORTED），改用枚举 v-if',
    where: 'template',
    re: /<component\b/g,
  },
  {
    id: 'no-v-is',
    why: 'mp-weixin 不支持 v-is（X_V_IS_NOT_SUPPORTED），改用枚举 v-if',
    where: 'template',
    re: /\bv-is\s*=/g,
  },
  {
    /* 注意区分：`v-on:click="fn"` / `@click="fn"` 是合法的，只有
       `v-on="{ click: fn }"` 这种「不带参数的整体对象绑定」被禁。 */
    id: 'no-von-object',
    why: 'mp-weixin 不支持 v-on="对象"（X_V_ON_NO_ARGUMENT），事件名必须静态写死',
    where: 'template',
    re: /\bv-on\s*=\s*["']/g,
  },
]

/**
 * 模板里不该出现的原生 HTML 标签。
 * input / textarea / button / label / image / swiper / picker 等是
 * **uni 内建组件**，属于合法写法，所以不在名单里。
 */
const HTML_TAGS = [
  'div', 'span', 'p', 'ul', 'ol', 'li',
  'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'img', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
]

/** 剥掉 CSS / SCSS 注释：块注释的行首星号、条件编译标记都会干扰选择器判定 */
function stripCssComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1')
}

/**
 * 剥掉模板里的说明性 HTML 注释，避免注释中的示例代码被判成违规。
 * 只剥普通注释；`<!-- #ifdef MP-WEIXIN -->` 这类**条件编译块内部是真实代码**，
 * 必须原样保留继续检查，否则会漏检。
 */
function stripHtmlComments(s) {
  return s.replace(/<!--(?!\s*#)[\s\S]*?-->/g, '')
}

function splitBlocks(code) {
  /* 取 <template>、<script setup>/<script>、<style> 三块。
     用 lastIndexOf 取各自的闭合标签，避免块内字符串干扰。 */
  const grab = (openRe, close) => {
    const m = code.match(openRe)
    if (!m) return ''
    const start = m.index + m[0].length
    const end = code.indexOf(close, start)
    return end < 0 ? code.slice(start) : code.slice(start, end)
  }
  return {
    template: stripHtmlComments(grab(/<template[^>]*>/, '</template>')),
    script: grab(/<script[^>]*>/, '</script>'),
    style: stripCssComments(grab(/<style[^>]*>/, '</style>')),
  }
}

function checkFile(file) {
  const code = readFileSync(file, 'utf8')
  const blocks = splitBlocks(code)
  const issues = []

  for (const rule of RULES) {
    const hay = rule.where === 'all' ? code : blocks[rule.where] || ''
    const hits = [...hay.matchAll(rule.re)]
    if (hits.length) {
      issues.push({ rule: rule.id, why: rule.why, count: hits.length, sample: hits[0][0].trim() })
    }
  }

  /* 模板里的原生 HTML 标签（排除 uni 内建的 swiper / picker / image 等） */
  const tpl = blocks.template || ''
  for (const tag of HTML_TAGS) {
    const re = new RegExp(`<${tag}\\b`, 'g')
    const hits = [...tpl.matchAll(re)]
    if (hits.length) {
      issues.push({ rule: 'no-html-tag', why: `模板里用了 <${tag}>，uni 端应改用 view / text / image 等`, count: hits.length, sample: `<${tag}` })
    }
  }

  /* 样式块规范 */
  const style = blocks.style || ''
  if (style.trim()) {
    if (!/@import\s+['"]\.\.\/\.\.\/styles\/scss-tokens\.scss['"]/.test(style)) {
      issues.push({ rule: 'style-import', why: '样式块首行需要 @import ../../styles/scss-tokens.scss', count: 1, sample: '' })
    }
    if (!/@include\s+cd-reset/.test(style)) {
      issues.push({ rule: 'style-reset', why: '根类需要 @include cd-reset', count: 1, sample: '' })
    }
  }

  return issues
}

const only = process.argv.slice(2)
const comps = readdirSync(COMP_DIR).filter((d) => {
  if (only.length && !only.includes(d)) return false
  const p = join(COMP_DIR, d)
  return statSync(p).isDirectory() && d.startsWith('cd-')
})

let bad = 0
const rows = []
for (const c of comps) {
  const file = join(COMP_DIR, c, `${c}.vue`)
  let code
  try {
    code = readFileSync(file, 'utf8')
  } catch {
    rows.push({ comp: c, skip: '无同名 .vue（子件或命名不同，跳过）' })
    continue
  }
  if (!code.includes('<style')) {
    rows.push({ comp: c, skip: '无样式块（纯逻辑组件，跳过样式相关规则）' })
  }
  const issues = checkFile(file)
  if (issues.length) {
    bad += 1
    rows.push({ comp: c, issues })
  } else {
    rows.push({ comp: c, issues: [] })
  }
}

console.log(`检查 ${comps.length} 个组件目录\n`)
for (const r of rows) {
  if (r.skip) {
    console.log(`  --  ${r.comp}：${r.skip}`)
    continue
  }
  if (!r.issues.length) continue
  console.log(`  ✗  ${r.comp}`)
  for (const i of r.issues) {
    console.log(`       [${i.rule}] ×${i.count} ${i.why}${i.sample ? `  例: ${i.sample}` : ''}`)
  }
}
const clean = rows.filter((r) => !r.skip && !r.issues.length).length
console.log(`\n通过 ${clean} 个 / 违规 ${bad} 个`)

/* ================================================================
   演示页扫描
   组件目录之外的 .vue（src/pages 与 playground/mp-preview/src/pages）也要过
   跨端 CSS 硬约束。2026-10-03 就是演示页里写了 `.row > *`，
   WXSS 不支持通配符，微信小程序直接编译中断报 "error at token `*`"。
   演示页不套组件专属规范（@import tokens / @include cd-reset）。
   ================================================================ */
/* playground/mp-preview/src 递归扫（含 sub-* 子包里的 68 个组件页与 demo 副本）。
   2026-10-04：演示应用改成「首页 / 分类 / 每组件独立页」三层结构后，
   页面散在 7 个子包目录里，只写 .../src/pages 会整片漏扫。
   .stale 后缀的文件不算 .vue，自动排除。 */
const DEMO_DIRS = ['src/pages', 'playground/mp-preview/src']

function walkVue(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walkVue(p, out) // 必须传 out，否则子目录结果全丢
    else if (name.endsWith('.vue')) out.push(p)
  }
  return out
}

function checkDemoFile(file) {
  const code = readFileSync(file, 'utf8')
  const blocks = splitBlocks(code)
  const issues = []
  for (const rule of RULES) {
    /* no-lookahead 是 script 规则，演示页常在注释里拿它当反例，不查 */
    if (rule.id === 'no-lookahead') continue
    const hay = rule.where === 'all' ? code : blocks[rule.where] || ''
    const hits = [...hay.matchAll(rule.re)]
    if (hits.length) {
      issues.push({ rule: rule.id, why: rule.why, count: hits.length, sample: hits[0][0].trim() })
    }
  }
  return issues
}

const demoFiles = DEMO_DIRS.filter(existsSync).flatMap((d) => walkVue(d))
const demoBad = []
for (const f of demoFiles) {
  const iss = checkDemoFile(f)
  if (iss.length) demoBad.push({ file: f, issues: iss })
}

console.log(`\n演示页检查 ${demoFiles.length} 个文件`)
for (const d of demoBad) {
  console.log(`  ✗  ${d.file}`)
  for (const i of d.issues) {
    console.log(`       [${i.rule}] ×${i.count} ${i.why}${i.sample ? `  例: ${i.sample}` : ''}`)
  }
}
console.log(`通过 ${demoFiles.length - demoBad.length} 个 / 违规 ${demoBad.length} 个`)

process.exit(bad || demoBad.length ? 1 : 0)
