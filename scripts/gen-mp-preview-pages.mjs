#!/usr/bin/env node
/**
 * gen-mp-preview-pages.mjs —— 生成微信小程序演示应用（playground/mp-preview）
 * ============================================================================
 * 为什么需要生成器
 * ----------------------------------------------------------------------------
 * 演示应用有 68 个组件，若每个组件页手写一份，页面壳（间距 / 标题 / 卡片）
 * 必然逐页漂移——这正是「有的有 margin 有的没有」的成因。改为脚本生成后，
 * 页面壳只有一份模板，间距规范全局唯一，永远不会漂移。
 *
 * 三层结构（对标 TDesign 小程序示例）
 * ----------------------------------------------------------------------------
 *   首页（分类入口） → 分类清单页（该分类组件列表） → 每组件独立页
 * 不再把一个分类的所有组件堆进一个页面。
 *
 * 数据源（全部为仓库内既有资产，不凭空造）
 * ----------------------------------------------------------------------------
 *   1. scripts/component-meta.json  —— 7 个分类、68 个组件的中文名/描述/关联
 *   2. docs/.vitepress/demo-src/*    —— 文档站已验证的 86 段 demo SFC（67 个组件）
 *   3. src/uni_modules/codedog-ui/components —— 组件目录名（用于生成子选择器）
 *
 * 产物
 * ----------------------------------------------------------------------------
 *   src/component-catalog.js        首页与分类页共用的目录数据
 *   src/styles/demo-shell.scss      demo 支撑样式的小程序端副本（mp 安全）
 *   src/pages/index/index.vue       首页
 *   src/pages/category/index.vue    分类清单页
 *   src/sub-<分类>/pages/<组件>/    68 个组件页 + 各自的 demo SFC
 *   src/pages.json                  路由（主包 2 页 + 7 个子包 68 页）
 *
 * mp 端两条硬约束（wxss 编译期/运行期直接报错，必须遵守）
 * ----------------------------------------------------------------------------
 *   1. 禁止通配符选择器 `*`（微信小程序 WXSS 报 error at token "*"）
 *      → .row / .stack 的「子元素间距」不能用 `> *`，改为显式枚举标签。
 *        枚举表在运行时扫描 demo 源码里真实出现的自定义标签自动生成，
 *        新增组件无需手改本文件。
 *   2. 禁止结构伪类（:last-child / :nth-child 等）
 *      → 区块间距只在 .cdp-section 上写一处 margin-bottom，
 *        靠页面底部 padding 兜住最后一个区块，不用 :last-child 归零。
 *
 * 用法: node scripts/gen-mp-preview-pages.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const META_PATH = path.join(ROOT, 'scripts/component-meta.json')
const DEMO_SRC = path.join(ROOT, 'docs/.vitepress/demo-src')
const COMPONENTS_DIR = path.join(ROOT, 'src/uni_modules/codedog-ui/components')
const APP_SRC = path.join(ROOT, 'playground/mp-preview/src')

const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf-8'))
const categories = meta.categories
const metaBy = meta.meta
const allItems = categories.flatMap((c) => c.items)

/* ------------------------------------------------------------------ *
 * 1. demo 源码改写：文档站路径 → npm 包路径
 * ------------------------------------------------------------------ */

/**
 * demo SFC 里的 import 指向主工程源码。预览应用装的是 npm 包形态，
 * 必须改写。真实存在的 specifier 全库只有 6 种（2026-10-04 全文扫描确认）：
 *   vue
 *   @/uni_modules/codedog-ui
 *   @/uni_modules/codedog-ui/utils/validate
 *   @/uni_modules/codedog-ui/components/cd-icon/icons
 *   ../../../../src/uni_modules/codedog-ui
 *   ../../../../src/uni_modules/codedog-ui/components/cd-icon/icons
 * 包的 exports 是 "./components/*": "./components/*"，不带 .js 后缀解析不稳，
 * 故一律补 .js。
 */
