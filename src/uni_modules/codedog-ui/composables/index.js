/**
 * CodeDogUI / composables 统一出口
 */

export {
  usePlatform,
  getSystemInfo,
  UNI_PLATFORM,
  isH5,
  isMP,
  isWeixin,
  isApp,
  isElectron,
  isNvue,
  deviceType,
  osName,
  isTouchDevice,
} from './use-platform'

export { useBreakpoint, resolveDesktopShape, getViewport, BREAKPOINTS } from './use-breakpoint'

export { useTheme } from './use-theme'

export { useDevice } from './use-device'

export { useField } from './use-field'

export { usePageScroll } from './use-page-scroll'

/* 浮层定位内核：自己写气泡类浮层时要用（index.d.ts 上已声明，这里必须真的导出） */
export { useFloating, FLOAT_PLACEMENTS } from './use-floating'

/* Esc 层级栈：多层浮层共存时，只有最上面那层响应 Esc */
export { useEscLayer } from './use-esc-stack'
