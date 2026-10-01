<template>
  <view class="cd-image" :class="rootClass" :style="rootStyle" @click="handleClick">
    <image
      v-if="src && state !== 'error'"
      class="cd-image__inner"
      :src="src"
      :mode="nativeMode"
      :lazy-load="lazyLoad"
      :style="innerStyle"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- ---------- 加载中 ---------- -->
    <view v-if="showLoading && state === 'loading'" class="cd-image__placeholder">
      <slot name="loading">
        <cd-icon name="loader" :size="iconSize" spin />
      </slot>
    </view>

    <!-- ---------- 失败 ---------- -->
    <view v-if="state === 'error'" class="cd-image__error">
      <slot name="error">
        <cd-icon name="image" :size="iconSize" />
        <text v-if="errorText" class="cd-image__error-text">{{ errorText }}</text>
      </slot>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-image —— 图片
 * ---------------------------------------------------------------
 * 原生 <image> 缺的不是「显示」，而是**状态**：
 * 加载中长什么样、失败长什么样、失败要不要兜底占位。
 * 业务里最常见的翻车现场就是「接口挂了，页面上出现一排碎图图标」。
 *
 * 所以这一层的价值全在三态管理上：
 *   loading → 一层占位（可带呼吸图标）
 *   loaded  → 占位撤掉，图片淡入
 *   error   → 换成语义化的失败占位（不是浏览器的碎图）
 *
 * mode 的映射刻意做成一张显式表而不是行内三元：
 * uni 的 <image mode> 取值（scaleToFill / aspectFit / aspectFill）
 * 和 CSS 的 object-fit（fill / contain / cover）不是同一套词，
 * 业务写 CSS 习惯的 contain/cover 才是正确的 API 设计，转换在这里做掉。
 *
 * 已知限制：H5 的 <image> 是真实 img，加载失败的判定依赖 onerror；
 * 跨域图片若服务端不返回 CORS 头，onerror 也可能不触发。
 * 这是浏览器的安全模型，不是能绕过去的东西。
 */
import { computed, ref, watch } from 'vue'

defineOptions({
  name: 'cd-image',
})

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  /** fill / contain / cover / none / scale-down */
  fit: {
    type: String,
    default: 'cover',
  },
  width: {
    type: [String, Number],
    default: '',
  },
  height: {
    type: [String, Number],
    default: '',
  },
  /** 圆角，数字按 px */
  radius: {
    type: [String, Number],
    default: '',
  },
  /** 圆形 */
  round: {
    type: Boolean,
    default: false,
  },
  /** 通用图片尺寸（同时给宽高） */
  size: {
    type: [String, Number],
    default: '',
  },
  lazyLoad: {
    type: Boolean,
    default: true,
  },
  showLoading: {
    type: Boolean,
    default: true,
  },
  /** 点击自动预览大图 */
  preview: {
    type: Boolean,
    default: false,
  },
  /** 预览图列表，默认只预览自己 */
  previewList: {
    type: Array,
    default: () => [],
  },
  /** 失败时的提示文案，不想显示就留空 */
  errorText: {
    type: String,
    default: '',
  },
  iconSize: {
    type: [String, Number],
    default: '1.8em',
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

const emit = defineEmits(['load', 'error', 'click'])

const MODE_MAP = {
  fill: 'scaleToFill',
  contain: 'aspectFit',
  cover: 'aspectFill',
  none: 'center',
  'scale-down': 'center',
}

const state = ref(props.src ? 'loading' : 'error')

watch(
  () => props.src,
  (value) => {
    state.value = value ? 'loading' : 'error'
  }
)

const nativeMode = computed(() => MODE_MAP[props.fit] || 'aspectFill')

function toSize(value) {
  if (value === '' || value === null || value === undefined) return ''
  return typeof value === 'number' ? `${value}px` : String(value)
}

const rootStyle = computed(() => {
  const parts = []
  const size = toSize(props.size)
  const w = toSize(props.width) || size
  const h = toSize(props.height) || size

  if (w) parts.push(`width:${w};`)
  if (h) parts.push(`height:${h};`)

  if (props.round) parts.push('border-radius:999px;')
  else if (props.radius !== '') parts.push(`border-radius:${toSize(props.radius)};`)

  if (props.customStyle) parts.push(props.customStyle)
  return parts.join('')
})

/** 图片本体撑满容器：容器负责尺寸，图片只负责填充 */
const innerStyle = 'width:100%;height:100%;display:block;'

const rootClass = computed(() =>
  [
    `cd-image--${state.value}`,
    props.round ? 'cd-image--round' : '',
    props.preview ? 'cd-image--previewable' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

function handleLoad(event) {
  state.value = 'loaded'
  emit('load', event)
}

function handleError(event) {
  state.value = 'error'
  emit('error', event)
}

function handleClick(event) {
  emit('click', event)
  if (!props.preview || state.value === 'error') return

  const urls = props.previewList && props.previewList.length ? props.previewList : [props.src]
  uni.previewImage({
    urls,
    current: props.src,
  })
}

defineExpose({ state })
</script>

<script>
export default {
  name: 'cd-image',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-image {
  @include cd-reset;

  position: relative;
  display: block;
  /* 默认给一个方形尺寸，避免业务忘了传尺寸时高度塌成 0（图片根本看不见）。
     刻意用 px 而不是 rpx —— 本框架的硬约定是不出现纯 rpx，
     否则在 H5 大屏上会被 rpx 的 960px 封顶规则截断。 */
  width: 160px;
  height: 160px;
  overflow: hidden;
  background-color: var(--cd-image-placeholder, #f1f5f9);
  border-radius: var(--cd-image-radius, 8px);
}

.cd-image__inner {
  display: block;
  width: 100%;
  height: 100%;
  /* 淡入：图片「啪」地出现会显得页面在跳，150ms 的透明度过渡就够了 */
  animation: cd-image-fade-in var(--cd-duration-base, 250ms) var(--cd-ease-out, ease);
}

@keyframes cd-image-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* ==================================================================
 * 加载中 / 失败
 * ================================================================== */
.cd-image__placeholder,
.cd-image__error {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--cd-image-loading-color, #94a3b8);
}

.cd-image__error {
  background-color: var(--cd-image-placeholder, #f1f5f9);
}

.cd-image__error-text {
  margin-top: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-xs, 11px);
  line-height: 1.4;
  color: var(--cd-text-placeholder, #94a3b8);
}

.cd-image--previewable {
  cursor: pointer;
}
</style>
