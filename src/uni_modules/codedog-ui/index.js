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

/* 命令式反馈服务：toast / confirm / alert / loading。
   宿主组件（cd-toast-host）不在静态依赖里 —— H5 端由服务在首次调用时
   动态 import（独立 chunk，用到才加载）；小程序端走 easycom / 手动引用。 */
export {
  toast,
  confirm,
  alert,
  loading,
  hideLoading,
  settleModal,
  dismissToast,
} from './service'

export { buildWotThemeVars, wotThemePresets } from './theme/bridge'

export { kebabCase, toWotStyleString, useWotScope } from './composables/use-wot-scope'

export {
  NS,
  CD_CONFIG_KEY,
  CD_FORM_KEY,
  CD_FORM_ITEM_KEY,
  THEME_STORAGE_KEY,
  SIZE_PRESETS,
  SHAPE_MODES,
  SERVICE_Z,
} from './constants'
