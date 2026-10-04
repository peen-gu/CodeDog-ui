/**
 * CodeDogUI / useTheme —— 亮暗主题
 * ---------------------------------------------------------------
 * 状态是模块级单例：任意组件调用 useTheme() 拿到的都是同一份主题状态，
 * 切换后全局同步，不需要事件总线或状态管理库。
 *
 * 三、套应用路径，按可靠性从高到低生效：
 *   1. cd-config-provider 的根节点 class（跨端统一，推荐）
 *   2. H5 端直接给 <html> 打 class（无需 Provider 也能全局换肤）
 *   3. 组件内置的 var(--cd-x, 兜底值) —— 即使上面都失效也不会崩
 */

import { ref, computed } from 'vue'
/* 主题探测走统一的 getSystemInfo()：优先新 API（getAppBaseInfo 才有 theme），
   避免 mp 端触发 uni.getSystemInfoSync 的弃用告警。见 use-platform.js 内注释。 */
import { getSystemInfo } from './use-platform'

const STORAGE_KEY = 'cd-theme-mode'

/** 用户显式选择：'light' | 'dark' | 'auto' */
const mode = ref('light')

/** 系统当前是否暗色（mode 为 auto 时决定最终主题） */
const systemDark = ref(false)

let initialized = false
let systemWatcherBound = false
let mediaQuery = null

/* -------------------- 持久化 -------------------- */

function readStorage() {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved
  } catch (e) {
    /* 存储不可用时静默降级 */
  }
  return 'light'
}

function writeStorage(value) {
  try {
    uni.setStorageSync(STORAGE_KEY, value)
  } catch (e) {
    /* 忽略 */
  }
}

/* -------------------- 系统主题监听 -------------------- */

function detectSystem() {
  /* #ifdef H5 */
  if (typeof window !== 'undefined' && window.matchMedia) {
    systemDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    return
  }
  /* #endif */
  /* #ifdef MP-WEIXIN */
  try {
    const info = getSystemInfo()
    systemDark.value = info.theme === 'dark'
    return
  } catch (e) {
    /* 忽略 */
  }
  /* #endif */
  systemDark.value = false
}

function bindSystemWatcher() {
  if (systemWatcherBound) return
  systemWatcherBound = true

  /* #ifdef H5 */
  if (typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => {
      systemDark.value = e.matches
      applyToDocument()
    }
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', onChange)
    else if (mediaQuery.addListener) mediaQuery.addListener(onChange)
  }
  /* #endif */

  /* #ifdef MP-WEIXIN */
  // 微信小程序原生主题变化回调，需要在 manifest.json 里开启 darkmode: true
  if (typeof uni !== 'undefined' && typeof uni.onThemeChange === 'function') {
    uni.onThemeChange((res) => {
      systemDark.value = res.theme === 'dark'
    })
  }
  /* #endif */

  /* #ifndef H5 */
  /* #ifndef MP-WEIXIN */
  // 其余端无系统主题事件，固定按亮色处理
  /* #endif */
  /* #endif */
}

/* -------------------- 落地 -------------------- */

/**
 * H5 端把主题类名打到 <html> 上。
 * 这样即使页面没有包 cd-config-provider，tokens.scss 里的
 * `html.cd-theme-dark` 规则也能接管全部 CSS 变量。
 */
function applyToDocument() {
  /* #ifdef H5 */
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.classList.toggle('cd-theme-dark', isDark.value)
  }
  /* #endif */
}

function init() {
  if (initialized) return
  initialized = true
  mode.value = readStorage()
  detectSystem()
  bindSystemWatcher()
  applyToDocument()
}

/* -------------------- 派生状态 -------------------- */

const resolvedTheme = computed(() => (mode.value === 'auto' ? (systemDark.value ? 'dark' : 'light') : mode.value))
const isDark = computed(() => resolvedTheme.value === 'dark')

/* -------------------- 对外 API -------------------- */

/**
 * @returns 主题状态与操作方法（全局单例）
 */
export function useTheme() {
  init()

  /**
   * 设置主题模式
   * @param {'light'|'dark'|'auto'} value
   */
  function setMode(value) {
    if (value !== 'light' && value !== 'dark' && value !== 'auto') return
    mode.value = value
    writeStorage(value)
    applyToDocument()
  }

  /** 在亮 / 暗之间来回切（不会切到 auto，符合用户对「点一下」的预期） */
  function toggle() {
    setMode(isDark.value ? 'light' : 'dark')
  }

  return {
    /** 用户选择的模式 */
    mode,
    /** 实际生效的主题：'light' | 'dark' */
    resolvedTheme,
    /** 是否暗色，模板里直接用 */
    isDark,
    /** 系统是否暗色 */
    systemDark,
    setMode,
    toggle,
  }
}

export default useTheme