function adaptDemoSource(src) {
  const table = [
    [/@\/uni_modules\/codedog-ui\/components\/cd-icon\/icons/g, 'codedog-ui/components/cd-icon/icons.js'],
    [/\.\.\/\.\.\/\.\.\/\.\.\/src\/uni_modules\/codedog-ui\/components\/cd-icon\/icons/g, 'codedog-ui/components/cd-icon/icons.js'],
    [/@\/uni_modules\/codedog-ui\/utils\/validate/g, 'codedog-ui/utils/validate.js'],
    [/@\/uni_modules\/codedog-ui\/components\//g, 'codedog-ui/components/'],
    [/\.\.\/\.\.\/\.\.\/\.\.\/src\/uni_modules\/codedog-ui\/components\//g, 'codedog-ui/components/'],
    [/@\/uni_modules\/codedog-ui/g, 'codedog-ui'],
    [/\.\.\/\.\.\/\.\.\/\.\.\/src\/uni_modules\/codedog-ui/g, 'codedog-ui'],
  ]
  let out = src
  for (const [re, to] of table) out = out.replace(re, to)
  /* components/ 下裸路径补 .js 扩展名 */
  out = out.replace(/from ['"]codedog-ui\/components\/([^'"]+)['"]/g, (m, p) =>
    /\.(js|vue|scss|css|json)$/.test(p) ? m : `from 'codedog-ui/components/${p}.js'`,
  )
  return out
}

/**
 * 取该组件页要用的 demo 文件名（已按序号排序）。
 *
 * ⚠️ 这里**不做内容筛选**：demo 已在源头 `scripts/gen-component-docs.mjs`
 * 过滤干净（点名优先 / 排除只出现在别人插槽里的配角 / 兜底最多 1 条）。
 * 本脚本只负责搬运，避免同一条规则在两个地方各写一份、日后悄悄分叉。
 * 若发现某个组件页出现「不是它的 demo」，请去改 gen-component-docs.mjs。
 */
function pickDemos(name) {
  const dir = path.join(DEMO_SRC, name)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.vue'))
    .sort((a, b) => Number(path.basename(a, '.vue')) - Number(path.basename(b, '.vue')))
}

/* ------------------------------------------------------------------ *
 * 2. 扫描 demo 里真实出现的自定义标签（生成子选择器用）
 * ------------------------------------------------------------------ */
const BASE_TAGS = [
  'view', 'uni-view', 'text', 'uni-text', 'button', 'uni-button',
  'input', 'uni-input', 'textarea', 'uni-textarea', 'image', 'uni-image',
  'switch', 'uni-switch', 'slider', 'uni-slider', 'icon', 'uni-icon',
  'scroll-view', 'uni-scroll-view', 'swiper', 'uni-swiper',
  'swiper-item', 'uni-swiper-item', 'navigator', 'uni-navigator',
  'progress', 'uni-progress', 'checkbox', 'uni-checkbox', 'radio', 'uni-radio',
]

function collectCustomTags() {
  const found = new Set()
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.vue')) {
        const s = fs.readFileSync(p, 'utf-8')
        for (const m of s.matchAll(/<([a-z][a-z0-9]*(?:-[a-z0-9]+)+)[\s/>]/g)) found.add(m[1])
      }
    }
  }
  walk(DEMO_SRC)
  return [...found].sort()
}

/* ------------------------------------------------------------------ *
 * 3. demo 支撑样式（mp 安全版）
 * ------------------------------------------------------------------ */
