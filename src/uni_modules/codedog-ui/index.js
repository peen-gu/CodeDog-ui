/**
 * CodeDogUI 主入口
 * ---------------------------------------------------------------
 * 组件通过 easycom 自动按需引入，不需要在这里注册：
 *   pages.json 中配置
 *   "^cd-(.*)": "@/uni_modules/codedog-ui/components/cd-$1/cd-$1.vue"
 * 模板里直接写 <cd-button /> 即可，未使用的组件不会进入产物。
 *
 * 这里只导出「非组件」的运行时能力：组合式函数、主题映射、常量。
 *
 * @example
 *   import { useDevice, useTheme, buildWotThemeVars } from '@/uni_modules/codedog-ui'
 */

export * from './composables'

export * from './utils/validate'

/* 日期工具是纯函数，业务做自定义日历 / 报表时可以直接复用 */
export * from './utils/date'

/* 命令式反馈服务：toast / confirm / alert / loading / previewImage。
   宿主组件（cd-toast-host）不在静态依赖里 —— H5 端由服务在首次调用时
   动态 import（独立 chunk，用到才加载）；小程序端走 easycom / 手动引用。
   previewImage 同此套路：H5 动态挂载 cd-image-preview，小程序降级 uni.previewImage。 */
export {
  toast,
  confirm,
  alert,
  loading,
  hideLoading,
  settleModal,
  dismissToast,
  previewImage,
} from './service'

export { buildWotThemeVars, wotThemePresets } from './theme/bridge'

export { kebabCase, toWotStyleString, useWotScope } from './composables/use-wot-scope'

/* 注入键全部导出：自定义控件要接入某个容器（比如自己写一个复选框去接
   cd-checkbox-group）就得拿到对应的 key。只导出一部分的话，
   index.d.ts 上写着的那些键运行时是 undefined —— 类型不报错、一跑就炸。 */
export {
  NS,
  CD_CONFIG_KEY,
  CD_FORM_KEY,
  CD_FORM_ITEM_KEY,
  CD_CHECKBOX_GROUP_KEY,
  CD_RADIO_GROUP_KEY,
  CD_CELL_GROUP_KEY,
  CD_COLLAPSE_KEY,
  CD_STEPS_KEY,
  CD_TIMELINE_KEY,
  CD_BREADCRUMB_KEY,
  THEME_STORAGE_KEY,
  SIZE_PRESETS,
  SHAPE_MODES,
  SERVICE_Z,
} from './constants'
