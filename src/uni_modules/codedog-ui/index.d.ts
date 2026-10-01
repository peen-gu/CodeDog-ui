/**
 * CodeDogUI / 类型声明
 * ------------------------------------------------------------------
 * 覆盖 `import ... from 'codedog-ui'` 的 JS 导出面：
 * 组合式函数、命令式服务、主题桥接、工具与常量。
 *
 * 组件（<cd-button> 等）走 easycom 自动注册，Vue 的模板类型系统
 * 无法为 easycom 提供全局 props 补全 —— 这是 uni-app 生态的通用限制
 * （wot-design-uni 同样如此）。属性请以文档站为准。
 */

import type { Ref } from 'vue'

/* ==================== 平台与设备 ==================== */

export type UniPlatform = 'h5' | 'mp-weixin' | 'app' | 'app-nvue' | 'electron' | string

export const UNI_PLATFORM: UniPlatform
export const isH5: boolean
export const isMP: boolean
export const isWeixin: boolean
export const isApp: boolean
export const isNvue: boolean

export type DeviceType = 'mobile' | 'desktop' | 'tablet'
export const deviceType: DeviceType
export const osName: string
export const isTouchDevice: boolean

/** 同步获取系统信息（内部已做平台差异收敛） */
export declare function getSystemInfo(): UniApp.GetSystemInfoResult

/* ==================== 断点 ==================== */

export interface Breakpoints {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
}

export declare const BREAKPOINTS: Breakpoints

export interface Viewport {
  width: number
  height: number
}

/** 当前视口尺寸（响应式） */
export declare function getViewport(): Ref<Viewport>

/** 按视口宽推断双形态：窄屏 mobile、宽屏 desktop */
export declare function resolveDesktopShape(width: number): boolean

/** 订阅断点变化 */
export declare function useBreakpoint(): {
  width: Ref<number>
  /** xs / sm / md / lg / xl */
  name: Ref<keyof Breakpoints>
  isDesktop: Ref<boolean>
}

/* ==================== 主题 ==================== */

export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * 主题状态。读 `mode.value` 取当前模式，写它即切换并持久化。
 * `resolved.value` 是 auto 展开后的实际值（light / dark）。
 */
export declare function useTheme(): {
  mode: Ref<ThemeMode>
  resolved: Ref<'light' | 'dark'>
  setMode(mode: ThemeMode): void
  toggle(): void
}

/* ==================== 设备（双形态） ==================== */

export interface UseDeviceReturn {
  /** 是否移动端（宽度 < 断点阈值） */
  isMobile: Ref<boolean>
  /** 是否 PC 形态 */
  isDesktop: Ref<boolean>
  /** 终端类型 */
  type: Ref<DeviceType>
}

export declare function useDevice(): UseDeviceReturn

/* ==================== 表单字段接线 ==================== */

/**
 * 自定义控件接入表单校验链的统一入口。
 *
 * - 把 `notifyChange` / `notifyBlur` 挂到你的值变化时机上
 * - 把 `formDisabled` 一并尊重，让 `<cd-form disabled>` 对自定义控件生效
 *
 * @example
 *   const { field, formDisabled, notifyChange, notifyBlur } = useField()
 */
export declare function useField(options?: {
  /** 字段名，不传时由父级 cd-form-item 的 prop 提供 */
  name?: string
}): {
  /** 字段上下文（来自 cd-form-item），不在表单内时为 null */
  field: {
    name: string
    disabled: boolean
    report(value: unknown, trigger: 'change' | 'blur'): void
  } | null
  formDisabled: Ref<boolean>
  notifyChange(value: unknown): void
  notifyBlur(value: unknown): void
}

/* ==================== 滚动 ==================== */

/**
 * 统一 H5 / 小程序 的页面滚动来源。
 *
 * @param propScrollTop 由页面 `onPageScroll` 传入的值；
 *   传 null（或不传）时在 H5 上自动监听 window scroll（rAF 节流），
 *   小程序上则要求调用方传入，否则返回常量 0。
 */
export declare function usePageScroll(propScrollTop?: number | null): {
  scrollTop: Ref<number>
}

/* ==================== 浮层定位内核 ==================== */

