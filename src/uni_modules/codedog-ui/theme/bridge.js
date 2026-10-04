/**
 * CodeDogUI / 主题桥接层（路线 B 二次封装的核心）
 * ---------------------------------------------------------------
 * 二次封装最容易做错的地方：只是把别人的组件换个名字包一层，
 * 结果自己的设计语言根本没落地，页面上仍是两套视觉。
 *
 * 正确做法是找到底层库的「主题注入点」，把自己的令牌灌进去。
 * wot-design-uni 的注入点非常理想 —— 它内部所有样式都写成
 *   var(--wot-color-theme, #默认值)
 * 也就是 SCSS 变量全部包了一层 CSS 变量兜底。
 *
 * 于是我们不需要改它一行代码、不需要重新编译 SCSS，
 * 只要通过 wd-config-provider 的 theme-vars 传入一份 camelCase 映射，
 * 它会自动转成 --wot-xxx 内联样式挂到根节点，向下级联到所有 wd- 组件。
 *
 * 命名转换规则（来自 wot-design-uni 的 mapThemeVarsToCSSVars）：
 *   camelCase → kebab-case，并加 --wot- 前缀
 *   colorTheme        → --wot-color-theme
 *   buttonPrimaryBgColor → --wot-button-primary-bg-color
 */

/* ==================================================================
 * 亮色主题映射
 * ================================================================== */
const LIGHT_VARS = {
  /* ---- 品牌与功能色 ---- */
  colorTheme: '#3b76f6',
  colorSuccess: '#10b981',
  colorWarning: '#f59e0b',
  colorDanger: '#ef4444',
  colorInfo: '#64748b',

  /* ---- 文本 ---- */
  colorTitle: '#0f172a',
  colorContent: '#334155',
  colorSecondary: '#64748b',
  colorAid: '#94a3b8',
  colorTip: '#cbd5e1',

  /* ---- 描边与背景 ---- */
  colorBorder: '#e2e8f0',
  colorBorderLight: '#f1f5f9',
  colorBg: '#f1f5f9',

  /* ---- 字号（与 CodeDogUI 字阶对齐） ---- */
  fsBig: '24px',
  fsImportant: '20px',
  fsTitle: '16px',
  fsContent: '14px',
  fsSecondary: '12px',
  fsAid: '11px',

  fwMedium: '500',
  fwSemibold: '600',

  /* 屏幕两侧留白：移动端 16px，配合 CodeDogUI 的 --cd-space-4 */
  sizeSidePadding: '16px',

  /* ---- 按钮：把 wot 按钮拉齐到我们的控件尺寸与配色 ---- */
  buttonPrimaryBgColor: '#3b76f6',
  buttonPrimaryColor: '#ffffff',
  buttonSuccessBgColor: '#10b981',
  buttonSuccessColor: '#ffffff',
  buttonWarningBgColor: '#f59e0b',
  buttonWarningColor: '#ffffff',
  buttonErrorBgColor: '#ef4444',
  buttonErrorColor: '#ffffff',
  buttonInfoBgColor: '#64748b',
  buttonInfoColor: '#ffffff',
  buttonInfoPlainBorderColor: '#e2e8f0',
  buttonInfoPlainNormalColor: '#334155',
  buttonNormalColor: '#334155',
  buttonPlainBgColor: 'transparent',

  buttonSmallHeight: '28px',
  buttonSmallFs: '12px',
  buttonSmallPadding: '10px',
  buttonSmallRadius: '6px',

  buttonMediumHeight: '36px',
  buttonMediumFs: '14px',
  buttonMediumPadding: '16px',
  buttonMediumRadius: '8px',

  buttonLargeHeight: '44px',
  buttonLargeFs: '15px',
  buttonLargePadding: '20px',
  buttonLargeRadius: '10px',

  /* ---- 遮罩：统一成我们的 --cd-bg-mask ---- */
  overlayBg: 'rgba(15, 23, 42, 0.45)',
  overlayBgDark: 'rgba(0, 0, 0, 0.6)',

  /* ---- 动作面板（移动端下拉选择的载体） ---- */
  actionSheetRadius: '16px',
  actionSheetBg: '#ffffff',
  actionSheetActionHeight: '52px',
  actionSheetColor: '#0f172a',
  actionSheetFs: '15px',
  actionSheetSubnameColor: '#64748b',
  actionSheetActiveColor: '#f1f5f9',
  actionSheetTitleHeight: '56px',
  actionSheetCancelHeight: '48px',
  actionSheetCancelBg: '#f8fafc',
  actionSheetCancelColor: '#334155',
  actionSheetCancelRadius: '10px',
  actionSheetDisabledColor: '#94a3b8',

  /* ---- 弹层 ---- */
  popupCloseColor: '#64748b',

  /* ---- 轻提示 ---- */
  toastBg: 'rgba(15, 23, 42, 0.86)',
  toastColor: '#ffffff',
  toastFs: '14px',
  toastRadius: '8px',

  /* ---- 消息框 ---- */
  messageBoxWidth: '320px',
  messageBoxBg: '#ffffff',
  messageBoxRadius: '12px',
  messageBoxPadding: '20px',
  messageBoxTitleFs: '16px',
  messageBoxTitleColor: '#0f172a',
  messageBoxContentFs: '14px',
  messageBoxContentColor: '#334155',

  /* ---- 单元格 ---- */
  cellTitleColor: '#0f172a',
  cellValueColor: '#64748b',
  cellTapBg: '#f1f5f9',
  cellArrowColor: '#94a3b8',

  /* ---- 输入框 ---- */
  inputColor: '#0f172a',
  inputPlaceholderColor: '#94a3b8',
  inputBorderColor: '#e2e8f0',
  inputInnerHeight: '36px',
  inputFs: '14px',
  inputIconColor: '#94a3b8',
  inputErrorColor: '#ef4444',

  /* ---- 表格 ---- */
  tableColor: '#334155',
  tableBg: '#ffffff',
  tableStripeBg: '#f8fafc',
  tableBorderColor: '#e2e8f0',
  tableFontSize: '14px',

  /* ---- 分页 ---- */
  paginationContentPadding: '16px 0',
  paginationMessageColor: '#64748b',
  paginationMessageFs: '13px',
  paginationNavWidth: '32px',
  paginationNavColor: '#334155',
  paginationNavBorder: '#e2e8f0',
  paginationNavBorderRadius: '8px',
  paginationNavCurrentColor: '#3b76f6',
  paginationNavFs: '14px',
  paginationIconSize: '14px',
}

