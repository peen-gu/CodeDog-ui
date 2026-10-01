<template>
  <view class="cd-slider" :class="rootClass" :style="customStyle">
    <view
      class="cd-slider__track"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
      @mousedown="onMouseDown"
    >
      <view class="cd-slider__rail" />

      <view class="cd-slider__fill" :style="fillStyle" />

      <view
        v-for="(item, index) in thumbList"
        :key="index"
        class="cd-slider__thumb"
        :class="{ 'cd-slider__thumb--dragging': draggingIndex === index }"
        :style="`left:${item.pct}%`"
      >
        <view v-if="showTooltip && (tooltipAlways || draggingIndex === index)" class="cd-slider__tooltip">
          <text class="cd-slider__tooltip-text">{{ item.value }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-slider —— 滑块
 * ---------------------------------------------------------------
 * 为什么不用 wd-slider 之类的现成实现，而要自己处理指针：
 * 滑块是「拖拽」而不是「点击」，它必须在按下时就锁定一根轨道，
 * 并在拖动过程中持续计算位置。这件事在两端的事件模型不同：
 *   - 触屏（小程序 + 移动 H5）：只有元素级的 touchstart/touchmove；
 *   - 桌面 H5：mousedown 之后指针很可能移出元素，
 *     必须把 move / up 挂到 document 上，否则鼠标一滑出轨道就「掉」了。
 * 所以这里是两套并存的：元素级 touch 事件 + H5 专属的 document 鼠标监听。
 *
 * 关键实现细节：
 *
 * 1. 轨道的矩形在**按下那一刻量一次**并缓存。
 *    拖动途中不再重量 —— 滑块的轨道在拖动过程中不会移动，
 *    每帧去 createSelectorQuery 是纯浪费（而且是异步的，会引入抖动）。
 *
 * 2. 取整顺序是「先量化再钳制」而不是反过来。
 *    step=10、max=100 时，先把 103 钳到 100 没问题；
 *    但如果先量化成 110 再钳，就会得到一个越界的值。
 *
 * 3. 双滑块选「离手指更近的那个」来动，且允许交错。
 *    不允许交错会带来一个恼人现象：想拖左滑块往右推，推到右滑块位置就卡住不动了，
 *    用户只能先去挪右滑块。允许交错后两个滑块会在相遇瞬间交换身份，
 *    连续感才对。
 */
import { computed, getCurrentInstance, onUnmounted, ref } from 'vue'
import { useField } from '../../composables/use-field'

defineOptions({
  name: 'cd-slider',
})

const props = defineProps({
  /** 单值 Number；开启 range 时是 [low, high] */
  modelValue: {
    type: [Number, Array],
    default: 0,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100,
  },
  step: {
    type: Number,
    default: 1,
  },
  /** 双滑块区间模式 */
  range: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 拖动时显示数值气泡 */
  showTooltip: {
    type: Boolean,
    default: false,
  },
  /** 气泡常显 */
  tooltipAlways: {
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

const emit = defineEmits(['update:modelValue', 'input', 'change'])

const { formDisabled, notifyChange, notifyBlur } = useField()

const instance = getCurrentInstance()

const isDisabled = computed(() => props.disabled || formDisabled.value)

/* ----------------------------------------------------------------
 * 数值与百分比
 * ---------------------------------------------------------------- */

const span = computed(() => (props.max > props.min ? props.max - props.min : 1))

function clamp(value) {
  if (value < props.min) return props.min
  if (value > props.max) return props.max
  return value
}

/** 量化到 step 的整数倍；先量化再钳制，避免越界 */
function quantize(value) {
  const step = props.step > 0 ? props.step : 1
  const raw = props.min + Math.round((value - props.min) / step) * step
  /* 浮点噪声（0.1 步进会算成 0.30000000000000004）会让气泡显示很难看 */
  return Number(clamp(raw).toFixed(6))
}

function toPct(value) {
  return ((clamp(value) - props.min) / span.value) * 100
}

/** 归一化后的当前值：始终是数组，模板里只处理一种形态 */
const values = computed(() => {
  if (props.range) {
    const arr = Array.isArray(props.modelValue) ? props.modelValue : [props.min, props.min]
    const low = Number(arr[0] ?? props.min)
    const high = Number(arr[1] ?? props.min)
    return [Math.min(low, high), Math.max(low, high)]
  }
  return [Number(props.modelValue ?? props.min)]
})

const thumbList = computed(() =>
  values.value.map((v) => ({ value: Number(v.toFixed(6)), pct: toPct(v) }))
)

const fillStyle = computed(() => {
  const list = thumbList.value
  if (list.length < 2) return `left:0;width:${list[0].pct}%;`
  return `left:${list[0].pct}%;width:${list[1].pct - list[0].pct}%;`
})

/* ----------------------------------------------------------------
 * 指针交互
 * ---------------------------------------------------------------- */

const draggingIndex = ref(-1)

/** 按下时缓存轨道矩形：拖动途中轨道不会动，不需要反复测量 */
let trackRect = null
let pendingClientX = null

function measureTrack() {
  return new Promise((resolve) => {
    const query = uni.createSelectorQuery().in(instance)
    query
      .select('.cd-slider__track')
      .boundingClientRect((rect) => resolve(rect || null))
      .exec()
  })
}

function valueFromClientX(clientX) {
  if (!trackRect || !trackRect.width) return null
  const pct = (clientX - trackRect.left) / trackRect.width
  return quantize(props.min + Math.min(1, Math.max(0, pct)) * span.value)
}

/** 选取要被移动的那个滑块：单滑块永远是 0，双滑块取离目标值更近的 */
function pickIndex(next) {
  if (!props.range || thumbList.value.length < 2) return 0
  const [low, high] = values.value
  return Math.abs(next - low) <= Math.abs(next - high) ? 0 : 1
}

function commit(index, value) {
  if (props.range) {
    const next = [...values.value]
    next[index] = value
    /* 允许交错：拖过对方时交换身份，手感才连续 */
    const sorted = next[0] <= next[1] ? next : [next[1], next[0]]
    emit('update:modelValue', sorted)
    emit('input', sorted)
  } else {
    emit('update:modelValue', value)
    emit('input', value)
  }
}

function handleClientX(clientX, forceIndex) {
  const next = valueFromClientX(clientX)
  if (next === null) return
  const index = forceIndex !== undefined ? forceIndex : pickIndex(next)
  commit(index, next)
}

async function onTouchStart(event) {
  if (isDisabled.value) return
  const touch = event.touches && event.touches[0]
  if (!touch) return
  pendingClientX = touch.clientX
  draggingIndex.value = 0
  trackRect = await measureTrack()
  if (pendingClientX !== null) handleClientX(pendingClientX)
}

function onTouchMove(event) {
  if (isDisabled.value || !trackRect) return
  const touch = event.touches && event.touches[0]
  if (!touch) return
  if (event.preventDefault) event.preventDefault()
  handleClientX(touch.clientX)
}

function onTouchEnd() {
  if (isDisabled.value) return
  pendingClientX = null
  if (draggingIndex.value > -1) {
    draggingIndex.value = -1
    emit('change', props.range ? [...values.value] : values.value[0])
    /* 拖完才算一次有效输入 —— 拖动过程中逐帧汇报会让表单「边拖边报错」 */
    notifyChange(props.range ? [...values.value] : values.value[0])
    notifyBlur()
  }
}

/* -------------------- 桌面鼠标 -------------------- */

function onMouseDown(event) {
  if (isDisabled.value) return
  /* #ifdef H5 */
  if (typeof document === 'undefined') return
  event.preventDefault && event.preventDefault()
  pendingClientX = event.clientX
  draggingIndex.value = 0
  measureTrack().then((rect) => {
    trackRect = rect
    if (pendingClientX !== null) handleClientX(pendingClientX)
  })
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  /* #endif */
}

function onMouseMove(event) {
  /* #ifdef H5 */
  if (!trackRect) return
  handleClientX(event.clientX)
  /* #endif */
}

function onMouseUp() {
  /* #ifdef H5 */
  if (typeof document === 'undefined') return
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  onTouchEnd()
  /* #endif */
}

onUnmounted(() => {
  /* #ifdef H5 */
  if (typeof document === 'undefined') return
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  /* #endif */
})

const rootClass = computed(() =>
  [
    isDisabled.value ? 'cd-slider--disabled' : '',
    props.range ? 'cd-slider--range' : 'cd-slider--single',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)
</script>

<script>
export default {
  name: 'cd-slider',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-slider {
  @include cd-reset;

  display: block;
  width: 100%;
}

/**
 * 可点区域要比轨道本身高得多。
 * 轨道只有 4px，手指按不准；这里给它上下各留出一指的高度，
 * 视觉上的细轨道由内层 .cd-slider__rail 承担。
 */
.cd-slider__track {
  position: relative;
  width: 100%;
  height: var(--cd-slider-hit-height, 32px);
  cursor: pointer;
}

.cd-slider--disabled .cd-slider__track {
  cursor: not-allowed;
}

/**
 * 垂直居中一律用 transform: translateY(-50%)，不用「负的 半高 margin」。
 * 后者要写 calc(var(--x) / -2) —— 小程序对「CSS 变量参与 calc 除法」
 * 的支持并不一致，这是本框架里已经记录在案的坑。
 * 换成 transform 之后，变量只出现在乘法/加法位置，两端行为完全一致。
 */
.cd-slider__rail,
.cd-slider__fill {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: var(--cd-slider-track-height, 4px);
  border-radius: var(--cd-radius-round, 999px);
}

.cd-slider__rail {
  width: 100%;
  background-color: var(--cd-slider-track-color, #f1f5f9);
}

.cd-slider__fill {
  background-color: var(--cd-slider-fill-color, #3b76f6);
}

.cd-slider--disabled .cd-slider__fill {
  background-color: var(--cd-text-disabled, #cbd5e1);
}

/* ==================================================================
 * 滑块
 * ================================================================== */
.cd-slider__thumb {
  position: absolute;
  top: 50%;
  /* left 由内联的百分比给出；translate(-50%,-50%) 把自身中心对到那个点上 */
  transform: translate(-50%, -50%);
  width: var(--cd-slider-thumb-size, 18px);
  height: var(--cd-slider-thumb-size, 18px);
  background-color: var(--cd-slider-thumb-color, #ffffff);
  border: 2px solid var(--cd-slider-fill-color, #3b76f6);
  border-radius: var(--cd-radius-round, 999px);
  box-shadow: var(--cd-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
  box-sizing: border-box;
  transition: box-shadow var(--cd-duration-fast, 150ms) var(--cd-ease-out, ease);
}

/**
 * 拖动中套一圈光晕，而不是把圆点放大。
 * 放大要改 transform，而 transform 已经被 translate(-50%,-50%) 占用；
 * 更麻烦的是缩放的变换矩阵会连带把内部的数值气泡一起放大。
 * 用 box-shadow 做光晕，既不动布局也不影响子元素。
 */
.cd-slider__thumb--dragging {
  box-shadow: 0 0 0 6px var(--cd-color-primary-soft, #eff5ff);
}

@include cd-hover {
  .cd-slider:not(.cd-slider--disabled) .cd-slider__thumb:hover {
    box-shadow: 0 0 0 5px var(--cd-color-primary-soft, #eff5ff);
  }
}

.cd-slider--disabled .cd-slider__thumb {
  border-color: var(--cd-text-disabled, #cbd5e1);
}

/* ==================================================================
 * 数值气泡
 * ================================================================== */
.cd-slider__tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  transform: translateX(-50%);
  padding: 2px 6px;
  background-color: var(--cd-slider-tooltip-bg, rgba(15, 23, 42, 0.86));
  border-radius: var(--cd-radius-sm, 4px);
  white-space: nowrap;
}

.cd-slider__tooltip-text {
  font-size: var(--cd-font-size-xs, 11px);
  line-height: 1.4;
  color: #ffffff;
}
</style>
