/**
 * CodeDogUI / useBreakpoint —— 断点与 PC 形态判定
 * ---------------------------------------------------------------
 * 这是整套框架的「双形态开关」。所有需要区分移动 / PC 的组件都从这里取值。
 *
 * 两个设计要点：
 *
 * 1) 单例监听。
 *    100 个组件各自 addEventListener('resize') 会让滚动直接卡死。
 *    这里把尺寸状态提到模块级单例，只在「第一个」订阅者出现时挂监听，
 *    最后一个订阅者卸载时摘掉。组件数量与监听器数量解耦。
 *
 * 2) isPC 的三重判定。
 *    只看宽度会把「PC 上拖窄的浏览器窗口」误判成手机，
 *    只看 hover 会把「带触摸屏的笔记本」误判成平板。
 *    所以必须是 平台是 H5 + 宽度达到桌面断点 + 设备具备精确指针。
 */

import { ref, computed, onUnmounted, getCurrentInstance } from 'vue'
import { isH5, isTouchDevice, getSystemInfo } from './use-platform'

/** 断点阈值（px）。修改这里必须同步修改 styles/scss-tokens.scss 里的 $cd-bp-* */
export const BREAKPOINTS = {
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1440,
}

/** 模块级单例状态 —— 全局只存在一份 */
const state = {
  width: ref(375),
  height: ref(667),
  /** 设备是否具备精确指针（鼠标 / 触控板）。触屏设备为 false */
  canHover: ref(false),
  ready: ref(false),
}

let subscriberCount = 0
let bound = false

/* -------------------- 内部工具 -------------------- */

function readSize() {
  /*
   * H5 端必须直接读 window.innerWidth / innerHeight，不能走 getSystemInfo()。
   *
   * getSystemInfo() 的结果被永久缓存（平台信息不变，缓存是对的），
   * 于是 windowWidth 永远停留在首帧那个值 ——
   * PC 上拖动窗口缩放、分屏、手机横竖屏切换，断点全部不更新，
   * 双形态组件会一直停在首屏判定的形态上。
   *
   * window.innerWidth 才是「此刻真实视口宽度」的唯一可靠来源。
   */
  /* #ifdef H5 */
  if (typeof window !== 'undefined') {
    return {
      width: window.innerWidth || 375,
      height: window.innerHeight || 667,
    }
  }
  /* #endif */

  const info = getSystemInfo()
  return {
    width: info.windowWidth || 375,
    height: info.windowHeight || 667,
  }
}

function applySize(width, height) {
  if (typeof width === 'number' && width > 0) state.width.value = width
  if (typeof height === 'number' && height > 0) state.height.value = height
}

function detectHover() {
  /* #ifdef H5 */
  if (typeof window !== 'undefined' && window.matchMedia) {
    state.canHover.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    return
  }
  /* #endif */
  // 非 H5 端一律按触摸设备处理，不启用 hover 态
  state.canHover.value = false
}

function handleResize(payload) {
  // 小程序端：payload 形如 { size: { windowWidth, windowHeight } }
  // H5 端：原生 ResizeEvent，payload 里没有我们需要的信息，直接重新读取系统信息
  const size = payload && payload.size
  if (size && size.windowWidth) {
    applySize(size.windowWidth, size.windowHeight)
  } else {
    const s = readSize()
    applySize(s.width, s.height)
  }
  detectHover()
}

let hoverMediaQuery = null

function bind() {
  if (bound) return
  bound = true

  const s = readSize()
  applySize(s.width, s.height)
  detectHover()

  /* #ifdef H5 */
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize, { passive: true })
    // 插拔鼠标（笔记本外接鼠标 / 平板接键盘）时 hover 能力会变化，需要单独监听
    if (window.matchMedia) {
      hoverMediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
      if (hoverMediaQuery.addEventListener) {
        hoverMediaQuery.addEventListener('change', detectHover)
      } else if (hoverMediaQuery.addListener) {
        hoverMediaQuery.addListener(detectHover)
      }
    }
  }
  /* #endif */

  /* #ifndef H5 */
  if (typeof uni !== 'undefined' && typeof uni.onWindowResize === 'function') {
    uni.onWindowResize(handleResize)
  }
  /* #endif */

  state.ready.value = true
}