export interface FloatingPlacement {
  /** top / bottom / left / right（翻转后可能改变） */
  position: 'top' | 'bottom' | 'left' | 'right'
  align: 'start' | 'center' | 'end'
}

export interface UseFloatingOptions {
  placement?: FloatingPlacement | `${FloatingPlacement['position']}-${FloatingPlacement['align']}`
  /** 触发物与面板的间距，px */
  offset?: number
  /** 面板宽度；字符串时原样下发（如 'max-content'） */
  width?: number | string
  /** 自动翻转（空间不足时换边），默认 true */
  flip?: boolean
  /** 是否立即打开 */
  open?: boolean
  /** 面板内联样式追加（字符串契约） */
  customStyle?: string
}

export interface UseFloatingReturn {
  uid: string
  open: Ref<boolean>
  show(): void
  hide(): void
  toggle(): void
  /** 触发物样式（需要挂回触发元素） */
  triggerStyle: Record<string, string>
  /** 面板样式（position: fixed + 测量后的 left/top） */
  panelStyle: Record<string, string>
  /** 箭头样式 */
  arrowStyle: Record<string, string>
  /** 重新测量 */
  update(): void
}

export declare function useFloating(options?: UseFloatingOptions): UseFloatingReturn

/* ==================== 命令式反馈服务 ==================== */

export interface ToastOptions {
  message: string
  /** success / error / warning / info / none */
  type?: 'success' | 'error' | 'warning' | 'info' | 'none'
  duration?: number
  /** auto / top / middle / bottom */
  position?: 'auto' | 'top' | 'middle' | 'bottom'
}

export interface ToastHandle {
  id: number
  close(): void
}

export declare const toast: ((
  options: ToastOptions | string
) => ToastHandle) & {
  success(message: string, duration?: number): ToastHandle
  error(message: string, duration?: number): ToastHandle
  warning(message: string, duration?: number): ToastHandle
  info(message: string, duration?: number): ToastHandle
}

export interface ModalOptions {
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  /** 隐藏取消按钮（alert 形态） */
  showCancel?: boolean
  /** 危险操作：确认按钮呈实心红 */
  danger?: boolean
}

/** 确认框。resolve(true) 表示点了确认，false 表示取消 / 遮罩 / Esc */
export declare function confirm(options: ModalOptions): Promise<boolean>

/** 警告框。只有确认按钮 */
export declare function alert(options: ModalOptions): Promise<void>

/** 全局 loading。返回 close 句柄；重复调用只更新文案 */
export declare function loading(message: string, options?: { duration?: number }): {
  close(): void
}

/** 关闭当前 loading */
export declare function hideLoading(): void

/** 把悬挂中的模态按「取消」结算（供内部与特殊场景使用） */
export declare function settleModal(result: boolean): void

/** 手动关闭某一条 toast */
export declare function dismissToast(id: number): void

/* ==================== 主题桥接（wot-design-uni） ==================== */

export type WotThemeVars = Record<string, string>

/**
 * 构建 wot-design-uni 的 theme-vars。
 * camelCase 会被底层转成 --wot-xxx 内联样式并级联到所有 wd- 组件。
 *
 * @example
 *   buildWotThemeVars('dark', { colorTheme: '#ff6b00' })
 */
export declare function buildWotThemeVars(
  theme: 'light' | 'dark',
  overrides?: WotThemeVars
): WotThemeVars

export declare const wotThemePresets: {
  light: WotThemeVars
  dark: WotThemeVars
}

/**
 * 给二次封装的 wot 组件提供主题作用域。
 * 必须在组件里调用并把返回值绑到 wd-config-provider 上，
 * 否则弹层（root-portal 传送后）会丢失主题。
 */
export declare function useWotScope(themeVars?: WotThemeVars): {
  themeVars: WotThemeVars
  scopeClass: string
  scopeStyle: Record<string, string>
}

/* ==================== 工具 ==================== */

/** camelCase / PascalCase → kebab-case */
export declare function kebabCase(str: string): string

/** 把主题映射拼成可内联的 style 字符串 */
export declare function toWotStyleString(theme: 'light' | 'dark', overrides?: WotThemeVars): string

/* ==================== 校验 ==================== */