function buildShellScss(childTags) {
  const childSel = childTags.map((t) => `.cdp-host .row > ${t}`).join(',\n')
  const stackSel = childTags.map((t) => `.cdp-host .stack > ${t}`).join(',\n')
  return `/*
 * demo-shell.scss —— demo 支撑样式的小程序端副本
 * -------------------------------------------------------------------------------
 * ⚠️ 本文件由 scripts/gen-mp-preview-pages.mjs 生成，手改会被覆盖。
 *
 * demo SFC 抽自主工程演示页，片段里引用了页面的辅助 class（.row / .field /
 * .body-text 等）。本文件移植 docs/.vitepress/theme/demo-support.css 中被实际
 * 用到的那部分，命名作用域收在 .cdp-host 下，避免和页面壳样式互相污染。
 *
 * mp 端两条硬约束（违反会直接编译报错 / 运行时塌陷）：
 *   1. WXSS 不支持通配符选择器 \`*\`（报 error at token "*"）
 *      → .row / .stack 的子元素间距改为显式枚举标签，见下方 CHILD 段。
 *      枚举表由脚本扫描 demo 源码里真实出现的自定义标签生成，新增组件自动覆盖。
 *   2. WXSS 不支持结构伪类（:last-child / :nth-child）
 *      → 全文不出现伪类。
 */
$cdp-text-primary: var(--cd-text-primary, #0f172a);
$cdp-text-regular: var(--cd-text-regular, #334155);
$cdp-text-secondary: var(--cd-text-secondary, #64748b);
$cdp-text-placeholder: var(--cd-text-placeholder, #94a3b8);
$cdp-sunken: var(--cd-bg-sunken, #f1f5f9);

/* ---------------- 横向排布 ---------------- */
.cdp-host .row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

/* CHILD —— 不能用 \`> *\`，逐标签枚举（脚本生成，勿手改） */
${childSel} {
  margin: 0 8px 8px 0;
}

.cdp-host .row--baseline {
  align-items: baseline;
}

.cdp-host .row--gap {
  margin-top: 12px;
}

/* ---------------- 纵向堆叠 ---------------- */
.cdp-host .stack {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

${stackSel} {
  margin-bottom: 12px;
}

/* ---------------- 文本 ---------------- */
.cdp-host .body-text {
  display: block;
  font-size: 12px;
  color: $cdp-text-secondary;
  line-height: 1.7;
}

.cdp-host .muted {
  font-size: 12px;
  color: $cdp-text-placeholder;
}

.cdp-host .hint {
  display: block;
  margin-top: 8px;
  font-size: 11px;
  color: $cdp-text-placeholder;
  line-height: 1.6;
}

.cdp-host .inline-text {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: $cdp-text-regular;
}

/* ---------------- 字段 ---------------- */
.cdp-host .field {
  display: block;
}

.cdp-host .field__label,
.cdp-host .field-label,
.cdp-host .col-label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: $cdp-text-secondary;
}

.cdp-host .col-label {
  font-size: 11px;
  color: $cdp-text-placeholder;
}

.cdp-host .field__suffix {
  font-size: 12px;
  color: $cdp-text-placeholder;
}

/* ---------------- 分栏 ---------------- */
.cdp-host .split {
  display: flex;
  flex-wrap: wrap;
}

.cdp-host .split__col {
  box-sizing: border-box;
  flex: 1 1 300px;
  min-width: 0;
  margin-right: 16px;
  margin-bottom: 12px;
}

.cdp-host .grid2 {
  display: flex;
  flex-wrap: wrap;
}

.cdp-host .grid2__item {
  flex: 1 1 260px;
  min-width: 0;
  margin-right: 16px;
  margin-bottom: 12px;
}

/* ---------------- 结果 / 日志 ---------------- */
.cdp-host .result {
  display: flex;
  align-items: center;
  margin-top: 12px;
  padding: 12px 16px;
  background-color: $cdp-sunken;
  border-radius: 8px;
}

.cdp-host .result__label {
  margin-right: 12px;
  font-size: 11px;
  color: $cdp-text-placeholder;
}

.cdp-host .result__value {
  font-size: 12px;
  color: $cdp-text-primary;
}

.cdp-host .submit-result {
  margin-top: 16px;
}

.cdp-host .log {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: $cdp-sunken;
  border-radius: 4px;
}

.cdp-host .log__text {
  font-size: 12px;
  color: $cdp-text-secondary;
}

/* ---------------- 时间线 ---------------- */
.cdp-host .tl-title {
  display: block;
  margin-bottom: 2px;
  font-size: 14px;
  font-weight: 500;
  color: $cdp-text-primary;
}

.cdp-host .tl-text {
  display: block;
  font-size: 12px;
  color: $cdp-text-secondary;
  line-height: 1.6;
}

/* ---------------- 统计块 ---------------- */
.cdp-host .stats {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.cdp-host .stat {
  box-sizing: border-box;
  flex: 1 1 200px;
  min-width: 0;
  padding: 16px;
  margin-right: 12px;
  margin-bottom: 12px;
  border-radius: 12px;
  background-color: var(--cd-bg-container, #ffffff);
}

.cdp-host .stat__label {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: $cdp-text-placeholder;
}

/* ---------------- 栅格演示 ----------------
   ⚠️ 这几个类由 :class / class 输出，早期用正则只扫 class="..." 会漏掉，
   漏掉的后果是「栅格演示只剩文字、色块与圆角全没了」（本轮实测截图发现）。 */
.cdp-host .grid-box {
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 8px;
  background-color: $cdp-sunken;
  border-radius: 8px;
}

.cdp-host .grid-box--brand {
  background-color: var(--cd-color-primary-soft, #eff5ff);
}

.cdp-host .grid-box--soft {
  background-color: var(--cd-color-success-soft, #ecfdf5);
}

.cdp-host .grid-box__text {
  font-family: var(--cd-font-family-mono, monospace);
  font-size: 11px;
  color: $cdp-text-regular;
  text-align: center;
}

.cdp-host .grid-gap-top {
  margin-top: 16px;
}

/* ---------------- 表单结果块 ---------------- */
.cdp-host .form-actions {
  margin-top: 16px;
}

.cdp-host .result-block {
  margin-top: 16px;
}

.cdp-host .result-block__label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: $cdp-text-secondary;
}

/* 表单模型快照。演示页与文档站都没有给它定义过样式，
   这里补成等宽小字块，JSON 快照才读得清 */
.cdp-host .cd-code {
  display: block;
  padding: 8px 12px;
  font-family: var(--cd-font-family-mono, monospace);
  font-size: 11px;
  line-height: 1.6;
  color: $cdp-text-regular;
  background-color: $cdp-sunken;
  border-radius: 4px;
  word-break: break-all;
}

/* ---------------- 扩展组件演示（0.5.4）----------------
   这些类是 src/pages/extended 演示页里的局部样式。小程序端没有页面级样式表，
   必须在这里同步一份，否则预览页里这些块会「没样式」——
   覆盖率自检（auditShellCoverage 报的 20 个缺失类）就是为这个存在的。 */

/* 打字机聊天气泡 */
.cdp-host .chat {
  display: flex;
  flex-direction: column;
}

.cdp-host .chat__row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 12px;
}

.cdp-host .chat__bubble {
  max-width: 100%;
  margin-left: 8px;
  padding: 10px 14px;
  background-color: $cdp-sunken;
  border-radius: 12px;
}

/* 导航栏 / 标签栏 预览框：给固定定位的组件一个「假页面」边界，
   否则 fixed=false 时会直接趴在预览区左上角看不出效果 */
.cdp-host .navbar-preview {
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid $cdp-sunken;
  border-radius: 8px;
}

.cdp-host .tabbar-preview {
  margin-top: 12px;
  overflow: hidden;
  border: 1px solid $cdp-sunken;
  border-radius: 8px;
}

/* 树：限高滚动，否则几十个节点会把整个预览页撑长 */
.cdp-host .tree-box {
  max-height: 280px;
  margin-top: 12px;
  overflow: auto;
}

/* 取色器色块 */
.cdp-host .swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  margin-left: 16px;
  border-radius: 8px;
}

.cdp-host .swatch__text {
  font-size: 11px;
  color: #ffffff;
}

/* 二维码 */
.cdp-host .qr-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cdp-host .qr-box__text {
  margin-top: 8px;
  font-size: 12px;
  color: $cdp-text-secondary;
}

.cdp-host .qr-input {
  width: 200px;
  margin-left: 16px;
}

/* 水印 / 索引栏：两者都靠「父级有定位 + 有高度」才有意义 */
.cdp-host .watermark-box {
  position: relative;
  height: 180px;
  overflow: hidden;
  border: 1px solid $cdp-sunken;
  border-radius: 8px;
}

.cdp-host .watermark-box__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.cdp-host .watermark-box__text {
  margin-bottom: 12px;
  font-size: 13px;
  color: $cdp-text-regular;
}

.cdp-host .indexbar-box {
  position: relative;
  height: 260px;
  overflow: hidden;
  border: 1px solid $cdp-sunken;
  border-radius: 8px;
}

.cdp-host .indexbar-box__scroll {
  height: 100%;
  /* 给右侧索引栏留出位置，否则字母会压在列表文字上 */
  padding-right: 28px;
}

.cdp-host .indexbar-box__letter {
  display: block;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--cd-color-primary, #2563eb);
  background-color: $cdp-sunken;
}

.cdp-host .indexbar-box__city {
  display: block;
  padding: 8px 12px;
  font-size: 14px;
  color: $cdp-text-regular;
  border-bottom: 1px solid $cdp-sunken;
}

/* ---------------- 图标网格 ----------------
   不用 @media 改列宽：小程序视口固定窄屏，直接钉 25%（4 列）。
   文档站那份靠媒体查询在宽屏切成 8 列，小程序不需要。 */
.cdp-host .icon-grid {
  display: flex;
  flex-wrap: wrap;
}

.cdp-host .icon-cell {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 25%;
  padding: 8px 2px;
}

.cdp-host .icon-cell__name {
  margin-top: 6px;
  font-size: 10px;
  color: $cdp-text-placeholder;
  text-align: center;
  /* 不用 break-all：长图标名会断成「corner-down-l eft」词中碎行；
     overflow-wrap 优先在连字符处断，断出来是「corner-down- / left」 */
  word-break: normal;
  overflow-wrap: break-word;
  line-height: 1.3;
}

/* ---------------- 图片 / 缩略图 ---------------- */
.cdp-host .img-row {
  display: flex;
  flex-wrap: wrap;
}

.cdp-host .img-case {
  box-sizing: border-box;
  width: 132px;
  margin-right: 12px;
  margin-bottom: 12px;
}

.cdp-host .img-case__label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  color: $cdp-text-secondary;
}

.cdp-host .img-case__state {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: $cdp-text-placeholder;
}

.cdp-host .thumb {
  box-sizing: border-box;
  width: 80px;
  height: 80px;
  overflow: hidden;
  border-radius: 8px;
}

.cdp-host .thumb__img {
  width: 100%;
  height: 100%;
}

/* ---------------- 骨架屏 ---------------- */
.cdp-host .custom-skeleton {
  background-color: var(--cd-skeleton-bg, #f1f5f9);
  border-radius: 4px;
}

.cdp-host .custom-skeleton--square {
  width: 80px;
  height: 80px;
  margin-right: 12px;
}

.cdp-host .custom-skeleton--short {
  width: 160px;
  height: 20px;
}

.cdp-host .loaded-block {
  padding: 12px 0;
}

/* ---------------- 空状态网格 ---------------- */
.cdp-host .empty-grid {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.cdp-host .empty-grid__cell {
  box-sizing: border-box;
  width: 50%;
  margin-bottom: 8px;
  border: 1px solid var(--cd-border-color-light, #f1f5f9);
  border-radius: 8px;
}

/* ---------------- 杂项 ---------------- */
.cdp-host .tab-pane {
  display: block;
}

.cdp-host .tabs-gap {
  margin-top: 20px;
}

.cdp-host .sheet-header {
  display: block;
  padding-bottom: 8px;
  font-size: 12px;
  color: $cdp-text-secondary;
  text-align: center;
}

.cdp-host .popover-demo {
  max-width: 240px;
}

.cdp-host .popover-demo__text {
  display: block;
  font-size: 12px;
  color: $cdp-text-regular;
  line-height: 1.6;
}

.cdp-host .popover-demo__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.cdp-host .affix-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 16px;
  background-color: var(--cd-bg-elevated, #ffffff);
}

.cdp-host .affix-bar__text {
  font-size: 12px;
  color: $cdp-text-regular;
}
`
}