function unbind() {
  if (!bound) return
  bound = false

  /* #ifdef H5 */
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
    if (hoverMediaQuery) {
      if (hoverMediaQuery.removeEventListener) {
        hoverMediaQuery.removeEventListener('change', detectHover)
      } else if (hoverMediaQuery.removeListener) {
        hoverMediaQuery.removeListener(detectHover)
      }
      hoverMediaQuery = null
    }
  }
  /* #endif */

  /* #ifndef H5 */
  if (typeof uni !== 'undefined' && typeof uni.offWindowResize === 'function') {
    uni.offWindowResize(handleResize)
  }
  /* #endif */
}

function subscribe() {
  subscriberCount += 1
  bind()
}

function unsubscribe() {
  subscriberCount = Math.max(0, subscriberCount - 1)
  if (subscriberCount === 0) unbind()
}

/* -------------------- 派生状态（模块级，只算一次） -------------------- */

const width = state.width
const height = state.height
const canHover = state.canHover

const breakpoint = computed(() => {
  const w = state.width.value
  if (w >= BREAKPOINTS.xl) return 'xl'
  if (w >= BREAKPOINTS.lg) return 'lg'
  if (w >= BREAKPOINTS.md) return 'md'
  if (w >= BREAKPOINTS.sm) return 'sm'
  return 'xs'
})

const isMobile = computed(() => state.width.value < BREAKPOINTS.md)
const isTablet = computed(() => state.width.value >= BREAKPOINTS.md && state.width.value < BREAKPOINTS.lg)
const isDesktop = computed(() => state.width.value >= BREAKPOINTS.lg)
const isWide = computed(() => state.width.value >= BREAKPOINTS.xl)

/**
 * 是否以 PC 形态运行 —— 全套双形态组件的总开关。
 * 注意 `isH5 &&` 这一段：小程序端就算跑在宽屏 PC 微信里，
 * 也不应该变成 PC 形态，因为它的交互模型仍然是触摸 + 底部弹出。
 */
const isPC = computed(() => isH5 && isDesktop.value && canHover.value)

/* -------------------- 对外 API -------------------- */

/**
 * @returns 响应式断点信息。组件卸载时会自动释放监听。
 */
export function useBreakpoint() {
  subscribe()

  if (getCurrentInstance()) {
    onUnmounted(unsubscribe)
  }

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isPC,
    canHover,
  }
}

/**
 * 双形态组件的形态解析器。
 * 组件对外暴露 `mode` prop，这里把它解析成最终形态，
 * 让组件既能自动跟随视口，也能被强制指定（用于测试或窄容器内嵌 PC 布局）。
 *
 * @param {'auto'|'mobile'|'desktop'} mode
 * @param {boolean|import('vue').Ref<boolean>} pcSignal isPC 的值或 ref
 * @returns {boolean} 是否使用桌面形态
 */
export function resolveDesktopShape(mode, pcSignal) {
  if (mode === 'desktop') return true
  if (mode === 'mobile') return false
  return typeof pcSignal === 'object' && pcSignal !== null && 'value' in pcSignal
    ? !!pcSignal.value
    : !!pcSignal
}

/**
 * 供非组件环境（工具函数 / 路由守卫）读取当前尺寸，不建立订阅。
 *
 * 必须先 bind() 再读：state.width 的初值是 375（移动端兜底），
 * 在第一个 useBreakpoint() 订阅出现之前直接读，会拿到
 * 「width 来自真实视口、breakpoint 却按 375 算」这种自相矛盾的结果。
 */
export function getViewport() {
  bind()
  const s = readSize()
  return {
    width: s.width,
    height: s.height,
    breakpoint: breakpoint.value,
    isPC: isPC.value,
  }
}

export default useBreakpoint
