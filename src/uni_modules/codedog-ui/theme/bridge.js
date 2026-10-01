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
 * 只覆盖「品牌色 + 背景 + 文字」三类，其余交给 wot 自己的 dark 分支。
 * 为什么不把亮色那一整套也搬过来：wot 的暗色实现走的是 $-dark-* 变量族，
 * 如果我们把 $-color-title 之类的亮色变量也塞进去，会出现
 * 「深色底 + 深色字」的翻车。两套映射互斥而不是合并，就是为了避免这个。
 * ================================================================== */
const DARK_VARS = {
  colorTheme: '#6094fa',
  colorSuccess: '#10b981',
  colorWarning: '#f59e0b',
  colorDanger: '#ef4444',
  colorInfo: '#94a3b8',

  /* 暗色底：与 CodeDogUI 的 --cd-bg-page / --cd-bg-container 对齐 */
  darkBackground: '#0b1120',
  darkBackground2: '#131c2e',
  darkBackground3: '#0f172a',
  darkBackground4: '#1e293b',
  darkBackground5: '#64748b',
  darkBackground7: '#94a3b8',

  darkColor: '#f1f5f9',
  darkColor2: '#f87171',
  darkColor3: 'rgba(241, 245, 249, 0.8)',
  darkColorGray: '#94a3b8',
  darkBorderColor: '#253048',

  overlayBg: 'rgba(0, 0, 0, 0.6)',
  overlayBgDark: 'rgba(0, 0, 0, 0.7)',

  /* 品牌主色在暗底上提亮一档，保证对比度 */
  buttonPrimaryBgColor: '#6094fa',
  buttonPrimaryColor: '#0b1120',

  /* 面板在暗色下要整体压深，否则会「白板刺眼」 */
  actionSheetBg: '#131c2e',
  actionSheetColor: '#f1f5f9',
  actionSheetActiveColor: '#1e293b',
  actionSheetCancelBg: '#0f172a',
  actionSheetCancelColor: '#cbd5e1',
  actionSheetRadius: '16px',

  tableBg: '#131c2e',
  tableColor: '#cbd5e1',
  tableStripeBg: '#0f172a',
  tableBorderColor: '#253048',

  paginationNavColor: '#cbd5e1',
  paginationNavBorder: '#253048',
  paginationNavCurrentColor: '#6094fa',
  paginationMessageColor: '#94a3b8',
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