/**
 * 覆盖率自检：返回「demo 用到但样式表没定义」的类名。
 *
 * 两类噪声已过滤：
 *   - 动态拼接的类名（模板里是 `img-case__state--${x}`，抽出来是带 `${` 的碎片）
 *   - 纯符号碎片
 * 只报真正像类名的东西，避免刷屏。
 */
/**
 * 只作为「指引目标的选择器锚点」存在的类，不需要任何样式。
 * cd-guide 靠 createSelectorQuery('.guide-target') 定位，类名本身是给查询用的，
 * 给它写样式反而会干扰被指向的组件。白名单在此，避免自检为它们刷警告。
 */
const MARKER_CLASSES = new Set(['guide-target', 'guide-target-2', 'guide-target-3'])

function auditShellCoverage(scss) {
  const used = new Set()
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.vue')) {
        const s = fs.readFileSync(p, 'utf-8')
        /* 先剥掉模板字面量里的 ${...} 表达式：那里面出现的词是 JS 变量或字符串，
           不是类名（实测 `img-case__state--${x || 'loading'}` 会误报 loading） */
        const tpl = (s.match(/<template>([\s\S]*?)<\/template>/) || ['', ''])[1].replace(
          /\$\{[^}]*\}/g,
          '',
        )
        for (const m of tpl.matchAll(/class="([^"]*)"/g)) {
          for (const c of m[1].split(/\s+/)) if (c) used.add(c)
        }
        /* :class 里的字符串字面量也要算 —— 栅格类就是从这里漏掉的 */
        for (const m of tpl.matchAll(/:class="([^"]*)"/g)) {
          for (const q of m[1].matchAll(/'([^']+)'/g)) {
            for (const c of q[1].split(/\s+/)) if (c) used.add(c)
          }
        }
      }
    }
  }
  walk(DEMO_SRC)

  const defined = new Set()
  for (const m of scss.matchAll(/\.cdp-host\s+\.([a-zA-Z][\w-]*)/g)) defined.add(m[1])

  return [...used]
    .filter((c) => /^[a-zA-Z][\w-]*$/.test(c) && !defined.has(c) && !MARKER_CLASSES.has(c))
    .sort()
}

