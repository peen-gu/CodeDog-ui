/**
 * CodeDogUI / usePlatform —— 终端探测
 * ---------------------------------------------------------------
 * 探测分两级，优先编译期（100% 准确），运行时兜底：
 *   1. 编译期：uni-app 的条件编译，构建时就把无用分支裁掉，零运行时开销
 *   2. 运行时：uni.getSystemInfoSync().uniPlatform，覆盖未显式列举的端
 *
 * 为什么需要它：
 *   use-breakpoint 只能告诉你「容器有多宽」，但 375px 的窄窗口可能是
 *   手机浏览器、也可能是 PC 上被拖窄的窗口 —— 两者的交互预期完全不同。
 *   所以「是不是 PC」必须同时看 平台 + 宽度 + 悬停能力 三个信号。
 */

let cachedSystemInfo = null

/**
 * 安全读取系统信息。
 * uni.getSystemInfoSync 在新版本里已被拆分为 getWindowInfo / getDeviceInfo，
 * 但为了兼容旧基础库与 H5，这里保留它并做异常兜底 —— 探测失败不能阻断渲染。
 */
export function getSystemInfo() {
  if (cachedSystemInfo) return cachedSystemInfo
  try {
    if (typeof uni !== 'undefined' && typeof uni.getSystemInfoSync === 'function') {
      cachedSystemInfo = uni.getSystemInfoSync() || {}
    } else {
      cachedSystemInfo = {}
    }
  } catch (e) {
    cachedSystemInfo = {}
  }
  return cachedSystemInfo
}

/** 编译期平台探测，运行时兜底 */
function detectPlatform() {
  /* #ifdef H5 */
  return 'web'
  /* #endif */
  /* #ifdef MP-WEIXIN */
  return 'mp-weixin'
  /* #endif */
  /* #ifdef APP-PLUS */
  return 'app'
  /* #endif */
  return getSystemInfo().uniPlatform || 'unknown'
}

/** 当前运行平台：web / mp-weixin / app / ... */
export const UNI_PLATFORM = detectPlatform()

/* -------------------- 平台判定（模块级常量，可在模板里直接用） -------------------- */

/** 是否运行在浏览器（H5 端）—— PC 形态只可能出现在这里 */
export const isH5 = UNI_PLATFORM === 'web'

/** 是否任意小程序端 */
export const isMP = UNI_PLATFORM.indexOf('mp-') === 0

/** 是否微信小程序 */
export const isWeixin = UNI_PLATFORM === 'mp-weixin'

/** 是否 App（含鸿蒙） */
export const isApp = UNI_PLATFORM === 'app' || UNI_PLATFORM === 'app-harmony'

/** 是否 nvue 渲染（样式能力受限，很多 CSS 不可用） */
export const isNvue = !!getSystemInfo().nvue

/**
 * 设备类型：phone / pad / pc。
 * 注意 deviceType 在小程序开发者工具里恒为 'phone'，不要用它判断真机形态。
 */
export const deviceType = getSystemInfo().deviceType || 'phone'

/** 操作系统：ios / android / windows / mac / devtools */
export const osName = (getSystemInfo().osName || getSystemInfo().platform || '').toLowerCase()

/** 是否触屏设备。H5 端靠媒体查询与触摸事件探测，其余端恒为 true */
export const isTouchDevice = (() => {
  /* #ifdef H5 */
  if (typeof window !== 'undefined') {
    return 'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0)
  }
  return false
  /* #endif */
  return true
})()

/**
 * 组合式 API 版本。
 * 返回的都是模块级常量，不是响应式的 —— 平台和 OS 在应用生命周期内不会改变。
 */
export function usePlatform() {
  return {
    platform: UNI_PLATFORM,
    isH5,
    isMP,
    isWeixin,
    isApp,
    isNvue,
    deviceType,
    osName,
    isTouchDevice,
    systemInfo: getSystemInfo(),
  }
}

export default usePlatform
