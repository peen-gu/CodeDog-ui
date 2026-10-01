/**
 * CodeDogUI / 内置图标表
 * ---------------------------------------------------------------
 * 为什么不复用 wd-icon（这条结论是查了源码得出的，不是拍脑袋）：
 *   wot-design-uni 的图标在 APP / H5 端走包内本地字体 wd-icons.ttf，
 *   但在**小程序端**的 @font-face 指向 https://at.alicdn.com/... 外链字体。
 *   这意味着：
 *     1. 小程序需要在「开发设置 - 服务器域名」里把 at.alicdn.com 加进白名单，否则图标全变方块；
 *     2. 图标渲染依赖一次跨域网络请求，弱网首屏会闪空；
 *     3. 图标集是上游说改就改的，我们没法控制。
 *   一个 UI 框架的图标层不能有这种不确定性，所以自研。
 *
 * 为什么不用 iconfont 字体：
 *   字体文件同样需要 @font-face，小程序端要么走外链（同上问题）要么把字体 base64 塞进 CSS，
 *   会让样式体积膨胀几十 KB，且改一个图标就要重新导字体。
 *
 * 采用的方案：CSS mask + 内联 data URI SVG
 *   形状：-webkit-mask-image: url("data:image/svg+xml,...")，由模板内联 style 注入
 *   颜色：background-color，默认 currentColor，于是图标自动跟随父级文字色
 *   好处：零网络请求、零字体文件、可任意换色、两端（H5 / 小程序）行为一致
 *
 * 图标规格：统一 24×24 视口、描边式（stroke）、圆头圆角、stroke-width 2。
 * 描边式的好处是形状少、语义清晰，且在 mask 里只有 alpha 起作用，
 * 所以 stroke 写什么颜色都无所谓（这里统一写 #000）。
 */

/**
 * ⚠️ 第三方许可声明 —— 请勿删除本段
 * ---------------------------------------------------------------
 * 下方图标的几何数据（path 的 d 属性）衍生自 Feather Icons 及其分支 Lucide。
 *
 *   Feather Icons — MIT License
 *     Copyright (c) 2013-2023 Cole Bemis
 *     https://github.com/feathericons/feather
 *
 *   Lucide — ISC License
 *     Copyright (c) 2026 Lucide Icons and Contributors
 *     （其中标注为 Feather 衍生的那部分图标，版权归 Cole Bemis，按 MIT 许可）
 *     https://github.com/lucide-icons/lucide
 *
 * MIT 与 ISC 均允许商用、修改与再分发，唯一的硬性义务是：
 * **在软件的所有副本或实质性部分中保留上述版权声明与许可声明**。
 * 完整许可证原文见仓库根目录的 THIRD-PARTY-NOTICES.md。
 */

/** stroke-width：数值越小越纤细。1.75 比 2 更接近现代设计系统的观感 */
const STROKE_WIDTH = 1.75

/**
 * 实心图标白名单。
 * 描边式是这个图标集的基本盘，但少数场景（评分星、收藏心）必须是实心的 ——
 * 用一个描边星去表达「已点亮」在视觉上说不通。
 * 因此这里列出需要以 fill 绘制（而不是 stroke）的图标名。
 * @type {Set<string>}
 */
const FILLED_ICONS = new Set(['star-fill'])

/**
 * 图标定义表：key 是 name，value 是 SVG 内部片段（不含外层 <svg>）。
 * @type {Record<string, string>}
 */