/* ------------------------------------------------------------------ *
 * 4. 页面壳样式（所有页面共用，间距规范唯一来源）
 * ------------------------------------------------------------------ */
const SHELL_STYLE = `<style lang="scss">
/* ------------------------------------------------------------------ *
 * 页面壳间距规范（唯一来源）
 *   页面左右留白  12px  —— .cdp
 *   区块之间      12px  —— .cdp-section 的 margin-bottom（全文仅此一处）
 *   卡片内边距    14px  —— .cdp-card
 *   标题与卡片     8px  —— .cdp-section__title 的 margin-bottom
 * 不用 :last-child 归零（WXSS 不支持结构伪类），靠页面底部 24px padding 兜底。
 * ------------------------------------------------------------------ */
.cdp {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 12px 12px 24px;
  background-color: var(--cd-bg-page, #f5f7fa);
}

/* 顶部信息卡：组件名 + 一句说明 + 标签名 chip */
.cdp-header {
  box-sizing: border-box;
  padding: 16px;
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: 12px;
}

.cdp-header__title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--cd-text-primary, #0f172a);
  line-height: 1.3;
}

.cdp-header__desc {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--cd-text-secondary, #64748b);
  line-height: 1.7;
}

.cdp-header__chip {
  display: inline-block;
  margin-top: 12px;
  padding: 3px 8px;
  font-family: var(--cd-font-family-mono, monospace);
  font-size: 11px;
  color: var(--cd-color-primary, #3b76f6);
  background-color: var(--cd-color-primary-soft, #eff5ff);
  border-radius: 4px;
}

/* 区块：间距只在这里定义一处 */
.cdp-section {
  margin-bottom: 12px;
}

.cdp-section__title {
  display: block;
  margin-bottom: 8px;
  padding-left: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--cd-text-secondary, #64748b);
}

/* demo 画布 */
.cdp-card {
  box-sizing: border-box;
  padding: 14px;
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: 12px;
}
</style>`

/* ------------------------------------------------------------------ *
 * 5. 组件页
 * ------------------------------------------------------------------ */
function esc(s) {
  return String(s ?? '').replace(/&(?!amp;|lt;|gt;|quot;)/g, '&amp;')
}

