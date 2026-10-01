<template>
  <wd-config-provider
    :theme="wdTheme"
    :theme-vars="mergedWotVars"
    :custom-class="rootClass"
    :custom-style="customStyle"
  >
    <slot />
  </wd-config-provider>
</template>

<script setup>
/**
 * cd-config-provider —— 全局主题与尺寸容器
 * ---------------------------------------------------------------
 * 一次挂载，同时解决三件事：
 *
 * 1. 让 CodeDogUI 自己的组件拿到 --cd-* 变量
 *    （.cd-root 类名在 tokens.scss 里挂了全套亮色变量）
 *
 * 2. 让 wot-design-uni 的组件跟随同一套设计语言
 *    通过 theme-vars 把 --wot-* 变量灌进去 —— 这是二次封装的关键一步。
 *    不做这一步，页面上会是「我们的按钮」和「它的弹窗」两套视觉。
 *
 * 3. 统一尺寸密度
 *    size 档位挂在根节点上，一条 --cd-control-height 改动全局生效，
 *    这是 PC（紧凑）与移动（宽松）最实用的差异控制点。
 *
 * theme 传空字符串表示「跟随全局主题状态」，适合作为应用根容器；
 * 传入具体值则锁定该子树，适合局部固定主题的场景（如强制亮色的打印区）。
 */
import { computed, provide } from 'vue'
import { useTheme } from '../../composables/use-theme'
import { buildWotThemeVars } from '../../theme/bridge'
import { CD_CONFIG_KEY } from '../../constants'

defineOptions({
  name: 'cd-config-provider',
})

const props = defineProps({
  /** 'light' | 'dark' | 'auto' | ''（空 = 跟随全局状态） */
  theme: {
    type: String,
    default: '',
  },
  /** 'small' | 'default' | 'large' */
  size: {
    type: String,
    default: 'default',
  },
  /** 追加 / 覆盖传给 wot-design-uni 的主题变量 */
  wotThemeVars: {
    type: Object,
    default: () => ({}),
  },
  customClass: {
    type: String,
    default: '',
  },
  customStyle: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:theme'])

const { mode, systemDark, setMode } = useTheme()

/** 生效的模式：外部受控优先，否则读全局状态 */
const activeMode = computed(() => props.theme || mode.value)

/** 解析出最终是亮还是暗（auto 时看系统） */
const activeIsDark = computed(() => {
  if (activeMode.value === 'auto') return systemDark.value
  return activeMode.value === 'dark'
})

/** 透传给 wd-config-provider，它会自动加上 wot-theme-dark 类 */
const wdTheme = computed(() => (activeIsDark.value ? 'dark' : 'light'))

const mergedWotVars = computed(() => buildWotThemeVars(wdTheme.value, props.wotThemeVars))

/**
 * 根节点类名。
 * `cd-root` 是「可移植的主题作用域」—— 不只是 Provider 根节点，
 * 任何需要独立主题的容器（弹层、被传送到 body 的面板）都可以挂这个类，
 * 从而在脱离 Provider 子树后依然拿到全套 CSS 变量。
 */
const rootClass = computed(() =>
  [
    'cd-root',
    activeIsDark.value ? 'cd-theme-dark' : '',
    props.size !== 'default' ? `cd-size-${props.size}` : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

/** 切换主题：同时更新全局状态并对外广播，受控 / 非受控都能用 */
function setTheme(value) {
  setMode(value)
  emit('update:theme', value)
}

/** 亮暗互换 */
function toggleTheme() {
  setTheme(activeIsDark.value ? 'light' : 'dark')
}

provide(CD_CONFIG_KEY, {
  size: computed(() => props.size),
  isDark: activeIsDark,
  theme: computed(() => (activeIsDark.value ? 'dark' : 'light')),
  setTheme,
  toggleTheme,
})
</script>

<style lang="scss">
/* Provider 本身不产生任何视觉，只承载类名与 CSS 变量 */
</style>
