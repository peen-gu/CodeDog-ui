/**
 * CodeDogUI / 常量与注入键
 */

/** 组件类名前缀 */
export const NS = 'cd'

/** cd-config-provider 向下注入的上下文键 */
export const CD_CONFIG_KEY = Symbol('cd-config-provider')

/**
 * cd-form 向下注入的上下文键。
 * 表单上下文负责「统一校验所有子项」，字段上下文负责「校验我自己」。
 * 分成两个键而不是一个，是为了让 cd-input 能只依赖字段上下文 ——
 * 它不需要知道表单的存在。
 */
export const CD_FORM_KEY = Symbol('cd-form')

/** cd-form-item 向下注入的字段上下文键 */
export const CD_FORM_ITEM_KEY = Symbol('cd-form-item')

/** cd-checkbox-group 向下注入的组上下文键（组内多选） */
export const CD_CHECKBOX_GROUP_KEY = Symbol('cd-checkbox-group')

/** cd-radio-group 向下注入的组上下文键（组内单选） */
export const CD_RADIO_GROUP_KEY = Symbol('cd-radio-group')

/**
 * cd-cell-group 向下注入的上下文键。
 * 存在的唯一理由：分组后分隔线由「容器」统一画在相邻两格的交界处
 * （`.cd-cell + .cd-cell { border-top }`），
 * 这样天然不会在最后一格留一条多余的线 ——
 * 而 `:last-child` 在小程序 WXSS 的支持并不可靠。
 * 单元格靠这个键知道自己「在组里」，从而关掉自带的底边线，避免双线。
 */
export const CD_CELL_GROUP_KEY = Symbol('cd-cell-group')

/** cd-collapse 向下注入的上下文键（手风琴模式 / 统一展开收起） */
export const CD_COLLAPSE_KEY = Symbol('cd-collapse')

/** cd-steps 向下注入的上下文键（把序号与总数下发给 cd-step） */
export const CD_STEPS_KEY = Symbol('cd-steps')

/** cd-timeline 向下注入的上下文键（首尾项需要不同的线条处理） */
export const CD_TIMELINE_KEY = Symbol('cd-timeline')

/** cd-breadcrumb 向下注入的上下文键（只有最后一项是「当前位置」） */
export const CD_BREADCRUMB_KEY = Symbol('cd-breadcrumb')

/** 主题模式本地存储键 */
export const THEME_STORAGE_KEY = 'cd-theme-mode'

/** 尺寸档位 */
export const SIZE_PRESETS = ['small', 'default', 'large']

/** 双形态模式 —— 所有支持双形态的组件共用同一套取值 */
export const SHAPE_MODES = ['auto', 'mobile', 'desktop']

/**
 * 命令式反馈服务的层级常量。
 * 之所以是 JS 常量而不是纯 CSS 变量：cd-dialog 的 zIndex prop 要 Number，
 * 传不进去 CSS var()。CSS 侧的令牌（--cd-z-modal 等）以这里的数值为兜底。
 */
export const SERVICE_Z = {
  /** 确认 / 警告框：压过业务自己的 cd-dialog（默认 2200） */
  modal: 2400,
  /** 全局 loading：在 toast 之下 —— toast 是临时信息，要能透过遮罩被看到 */
  loading: 2900,
}