export const ICONS = {
  /* ---------------- 方向与箭头 ---------------- */
  'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'arrow-up': '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  'arrow-down': '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-up': '<path d="m18 15-6-6-6 6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevrons-left': '<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>',
  'chevrons-right': '<path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/>',
  'corner-down-left': '<path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/>',
  'external-link':
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',

  /* ---------------- 状态与反馈 ---------------- */
  check: '<path d="M20 6 9 17l-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  'check-square': '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'close-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  'plus-circle': '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>',
  'minus-circle': '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  warning: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  'loader': '<path d="M12 2v4"/><path d="m16.24 7.76 2.83-2.83"/><path d="M18 12h4"/><path d="m16.24 16.24 2.83 2.83"/><path d="M12 18v4"/><path d="m4.93 19.07 2.83-2.83"/><path d="M2 12h4"/><path d="m4.93 4.93 2.83 2.83"/>',

  /* ---------------- 操作 ---------------- */
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  sort: '<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  'more-horizontal': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  'more-vertical': '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  'drag-vertical': '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',

  /* ---------------- 对象与业务 ---------------- */
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  setting: '<circle cx="12" cy="12" r="3"/><path d="M12 1v6"/><path d="M12 17v6"/><path d="M4.22 4.22l4.24 4.24"/><path d="M15.54 15.54l4.24 4.24"/><path d="M1 12h6"/><path d="M17 12h6"/><path d="M4.22 19.78l4.24-4.24"/><path d="M15.54 8.46l4.24-4.24"/>',
  sliders: '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  location: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  file: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  /* ---------------- 实心（fill 绘制，非 Feather 衍生） ----------------
   * 以 24×24 视口为坐标系，五角星外接圆半径 9.6、内接圆半径 4.0，
   * 按「外角 -90°/-18°/54°/126°/198°，内角各偏 36°」逐点算出十边形轮廓。
   * 与 Feather / Lucide 的 star 路径没有任何字节重合，
   * 因此不进入第三方的署名义务范围。
   */
  'star-fill':
    '<path d="M12 2.4 14.35 8.76 21.13 9.03 15.8 13.24 17.64 19.77 12 16 6.36 19.77 8.2 13.24 2.87 9.03 9.65 8.76Z"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/>',
  menu: '<path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  chart: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  tag: '<path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="m8.21 13.89-1.21 8.11 5-3 5 3-1.21-8.12"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
}

/** 全部图标名，便于开发期做拼写校验与文档生成 */
export const ICON_NAMES = Object.keys(ICONS)

/**
 * 把图标片段拼成完整的 SVG 字符串。
 * 注意颜色固定写成 #000：mask 只用 alpha 通道，颜色完全不参与渲染，
 * 真正的颜色来自元素的 background-color。
 *
 * @param {string} inner  SVG 内部片段
 * @param {boolean} filled 实心绘制（fill）还是描边绘制（stroke）
 */
function buildSvg(inner, filled) {
  const paint = filled
    ? 'fill="#000" stroke="none"'
    : `fill="none" stroke="#000" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"`
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
    paint +
    '>' +
    inner +
    '</svg>'
  )
}

/**
 * 生成可内联的 mask 图片地址。
 * encodeURIComponent 会把 < > # " 空格等全部转义，
 * 这是必需的 —— 尤其是 #，它在 URL 里代表锚点，不转义会把 SVG 截断。
 */
export function buildIconUri(inner, filled = false) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildSvg(inner, filled))}`
}

/**
 * 带缓存的取址：同一个图标在页面上出现 100 次也只编码一次。
 * 编码结果是纯字符串，没有副作用，可以安全共享。
 * @type {Map<string, string>}
 */
const uriCache = new Map()

export function getIconUri(name) {
  if (!name || !ICONS[name]) return ''
  if (!uriCache.has(name)) {
    uriCache.set(name, buildIconUri(ICONS[name], FILLED_ICONS.has(name)))
  }
  return uriCache.get(name)
}

/** 开发期提示：名字写错时给出可用列表，避免对着空白猜 */
export function warnUnknownIcon(name) {
  if (ICONS[name]) return
  // eslint-disable-next-line no-console
  console.warn(
    `[CodeDogUI] cd-icon 未找到名为 "${name}" 的图标。可用图标：${ICON_NAMES.join(', ')}`
  )
}