function buildComponentPage(name) {
  const m = metaBy[name] || { title: name, desc: '', related: [] }
  const files = pickDemos(name)
  const idx = files.map((f) => Number(path.basename(f, '.vue')))

  const imports = idx.map((i) => `import Demo${i} from './demo-${i}.vue'`).join('\n')
  const blocks = idx
    .map(
      (i) => `    <view class="cdp-section">
      <text class="cdp-section__title">${i === 0 ? '基础用法' : `示例 ${i + 1}`}</text>
      <view class="cdp-card cdp-host">
        <Demo${i} />
      </view>
    </view>`,
    )
    .join('\n')

  /* config-provider 是包裹型根组件，没有独立 demo，改为文字说明 */
  const body =
    blocks ||
    `    <view class="cdp-section">
      <text class="cdp-section__title">说明</text>
      <view class="cdp-card cdp-host">
        <text class="body-text">
          本组件是页面根容器，向下广播主题（亮/暗）、尺寸密度与圆角形态，
          并把 wot-design-uni 的 CSS 变量一并桥接过去。它没有独立的视觉形态，
          因此不提供单独的交互演示——本站每个页面都包在它里面。
        </text>
      </view>
    </view>`

  const related = (m.related || []).filter((r) => allItems.includes(r))
  const relatedBlock = related.length
    ? `
    <view class="cdp-section">
      <text class="cdp-section__title">相关组件</text>
      <cd-cell-group inset>
${related
  .map(
    (r) => `        <cd-cell title="${esc(metaBy[r]?.title || r)}" label="cd-${r}" arrow clickable @click="goto('${r}')" />`,
  )
  .join('\n')}
      </cd-cell-group>
    </view>`
    : ''

  return `<template>
  <view class="cdp">
    <view class="cdp-header">
      <text class="cdp-header__title">${esc(m.title)}</text>
      <text class="cdp-header__desc">${esc(m.desc)}</text>
      <text class="cdp-header__chip">cd-${name}</text>
    </view>

${body}${relatedBlock}
  </view>
</template>

<script setup>
${imports}

/**
 * 关联组件可能落在别的子包里。小程序允许跨子包 navigateTo，
 * 路径写绝对路径即可（/sub-<分类>/pages/<组件>/index）。
 */
const ROUTE = ${JSON.stringify(Object.fromEntries(allItems.map((n) => [n, routeOf(n)])), null, 2)}

function goto(name) {
  const url = ROUTE[name]
  if (!url) return
  uni.navigateTo({
    url,
    fail: () => uni.showToast({ title: '页面未找到', icon: 'none' }),
  })
}
</script>

${SHELL_STYLE}
`
}

function routeOf(name) {
  const cat = categories.find((c) => c.items.includes(name))
  return `/sub-${cat.id}/pages/${name}/index`
}

/* ------------------------------------------------------------------ *
 * 6. 首页
 * ------------------------------------------------------------------ */
