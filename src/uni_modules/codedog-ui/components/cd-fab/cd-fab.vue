<template>
  <view
    v-if="visible"
    class="cd-fab"
    :class="rootClass"
    :style="rootStyle"
    @touchstart="onTouchStart"
    @touchmove.stop.prevent="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
    @mousedown="onMouseDown"
    @click="handleClick"
  >
    <slot>
      <view v-if="icon" class="cd-fab__icon">
        <cd-icon :name="icon" :size="iconSize" />
      </view>
      <text v-if="text" class="cd-fab__text">{{ text }}</text>
    </slot>
  </view>
</template>

<script setup>
/**
 * cd-fab —— 悬浮操作按钮
 * ---------------------------------------------------------------
 * 定位用 position:fixed + 边距变量，而不是靠父级布局：
 * 悬浮按钮的语义就是「脱离文档流，一直能点到」，
 * 一旦参与父级布局，滚动时就留不住它。
 *
 * 拖拽是为了解决一个真实的移动端痛点：悬浮按钮固定的那个角落
 * 恰好压住了页面上的关键内容（尤其是列表最后一行），
 * 用户此时除了把内容再滚一点之外毫无办法。允许拖走它，
 * 比让业务去换角落实用得多。
 *
 * 拖拽实现要点：
 *   1. 位移是「相对按下时的那一点」的累加，不是鼠标绝对坐标 ——
 *      后者在页面滚动或容器定位变化时会突然跳一下；
 *   2. 拖动超过阈值后要吞掉随后的 click：
 *      手指一抖就会同时触发拖拽与点击，用户只是想挪开它却触发了操作；
 *   3. 鼠标拖拽复用同一套逻辑（H5 上 mousedown → document 的 move/up），
 *      与 cd-slider 采用同一套指针约定。
 */
import { computed, onUnmounted, ref } from 'vue'
import { useDevice } from '../../composables/use-device'

defineOptions({
  name: 'cd-fab',
})

