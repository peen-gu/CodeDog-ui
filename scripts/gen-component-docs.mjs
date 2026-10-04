#!/usr/bin/env node
/**
 * CodeDogUI 组件文档生成器
 * ------------------------------------------------------------------
 * 从 SFC 源码与演示页里自动生成 VitePress 文档，避免文档与代码脱节。
 *
 * 数据源有三个：
 *   1. 组件 SFC          → props / emits / slots / defineExpose / 源码设计注释
 *   2. 演示页 <cd-card>  → 真实用例 + 人写的中文说明
 *      （演示页里每个分区块都写成 `<cd-card title="cd-xxx" desc="...">`，
 *        既是emos; demo 又自带 metadata，不用再维护第二份描述）
 *   3. component-meta.json → 分类与标题（纯人工、不自动生成）
 *
 * 用法：node scripts/gen-component-docs.mjs
 *
 * 已知取舍：
 *   - props 的括号配平忽略字符串内容。本框架 props 里没有字符串含花括号的写法，
 *     若将来出现（例如 validator 里写模板串）需要升级为「感知字符串」的扫描。
 *   - 演示页代码块是整段 cd-card 内容，含 <view> 等 demo 专有标签，
 *     但胜在真实、可运行、不会过期。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const COMP_DIR = path.join(ROOT, 'src/uni_modules/codedog-ui/components')
const PAGES_DIR = path.join(ROOT, 'src/pages')
const DOCS = path.join(ROOT, 'docs')
const OUT_DIR = path.join(DOCS, 'components')
const DATA_DIR = path.join(DOCS, '.vitepress', 'data')
const META_FILE = path.join(__dirname, 'component-meta.json')
/* 实时预览：demo SFC 与注册表（CdDemo.vue 通过 registry 懒加载） */
const DEMO_SRC_DIR = path.join(DOCS, '.vitepress', 'demo-src')
const REGISTRY_FILE = path.join(DOCS, '.vitepress', 'theme', 'demo-registry.mjs')

/* ==================== 基础工具 ==================== */

function read(p) {
  return fs.readFileSync(p, 'utf-8')
}

/**
 * 写产物，并把行尾统一成 LF。
 *
 * 演示页源码里混着 CRLF（实测 src/pages/navigation/index.vue 421 行里有 405 行是 CRLF），
 * 提取出来的代码块会把 \r 原样带进 md —— 产物变成 CRLF/LF 混排，
 * 在 Linux 上部署没问题但 git diff 会整片重写、diff 审阅直接失效。
 * 生成器的输出必须是规范化的，不能把输入的行尾原样透出去。
 */
function writeLf(p, s) {
  fs.writeFileSync(p, s.replace(/\r\n/g, '\n'), 'utf-8')
}

/** 去掉字符串字面量，让括号计数不被 `'}'` 之类的内容干扰 */
function stripStrings(s) {
  return s
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '``')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
}

/** 一段文本里各类括号的净差值：>0 表示还没闭合 */
function bracketBalance(s) {
  const t = stripStrings(s)
  let b = 0
  for (const c of t) {
    if (c === '(' || c === '[' || c === '{') b++
    else if (c === ')' || c === ']' || c === '}') b--
  }
  return b
}

/** 只算花括号（用于 props 对象） */
function braceDelta(line) {
  const t = stripStrings(line)
  let d = 0
  for (const c of t) {
    if (c === '{') d++
    else if (c === '}') d--
  }
  return d
}

/** 从 src[startIdx] 这个「开括号字符」出发，取到配平的闭括号为止的内容 */
function takeBalanced(src, startIdx, open, close) {
  let depth = 0
  for (let i = startIdx; i < src.length; i++) {
    const c = src[i]
    if (c === open) depth++
    else if (c === close) {
      depth--
      if (depth === 0) return src.slice(startIdx + 1, i)
    }
  }
  return ''
}

/* ==================== SFC 解析 ==================== */

function parseSfc(code) {
  const scriptM = code.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  const tplM = code.match(/<template>([\s\S]*?)<\/template>/)
  return {
    script: scriptM ? scriptM[1] : '',
    template: tplM ? tplM[1] : '',
  }
}

/** 去掉整块的最小缩进，但保留首尾两行（孤立标签片段需要留下开闭标签） */
function dedentKeep(buf) {
  const indent = Math.min(
    ...buf.filter((l) => l.trim() !== '').map((l) => l.match(/^\s*/)[0].length)
  )
  return buf
    .map((l) => (l.trim() === '' ? '' : l.slice(indent)))
    .join('\n')
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '')
}

/**
 * 把 `/** ... *\/` 块注释洗成一行纯文本。
 * JSDoc 标签段（@type / @example / @param）一律丢弃 —— 那是给 IDE 看的，
 * 混进 Markdown 表格会把单元格撑爆。
 */
function cleanComment(lines) {
  let text = lines
    .join('\n')
    .replace(/^\s*\/\*+\s*/, '')
    .replace(/\*+\/\s*$/, '')
    .split('\n')
    .map((l) => l.replace(/^\s*\*?\s?/, '').trim())
    .filter((l) => l !== '')
    .join(' ')
    .trim()
  const at = text.search(/@\w+/)
  if (at > 0) text = text.slice(0, at).trim()
  /* 源码注释开头常有 `cd-xxx —— 中文名 ----------` 的标题横幅，正文不需要 */
  return text.replace(/^cd-[\w-]+[^-！。?]*?-{3,}\s*/, '').trim()
}