export interface ValidationContext {
  model: Record<string, unknown>
  field?: string
}

export type ValidatorResult = true | string | Promise<true | string>

export interface FieldRule {
  required?: boolean
  message?: string
  pattern?: RegExp
  min?: number
  max?: number
  enum?: unknown[]
  /** 返回 true / 错误文案 / Promise */
  validator?: (value: unknown, context: ValidationContext) => ValidatorResult
  /** blur / change，默认两者都触发 */
  trigger?: 'blur' | 'change'
}

/** 判定「空」：undefined / null / 空字符串 / 空数组 */
export declare function isValueEmpty(value: unknown): boolean

export declare function normalizeRules(
  rules: FieldRule[] | Record<string, FieldRule[]>
): FieldRule[]

export declare function getValueByPath(source: Record<string, unknown>, path: string): unknown

export declare function setValueByPath(
  target: Record<string, unknown>,
  path: string,
  value: unknown
): void

export declare function matchTrigger(rule: FieldRule, trigger: 'blur' | 'change'): boolean

/** 依次执行规则，返回第一条失败文案；全部通过返回 null */
export declare function runRules(
  rules: FieldRule[],
  value: unknown,
  context?: ValidationContext
): Promise<string | null>

export declare const PATTERNS: {
  mobile: RegExp
  tel: RegExp
  email: RegExp
  url: RegExp
  idCard: RegExp
  password: RegExp
  number: RegExp
  postCode: RegExp
  ip: RegExp
}

/* ==================== 日期工具（纯函数） ==================== */

export type DateLike = Date | string | number

export declare function pad(n: number): string
export declare function toDate(value: DateLike): Date
export declare function formatDate(date: DateLike): string
export declare function formatTime(date: DateLike): string

export declare function firstWeekday(year: number, month: number, weekStart?: 0 | 1): number
export declare function daysInMonth(year: number, month: number): number
export declare function addMonths(date: Date, delta: number): Date
export declare function addDays(date: Date, delta: number): Date

export declare function compareDay(a: DateLike, b: DateLike): number
export declare function isSameDay(a: DateLike, b: DateLike): boolean
export declare function isToday(date: DateLike): boolean
export declare function clampDay(date: DateLike, min?: DateLike, max?: DateLike): Date
export declare function inRange(date: DateLike, min?: DateLike, max?: DateLike): boolean

export interface DayCell {
  date: Date
  day: number
  /** 是否当前展示月 */
  inMonth: boolean
  disabled: boolean
  isToday: boolean
  /** 相对序号，从 1 开始 */
  index: number
}

/** 生成整月网格（含前后补位），供自定义日历复用 */
export declare function buildMonthGrid(
  year: number,
  month: number,
  weekStart?: 0 | 1
): DayCell[]

export declare function weekLabels(weekStart?: 0 | 1): string[]

/* ==================== 常量与注入键 ==================== */

/** 组件类名前缀 */
export declare const NS: 'cd'

export declare const CD_CONFIG_KEY: unique symbol
export declare const CD_FORM_KEY: unique symbol
export declare const CD_FORM_ITEM_KEY: unique symbol
export declare const CD_CHECKBOX_GROUP_KEY: unique symbol
export declare const CD_RADIO_GROUP_KEY: unique symbol
export declare const CD_CELL_GROUP_KEY: unique symbol
export declare const CD_COLLAPSE_KEY: unique symbol
export declare const CD_STEPS_KEY: unique symbol
export declare const CD_TIMELINE_KEY: unique symbol
export declare const CD_BREADCRUMB_KEY: unique symbol

/** 主题模式本地存储键 */
export declare const THEME_STORAGE_KEY: 'cd-theme-mode'

export declare const SIZE_PRESETS: ['small', 'default', 'large']

export declare const SHAPE_MODES: ['auto', 'mobile', 'desktop']

/**
 * 命令式反馈服务的层级常量。
 * JS 常量而非纯 CSS 变量的原因：cd-dialog 的 zIndex prop 是 Number，
 * CSS var() 传不进去。
 */
export declare const SERVICE_Z: {
  /** 确认 / 警告框层级 */
  modal: 2400
  /** 全局 loading 层级（在 toast 之下） */
  loading: 2900
}
