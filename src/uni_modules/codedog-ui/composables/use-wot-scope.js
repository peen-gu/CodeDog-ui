/**
 * CodeDogUI / useWotScope —— 让「被传送出 Provider 的弹层」重新拿到主题
 * ---------------------------------------------------------------
 * 这是一个很容易被忽略、但一定会踩到的坑：
 *
 *   wd-popup 开启 root-portal 后，弹层节点会被传送到 body（H5）或
 *   root-portal（小程序）下，彻底脱离 cd-config-provider 的 DOM 子树。
 *   于是它同时丢失两样东西：
 *     1. --cd-*  变量 → 我们的弹层样式全部走兜底值，暗色主题失效
 *     2. --wot-* 变量与 .wot-theme-dark 类 → 弹层里的 wd- 组件仍是亮色
 *
 * 解决办法不是关掉 root-portal（那会带来层级与固定定位的一堆麻烦），
 * 而是给弹层自己再套一份完整的主题作用域 —— 类名和变量都在同一个节点上。
 * 这正好也说明了为什么把 .cd-root 设计成「可移植的主题作用域」而非单纯的容器类。
 */

import { computed, inject } from 'vue'
import { buildWotThemeVars } from '../theme/bridge'
import { CD_CONFIG_KEY } from '../constants'
import { useTheme } from './use-theme'

/**
 * camelCase → kebab-case
 * 必须与 wot-design-uni 的 mapThemeVarsToCSSVars 保持一致，
 * 否则变量名对不上，主题会「看起来没生效」。
 */
export function kebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * 把主题变量对象序列化成可内联的 CSS 变量字符串。
 * @param {'light'|'dark'} theme
 * @param {Record<string, string>} [overrides]
 * @returns {string} 形如 `--wot-color-theme:#3b76f6;--wot-fs-title:16px;`
 */
export function toWotStyleString(theme, overrides) {
  const vars = buildWotThemeVars(theme, overrides)
  return Object.keys(vars)
    .map((key) => `--wot-${kebabCase(key)}:${vars[key]};`)
    .join('')
}

/**
 * 为弹层构建完整的主题作用域（类名 + 变量）。
 * 优先读 cd-config-provider 注入的上下文；没有 Provider 时退回全局主题状态。
 */
export function useWotScope(wotThemeVars) {
  const config = inject(CD_CONFIG_KEY, null)
  const { isDark: globalIsDark } = useTheme()

  const isDark = computed(() => (config ? !!config.isDark.value : globalIsDark.value))
  const themeName = computed(() => (isDark.value ? 'dark' : 'light'))

  /**
   * 类名里同时带 cd- 与 wot- 两套：
   *   cd-root / cd-theme-dark  → 我们自己的 --cd-* 变量
   *   wot-theme-dark           → 让 wd- 组件的暗色分支规则命中
   */
  const scopeClass = computed(() =>
    ['cd-root', isDark.value ? 'cd-theme-dark' : '', `wot-theme-${themeName.value}`].filter(Boolean).join(' ')
  )

  const scopeStyle = computed(() => toWotStyleString(themeName.value, wotThemeVars))

  return {
    isDark,
    themeName,
    scopeClass,
    scopeStyle,
  }
}

export default useWotScope
