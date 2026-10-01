<template>
  <view class="cd-avatar" :class="rootClass" :style="rootStyle" @click="handleClick">
    <!-- 图片优先；加载失败自动降级到图标 / 文字，不留破图 -->
    <image
      v-if="showImage"
      class="cd-avatar__image"
      :src="src"
      :mode="imageMode"
      @error="handleImageError"
    />

    <slot v-else />

    <cd-icon v-if="!showImage && !hasSlot && icon" :name="icon" :size="iconSize" />

    <text v-if="!showImage && !hasSlot && !icon && displayText" class="cd-avatar__text">
      {{ displayText }}
    </text>
  </view>
</template>

<script setup>
/**
 * cd-avatar —— 头像
 * ---------------------------------------------------------------
 * 核心是「降级链」：src 图片 → 默认插槽 → icon → text → 空。
 * 任何一级缺失就落到下一级，所以头像组件永远不会出现破图或者空洞。
 *
 * 图片加载失败的处理放在组件内部（@error 切 hasError），而不是让业务去监听——
 * 头像的失败降级是「组件该自己搞定的事」，让业务处理只会导致每个用到头像的地方
 * 都重复写一遍 onError。
 *
 * 文字内容的中西文取字策略不同：中文名取后两字（"欧阳修" → "阳修"）符合称呼习惯，
 * 西文名取前两字母（"Michael" → "Mi"）。统一用 slice(0,2) 会把中文名切成"欧阳"，
 * 读起来别扭。
 */
import { computed, ref, useSlots } from 'vue'

defineOptions({
  name: 'cd-avatar',
})

const props = defineProps({
  /** 图片地址 */
  src: {
    type: String,
    default: '',
  },
  /** 尺寸：数字按 px，字符串原样输出（如 '3em' / '25%'） */
  size: {
    type: [String, Number],
    default: 40,
  },
  /** circle / square */
  shape: {
    type: String,
    default: 'circle',
  },
  /** 图片加载失败或未提供图片时展示的图标 */
  icon: {
    type: String,
    default: '',
  },
  /** 图片加载失败或未提供图片时展示的文字（一般传姓名） */
  text: {
    type: String,
    default: '',
  },
  /** 自定义底色，不传则按文字内容生成一个稳定的颜色 */
  bgColor: {
    type: String,
    default: '',
  },
  /** 文字颜色 */
  color: {
    type: String,
    default: '',
  },
  /** cover / contain / fill */
  fit: {
    type: String,
    default: 'cover',
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

const emit = defineEmits(['click', 'error'])

const slots = useSlots()

const hasError = ref(false)

const hasSlot = computed(() => !!(slots.default && slots.default().length))

const showImage = computed(() => !!props.src && !hasError.value)

/**
 * 没有显式指定底色时，用文字生成一个稳定的颜色。
 * 同一个名字永远得到同一个颜色 —— 随机色会导致每次渲染头像颜色都在跳。
 */
const autoBg = computed(() => {
  if (props.bgColor) return props.bgColor
  const seed = props.text || props.icon || ''
  if (!seed) return 'var(--cd-avatar-bg, var(--cd-bg-sunken, #f1f5f9))'
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360
  }
  return `hsl(${hash}, 62%, 52%)`
})

const displayText = computed(() => {
  const t = (props.text || '').trim()
  if (!t) return ''
  if (t.length <= 2) return t
  return /^[\u4e00-\u9fa5]+$/.test(t) ? t.slice(-2) : t.slice(0, 2)
})

/** 头像尺寸不确定（可能传 '25%' / '3em'），图标按 50% 跟随，视觉比例稳定 */
const iconSize = computed(() => '50%')

/**
 * 文字字号只能按 px 算。
 * 因为 `calc(25% * 0.4)` 里的百分比在 font-size 上指的是**父级字号**，
 * 而不是头像高度 —— 那会算出一个和尺寸毫无关系的值。
 * 所以只有尺寸能确定成 px 时才下发字号，其余情况交给 CSS 的兜底值。
 */
const textFontSize = computed(() => {
  const size = props.size
  if (typeof size === 'number') return `${size * 0.4}px`
  const matched = /^([\d.]+)px$/.exec(String(size).trim())
  if (matched) return `${Number(matched[1]) * 0.4}px`
  return ''
})

const imageMode = computed(() => {
  if (props.fit === 'contain') return 'aspectFit'
  if (props.fit === 'fill') return 'scaleToFill'
  return 'aspectFill'
})

const shapeClass = computed(() => (props.shape === 'square' ? 'cd-avatar--square' : 'cd-avatar--circle'))

const rootClass = computed(() =>
  [
    shapeClass.value,
    !showImage.value ? 'cd-avatar--fallback' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const rootStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : String(props.size)
  const parts = [`width:${size};`, `height:${size};`]
  if (textFontSize.value) parts.push(`font-size:${textFontSize.value};`)
  /* 有图时底色不该露出来（透明 PNG 除外），所以只在降级态上色 */
  if (!showImage.value) {
    parts.push(`background-color:${autoBg.value};`)
  }
  if (props.color) {
    parts.push(`color:${props.color};`)
  }
  if (props.customStyle) parts.push(props.customStyle)
  return parts.join('')
})

function handleImageError(event) {
  hasError.value = true
  emit('error', event)
}

function handleClick(event) {
  emit('click', event)
}

/* 换了新地址要允许重试，否则一次失败之后永远显示降级内容 */
defineExpose({
  reset() {
    hasError.value = false
  },
})
</script>

<script>
export default {
  name: 'cd-avatar',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-avatar {
  @include cd-reset;

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  vertical-align: middle;
  background-color: var(--cd-avatar-bg, var(--cd-bg-sunken, #f1f5f9));
  color: var(--cd-text-inverse, #ffffff);
  font-weight: var(--cd-font-weight-medium, 500);
  line-height: 1;
}

.cd-avatar--circle {
  border-radius: var(--cd-radius-round, 999px);
}

.cd-avatar--square {
  border-radius: var(--cd-avatar-radius, var(--cd-radius-md, 8px));
}

.cd-avatar__image {
  display: block;
  width: 100%;
  height: 100%;
}

.cd-avatar__text {
  display: block;
  line-height: 1;
  /* 尺寸单位不是 px 时拿不到字号，给一个相对兜底，避免文字撑破圆形 */
  font-size: var(--cd-avatar-font-size, 0.4em);
  white-space: nowrap;
}
</style>