/** props 对象体 → 结构化数组 */
function parseProps(body) {
  const lines = body.split('\n')
  const props = []
  let pending = []
  let cur = null
  let depth = 0

  for (const raw of lines) {
    const line = raw.replace(/\s*\/\/.*$/, '')
    if (cur === null) {
      const m = line.match(/^\s{2}(\w+):\s*\{/)
      if (m) {
        cur = { name: m[1], comment: cleanComment(pending), lines: [raw] }
        pending = []
        depth = braceDelta(raw)
        if (depth <= 0) {
          props.push(cur)
          cur = null
          depth = 0
        }
      } else if (line.trim() !== '') {
        pending.push(raw)
      }
      continue
    }
    cur.lines.push(raw)
    depth += braceDelta(raw)
    if (depth <= 0) {
      props.push(cur)
      cur = null
      depth = 0
    }
  }
  return props.map(normalizeProp)
}

/** 逐行读取 default 值：带括号的默认值得跨行拼（如 `() => ({...})`） */
function readDefault(lines) {
  const start = lines.findIndex((l) => /^\s+default:/.test(l))
  if (start < 0) return ''
  let chunk = lines[start].replace(/^\s*default:\s*/, '')
  let bal = bracketBalance(chunk)
  let i = start + 1
  while (bal > 0 && i < lines.length) {
    chunk += ' ' + lines[i].trim()
    bal = bracketBalance(chunk)
    i++
  }
  return chunk.replace(/,+\s*$/, '').trim()
}

function formatType(raw) {
  if (!raw) return '-'
  const t = raw.replace(/\s+/g, ' ').trim()
  if (t.startsWith('[')) return t.slice(1, -1).split(',').map((x) => x.trim()).join(' \\| ')
  return t
}

function normalizeProp(p) {
  const src = p.lines.join('\n')
  const typeM = src.match(/type:\s*(\[[^\]]*\]|[A-Za-z_$][\w.$]*)/)
  const required = /\brequired:\s*true\b/.test(src)
  let def = readDefault(p.lines)
  if (def === 'undefined') def = ''
  return {
    name: p.name,
    type: formatType(typeM ? typeM[1] : ''),
    default: def === '' ? '—' : `\`${def.replace(/`/g, '\\`')}\``,
    required,
    comment: p.comment || '—',
  }
}