const props = defineProps({
  /** 图标名 */
  icon: {
    type: String,
    default: 'plus',
  },
  /** 图标尺寸 */
  iconSize: {
    type: [String, Number],
    default: '1.4em',
  },
  /** 图标旁的文字 */
  text: {
    type: String,
    default: '',
  },
  /** right-bottom / right-center / left-bottom / left-center */
  position: {
    type: String,
    default: 'right-bottom',
  },
  /** normal / large */
  size: {
    type: String,
    default: 'normal',
  },
  /** 自定义背景色（覆盖主色） */
  color: {
    type: String,
    default: '',
  },
  /** 距底部距离（px）；PC 上会自动加一档，避免和浏览器边缘贴太近 */
  offsetBottom: {
    type: [String, Number],
    default: '',
  },
  offsetRight: {
    type: [String, Number],
    default: '',
  },
  /** 可拖拽 */
  draggable: {
    type: Boolean,
    default: false,
  },
  visible: {
    type: Boolean,
    default: true,
  },
  zIndex: {
    type: Number,
    default: 1100,
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

const emit = defineEmits(['click', 'drag-start', 'drag-end'])

const { isPC } = useDevice()

/** 拖拽产生的额外位移 */
const dragX = ref(0)
const dragY = ref(0)

/* 下面两样东西都必须在卸载时清掉：拖拽过程中组件被卸载（比如所在页面被切走）时，
   document 上的 mousemove / mouseup 会永久残留 —— 每拖一次就多一对，
   而且回调里还握着已销毁实例的引用。 */

/** endDrag 里那个「下一轮复位 moved」的 setTimeout id */
let resetMovedTimer = null
/** document 上的鼠标监听是否已挂上（卸载时据此摘除） */
let mouseBound = false

/** 拖动是否已经超过阈值（用于吞掉随后的 click） */
let moved = false
let startPoint = null
let startOffset = { x: 0, y: 0 }

/** 触发 drag-start 的阈值：小于它算「手抖」，还按点击处理 */
const DRAG_THRESHOLD = 4

const rootClass = computed(() =>
  [
    `cd-fab--${props.size}`,
    props.position.indexOf('left') === 0 ? 'cd-fab--left' : 'cd-fab--right',
    props.position.indexOf('center') > -1 ? 'cd-fab--center' : 'cd-fab--bottom',
    props.draggable ? 'cd-fab--draggable' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

function toPx(value, fallback) {
  if (value === '' || value === null || value === undefined) return fallback
  return typeof value === 'number' ? `${value}px` : String(value)
}

const rootStyle = computed(() => {
  const parts = [
    `--cd-fab-z:${props.zIndex};`,
    `transform:translate3d(${dragX.value}px, ${dragY.value}px, 0);`,
  ]

  /* PC 上默认留更宽的边距：鼠标指针比手指精确，贴太近容易点到别的东西 */
  const defaultBottom = isPC.value ? 'var(--cd-space-8, 32px)' : 'var(--cd-space-6, 24px)'
  const defaultRight = isPC.value ? 'var(--cd-space-8, 32px)' : 'var(--cd-space-4, 16px)'

  parts.push(`bottom:${toPx(props.offsetBottom, defaultBottom)};`)
  parts.push(props.position.indexOf('left') === 0
    ? `left:${toPx(props.offsetRight, defaultRight)};`
    : `right:${toPx(props.offsetRight, defaultRight)};`)

  if (props.color) parts.push(`background-color:${props.color};`)
  if (props.customStyle) parts.push(props.customStyle)
  return parts.join('')
})

/* ----------------------------------------------------------------
 * 拖拽
 * ---------------------------------------------------------------- */

function pointFromEvent(event) {
  const touch = event.touches && event.touches[0]
  if (touch) return { x: touch.clientX, y: touch.clientY }
  if (event.clientX !== undefined) return { x: event.clientX, y: event.clientY }
  return null
}

function beginDrag(event) {
  if (!props.draggable) return
  const point = pointFromEvent(event)
  if (!point) return
  startPoint = point
  startOffset = { x: dragX.value, y: dragY.value }
  moved = false
}

function moveDrag(event) {
  if (!props.draggable || !startPoint) return
  const point = pointFromEvent(event)
  if (!point) return

  const dx = point.x - startPoint.x
  const dy = point.y - startPoint.y

  if (!moved && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
    moved = true
    emit('drag-start')
  }
  if (!moved) return

  dragX.value = startOffset.x + dx
  dragY.value = startOffset.y + dy
}

function endDrag() {
  if (!props.draggable || !startPoint) return
  startPoint = null
  if (moved) emit('drag-end', { x: dragX.value, y: dragY.value })
  /* 复位标记放到下一个事件循环：click 是在 touchend 之后同步派发的，
     立刻复位会让「吞掉 click」失效。
     id 记下来是为了在卸载时清掉 —— 否则它会在组件销毁后摸一个已经没意义的状态 */
  clearResetTimer()
  resetMovedTimer = setTimeout(() => {
    resetMovedTimer = null
    moved = false
  }, 0)
}

function clearResetTimer() {
  if (resetMovedTimer === null) return
  clearTimeout(resetMovedTimer)
  resetMovedTimer = null
}

/* -------------------- 卸载兜底 -------------------- */

onUnmounted(() => {
  clearResetTimer()
  detachMouse()
})

function onTouchStart(event) {
  beginDrag(event)
}

function onTouchMove(event) {
  moveDrag(event)
}

function onTouchEnd() {
  endDrag()
}

/* -------------------- 桌面鼠标（H5） -------------------- */

function onMouseDown(event) {
  /* #ifdef H5 */
  if (!props.draggable || typeof document === 'undefined') return
  beginDrag(event)
  /* 重复绑定同一对监听是无效的（同名同函数浏览器会去重），
     但 mouseBound 让「有没有挂过」这件事可读，卸载时才能确定地摘掉 */
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  mouseBound = true
  /* #endif */
}

function onMouseMove(event) {
  /* #ifdef H5 */
  moveDrag(event)
  /* #endif */
}

function onMouseUp() {
  /* #ifdef H5 */
  detachMouse()
  endDrag()
  /* #endif */
}

/** 摘掉 document 上的鼠标监听。onMouseUp 与 onUnmounted 共用，保证不漏 */
function detachMouse() {
  /* #ifdef H5 */
  if (!mouseBound || typeof document === 'undefined') return
  mouseBound = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  /* #endif */
}

function handleClick(event) {
  /* 拖过就别再当成点击了 */
  if (moved) return
  emit('click', event)
}

defineExpose({ reset: () => {
  dragX.value = 0
  dragY.value = 0
} })
</script>

<script>
export default {
  name: 'cd-fab',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-fab {
  @include cd-reset;

  position: fixed;
  z-index: var(--cd-fab-z, 1100);
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--cd-fab-size, 48px);
  min-width: var(--cd-fab-size, 48px);
  padding: 0 var(--cd-space-3, 12px);
  background-color: var(--cd-color-primary, #3b76f6);
  color: #ffffff;
  border-radius: var(--cd-radius-round, 999px);
  box-shadow: var(--cd-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.1));
  cursor: pointer;
  /* 位移走 transform 而不是 left/top：
     后者每帧都要重排，前者只走合成，拖动才跟得上手 */
  transition: box-shadow var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-fab--large {
  --cd-fab-size: 56px;
}

.cd-fab--draggable {
  /* 拖拽时禁掉过渡，否则手指停下后按钮还会「飘」一小段 */
  transition: none;
}

.cd-fab:active {
  box-shadow: var(--cd-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.16));
}

@include cd-hover {
  .cd-fab:hover {
    background-color: var(--cd-color-primary-hover, #2560eb);
  }
}

.cd-fab__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cd-fab__text {
  margin-left: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-medium, 500);
  line-height: 1;
  white-space: nowrap;
}
</style>
