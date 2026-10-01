<template>
  <view class="cd-icon" :class="rootClass" :style="iconStyle" @click="handleClick"></view>
</template>

<script setup>
/**
 * cd-icon —— 自研矢量图标
 * ---------------------------------------------------------------
 * 实现原理（跨端关键）：
 *   形状来自 -webkit-mask-image 内联的 SVG data URI，
 *   颜色来自 background-color，默认 currentColor 从而自动跟随父级文字色。
 *
 * 为什么把 mask 相关样式写成「内联样式字符串」而不是 :style 对象：
 *   小程序端 uni-app 会把对象形式的 :style 序列化成字符串，
 *   期间对连字符属性名（-webkit-mask-image）的处理不如字符串形式可靠。
 *   直接给字符串，两端都是原样透传，行为完全一致。
 *
 * 尺寸约定：
 *   不传 size 时高度取 var(--cd-icon-size, 1em)，因此图标会跟随所在文字的字号，
 *   「文字 14px + 图标 1em」这种写法在两端都能对齐。
 */
import { computed } from 'vue'
import { getIconUri, warnUnknownIcon } from './icons'

defineOptions({
  name: 'cd-icon',
})

const props = defineProps({
  /** 图标名，见 icons.js 的 ICONS 表 */
  name: {
    type: String,
    default: '',
  },
  /** 尺寸：数字按 px 处理，字符串原样输出（如 '1.2em' / '20px'） */
  size: {
    type: [String, Number],
    default: '',
  },
  /** 颜色，默认跟随父级 color */
  color: {
    type: String,
    default: '',
  },
  /** 持续旋转，用于 loading 场景 */
  spin: {
    type: Boolean,
    default: false,
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

const emit = defineEmits(['click'])

if (process.env.NODE_ENV !== 'production' && props.name) {
  warnUnknownIcon(props.name)
}

const uri = computed(() => getIconUri(props.name))

const rootClass = computed(() =>
  [props.spin ? 'cd-icon--spin' : '', props.customClass].filter(Boolean).join(' ')
)

function normalizeSize(size) {
  if (size === '' || size === null || size === undefined) return ''
  return typeof size === 'number' ? `${size}px` : String(size)
}

const iconStyle = computed(() => {
  const parts = []
  const size = normalizeSize(props.size)

  /* 尺寸写在元素上；不传时交给 CSS 变量兜底，保证「跟随字号」的默认行为 */
  if (size) {
    parts.push(`width:${size};height:${size};`)
  }

  if (props.color) {
    parts.push(`background-color:${props.color};`)
  }

  const u = uri.value
  if (u) {
    /* 标准属性写前面、-webkit- 前缀写后面：
       两者都支持时后者生效，可兼容只认前缀的旧 WebKit 内核（小程序 WebView） */
    parts.push(`mask-image:url("${u}");`)
    parts.push(`-webkit-mask-image:url("${u}");`)
  } else if (!props.color) {
    /* 图标名为空或拼错时，形状不存在，若仍保留默认的 currentColor 底色
       会渲染成一个纯色方块。这里显式压掉底色，让它安静地留空。
       注意不能用属性选择器做这件事 —— 小程序 WXSS 不支持 [style*=...] */
    parts.push('background-color:transparent;')
  }

  if (props.customStyle) {
    parts.push(props.customStyle)
  }

  return parts.join('')
})

function handleClick(event) {
  emit('click', event)
}
</script>

<script>
export default {
  name: 'cd-icon',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-icon {
  @include cd-reset;

  display: inline-block;
  flex-shrink: 0;
  width: var(--cd-icon-size, 1em);
  height: var(--cd-icon-size, 1em);
  /* 默认跟随父级文字色 —— 这是让图标「看起来属于这段文字」的关键 */
  background-color: var(--cd-icon-color, currentColor);
  vertical-align: middle;

  /* mask 的四个长属性都写两份前缀，且绝不使用 mask 简写：
     简写会重置 -webkit-mask-image，导致图标整块变成实心方块 */
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
}

/* 图标名为空 / 拼错时不渲染任何形状，交由内联样式压掉底色。
   这里不写 [style*=...] 之类的属性选择器 —— 小程序 WXSS 不支持。 */
.cd-icon--spin {
  animation: cd-icon-spin 1s linear infinite;
}

@keyframes cd-icon-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