function parseEmits(script) {
  const m = script.match(/defineEmits\(\s*(\[|\{)/)
  if (!m) return []
  const open = m[1]
  const close = open === '[' ? ']' : '}'
  const idx = script.indexOf(open, m.index)
  const body = takeBalanced(script, idx, open, close)
  const names = [...body.matchAll(/['"](\S+?)['"]/g)].map((x) => x[1])
  return [...new Set(names)]
}

function parseSlots(template) {
  const out = []
  const re = /<slot\b([^>]*)>/g
  let m
  const bindings = {}
  while ((m = re.exec(template))) {
    const attrs = m[1]
    const nm = attrs.match(/name=["']([\w-]+)["']/)
    const name = nm ? nm[1] : 'default'
    if (!out.includes(name)) {
      out.push(name)
      const scoped = [...attrs.matchAll(/:(\w[\w-]*)=/g)].map((x) => x[1])
      if (scoped.length) bindings[name] = scoped
    }
  }
  return { names: out, bindings }
}

function parseExpose(script) {
  const m = script.match(/defineExpose\(\s*\{/)
  if (!m) return []
  const idx = m.index + m[0].length - 1
  const body = takeBalanced(script, idx, '{', '}')
  const keys = [...body.matchAll(/^\s{2}(\w+)\s*[:,)]/gm)].map((x) => x[1])
  return [...new Set(keys)]
}

/** 抽取 defineProps 之前那段最长的块注释 —— 通常是作者写的设计说明 */
function parseNotes(script) {
  const anchor = script.search(/const\s+props\s*=\s*defineProps|const\s+\w+\s*=\s*defineProps/)
  const head = anchor > 0 ? script.slice(0, anchor) : script
  const blocks = [...head.matchAll(/\/\*([\s\S]*?)\*\//g)].map((x) => cleanComment(['/*' + x[1] + '*/']))
  if (!blocks.length) return ''
  return blocks.sort((a, b) => b.length - a.length)[0]
}

/* ==================== 演示页解析 ==================== */

/**
 * 演示页的分区有两种标记，优先用注释标记——它覆盖得最全：
 *   <!-- ============ cd-cell / cd-cell-group ============ -->
 *   <cd-card class="section" title="..." desc="..."> ... </cd-card>
 * 一个分区常常同时演示多个组件（如 cd-cell / cd-cell-group），
 * 因此这里的 names 是复数：同一段用例会挂给块里出现的每个组件。
 */
/** 从一个字符串里抽出所有形如 cd-xxx 的组件名（支持 / + · 、空格 分隔） */
function namesFrom(s) {
  if (!s) return []
  return s
    .split(/[\/·、,，+]|\s+/)
    .map((x) => x.trim())
    .filter((x) => /^cd-[\w-]+$/.test(x))
    .map((x) => x.slice(3))
}

const SECTION_MARK = /<!--\s*=+\s*([\s\S]*?cd-[\s\S]*?)\s*=+\s*-->/

/** 从一个 `<cd-card` 起始行出发，取到配平的 `</cd-card>` */
function takeCard(lines, start) {
  const buf = []
  let depth = 0
  for (let j = start; j < lines.length; j++) {
    buf.push(lines[j])
    depth +=
      (lines[j].match(/<cd-card\b/g) || []).length -
      (lines[j].match(/<\/cd-card>/g) || []).length
    if (depth <= 0) return { head: buf.join('\n'), lines: buf, end: j }
  }
  return null
}

/**
 * 一个演示片段对某个组件的「来源强度」：
 *   owner    —— 分区标题/注释明确点名（最可信，优先展示）
 *   used     —— 片段代码里用到了它（兜底，多为子项组件如 cd-grid-item）
 */
function parseDemoBlocks(file) {
  const lines = read(file).split('\n')
  const page = path.basename(path.dirname(file))
  const out = []
  let i = 0

  while (i < lines.length) {
    if (!/<cd-card\b/.test(lines[i])) {
      i++
      continue
    }
    const card = takeCard(lines, i)
    if (!card) break

    /* ① 往回看几行找分区注释；② 卡片自己的 title 属性 */
    const lookback = lines.slice(Math.max(0, i - 6), i).join('\n')
    const markM = lookback.match(SECTION_MARK)
    const titleM = card.head.match(/title="([^"]*)"/)
    const owner = [...new Set([...namesFrom(markM ? markM[1] : ''), ...namesFrom(titleM ? titleM[1] : '')])]

    const dm = card.head.match(/desc="([^"]*)"/)
    const desc = dm ? dm[1] : ''
    const code = dedent(card.lines)

    /* ③ 片段里实际用到的组件 —— 兜底，让子项组件也有用例 */
    const used = [...new Set([...code.matchAll(/<cd-([a-z-]+)/g)].map((x) => x[1]))]

    out.push({ owner, used, desc, code, page })
    i = card.end + 1
  }
  return out
}

/**
 * 剥掉外层 cd-card 自己的具名插槽块。
 *
 * 演示页分区块常写成：
 *   <cd-card class="section" title="cd-row / cd-col" desc="…">
 *     <template #extra><text class="muted">gutter 16</text></template>
 *     <cd-row>…</cd-row>
 *   </cd-card>
 *
 * `<template #extra>` 是**外层卡片**的插槽，不属于演示片段本身。
 * dedent 过去只剥 `<cd-card>` 标签这一行，这段插槽就被留在片段开头，
 * 于是 isStandalone() 判定「片段以 <template #xxx> 开头 → 是宿主插槽内容」
 * 把**整个片段丢弃**。
 *
 * 实测后果（2026-10-04 定位）：`cd-row / cd-col` 区块（src/pages/components/index.vue
 * 第 173 行）正是唯一以 `<template #extra>` 开头的区块，它被丢弃后 row / col
 * 失去唯一的权威用例，退化成展示 Input / Card 的切片 —— docs/components/col.md 与
 * row.md 线上文档可见，小程序演示页同源同病。
 *
 * 判定「属于外层卡片」的依据：去缩进后落在最小缩进层级（即卡片的直接子节点）
 * 且以 `<template #` 开头。片段内部更深层级的插槽（如 cd-button 的 #icon）不受影响。
 */
function stripWrapperSlots(bodyLines, indent) {
  const out = []
  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i]
    const lead = line.trim() === '' ? -1 : line.match(/^\s*/)[0].length
    if (lead === indent && /^\s*<template\s+#/.test(line)) {
      let depth = 0
      for (; i < bodyLines.length; i++) {
        depth += (bodyLines[i].match(/<template\b/g) || []).length
        depth -= (bodyLines[i].match(/<\/template>/g) || []).length
        if (depth <= 0) break
      }
      continue
    }
    out.push(line)
  }
  return out
}

/** 去掉整块的最小缩进，并剥掉外层 cd-card 标签本身 */
function dedent(buf) {
  /* 开标签可能跨多行（属性各占一行），要一直跳过到标签真正闭合那一行 */
  let head = 0
  while (head < buf.length && !buf[head].trim().endsWith('>')) head++
  head++

  const bodyLines = buf.slice(head, buf.length - 1)
  if (!bodyLines.length) return ''
  const indent = Math.min(
    ...bodyLines.filter((l) => l.trim() !== '').map((l) => l.match(/^\s*/)[0].length)
  )
  /* 剥完若一个字都不剩，说明这个区块本身就是「某宿主的插槽内容」，
     此时保留原样，交给 isStandalone() 按老规则拒掉，避免产出空预览 */
  const stripped = stripWrapperSlots(bodyLines, indent)
  const final = stripped.some((l) => l.trim() !== '') ? stripped : bodyLines
  return final
    .map((l) => (l.trim() === '' ? '' : l.slice(indent)))
    .join('\n')
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '')
}

/**
 * 终极兜底：有些组件演示时不包在 cd-card 里（如页面根部的 cd-affix）。
 * 直接从页面里抠出第一个该组件的标签片段。
 * 限长 40 行 —— cd-config-provider 这类页面根节点会把整页都吞进来。
 */
function collectOrphanUsage(name, files) {
  const MAX = 40
  /* 正向预查要额外允许「行尾」——演示代码里属性常常换行写，
     标签名后面紧跟的是换行而不是空白，漏掉 $ 会让整段一个都匹配不上 */
  const openRe = new RegExp(`<cd-${name}(?=[\\s/>]|$)`, 'g')
  const closeRe = new RegExp(`</cd-${name}(?=[\\s>])`, 'g')
  const pageOf = (f) => path.basename(path.dirname(f))

  for (const f of files) {
    const lines = read(f).split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const at = line.indexOf(`<cd-${name}`)
      if (at < 0) continue
      /* 标签名后面必须是空白或标签结束符；整行以标签名结尾（属性换行写）也算合法，不能漏 */
      const after = line.slice(at + 4 + name.length)
      if (after && !/^[\s/>]/.test(after)) continue

      /* 单行自闭合 */
      if (line.slice(at).includes('/>')) {
        return { code: dedentKeep([line]), page: pageOf(f), level: 2 }
      }

      const buf = [line]
      let depth = (line.match(openRe) || []).length - (line.match(closeRe) || []).length
      let j = i + 1
      while (j < lines.length && depth > 0 && buf.length < MAX) {
        buf.push(lines[j])
        depth += (lines[j].match(openRe) || []).length - (lines[j].match(closeRe) || []).length
        if (/^\s*\/>\s*$/.test(lines[j])) break
        j++
      }
      return { code: dedentKeep(buf), page: pageOf(f), level: 2 }
    }
  }
  return null
}

/** 把 `<xxx>` 形式的文本转义成字面量，避免被 Markdown→Vue 模板编译当成真实标签 */
function escapeTags(s) {
  return String(s).replace(/</g, '&lt;')
}

/**
 * 取演示页 <script setup> 的内部内容 —— demo SFC 的状态来源。
 *
 * 片段模板里大量引用页面状态（hobbies / iconNames / formSnapshot 等 56 处），
 * 预览要真实可交互，就必须把 script 一起带上。已逐页核对：
 * 演示页 script 顶层只有 vue import、模块 import 与函数/常量定义，
 * 无 uni 生命周期钩子，纯浏览器可执行。
 */
function pageScriptOf(file) {
  /* \r?\n：部分演示页是 CRLF 行尾，正则必须兼容 */
  const m = read(file).match(/<script setup>\r?\n([\s\S]*?)<\/script>/)
  return m ? m[1].replace(/\r\n/g, '\n').trim() : ''
}

/**
 * 片段能否独立渲染：顶层若出现 <template #xxx>，说明它是某个宿主
 * 组件的插槽内容（如 cd-card 的 #extra），脱离宿主后模板无法编译，
 * 这类片段只展示源码、不出预览。
 */
function isStandalone(code) {
  /* 只看第一个非空行：插槽型片段开头就是 <template #xxx>；
     片段中间嵌套的 <template #icon> 属于组件自身用法，不受影响 */
  const first = code.split('\n').find((l) => l.trim() !== '') || ''
  if (/^\s*<template\s+#/.test(first)) return false
  return tagsBalanced(code)
}

/**
 * 组件标签是否出现在**非插槽位置**。
 *
 * 一个分区块常同时演示多个组件（如 cd-cell / cd-cell-group），切片会挂给
 * 块里出现过的每个组件。但有些出现只是「顺带」：`<cd-button>` 写在
 * `<cd-card>` 的 `#footer` 插槽里，于是「CdCard 卡片」区块被挂到 button 名下，
 * Button 文档页/演示页就会出现一张卡片（2026-10-04 实测截图确认）。
 *
 * 判据（结构性、可判定，非打分）：剥掉全部 `<template #xxx>…</template>` 插槽块后，
 * 组件标签若不复存在，说明它只是别人插槽里的配角 → 不予采用。
 * 实测只有 cd-button 命中 1 条，且没有任何组件因此失去全部用例
 * （父组件如 cd-steps / cd-collapse 自己仍在顶层，不受影响）。
 */
function tagOutsideSlots(code, name) {
  let prev
  let out = code
  do {
    prev = out
    out = out.replace(/<template\s+#[\s\S]*?<\/template>/g, '')
  } while (out !== prev)
  return new RegExp(`<cd-${name}[\\s/>]`).test(out)
}

/** 标签配平检查（剥掉 HTML 注释后统计）：截断片段（如孤儿用例的 40 行上限）会失配 */
function tagsBalanced(code) {
  const clean = code.replace(/<!--[\s\S]*?-->/g, '')
  const open = {}
  for (const m of clean.matchAll(/<([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g)) {
    if (m[2] === '/') continue /* 自闭合 */
    open[m[1]] = (open[m[1]] || 0) + 1
  }
  for (const m of clean.matchAll(/<\/([a-zA-Z][\w-]*)>/g)) {
    open[m[1]] = (open[m[1]] || 0) - 1
  }
  return Object.values(open).every((n) => n === 0)
}

/**
 * 把一段演示片段组装成可在 VitePress 里编译的真实 SFC：
 * 片段模板 + 来源页 script setup。产出到 docs/.vitepress/demo-src/<name>/<i>.vue。
 */
function composeDemoSfc(demo, scriptSource) {
  /* 片段统一归一为 LF：CRLF 混进 SFC 会影响编译与 diff */
  const code = demo.code.replace(/\r\n/g, '\n')
  const parts = ['<template>', code, '</template>']
  if (scriptSource) parts.push('', '<script setup>', scriptSource, '</script>')
  return parts.join('\n') + '\n'
}

/**
 * 手写 demo 覆盖。
 *
 * 两种形态：
 *   1. 数组 —— 手写片段排在自动片段之前，两者都进预览池（默认行为）；
 *   2. `{ replace: true, demos: [...] }` —— **只用手写片段**，丢弃自动切片。
 *
 * 为什么需要 replace：自动切片是从演示页切出来的，有些片段虽然含本组件标签、
 * 能独立编译，但缺了「让组件显形」的那部分（触发器写在别处、或组件默认为关闭态），
 * 预览出来是一块空白。逐个给这类组件打补丁不如直接接管整个预览。
 */
const DEMO_OVERRIDES = {
  /* 演示页里 select 的用法片段正好是「禁用态表单」那一段，
     预览出来是一个点不动的下拉 —— 看文档的人第一眼该看到的是能用的样子 */
  select: [
    {
      code: [
        '<cd-select v-model="picked" :options="pickOptions" placeholder="请选择" />',
        '<view class="row">',
        '  <cd-tag type="info">当前值：{{ picked || "（未选）" }}</cd-tag>',
        '</view>',
      ].join('\n'),
      script: [
        "import { ref } from 'vue'",
        '',
        "const picked = ref('')",
        'const pickOptions = [',
        "  { label: '选项一', value: 'a' },",
        "  { label: '选项二', value: 'b' },",
        "  { label: '选项三（禁用）', value: 'c', disabled: true },",
        ']',
      ].join('\n'),
    },
  ],
  /* 演示页里的第二个 dialog 用法片段是「弹层声明」：整个片段只有
     <cd-dialog v-model="detailVisible" />，触发点在别处（表格行点击），
     切片后默认关闭 → 预览区是一块 0 高度的空白。接管掉。 */
  dialog: {
    replace: true,
    demos: [
      {
        code: [
          '<cd-button size="small" @click="visible = true">打开对话框</cd-button>',
          '<cd-dialog',
          '  v-model="visible"',
          '  title="删除确认"',
          '  content="删除后不可恢复，确定继续吗？"',
          '  @confirm="visible = false"',
          '  @cancel="visible = false"',
          '/>',
        ].join('\n'),
        script: ["import { ref } from 'vue'", '', 'const visible = ref(false)'].join('\n'),
      },
      {
        code: [
          '<cd-button size="small" type="danger" @click="delVisible = true">删除这个项目</cd-button>',
          '<cd-dialog',
          '  v-model="delVisible"',
          '  title="危险操作"',
          '  content="删除后无法恢复，确认要继续吗？"',
          '  confirm-text="确认删除"',
          '  :confirm-loading="submitting"',
          '  @confirm="runDelete"',
          '  @cancel="delVisible = false"',
          '/>',
          '<cd-tag v-if="done" type="success">已模拟删除完成</cd-tag>',
        ].join('\n'),
        script: [
          "import { ref } from 'vue'",
          '',
          'const delVisible = ref(false)',
          'const submitting = ref(false)',
          'const done = ref(false)',
          '',
          'function runDelete() {',
          '  submitting.value = true',
          '  setTimeout(() => {',
          '    submitting.value = false',
          '    delVisible.value = false',
          '    done.value = true',
          '  }, 1200)',
          '}',
        ].join('\n'),
      },
    ],
  },
  /* 演示页里图标是「cd-card 的 extra 插槽 + 网格」形态，切片后开头是
     <template #extra>，不满足 standalone 被整段跳过 —— 图标页会没有预览。
     这里补一段完整的图标总表。 */
  icon: [
    {
      code: [
        '<view class="icon-grid">',
        '  <view v-for="name in iconNames" :key="name" class="icon-cell">',
        '    <cd-icon :name="name" :size="20" />',
        '    <text class="icon-cell__name">{{ name }}</text>',
        '  </view>',
        '</view>',
      ].join('\n'),
      script: [
        "import { ICON_NAMES } from '../../../../src/uni_modules/codedog-ui/components/cd-icon/icons'",
        '',
        'const iconNames = ICON_NAMES',
      ].join('\n'),
    },
  ],
  /* cd-backtop 的可见条件是「页面滚动量 > visibility-height」，而它的滚动量来自
     usePageScroll：环境里有 window 就自己监听 window.scroll，否则取 scroll-top 属性。
     文档站预览框不是独立滚动容器，「向下滚本页」等于让读文档的人滚到别的章节，
     那时预览框早已离开视口，组件出现了也看不见。
     所以这里改成受控形态：传 scroll-top 属性自行驱动，不依赖真实滚动。 */
  backtop: {
    replace: true,
    demos: [
      {
        code: [
          '<view class="stack">',
          '  <text class="body-text">预览里不做真实滚动 —— 用下面的开关直接驱动 scroll-top，越过 visibility-height（360）后按钮出现。</text>',
          '  <view class="row">',
          '    <cd-button size="small" type="primary" @click="scrollTop = scrollTop > 360 ? 0 : 600">',
          '      {{ scrollTop > 360 ? "模拟回到顶部" : "模拟滚动到 600px" }}',
          '    </cd-button>',
          '    <cd-tag type="info">scrollTop = {{ scrollTop }}</cd-tag>',
          '  </view>',
          '  <cd-backtop :scroll-top="scrollTop" :visibility-height="360" />',
          '</view>',
        ].join('\n'),
        script: ["import { ref } from 'vue'", '', 'const scrollTop = ref(0)'].join('\n'),
      },
    ],
  },
  /* cd-toast-host 本身没有视觉形态（它是命令式反馈服务的挂载点），
     自动切片出来只有一个空标签，预览区是 0 高度的空白。
     改成「按钮触发四类反馈」，看文档的人第一眼能看见东西。 */
  'toast-host': {
    replace: true,
    demos: [
      {
        code: [
          '<view class="stack">',
          '  <text class="body-text">下列反馈全部由 service 触发。H5 端宿主会在首次调用时自动挂载；小程序端需要自己在页面里放一个 cd-toast-host。</text>',
          '  <view class="row">',
          '    <cd-button size="small" @click="toast.success(\'保存成功\')">成功提示</cd-button>',
          '    <cd-button size="small" @click="toast.error(\'保存失败\')">失败提示</cd-button>',
          '    <cd-button size="small" @click="runLoading">加载 1.2s</cd-button>',
          '    <cd-button size="small" @click="runConfirm">确认框</cd-button>',
          '  </view>',
          '  <view class="row"><cd-tag type="info">confirm 结果：{{ result || "（未触发）" }}</cd-tag></view>',
          '  <cd-toast-host />',
          '</view>',
        ].join('\n'),
        script: [
          "import { ref } from 'vue'",
          "import { toast, confirm, loading, hideLoading } from '../../../../src/uni_modules/codedog-ui'",
          '',
          "const result = ref('')",
          '',
          'async function runConfirm() {',
          "  const ok = await confirm({ title: '删除确认', content: '删除后不可恢复，确定继续吗？' })",
          "  result.value = ok ? '确定' : '取消'",
          '}',
          '',
          'function runLoading() {',
          "  loading('提交中')",
          '  setTimeout(() => {',
          '    hideLoading()',
          "    toast.success('已完成')",
          '  }, 1200)',
          '}',
        ].join('\n'),
      },
    ],
  },
  fab: [
    {
      code: [
        '<view class="stack">',
        '  <text class="body-text">悬浮球固定在视口右下角，按住可拖拽换位。</text>',
          '  <cd-fab icon="plus" text="新建" draggable @click="count += 1" />',
          '  <view class="row"><cd-tag type="info">已点击 {{ count }} 次</cd-tag></view>',
        '</view>',
      ].join('\n'),
      script: ["import { ref } from 'vue'", '', 'const count = ref(0)'].join('\n'),
    },
  ],
  drawer: [
    {
      code: [
        '<cd-button size="small" @click="visible = true">打开抽屉</cd-button>',
        '<cd-drawer v-model="visible" position="right" :size="320" title="侧边抽屉">',
        '  <text class="body-text">抽屉承载工作区类操作，dialog 承载决策类操作。</text>',
        '</cd-drawer>',
      ].join('\n'),
      script: ["import { ref } from 'vue'", '', 'const visible = ref(false)'].join('\n'),
    },
  ],
}

/** Markdown 表格单元格转义：管道符转义 + 换行压平 */
function cell(s) {
  return String(s == null ? '—' : s).replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim() || '—'
}

function renderMd(c, meta, demos) {
  const lines = []
  const title = meta.title || c.name
  lines.push('---')
  lines.push(`title: ${title}`)
  lines.push('---')
  lines.push('')
  lines.push(`# ${title}`)
  lines.push('')
  lines.push(`<div class="cd-api-tag">\`${c.name}\` · ${meta.categoryTitle || '组件'}</div>`)
  lines.push('')
  if (meta.desc) {
    lines.push(meta.desc)
    lines.push('')
  }

  /* 用法：先渲染真实预览，再给可折叠源码 */
  const usable = demos.slice(0, 2)
  if (usable.length) {
    lines.push('## 用法')
    lines.push('')
    usable.forEach((d, i) => {
      if (d.demoId) {
        /* 配对标签而非自闭合：markdown-it 对未知自闭合标签会当普通 HTML 吞掉，
           导致组件不被 Vue 编译、后续代码块排版也跟着坏掉 */
        lines.push(`<CdDemo id="${d.demoId}"></CdDemo>`)
        lines.push('')
      }
      lines.push(`\`\`\`vue${d.page ? ` // 来自演示页 ${d.page}` : ''}`)
      lines.push(d.code)
      lines.push('```')
      if (i < usable.length - 1) lines.push('')
    })
    lines.push('')
  }

  /* Props */
  lines.push('## Props')
  lines.push('')
  if (c.props.length) {
    lines.push('| 属性 | 类型 | 默认值 | 必填 | 说明 |')
    lines.push('|---|---|---|---|---|')
    for (const p of c.props) {
      /* 管道符必须转义 —— 注释里出现 'auto' | 'desktop' 会把表格撕裂 */
      lines.push(
        `| \`${p.name}\` | ${p.type} | ${cell(p.default)} | ${p.required ? '✓' : '—'} | ${cell(p.comment)} |`
      )
    }
  } else {
    lines.push('无')
  }
  lines.push('')

  /* Events */
  lines.push('## Events')
  lines.push('')
  if (c.emits.length) {
    lines.push('| 事件名 | 说明 |')
    lines.push('|---|---|')
    for (const e of c.emits) {
      const hint = EVENT_HINTS[e] || '—'
      lines.push(`| \`${e}\` | ${hint} |`)
    }
  } else {
    lines.push('无')
  }
  lines.push('')

  /* Slots */
  lines.push('## Slots')
  lines.push('')
  if (c.slots.names.length) {
    lines.push('| 插槽名 | 作用域参数 | 说明 |')
    lines.push('|---|---|---|')
    for (const s of c.slots.names) {
      const scoped = c.slots.bindings[s]
      lines.push(
        `| \`${s}\` | ${scoped ? scoped.map((x) => `\`${x}\``).join(' / ') : '—'} | ${
          SLOT_HINTS[`${c.name}:${s}`] || (s === 'default' ? '默认插槽' : '—')
        } |`
      )
    }
  } else {
    lines.push('无')
  }
  lines.push('')

  /* Expose */
  if (c.expose.length) {
    lines.push('## Expose')
    lines.push('')
    lines.push('通过 `ref` 调用：')
    lines.push('')
    lines.push('| 方法 / 属性 | 说明 |')
    lines.push('|---|---|')
    for (const k of c.expose) {
      lines.push(`| \`${k}\` | ${EXPOSE_HINTS[`${c.name}:${k}`] || '—'} |`)
    }
    lines.push('')
  }

  /* 设计说明 */
  if (c.notes) {
    lines.push('## 设计说明')
    lines.push('')
    lines.push('> 以下由源码注释自动抽取，随代码更新。')
    lines.push('')
    lines.push(
      c.notes
        .split(/(?<=[。！？])/)
        .map((x) => x.trim())
        .filter(Boolean)
        /* VitePress 会把 Markdown 当 Vue 模板编译，注释里常写 `<cd-xxx />`，
           不转义会被当成真实标签解析 → Element is missing end tag */
        .map((x) => `- ${escapeTags(x)}`)
        .join('\n')
    )
    lines.push('')
  }

  /* 关联组件 */
  if (meta.related && meta.related.length) {
    lines.push('## 关联')
    lines.push('')
    lines.push(meta.related.map((r) => `[cd-${r}](/components/${r})`).join(' · '))
    lines.push('')
  }

  return lines.join('\n')
}

/* ==================== 语义补充（人工维护的小词典） ==================== */

const EVENT_HINTS = {
  'update:modelValue': 'v-model 绑定值变化',
  'update:theme': '主题切换（v-model:theme）',
  'update:current': '当前页码变化（v-model:current）',
  'update:pageSize': '每页条数变化（v-model:pageSize）',
  click: '点击时触发',
  change: '值变化时触发',
  input: '输入过程中实时触发',
  focus: '获得焦点',
  blur: '失去焦点',
  confirm: '确认',
  cancel: '取消',
  clear: '点击清除按钮',
  open: '打开时',
  close: '关闭时（动画结束后）',
  'visible-change': '显示状态变化',
  select: '选中某一项',
  search: '提交搜索',
  action: '点击右侧动作位',
  overlimit: '步进器到达边界',
  validate: '表单校验完成，返回是否通过',
  submit: '表单提交',
  start: '开始',
  finish: '结束',
  pause: '暂停',
  toggle: '展开/收起切换',
}

const SLOT_HINTS = {
  'cd-cell:default': '右侧值区，永远排在箭头左侧',
  'cd-result:icon': '自定义结果图标',
  'cd-result:title': '结果主标题',
  'cd-result:desc': '结果描述',
  'cd-result:extra': '描述下方的补充区',
  'cd-result:actions': '操作按钮区',
  'cd-empty:image': '自定义空状态插图',
  'cd-empty:description': '空状态文案',
  'cd-empty:default': '底部操作区',
  'cd-alert:title': '自定义标题',
  'cd-alert:default': '提示内容',
  'cd-alert:action': '右侧操作区',
  'cd-card:header': '自定义头部',
  'cd-card:extra': '头部右侧附加区',
  'cd-card:footer': '底部区域',
  'cd-image:loading': '加载中占位',
  'cd-image:error': '加载失败占位',
  'cd-notice-bar:left-icon': '左侧图标',
  'cd-notice-bar:right-icon': '右侧图标（一般为关闭）',
  'cd-search-bar:left': '输入框前置区',
  'cd-search-bar:action': '右侧动作位',
  'cd-rate:text': '评分右侧文案',
  'cd-timeline-item:dot': '自定义节点',
  'cd-step:icon': '自定义步骤图标',
  'cd-step:title': '步骤标题',
  'cd-step:description': '步骤描述',
  'cd-grid-item:icon': '自定义图标',
  'cd-grid-item:text': '自定义文字',
  'cd-breadcrumb-item:default': '面包屑项内容',
  'cd-collapse-item:title': '自定义标题',
  'cd-action-sheet:default': '面板顶部自定义内容',
}

const EXPOSE_HINTS = {
  'cd-collapse:setActive': '命令式展开/收起指定项',
  'cd-collapse-item:refresh': '内容变化后重新测量高度',
  'cd-affix:refresh': '重新计算吸附状态',
  'cd-affix:fixed': '当前是否处于吸附态（响应式）',
  'cd-count-down:start': '开始 / 继续',
  'cd-count-down:pause': '暂停',
  'cd-count-down:reset': '重置到初始时长',
  'cd-count-down:sync': '与外部时间戳对齐',
  'cd-count-down:remain': '剩余毫秒数（响应式）',
  'cd-count-down:parts': '拆分后的时间片段（响应式）',
  'cd-count-to:restart': '重新开始动画',
  'cd-count-to:pause': '暂停动画',
  'cd-count-to:start': '开始动画',
  'cd-count-to:current': '当前数值（响应式）',
  'cd-fab:reset': '把拖拽后的按钮复位',
  'cd-image:state': '当前加载状态（响应式）',
  'cd-form:validate': '触发整表校验，返回是否通过',
  'cd-form:resetFields': '重置所有字段',
  'cd-form:clearValidate': '清除校验提示',
  'cd-form-item:validate': '单独校验该字段',
  'cd-form-item:resetField': '重置该字段',
  'cd-form-item:clearValidate': '清除该字段提示',
  'cd-input:focus': '命令式聚焦',
  'cd-input:blur': '命令式失焦',
  'cd-input:clear': '命令式清空',
  'cd-avatar:refresh': '重新走降级链',
}

/* ==================== 主流程 ==================== */

function main() {
  const metaRaw = fs.existsSync(META_FILE) ? JSON.parse(read(META_FILE)) : { categories: [], meta: {} }
  const categoryOf = {}
  const categoryTitleOf = {}
  for (const cat of metaRaw.categories) {
    for (const item of cat.items) {
      categoryOf[item] = cat.id
      categoryTitleOf[item] = cat.title
    }
  }

  /* 1. 收集演示页里的人写描述与用例 */
  const demoByComponent = {}
  const pageFiles = fs.existsSync(PAGES_DIR)
    ? fs.readdirSync(PAGES_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => path.join(PAGES_DIR, d.name, 'index.vue'))
        .filter((p) => fs.existsSync(p))
    : []
  for (const f of pageFiles) {
    for (const b of parseDemoBlocks(f)) {
      /* 优先用「点名」的片段，其次才用「代码里出现过」的兜底片段 */
      for (const n of b.owner) (demoByComponent[n] ||= []).push({ ...b, level: 0 })
      for (const n of b.used) {
        if (b.owner.includes(n)) continue
        ;(demoByComponent[n] ||= []).push({ ...b, level: 1 })
      }
    }
  }
  for (const k of Object.keys(demoByComponent)) {
    demoByComponent[k].sort((a, b) => a.level - b.level)
  }

  /* 2. 逐个组件解析 SFC */
  const components = []
  const dirs = fs
    .readdirSync(COMP_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  for (const dir of dirs) {
    const name = dir.replace(/^cd-/, '')
    const vuePath = path.join(COMP_DIR, dir, `${dir}.vue`)
    if (!fs.existsSync(vuePath)) continue
    const { script, template } = parseSfc(read(vuePath))

    let props = []
    const pm = script.match(/defineProps\(\s*\{/)
    if (pm) {
      const idx = script.indexOf('{', pm.index)
      props = parseProps(takeBalanced(script, idx, '{', '}'))
    }

    /* 演示页未用 cd-card 包裹的，直接抠标签兜底 */
    let demos = demoByComponent[name] || []
    if (!demos.length) {
      const o = collectOrphanUsage(name, pageFiles)
      if (o) demos = [o]
    }

    /* meta 里没写描述的，退回用演示页的 desc（人写的那一句） */
    const fallbackDesc = demos.find((d) => d.desc)?.desc || ''

    components.push({
      name,
      dir,
      props,
      emits: parseEmits(script),
      slots: parseSlots(template),
      expose: parseExpose(script),
      notes: parseNotes(script),
      demoCount: demos.length,
      demos,
      meta: {
        title: metaRaw.meta[name]?.title || `cd-${name}`,
        desc: metaRaw.meta[name]?.desc || fallbackDesc,
        category: categoryOf[name] || 'other',
        categoryTitle: categoryTitleOf[name] || '其他',
        related: metaRaw.meta[name]?.related || [],
      },
    })
  }

  /* 3. 写 Markdown + 实时预览 demo（SFC 与注册表） */
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.mkdirSync(DATA_DIR, { recursive: true })

  /* demo-src 旧产物整目录挪走再重建，避免新旧片段混留 */
  if (fs.existsSync(DEMO_SRC_DIR)) {
    const stash = `/tmp/cdui_demo_src_old_${Date.now()}`
    fs.renameSync(DEMO_SRC_DIR, stash)
  }
  fs.mkdirSync(DEMO_SRC_DIR, { recursive: true })

  const registryEntries = []
  /* 演示页 script 按页缓存 —— 同页多段片段共用一份 */
  const scriptCache = {}
  const scriptOf = (page) => {
    if (!(page in scriptCache)) {
      const f = path.join(PAGES_DIR, page, 'index.vue')
      scriptCache[page] = fs.existsSync(f) ? pageScriptOf(f) : ''
    }
    return scriptCache[page]
  }

  for (const c of components) {
    /* 先生成 demo SFC 并编号 —— renderMd 里会引用 demoId。
       只收可独立渲染的片段；插槽型片段跳过（md 里仅保留源码块） */
    const compDir = path.join(DEMO_SRC_DIR, c.name)
    const override = DEMO_OVERRIDES[c.name]
    /* replace 形态 = 只用写的片段；数组形态 = 手写片段排前面，后面接自动片段 */
    const isReplaceForm = override && !Array.isArray(override) && override.replace === true
    const manual = Array.isArray(override) ? override : override ? override.demos : null
    const pool = manual ? (isReplaceForm ? manual : [...manual, ...c.demos]) : c.demos
    /* 预览片段的两个硬条件：可独立编译 + 必须含本组件标签
       （后者挡掉两类坏片段：纯说明文字块 → 空预览；
         只有点击按钮、实体组件在块外的切片 → 点了没反应） */
    const selfTag = new RegExp(`<cd-${c.name}[\\s>/]`)
    const standalone = pool.filter(
      (d) =>
        isStandalone(d.code) &&
        selfTag.test(d.code) &&
        /* 排除「只是别人插槽里的配角」的切片，见 tagOutsideSlots 注释 */
        tagOutsideSlots(d.code, c.name),
    )

    /**
     * 选取策略：**点名的片段优先**。
     *
     * pool 里两类来源（见 parseDemoBlocks）：
     *   level 0 —— 分区注释/卡片标题明确点名（如 `<!-- cd-row / cd-col -->`）
     *   level 1 —— 只是代码里出现过（如站点 Hero 里放了一个 cd-progress）
     *   level 2 —— 未包 cd-card 的孤儿用例兜底
     *   手写 override 不带 level，视为点名。
     *
     * 过去直接 `slice(0, 2)`，兜底片段会和点名片段抢位置：
     * 实测 cd-progress 的第二个预览是站点 Hero（一排按钮与标签），
     * cd-icon 的两个预览内容完全一样。改为「有点名的只用点名的」后，
     * 这类误展示消失；完全依赖兜底片段的组件（如 cd-grid-item 这类子项）
     * 在点名集合为空时照旧回退，不会出现空预览。
     *
     * 兜底片段**最多取 1 条**：它没有人类写的分区说明背书，第二条几乎必然
     * 是「顺带出现」。实测 cd-button 没有自己的分区，取 2 条时第二条是整张
     * 必填表单（只因为提交按钮是 cd-button），放在「Button 按钮」页上很突兀。
     */
    const named = standalone.filter((d) => (d.level ?? 0) === 0)
    const candidates = named.length ? named : standalone.slice(0, 1)
    /* 去重：同一段代码被两个分区抽到（内容一模一样）时只留一份 */
    const seenCode = new Set()
    const usable = candidates
      .filter((d) => {
        if (seenCode.has(d.code)) return false
        seenCode.add(d.code)
        return true
      })
      .slice(0, 2)
    usable.forEach((d, i) => {
      /* 手写片段自带 script；自动片段沿用来源演示页的 script */
      const script = d.script !== undefined ? d.script : scriptOf(d.page)
      fs.mkdirSync(compDir, { recursive: true })
      writeLf(path.join(compDir, `${i}.vue`), composeDemoSfc(d, script))
      d.demoId = `${c.name}-${i}`
      registryEntries.push(`  '${c.name}-${i}': () => import('../demo-src/${c.name}/${i}.vue'),`)
    })

    /* 必须传 usable 而不是 pool / standalone：renderMd 里展示的代码块与 CdDemo id
       都来自这份数组的前 2 条，口径不一致就会「代码块是 A、预览是 B」整体错位 */
    const md = renderMd(c, c.meta, usable)
    writeLf(path.join(OUT_DIR, `${c.name}.md`), md)
  }

  /* 注册表：CdDemo.vue 按需懒加载对应 demo 模块（SSR 不触碰） */
  fs.writeFileSync(
    REGISTRY_FILE,
    [
      '/* 由 scripts/gen-component-docs.mjs 自动生成，勿手改。',
      ' * 键 = `<组件名>-<序号>`，对应组件页「用法」区的 <CdDemo id="..." />。',
      ' * 全部为懒加载条目：SSR 阶段不加载任何 demo 模块。 */',
      '',
      'export const demos = {',
      ...registryEntries,
      '}',
      '',
    ].join('\n'),
    'utf-8'
  )

  /* 4. 写侧边栏数据 + 总览页 */
  const data = {
    generatedAt: new Date().toISOString(),
    total: components.length,
    categories: metaRaw.categories.map((cat) => ({
      id: cat.id,
      title: cat.title,
      items: cat.items
        .filter((n) => components.some((c) => c.name === n))
        .map((n) => {
          const c = components.find((x) => x.name === n)
          return { name: n, title: c.meta.title, desc: c.meta.desc }
        }),
    })),
    components: components.map((c) => ({
      name: c.name,
      title: c.meta.title,
      desc: c.meta.desc,
      category: c.meta.category,
      props: c.props.length,
      emits: c.emits.length,
      slots: c.slots.names.length,
      expose: c.expose.length,
      demo: c.demoCount,
      missingInMeta: !metaRaw.meta[c.name],
      noDemo: c.demoCount === 0,
    })),
  }
  fs.writeFileSync(path.join(DATA_DIR, 'components.json'), JSON.stringify(data, null, 2), 'utf-8')

  /* 总览页 */
  const idx = ['---', 'title: 组件总览', '---', '', '# 组件总览', '']
  idx.push('当前共 **' + components.length + '** 个组件，下表由源码自动生成（重跑gen-doc 刷新）。')
  idx.push('')
  const noDemo = components.filter((c) => c.demoCount === 0).map((c) => c.name)
  if (noDemo.length) {
    idx.push(`> ⚠️ 以下组件尚未接入演示页：${noDemo.map((n) => `\`cd-${n}\``).join('、')}`)
    idx.push('')
  }
  for (const cat of data.categories) {
    idx.push(`## ${cat.title}`)
    idx.push('')
    idx.push('| 组件 | 说明 | Props | Events | Slots |')
    idx.push('|---|---|---|---|---|')
    for (const it of cat.items) {
      const c = components.find((x) => x.name === it.name)
      idx.push(
        `| [${it.title}](/components/${it.name}) | ${shorten(it.desc)} | ${c.props.length} | ${c.emits.length} | ${c.slots.names.length} |`
      )
    }
    idx.push('')
  }
  fs.writeFileSync(path.join(OUT_DIR, 'index.md'), idx.join('\n'), 'utf-8')

  /* 更新日志从 uni_modules 里那份同步过来，避免两份 changelog 对不上 */
  const src = read(path.join(ROOT, 'src/uni_modules/codedog-ui/changelog.md'))
  fs.writeFileSync(
    path.join(DOCS, 'changelog.md'),
    ['---', 'title: 更新日志', '---', '', src.replace(/^##\s+(\d)/gm, '## $1')].join('\n'),
    'utf-8'
  )

  console.log(`✓ 生成 ${components.length} 个组件文档 → docs/components/`)
  console.log(`✓ 侧边栏数据 → docs/.vitepress/data/components.json`)
  if (noDemo.length) console.log(`⚠ 无演示用例：${noDemo.join(', ')}`)
  const noMeta = components.filter((c) => !metaRaw.meta[c.name]).map((c) => c.name)
  if (noMeta.length) console.log(`⚠ 缺 meta 标题：${noMeta.join(', ')}`)

  const emptyDemo = components.filter((c) => c.demos.length && !c.demos[0].code.trim())
  if (emptyDemo.length) console.log(`⚠ 用例内容为空：${emptyDemo.map((c) => c.name).join(', ')}`)
}

function shorten(s) {
  if (!s) return '—'
  const t = s.replace(/\|/g, '\\|').trim()
  return t.length > 48 ? `${t.slice(0, 48)}…` : t
}

main()