function buildIndexPage() {
  return `<template>
  <view class="home">
    <!-- 品牌区：渐变 logo + 名称 + 一句价值主张 -->
    <view class="home__hero">
      <view class="home__mark"><text class="home__mark-text">C</text></view>
      <text class="home__name">CodeDogUI</text>
      <text class="home__slogan">${allItems.length} 个组件 · 一套代码跑通四端</text>
    </view>

    <!-- 搜索：直接按组件中文名 / 标签名过滤 -->
    <view class="home__search">
      <cd-search-bar v-model="keyword" placeholder="搜索组件，如「按钮」或 button" />
    </view>

    <!-- 命中结果：有关键词时优先展示，命中即直达组件页 -->
    <view v-if="keyword" class="home__section">
      <text class="home__section-title">搜索结果 · {{ hits.length }}</text>
      <cd-empty v-if="!hits.length" description="没有匹配的组件" />
      <cd-cell-group v-else inset>
        <cd-cell
          v-for="item in hits"
          :key="item.name"
          :title="item.title"
          :label="item.name"
          arrow
          clickable
          @click="goto(item.name)"
        />
      </cd-cell-group>
    </view>

    <!-- 分类入口 -->
    <view v-else class="home__section">
      <text class="home__section-title">组件分类</text>
      <view
        v-for="cat in categories"
        :key="cat.id"
        class="cat"
        @click="openCategory(cat.id)"
      >
        <view class="cat__icon">
          <cd-icon :name="cat.icon" :size="20" />
        </view>
        <view class="cat__main">
          <text class="cat__title">{{ cat.title }}</text>
          <text class="cat__desc">{{ cat.items.length }} 个组件</text>
        </view>
        <cd-icon name="chevron-right" :size="16" class="cat__arrow" />
      </view>
    </view>

    <view class="home__foot">
      <text class="home__foot-text">CodeDogUI · MIT License</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { categories, components } from '../../component-catalog.js'

const keyword = ref('')

const hits = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return []
  return components.filter(
    (c) => c.title.toLowerCase().includes(k) || c.name.includes(k),
  )
})

const ROUTE = ${JSON.stringify(Object.fromEntries(allItems.map((n) => [n, routeOf(n)])), null, 2)}

function goto(name) {
  const url = ROUTE[name]
  if (!url) return
  uni.navigateTo({ url, fail: () => uni.showToast({ title: '页面未找到', icon: 'none' }) })
}

function openCategory(id) {
  uni.navigateTo({ url: \`/pages/category/index?id=\${id}\` })
}
</script>

<style lang="scss">
/* 间距规范与组件页一致：左右 12px、区块间距 12px */
.home {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 0 12px 24px;
  background-color: var(--cd-bg-page, #f5f7fa);
}

.home__hero {
  padding: 32px 4px 20px;
}

.home__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--cd-brand-500, #3b76f6), var(--cd-brand-700, #1d4cd8));
}

.home__mark-text {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
}

.home__name {
  display: block;
  margin-top: 14px;
  font-size: 22px;
  font-weight: 700;
  color: var(--cd-text-primary, #0f172a);
}

.home__slogan {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--cd-text-secondary, #64748b);
}

.home__search {
  margin-bottom: 12px;
}

.home__section {
  margin-bottom: 12px;
}

.home__section-title {
  display: block;
  margin-bottom: 8px;
  padding-left: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--cd-text-secondary, #64748b);
}

/* 分类卡：图标 + 名称 + 数量 + 箭头，信息密度低、留白足 */
.cat {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 14px;
  margin-bottom: 12px;
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: 12px;
}

.cat__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: var(--cd-color-primary, #3b76f6);
  background-color: var(--cd-color-primary-soft, #eff5ff);
}

.cat__main {
  flex: 1;
  min-width: 0;
  margin-left: 12px;
}

.cat__title {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: var(--cd-text-primary, #0f172a);
}

.cat__desc {
  display: block;
  margin-top: 3px;
  font-size: 12px;
  color: var(--cd-text-placeholder, #94a3b8);
}

.cat__arrow {
  flex-shrink: 0;
  color: var(--cd-text-placeholder, #94a3b8);
}

.home__foot {
  padding: 28px 0 8px;
}

.home__foot-text {
  display: block;
  font-size: 12px;
  color: var(--cd-text-placeholder, #94a3b8);
  text-align: center;
}
</style>
`
}

/* ------------------------------------------------------------------ *
 * 7. 分类清单页
 * ------------------------------------------------------------------ */
function buildCategoryPage() {
  return `<template>
  <view class="cat-page">
    <view class="cat-page__head">
      <text class="cat-page__title">{{ current.title }}</text>
      <text class="cat-page__desc">{{ current.items.length }} 个组件</text>
    </view>

    <cd-cell-group inset>
      <cd-cell
        v-for="item in list"
        :key="item.name"
        :title="item.title"
        :label="item.name"
        arrow
        clickable
        @click="goto(item.name)"
      />
    </cd-cell-group>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { categories, components } from '../../component-catalog.js'

/* 从首页带过来的分类 id；缺省回落到第一个分类 */
const id = ref('')
const current = computed(
  () => categories.find((c) => c.id === id.value) || categories[0],
)
const list = computed(() =>
  current.value.items
    .map((name) => components.find((c) => c.name === name))
    .filter(Boolean),
)

const ROUTE = ${JSON.stringify(Object.fromEntries(allItems.map((n) => [n, routeOf(n)])), null, 2)}

function goto(name) {
  const url = ROUTE[name]
  if (!url) return
  uni.navigateTo({ url, fail: () => uni.showToast({ title: '页面未找到', icon: 'none' }) })
}

/* uni-app 页面参数通过 onLoad 注入 */
onLoad((query) => {
  if (query && query.id) id.value = query.id
})
</script>

<style lang="scss">
.cat-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 12px 12px 24px;
  background-color: var(--cd-bg-page, #f5f7fa);
}

.cat-page__head {
  box-sizing: border-box;
  padding: 16px;
  margin-bottom: 12px;
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: 12px;
}

.cat-page__title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--cd-text-primary, #0f172a);
}

.cat-page__desc {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--cd-text-secondary, #64748b);
}
</style>
`
}

/* ------------------------------------------------------------------ *
 * 8. 目录数据
 * ------------------------------------------------------------------ */
const CAT_ICONS = {
  infrastructure: 'grid',
  general: 'tag',
  layout: 'menu',
  form: 'edit',
  data: 'chart',
  navigation: 'location',
  feedback: 'bell',
}

function buildCatalog() {
  return `/**
 * component-catalog.js —— 演示应用的组件目录
 * -------------------------------------------------------------------------------
 * ⚠️ 本文件由 scripts/gen-mp-preview-pages.mjs 生成，手改会被覆盖。
 * 数据源：scripts/component-meta.json（分类 / 中文名 / 描述 / 关联组件）
 */
export const categories = ${JSON.stringify(
    categories.map((c) => ({
      id: c.id,
      title: c.title,
      icon: CAT_ICONS[c.id] || 'grid',
      items: c.items,
    })),
    null,
    2,
  )}

export const components = ${JSON.stringify(
    allItems.map((n) => ({ name: n, title: (metaBy[n] && metaBy[n].title) || n })),
    null,
    2,
  )}

export const total = ${allItems.length}
`
}

