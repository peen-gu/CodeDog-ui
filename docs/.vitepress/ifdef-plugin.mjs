/**
 * Vite 插件：在 VitePress 构建里执行 uni-app 条件编译指令
 * ---------------------------------------------------------------
 * CodeDogUI 组件源码按 uni-app 约定使用平台条件注释：
 *
 *   /* #ifdef H5 *\/   ...保留...
 *   /* #ifndef H5 *\/  ...删除...
 *   /* #endif *\/
 *
 * uni-app 的编译器会处理它们，但 VitePress 的 Vite 不认识 ——
 * 两个分支会同时进入产物（重复定义、冲突实现）。本插件以
 * 「文档站 = H5 运行环境」为前提，在 transform 阶段裁剪：
 *
 *   #ifdef < platforms 含 H5 >   → 保留，否则整块删除
 *   #ifndef < platforms 含 H5 >  → 整块删除，否则保留
 *
 * 同时兼容三种注释形态： `/* ... *\/`、`// ...`、`<!-- ... -->`。
 *
 * 作用域有两个目录：
 *   1. codedog-ui 组件库（本库源码）
 *   2. wot-design-uni（cd-dialog / cd-drawer / cd-action-sheet / cd-select 复用了它的浮层）
 *      —— 它的 SFC 里带 `<script module="render" lang="renderjs">`（APP-PLUS 专用，
 *      被 `#ifdef APP-PLUS` 包着）。标准 @vue/compiler-sfc 不认这个块，
 *      会报「一个 SFC 只能有一个 script」；本插件先把整块裁掉，问题自然消失。
 */

const TARGET_PLATFORMS = new Set(['H5'])

/* 三种注释形态都允许 #ifdef 前后有修饰：按行内第一个标记匹配 */
const OPEN_RE = /(?:\/\*|\/\/|<!--)\s*#(ifdef|ifndef)\s+([\w|\s.-]+?)\s*(?:\*\/|-->)?\s*$/
const END_RE = /(?:\/\*|\/\/|<!--)\s*#endif\s*(?:\*\/|-->)?\s*/

function platformsHit(condition) {
  return String(condition)
    .split(/\|\||,/)
    .map((s) => s.trim())
    .some((p) => TARGET_PLATFORMS.has(p))
}

/** 按行处理：遇到 #ifdef/#ifndef 判断本块去留，遇到 #endif 结束 */
function stripBlocks(code) {
  const lines = code.split('\n')
  const out = []
  let keep = true /* 当前是否处于应保留的区域 */
  let depth = 0 /* 条件块嵌套深度（本库最深一层，防御性支持嵌套） */
  let keptStack = [] /* 每层块是否保留 */

  for (const line of lines) {
    const open = line.match(OPEN_RE)
    if (open && END_RE.test(line) === false) {
      const hit = platformsHit(open[2])
      const selfKeep = open[1] === 'ifdef' ? hit : !hit
      keptStack.push(selfKeep && keep)
      depth += 1
      keep = selfKeep && keep
      continue /* 指令行本身不输出 */
    }
    if (depth > 0 && END_RE.test(line)) {
      depth -= 1
      keptStack.pop()
      keep = keptStack.length ? keptStack[keptStack.length - 1] : true
      continue
    }
    if (keep) out.push(line)
  }
  return out.join('\n')
}

export function uniConditionalCompile() {
  const ID_RE =
    /(?:src[\\/]uni_modules[\\/]codedog-ui|node_modules[\\/]wot-design-uni)[\\/].*\.(vue|js|ts|scss|css)$/
  return {
    name: 'cd-uni-conditional-compile',
    enforce: 'pre',
    transform(code, id) {
      const clean = id.split('?')[0]
      if (!ID_RE.test(clean)) return null
      if (!/(#ifdef|#ifndef|#endif)/.test(code)) return null
      return { code: stripBlocks(code), map: null }
    },
  }
}
