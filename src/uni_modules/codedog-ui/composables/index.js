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
