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

/* ==================== 基础工具 ==================== */

function read(p) {
  return fs.readFileSync(p, 'utf-8')
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
  return bodyLines
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

  /* 用法 */
  const usable = demos.slice(0, 2)
  if (usable.length) {
    lines.push('## 用法')
    lines.push('')
    usable.forEach((d, i) => {
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

  /* 3. 写 Markdown */
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.mkdirSync(DATA_DIR, { recursive: true })
  for (const c of components) {
    const md = renderMd(c, c.meta, c.demos)
    fs.writeFileSync(path.join(OUT_DIR, `${c.name}.md`), md, 'utf-8')
  }

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