/* ------------------------------------------------------------------ *
 * 9. 主流程
 * ------------------------------------------------------------------ */
function writeLf(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content.replace(/\r\n/g, '\n'), 'utf-8')
}

function main() {
  if (!fs.existsSync(APP_SRC)) {
    console.error('[gen-mp-preview] 找不到预览应用：' + APP_SRC)
    process.exit(1)
  }

  /* 子选择器标签表：基础标签 + demo 里真实出现的自定义标签 */
  const custom = collectCustomTags()
  const childTags = [...new Set([...BASE_TAGS, ...custom])].sort()
  const shellScss = buildShellScss(childTags)
  writeLf(path.join(APP_SRC, 'styles/demo-shell.scss'), shellScss)

  /* 覆盖率自检：demo 里用到、但 demo-shell.scss 没定义的类 → 样式会静默丢失。
     本轮就是这么发现「栅格演示只剩文字、色块圆角全没」的：早期扫类只用
     class="..."，漏了 :class 里的字符串字面量。 */
  const missing = auditShellCoverage(shellScss)
  if (missing.length) {
    console.log(`⚠️  demo 用到但 demo-shell.scss 未定义的类（${missing.length} 个）：`)
    for (const c of missing) console.log('     ' + c)
  }

  /* 目录数据 */
  writeLf(path.join(APP_SRC, 'component-catalog.js'), buildCatalog())

  /* 首页 / 分类页 */
  writeLf(path.join(APP_SRC, 'pages/index/index.vue'), buildIndexPage())
  writeLf(path.join(APP_SRC, 'pages/category/index.vue'), buildCategoryPage())

  /* 组件页 */
  const pageCount = { total: 0 }
  const subPackages = categories.map((cat) => {
    const pages = []
    for (const name of cat.items) {
      const dir = path.join(APP_SRC, `sub-${cat.id}/pages/${name}`)
      fs.mkdirSync(dir, { recursive: true })

      const want = pickDemos(name)
      const wantNames = new Set(want.map((f) => `demo-${path.basename(f, '.vue')}.vue`))
      /* 幂等：本轮不再需要的旧 demo 改名 .stale 而不是删除
         —— 沙箱对 rmSync 有批量删除拦截（实测报 SAFE_DELETE_BULK_GUARD_ERROR），
         .stale 后缀不会被 uni 编译，也不会污染产物 */
      for (const e of fs.readdirSync(dir)) {
        const isDemo = e.startsWith('demo-') && e.endsWith('.vue')
        if (isDemo && !wantNames.has(e)) fs.renameSync(path.join(dir, e), path.join(dir, `${e}.stale`))
        if (e.endsWith('.vue.stale') && wantNames.has(e.replace(/\.stale$/, ''))) {
          fs.renameSync(path.join(dir, e), path.join(dir, e.replace(/\.stale$/, '')))
        }
      }

      writeLf(path.join(dir, 'index.vue'), buildComponentPage(name))

      const demoDir = path.join(DEMO_SRC, name)
      for (const f of want) {
        const i = path.basename(f, '.vue')
        const src = adaptDemoSource(fs.readFileSync(path.join(demoDir, f), 'utf-8'))
        writeLf(path.join(dir, `demo-${i}.vue`), src)
      }
      pages.push({ path: `pages/${name}/index`, style: { navigationBarTitleText: (metaBy[name] && metaBy[name].title) || name } })
      pageCount.total += 1
    }
    return { root: `sub-${cat.id}`, pages }
  })

  /* pages.json */
  const pagesJson = {
    easycom: {
      autoscan: true,
      custom: {
        '^cd-(.*)': 'codedog-ui/components/cd-$1/cd-$1.vue',
        '^wd-(.*)': 'wot-design-uni/components/wd-$1/wd-$1.vue',
      },
    },
    pages: [
      { path: 'pages/index/index', style: { navigationBarTitleText: 'CodeDogUI' } },
      { path: 'pages/category/index', style: { navigationBarTitleText: '组件分类' } },
    ],
    globalStyle: {
      navigationBarTextStyle: 'black',
      navigationBarBackgroundColor: '#ffffff',
      backgroundColor: '#f5f7fa',
    },
    subPackages,
  }
  writeLf(path.join(APP_SRC, 'pages.json'), JSON.stringify(pagesJson, null, 2) + '\n')

  console.log(`[gen-mp-preview] 分类 ${categories.length} 个，组件页 ${pageCount.total} 个`)
  console.log(`[gen-mp-preview] 子选择器标签 ${childTags.length} 个（基础 ${BASE_TAGS.length} + 自定义 ${custom.length}）`)
  console.log(`[gen-mp-preview] 输出目录 ${APP_SRC}`)
}

main()