/* ==================================================================
 * 暗色主题映射
 *
 * 键集必须与 LIGHT_VARS 完全一致，一个都不能少。
 *
 * 早先这里只覆盖「品牌色 + 背景 + 文字」三类，其余交给 wot 自己的 dark 分支 ——
 * 这个假设只对了一半：wot 里**有** .wot-theme-dark 分支的组件确实走 $-dark-*，
 * 但大量没有写暗色分支的组件（以及 L3 尺寸类变量：高度、字号、内边距）
 * 仍然读 $-color-title / $-input-fs 这些亮色变量。
 * 于是暗色页面里会出现「深底 + 深字」「暗面板配亮色输入框」这种
 * 一眼可见的半成品观感 —— 差 79 个键就差 79 处。
 *
 * 所以现在的做法是「键集对齐 + 值按暗色重取」：
 *   - 有暗色语义对应的（文字 / 背景 / 描边）取暗色值；
 *   - 与主题无关的（字号、字重、高度、圆角、间距）原样搬过来。
 * 这样既填满了 wot 的兜底，又不会出现「深色底 + 深色字」。
 * ================================================================== */
const DARK_VARS = {
  /* ---- 品牌与功能色 ---- */
  colorTheme: '#6094fa',
  colorSuccess: '#10b981',
  colorWarning: '#f59e0b',
  colorDanger: '#ef4444',
  colorInfo: '#94a3b8',

  /* ---- 文本：暗底上全部反相 ---- */
  colorTitle: '#f1f5f9',
  colorContent: '#cbd5e1',
  colorSecondary: '#94a3b8',
  colorAid: '#64748b',
  colorTip: '#475569',

  /* ---- 描边与背景 ---- */
  colorBorder: '#253048',
  colorBorderLight: '#1c2436',
  colorBg: '#0f172a',

  /* ---- 字号 / 字重 / 尺寸：与主题无关，原样保持 ---- */
  fsBig: '24px',
  fsImportant: '20px',
  fsTitle: '16px',
  fsContent: '14px',
  fsSecondary: '12px',
  fsAid: '11px',

  fwMedium: '500',
  fwSemibold: '600',

  sizeSidePadding: '16px',

  /* ---- 按钮 ---- */
  buttonPrimaryBgColor: '#6094fa',
  buttonPrimaryColor: '#0b1120',
  buttonSuccessBgColor: '#10b981',
  buttonSuccessColor: '#ffffff',
  buttonWarningBgColor: '#f59e0b',
  buttonWarningColor: '#ffffff',
  buttonErrorBgColor: '#ef4444',
  buttonErrorColor: '#ffffff',
  buttonInfoBgColor: '#334155',
  buttonInfoColor: '#f1f5f9',
  buttonInfoPlainBorderColor: '#253048',
  buttonInfoPlainNormalColor: '#cbd5e1',
  buttonNormalColor: '#cbd5e1',
  buttonPlainBgColor: 'transparent',

  buttonSmallHeight: '28px',
  buttonSmallFs: '12px',
  buttonSmallPadding: '10px',
  buttonSmallRadius: '6px',

  buttonMediumHeight: '36px',
  buttonMediumFs: '14px',
  buttonMediumPadding: '16px',
  buttonMediumRadius: '8px',

  buttonLargeHeight: '44px',
  buttonLargeFs: '15px',
  buttonLargePadding: '20px',
  buttonLargeRadius: '10px',

  /* ---- 遮罩 ---- */
  overlayBg: 'rgba(0, 0, 0, 0.6)',
  overlayBgDark: 'rgba(0, 0, 0, 0.7)',

  /* ---- 动作面板 ---- */
  actionSheetRadius: '16px',
  actionSheetBg: '#131c2e',
  actionSheetActionHeight: '52px',
  actionSheetColor: '#f1f5f9',
  actionSheetFs: '15px',
  actionSheetSubnameColor: '#94a3b8',
  actionSheetActiveColor: '#1e293b',
  actionSheetTitleHeight: '56px',
  actionSheetCancelHeight: '48px',
  actionSheetCancelBg: '#0f172a',
  actionSheetCancelColor: '#cbd5e1',
  actionSheetCancelRadius: '10px',
  actionSheetDisabledColor: '#475569',

  /* ---- 弹层 ---- */
  popupCloseColor: '#94a3b8',

  /* ---- 轻提示：反色表面，暗色下要比页面浅一档 ---- */
  toastBg: 'rgba(51, 65, 85, 0.95)',
  toastColor: '#f1f5f9',
  toastFs: '14px',
  toastRadius: '8px',

  /* ---- 消息框 ---- */
  messageBoxWidth: '320px',
  messageBoxBg: '#131c2e',
  messageBoxRadius: '12px',
  messageBoxPadding: '20px',
  messageBoxTitleFs: '16px',
  messageBoxTitleColor: '#f1f5f9',
  messageBoxContentFs: '14px',
  messageBoxContentColor: '#cbd5e1',

  /* ---- 单元格 ---- */
  cellTitleColor: '#f1f5f9',
  cellValueColor: '#94a3b8',
  cellTapBg: '#1e293b',
  cellArrowColor: '#64748b',

  /* ---- 输入框 ---- */
  inputColor: '#f1f5f9',
  inputPlaceholderColor: '#64748b',
  inputBorderColor: '#253048',
  inputInnerHeight: '36px',
  inputFs: '14px',
  inputIconColor: '#64748b',
  /* 错误态在暗底上要提亮，#ef4444 压在深底上对比度不够 */
  inputErrorColor: '#f87171',

  /* ---- 表格 ---- */
  tableColor: '#cbd5e1',
  tableBg: '#131c2e',
  tableStripeBg: '#0f172a',
  tableBorderColor: '#253048',
  tableFontSize: '14px',

  /* ---- 分页 ---- */
  paginationContentPadding: '16px 0',
  paginationMessageColor: '#94a3b8',
  paginationMessageFs: '13px',
  paginationNavWidth: '32px',
  paginationNavColor: '#cbd5e1',
  paginationNavBorder: '#253048',
  paginationNavBorderRadius: '8px',
  paginationNavCurrentColor: '#6094fa',
  paginationNavFs: '14px',
  paginationIconSize: '14px',

  /* ---- 暗色底 ---- */
  darkBackground: '#0b1120',
  darkBackground2: '#131c2e',
  darkBackground3: '#0f172a',
  darkBackground4: '#1e293b',
  darkBackground5: '#64748b',
  /* 6 不能漏：wot 自己的 variable.scss 定义了 $-dark-background6，
     漏掉它就会被 wot 的兜底值（偏红的 #380e08）接管，
     在整片冷灰的暗色界面里冒出一块脏红 */
  darkBackground6: '#2a1a1a',
  darkBackground7: '#94a3b8',

  darkColor: '#f1f5f9',
  darkColor2: '#f87171',
  darkColor3: 'rgba(241, 245, 249, 0.8)',
  darkColorGray: '#94a3b8',
  darkBorderColor: '#253048',
}

/**
 * 构建 wot-design-uni 的主题变量。
 *
 * @param {'light'|'dark'} theme
 * @param {Record<string, string>} [overrides] 业务方追加 / 覆盖的变量
 * @returns {Record<string, string>} 可直接传给 wd-config-provider 的 theme-vars
 *
 * @example
 *   buildWotThemeVars('dark', { colorTheme: '#ff6b00' })
 */
export function buildWotThemeVars(theme, overrides) {
  const base = theme === 'dark' ? DARK_VARS : LIGHT_VARS
  return overrides ? { ...base, ...overrides } : { ...base }
}

/** 暴露原始映射，方便业务方读取某一项的取值做二次加工 */
export const wotThemePresets = {
  light: LIGHT_VARS,
  dark: DARK_VARS,
}

export default buildWotThemeVars
