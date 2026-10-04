<template>
  <view v-if="modelValue" class="cd-image-preview" :class="rootClass" :style="rootStyle">
    <!-- ============ 遮罩：纯视觉层，只负责吸掉背景滚动 ============ -->
    <view class="cd-image-preview__mask" @touchmove.stop.prevent />

    <!-- ============ 舞台：所有手势都挂在这一层，铺满全屏 ============ -->
    <view
      class="cd-image-preview__stage"
      @click="handleStageClick"
      @touchstart="handleTouchStart"
      @touchmove.stop.prevent="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
      @mousedown.stop.prevent="handleTouchStart"
      @mousemove.stop.prevent="handleTouchMove"
      @mouseup.stop="handleTouchEnd"
      @mouseleave.stop="handleTouchEnd"
    >
      <view class="cd-image-preview__track" :style="trackStyle">
        <view v-for="item in slots" :key="item.key" class="cd-image-preview__slide" :style="item.slotStyle">
          <view class="cd-image-preview__frame">
            <image
              v-if="item.url && item.status !== 'error'"
              class="cd-image-preview__image"
              :src="item.url"
              mode="aspectFit"
              :style="zoomStyle"
              @load="handleImageLoad(item.index)"
              @error="handleImageError(item.index)"
            />
          </view>

          <view v-if="item.status === 'loading'" class="cd-image-preview__status">
            <cd-icon name="loader" :size="28" spin />
          </view>
          <view v-else-if="item.status === 'error'" class="cd-image-preview__status">
            <cd-icon name="image" :size="32" />
            <text class="cd-image-preview__status-text">加载失败</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ============ 计数：只有一张时不显示，「1 / 1」是噪音 ============ -->
    <text v-if="showIndex && total > 1" class="cd-image-preview__index">{{ activeIndex + 1 }} / {{ total }}</text>

    <!-- ============ 翻页按钮：非循环到边界时隐藏对应那一侧 ============ -->
    <view
      v-if="total > 1 && (loop || activeIndex > 0)"
      class="cd-image-preview__btn cd-image-preview__btn--prev"
      :hover-class="hoverClass"
      :hover-start-time="0"
      :hover-stay-time="80"
      @click.stop="go(-1)"
    >
      <cd-icon name="chevron-left" :size="20" />
    </view>

    <view
      v-if="total > 1 && (loop || activeIndex < total - 1)"
      class="cd-image-preview__btn cd-image-preview__btn--next"
      :hover-class="hoverClass"
      :hover-start-time="0"
      :hover-stay-time="80"
      @click.stop="go(1)"
    >
      <cd-icon name="chevron-right" :size="20" />
    </view>

    <view
      class="cd-image-preview__btn cd-image-preview__btn--close"
      :hover-class="hoverClass"
      :hover-start-time="0"
      :hover-stay-time="80"
      @click.stop="requestClose"
    >
      <cd-icon name="close" :size="18" />
    </view>
  </view>
</template>

<script>
/**
 * 模块级滚动锁（计数式）—— 单独放在普通 <script> 里，
 * 因为 <script setup> 的顶层是 setup() 内部，写在那里会变成「每个实例一份」，
 * 计数就失去了意义（计数锁的全部价值就在「跨实例共享」）。
 *
 * 为什么不能是「保存旧值 → 写 hidden → 恢复旧值」：
 *   预览打开 → 保存 ''、写 hidden；
 *   预览里又开了弹窗 → 弹窗也写 hidden；
 *   关掉预览 → 恢复旧值 ''，滚动被解开了，可弹窗还开着。
 * 计数锁只在**最后一个使用者退出**时才解除，嵌套场景因此不会互相踩。
 * 这也是 wot-design-uni 的 useLockScroll 采用的形态。
 *
 * 两个函数做成具名导出，cd-toast-host 的 loading 遮罩直接复用同一份计数，
 * 于是「预览 + loading」这类跨组件嵌套同样安全。
 */
let scrollLockCount = 0
let savedBodyOverflow = ''

export function lockScroll() {
  /* #ifdef H5 */
  if (typeof document === 'undefined' || !document.body) return
  scrollLockCount += 1
  if (scrollLockCount > 1) return
  savedBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  /* #endif */
}

export function unlockScroll() {
  /* #ifdef H5 */
  if (typeof document === 'undefined' || !document.body) return
  if (!scrollLockCount) return
  scrollLockCount -= 1
  if (scrollLockCount > 0) return
  document.body.style.overflow = savedBodyOverflow
  savedBodyOverflow = ''
  /* #endif */
}
</script>

<script setup>
/**
 * cd-image-preview —— 图片预览（图集点开看大图）
 * ---------------------------------------------------------------
 * 一句话定位：uni.previewImage 的「可定制版」。
 * 原生 API 在小程序端体验很好，但 H5 端是浏览器弹窗、
 * 且两端都无法改样式 / 无法拿到翻页回调 / 无法嵌进业务自己的浮层栈。
 * 所以这里自绘一份：全屏遮罩 + 横向翻页 + 双指缩放。
 *
 * 【关键实现决策】
 *
 * 1. 遮罩与内容全部自持，不用 wd-popup / teleport。
 *    预览层的定位是 `position: fixed` 铺满视口，传送与否没有区别；
 *    而一旦传送出去，就得再解决主题作用域、层级、卸载时序三件事。
 *    自持的代价只有一个：z-index 得调用方自己管（zIndex prop）。
 *
 * 2. 翻页用「无界槽位坐标 slotPos」而不是「索引 + 归零」。
 *    朴素做法是三张幻灯片固定在 -100% / 0 / 100%，翻页后把轨道
 *    transform 从 -100% 瞬间归零 —— 这一步必须关掉过渡再打开，
 *    在小程序端拿不到可靠的「强制重排」手段，极易闪一下。
 *    改成：slotPos 是一个可以无限增减的整数，第 p 槽永远
 *    `left: p * 100%`，轨道只做 `translateX(-p * 屏宽)`。
 *    于是每次翻页的位移都恰好是一屏，天然可动画，且不需要任何归零。
 *    循环模式下 index = mod(slotPos, n)，边界自洽。
 *    v-for 的 key 取槽位 p 而不是图片下标 —— 这样翻页时已有节点
 *    的 left 与 src 都不变，Vue 只移动/增删边缘节点，图片不会重新加载。
 *
 * 3. 缩放只改 transform，不改布局。
 *    缩放层是图片本身（translate + scale），与翻页的轨道位移分处两层，
 *    互不干扰。双指缩放以舞台中心为原点（不做焦点跟随，少一层矩阵换算也更稳）；
 *    双击则做了焦点补偿：把点击点按 (1 - s) 的比例反推平移量，
 *    让手指下的那个位置缩放后仍在手指下。
 *
 * 4. 点击关闭走「touch 抑制窗口」而不是给图片加 @click.stop。
 *    移动端 touchend 之后浏览器会补发一次 click，双击缩放会顺带触发两次
 *    click 从而把预览关掉。所以手势真的发生位移（或双指、或双击）时，
 *    记一个 400ms 的抑制窗口，让补发的 click 被吞掉；
 *    纯点击（没位移）不抑制 —— 小程序端 tap 与 touchend 紧挨着，
 *    一律抑制会导致「点空白关不掉」。
 *
 * 5. 小程序端没有 window，document 也不存在。
 *    所有 H5 专属能力（键盘、body 滚动锁、resize）都先判空再访问，
 *    小程序端自然退化成「只能靠触摸与关闭按钮」。
 *
 * 【已知限制】
 *   - 缩放以舞台中心为原点，双指捏合时手指下的点会略微漂移（双击不漂移）。
 *     这是刻意省掉焦点矩阵换来的稳定性，图片预览场景感知不明显。
 *   - 小程序端无法阻止系统级手势（下拉刷新、右滑返回），
 *     只能在组件内挡住普通滚动穿透；这类手势由页面配置处理。
 *   - 小程序端 touch 事件带完整 touches 数组，双指缩放可用；
 *     但没有 gesture 事件，惯性滑动也不做（预览惯性没有正向收益）。
 *   - 命令式调用（previewImage）在小程序端降级为 uni.previewImage，
 *     因为小程序没有 body 可挂宿主组件 —— 详见 service/index.js。
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getSystemInfo, isH5 } from '../../composables/use-platform'
import { useEscLayer } from '../../composables/use-esc-stack'
import CdIcon from '../cd-icon/cd-icon.vue'

defineOptions({
  name: 'cd-image-preview',
  options: {
    addGlobalClass: true,
  },
})

const props = defineProps({
  /** 是否显示预览层（v-model） */
  modelValue: {
    type: Boolean,
    default: false,
  },
  /** 图片地址数组，元素可以是字符串，也可以是带 url 字段的对象 */
  urls: {
    type: Array,
    default: () => [],
  },
  /** 初始显示第几张：传索引，或传图片地址（自动匹配下标，匹配不到取第一张） */
  current: {
    type: [String, Number],
    default: 0,
  },
  /** 是否循环翻页：关闭后到首/尾不再绕回，且拖拽带阻尼 */
  loop: {
    type: Boolean,
    default: true,
  },
  /** 是否显示「3 / 8」计数；只有一张图时不显示 */
  showIndex: {
    type: Boolean,
    default: true,
  },
  /** 点击遮罩（图片之外的区域）是否关闭 */
  closeOnClickMask: {
    type: Boolean,
    default: true,
  },
  /** 是否允许缩放（双指捏合 / 双击） */
  zoomable: {
    type: Boolean,
    default: true,
  },
  /** 最大缩放倍数，最小按 1 处理 */
  maxZoom: {
    type: Number,
    default: 3,
  },
  /** 预览层的 z-index */
  zIndex: {
    type: Number,
    default: 3000,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'close'])

/* ==================== 常量 ==================== */

/** 翻页动画时长，与 CSS 里手写的过渡时长保持一致 */
const PAGE_ANIM = 260
/** 翻页阈值：屏宽的比例，同时给一个 px 下限避免大屏上过于灵敏 */
const SWIPE_RATIO = 0.18
const SWIPE_MIN = 40
/** 双击判定时长 */
const DOUBLE_TAP = 300
/** 手势结束后吞掉补发 click 的窗口，比双击判定略长 */
const CLICK_SUPPRESS = 400
/** 位移超过它就认为用户在滑而不是在点 */
const TAP_SLOP = 8
/** 滚轮每格缩放倍率（桌面端没有 pinch，滚轮是唯一能连续调倍率的入口） */
const WHEEL_STEP = 1.12

/* ==================== 图片列表与加载状态 ==================== */

/** 归一化：字符串原样，对象取 url；刻意保留空位，保证下标与业务传入对齐 */
const list = computed(() =>
  (props.urls || []).map((item) => (typeof item === 'string' ? item : String((item && item.url) || '')))
)

const total = computed(() => list.value.length)

/**
 * 每张图的加载状态：loading / loaded / error。
 * 刻意用「普通数组 + version ref」而不是 ref([])：
 * 这个数组按下标写入，ref([]) 会让 Vue 对数组做深层代理与按引用比对，
 * 每次写一项都要走一遍代理开销；而这里只需要一个「变了」的信号，
 * 所以配一个自增的 version 即可，slots 计算时读一次它建立依赖。
 */
let statusList = []
const statusVersion = ref(0)

function resetStatus() {
  /* 空地址直接判失败：否则 <image> 不渲染、load/error 都不触发，会永远转圈 */
  statusList = list.value.map((url) => (url ? 'loading' : 'error'))
  statusVersion.value += 1
}

function setStatus(index, status) {
  if (statusList[index] === status) return
  statusList[index] = status
  statusVersion.value += 1
}

/** 状态快照：version 自增即产出新引用，slots 读它就能建立依赖 */
const statusSnapshot = computed(() => ({
  version: statusVersion.value,
  list: statusList,
}))

resetStatus()

/* ==================== 槽位与下标 ==================== */

/** 无界槽位坐标：可正可负，翻页时 ±1，永不归零 */
const slotPos = ref(0)
const dragX = ref(0)
const animating = ref(false)

/** 舞台尺寸（px）：预览层是 fixed 铺满视口，所以直接取视口尺寸 */
const stageWidth = ref(0)
const stageHeight = ref(0)

function toIndex(pos) {
  const n = total.value
  if (!n) return 0
  if (props.loop) return ((pos % n) + n) % n
  return Math.min(n - 1, Math.max(0, pos))
}

const activeIndex = computed(() => toIndex(slotPos.value))

/** 只渲染当前与左右各一张：三张足够覆盖一次翻页，图集再大也不再多建节点 */
const slots = computed(() => {
  const n = total.value
  if (!n) return []
  const base = slotPos.value
  const positions = []
  for (let p = base - 1; p <= base + 1; p += 1) {
    if (n < 2 && p !== base) continue
    if (!props.loop && (p < 0 || p > n - 1)) continue
    positions.push(p)
  }
  const snapshot = statusSnapshot.value
  return positions.map((p) => {
    const index = toIndex(p)
    return {
      key: `p${p}`,
      index,
      url: list.value[index] || '',
      status: snapshot.list[index] || 'loading',
      slotStyle: `left:${p * 100}%;`,
    }
  })
})

/* ==================== 缩放与平移 ==================== */

const scale = ref(1)
const panX = ref(0)
const panY = ref(0)
/** 手势进行中：关掉缩放层的过渡，否则手指会被动画「拖后腿」 */
const interactive = ref(false)

/* 手势现场：只在一次手势内使用，不需要响应式 */
let mode = 'none'
let startX = 0
let startY = 0
let startPanX = 0
let startPanY = 0
let startDist = 0
let startScale = 1
let lastTapAt = 0
let moved = false
let suppressClickUntil = 0
let animTimer = null
/** 滚轮缩放没有 mouseup 可收尾，靠这个空闲计时把过渡交还 CSS */
let wheelTimer = null

function clamp(value, min, max) {
  if (value < min) return min
  if (value > max) return max
  return value
}

function maxZoomValue() {
  return props.maxZoom > 1 ? props.maxZoom : 1
}

/** 平移量上限：放大后最多只能移到露出边缘为止 */
function setPan(x, y) {
  const maxX = ((scale.value - 1) * (stageWidth.value || 0)) / 2
  const maxY = ((scale.value - 1) * (stageHeight.value || 0)) / 2
  panX.value = clamp(x, -maxX, maxX)
  panY.value = clamp(y, -maxY, maxY)
}

function applyZoom(next) {
  let v = Number.isFinite(next) ? next : 1
  v = clamp(v, 1, maxZoomValue())
  scale.value = v
  if (v <= 1) {
    panX.value = 0
    panY.value = 0
    return
  }
  setPan(panX.value, panY.value)
}

function resetZoom() {
  scale.value = 1
  panX.value = 0
  panY.value = 0
  interactive.value = false
}

/** 双击：1x 与 2x 之间切换（2x 超过 maxZoom 时取 maxZoom） */
function toggleZoom(touch) {
  const max = maxZoomValue()
  const target = scale.value > 1.01 ? 1 : Math.min(2, max)
  if (target === 1) {
    applyZoom(1)
    return
  }
  const w = stageWidth.value || 0
  const h = stageHeight.value || 0
  const tx = pointX(touch)
  const ty = pointY(touch)
  scale.value = target
  /* 焦点补偿：让手指下的点在放大后仍停在手指下 */
  setPan((tx - w / 2) * (1 - target), (ty - h / 2) * (1 - target))
}

function pointX(touch) {
  const v = touch.clientX ?? touch.pageX ?? touch.x
  return Number.isFinite(v) ? v : 0
}

function pointY(touch) {
  const v = touch.clientY ?? touch.pageY ?? touch.y
  return Number.isFinite(v) ? v : 0
}

function distance(a, b) {
  const dx = pointX(a) - pointX(b)
  const dy = pointY(a) - pointY(b)
  return Math.sqrt(dx * dx + dy * dy)
}

/* ==================== 手势 ==================== */

/**
 * 取这套手势的「触点列表」。
 *
 * 为什么必须做这一步归一化：桌面浏览器**没有 touch 事件**，
 * 鼠标事件里 `event.touches` 永远是 undefined。只绑 touch 的话，
 * 桌面用户会发现图片既拖不动、也缩放不了、只能点空白关闭 ——
 * 这是「DOM 全对、功能全无」的典型病。归一化之后，
 * 触摸端 gotouches 原样使用，鼠标端把**事件自身**当成一个单指触点
 * （clientX/clientY 字段名与触点一致），两套手势共用同一份逻辑。
 */
function pointsOf(event) {
  const touches = (event && event.touches) || []
  if (touches.length) return touches
  /* 鼠标事件自身就是一个「触点」，客户端坐标字段名与 Touch 一致 */
  const e = event || {}
  return Number.isFinite(e.clientX) && Number.isFinite(e.clientY) ? [e] : []
}

function handleTouchStart(event) {
  const touches = pointsOf(event)
  if (touches.length >= 2) {
    if (!props.zoomable) return
    mode = 'pinch'
    interactive.value = true
    startDist = distance(touches[0], touches[1])
    startScale = scale.value
    return
  }
  const touch = touches[0]
  if (!touch) return

  startX = pointX(touch)
  startY = pointY(touch)
  startPanX = panX.value
  startPanY = panY.value
  moved = false

  const now = Date.now()
  if (props.zoomable && now - lastTapAt < DOUBLE_TAP) {
    lastTapAt = 0
    mode = 'none'
    /* 双击后会补发两次 click，必须吞掉，否则预览会被关掉 */
    suppressClickUntil = now + CLICK_SUPPRESS
    dragX.value = 0
    toggleZoom(touch)
    return
  }
  lastTapAt = now
  mode = scale.value > 1 ? 'pan' : 'swipe'
}

function handleTouchMove(event) {
  const touches = pointsOf(event)

  if (mode === 'pinch') {
    if (touches.length < 2 || !startDist) return
    applyZoom(startScale * (distance(touches[0], touches[1]) / startDist))
    return
  }

  const touch = touches[0]
  if (!touch || (mode !== 'swipe' && mode !== 'pan')) return

  const dx = pointX(touch) - startX
  const dy = pointY(touch) - startY
  if (!moved && (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP)) moved = true

  if (mode === 'pan') {
    interactive.value = true
    setPan(startPanX + dx, startPanY + dy)
    return
  }

  /* 非循环模式到边界时给 0.3 的阻尼，让「到头了」这件事能被手指感觉到 */
  const atStart = !props.loop && slotPos.value <= 0
  const atEnd = !props.loop && slotPos.value >= total.value - 1
  if ((dx > 0 && atStart) || (dx < 0 && atEnd)) {
    dragX.value = dx * 0.3
    return
  }
  dragX.value = dx
}

function handleTouchEnd() {
  if (mode === 'swipe') {
    const threshold = Math.max(SWIPE_MIN, (stageWidth.value || 0) * SWIPE_RATIO)
    const dx = dragX.value
    if (dx <= -threshold) go(1)
    else if (dx >= threshold) go(-1)
    else if (dx !== 0) snapBack()
    dragX.value = 0
  }

  /* 真的滑动过就吞掉补发的 click，避免「滑一下顺手把预览关了」 */
  if (moved || mode === 'pinch') suppressClickUntil = Date.now() + CLICK_SUPPRESS

  if (mode === 'pinch' && scale.value <= 1.01) resetZoom()
  interactive.value = false
  mode = 'none'
}

function handleStageClick() {
  if (Date.now() < suppressClickUntil) return
  if (!props.closeOnClickMask) return
  /* 放大状态下点击多半是想看细节，不当成关闭意图 */
  if (scale.value > 1.01) return
  requestClose()
}

/**
 * 滚轮缩放（桌面专用）。
 *
 * 触屏 pinch 是「两指捏」，鼠标没有第二指，桌面用户如果不给滚轮，
 * 就只剩双击那一档 2x，根本没法连续看细节。这里按惯例：
 * 向上滚放大、向下滚缩小，并把**光标位置**当成缩放焦点，
 * 让光标下的那一小片区域始终停在原处。
 */
function handleWheel(event) {
  if (!props.zoomable) return
  const delta = event && event.deltaY
  if (!Number.isFinite(delta) || delta === 0) return

  const max = maxZoomValue()
  const target = clamp(
    scale.value * (delta < 0 ? WHEEL_STEP : 1 / WHEEL_STEP),
    1,
    max,
  )
  if (Math.abs(target - scale.value) < 0.001) return

  interactive.value = true
  const tx = pointX(event)
  const ty = pointY(event)
  const w = stageWidth.value || 0
  const h = stageHeight.value || 0
  applyZoom(target)
  /* 与双击同一套焦点补偿，保证「看哪儿就放大哪儿」 */
  if (target > 1) setPan((tx - w / 2) * (1 - target), (ty - h / 2) * (1 - target))

  /* 缩到 1 倍后一次单击不该被当成「关闭」误吞之外的误判，这里只做保护 */
  suppressClickUntil = Date.now() + CLICK_SUPPRESS

  if (wheelTimer) clearTimeout(wheelTimer)
  wheelTimer = setTimeout(() => {
    interactive.value = false
    wheelTimer = null
  }, 240)
}

/* ==================== 翻页 ==================== */

function scheduleAnimEnd() {
  if (animTimer) clearTimeout(animTimer)
  animTimer = setTimeout(() => {
    animating.value = false
    animTimer = null
  }, PAGE_ANIM)
}

/** 放手后没过阈值：回弹到原位 */
function snapBack() {
  dragX.value = 0
  animating.value = true
  scheduleAnimEnd()
}

function go(delta) {
  const n = total.value
  if (n < 2) return
  const target = slotPos.value + delta
  if (!props.loop && (target < 0 || target > n - 1)) {
    snapBack()
    return
  }
  dragX.value = 0
  animating.value = true
  slotPos.value = target
  resetZoom()
  scheduleAnimEnd()
  emitChange()
}

function emitChange() {
  const index = activeIndex.value
  emit('change', index, list.value[index] || '')
}

/* ==================== 显隐 ==================== */

/**
 * 按压态双写：H5 交给 CSS 的 :hover / :active，关掉 uni-app 的 hover-class
 * （它在 H5 上由鼠标事件模拟，会和 :hover 叠加出脏效果）；
 * 小程序端 :active 不可靠，走 hover-class。与 cd-button 同一套处理。
 */
const hoverClass = isH5 ? 'none' : 'cd-image-preview__btn--active'

const rootClass = computed(() => [props.customClass].filter(Boolean).join(' '))

const rootStyle = computed(() => `z-index:${props.zIndex};`)

const trackStyle = computed(() => {
  const x = -slotPos.value * stageWidth.value + dragX.value
  const transition = animating.value
    ? `transition:transform ${PAGE_ANIM}ms cubic-bezier(0.4, 0, 0.2, 1);`
    : 'transition:none;'
  return `${transition}transform:translateX(${x}px);`
})

const zoomStyle = computed(() => {
  const transition = interactive.value
    ? 'transition:none;'
    : 'transition:transform 220ms cubic-bezier(0.4, 0, 0.2, 1);'
  return `${transition}transform:translate(${panX.value}px, ${panY.value}px) scale(${scale.value});`
})

/** 把 current（索引或地址）解析成 0..n-1 的下标 */
function resolveIndex(input) {
  const n = total.value
  if (!n) return 0
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return 0
    return clamp(Math.trunc(input), 0, n - 1)
  }
  const text = String(input || '')
  if (!text) return 0
  /* 纯数字字符串按索引处理，否则按地址匹配（避免与数字型 url 混淆） */
  const asNum = Number(text)
  if (text === String(asNum) && Number.isFinite(asNum)) return clamp(Math.trunc(asNum), 0, n - 1)
  const hit = list.value.indexOf(text)
  return hit >= 0 ? hit : 0
}

function measureStage() {
  /* #ifdef H5 */
  if (typeof window !== 'undefined' && window.innerWidth) {
    stageWidth.value = window.innerWidth
    stageHeight.value = window.innerHeight || 0
    return
  }
  /* #endif */
  const info = getSystemInfo() || {}
  stageWidth.value = info.windowWidth || 375
  stageHeight.value = info.windowHeight || 0
}

/* -------------------- 滚动锁（仅 H5） -------------------- */

/* 计数式实现见上方普通 <script> 里的 lockScroll / unlockScroll。
   这里刻意不再保存 / 恢复旧值 —— 嵌套浮层会互相踩掉对方的锁。 */

/* -------------------- 键盘（仅 H5） -------------------- */

/**
 * Esc 走共享层级栈判定：预览常常开在弹窗之上，
 * 自己监听 document 的话一次 Esc 会把预览和它下面的弹窗一起关掉。
 * 只有方向键翻页仍然由本组件自己的监听处理，所以这里只借用栈做
 * 「我是不是最上面那一层」的判定 —— 与 cd-dropdown 同一套写法。
 */
const esc = useEscLayer(() => {})

function onKeydown(event) {
  if (!event) return
  const key = event.key
  const code = event.keyCode
  if (key === 'Escape' || code === 27) {
    if (!esc.isTop()) return
    requestClose()
    return
  }
  if (key === 'ArrowLeft' || code === 37) {
    if (typeof event.preventDefault === 'function') event.preventDefault()
    go(-1)
    return
  }
  if (key === 'ArrowRight' || code === 39) {
    if (typeof event.preventDefault === 'function') event.preventDefault()
    go(1)
  }
}

let keyBound = false

function bindKeys() {
  /* #ifdef H5 */
  if (keyBound || typeof document === 'undefined') return
  keyBound = true
  esc.push()
  document.addEventListener('keydown', onKeydown)
  /* #endif */
}

function unbindKeys() {
  /* #ifdef H5 */
  if (!keyBound || typeof document === 'undefined') return
  keyBound = false
  esc.remove()
  document.removeEventListener('keydown', onKeydown)
  /* #endif */
}

/* -------------------- 视口变化（仅 H5） -------------------- */

let resizeBound = false

/** window 级滚轮入口：没打开预览就当没发生；开了就交给 handleWheel 并吃掉默认滚动 */
function onWheelDoc(event) {
  if (!props.modelValue) return
  handleWheel(event)
  if (typeof event.preventDefault === 'function') event.preventDefault()
}

function bindResize() {
  /* #ifdef H5 */
  if (resizeBound || typeof window === 'undefined') return
  resizeBound = true
  window.addEventListener('resize', measureStage)
  /*
   * 滚轮必须用原生监听：uni-view 只透传它认识的事件，
   * 模板上的 @wheel 编译进去也收不到（实测 minified 产物里 handler 在、
   * 但事件从不上来），桌面端看起来就是「滚轮完全没反应」。
   * passive:false 才能 preventDefault 挡住背景滚动。
   */
  window.addEventListener('wheel', onWheelDoc, { passive: false })
  /* #endif */
}

function unbindResize() {
  /* #ifdef H5 */
  if (!resizeBound || typeof window === 'undefined') return
  resizeBound = false
  window.removeEventListener('resize', measureStage)
  window.removeEventListener('wheel', onWheelDoc)
  /* #endif */
}

function open() {
  slotPos.value = resolveIndex(props.current)
  dragX.value = 0
  animating.value = false
  resetZoom()
  measureStage()
  lockScroll()
  bindKeys()
  bindResize()
}

function close() {
  if (animTimer) {
    clearTimeout(animTimer)
    animTimer = null
  }
  if (wheelTimer) {
    clearTimeout(wheelTimer)
    wheelTimer = null
  }
  animating.value = false
  dragX.value = 0
  resetZoom()
  unlockScroll()
  unbindKeys()
  unbindResize()
}

function requestClose() {
  emit('update:modelValue', false)
  emit('close')
}

function handleImageLoad(index) {
  setStatus(index, 'loaded')
}

function handleImageError(index) {
  setStatus(index, 'error')
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) open()
    else close()
  }
)

/* urls 换了引用就重扫状态；同时把越界的槽位拉回范围 */
watch(
  () => props.urls,
  () => {
    resetStatus()
    const n = total.value
    if (n && slotPos.value > n - 1) slotPos.value = n - 1
    if (slotPos.value < 0) slotPos.value = 0
  }
)

/* 外部改 current 时跟随（翻页回写 current 时值相同，会被这里挡掉） */
watch(
  () => props.current,
  (value) => {
    if (!props.modelValue) return
    const next = resolveIndex(value)
    if (next === activeIndex.value) return
    dragX.value = 0
    animating.value = true
    slotPos.value = next
    resetZoom()
    scheduleAnimEnd()
  }
)

watch(
  () => props.zoomable,
  (value) => {
    if (!value) resetZoom()
  }
)

onMounted(() => {
  if (props.modelValue) open()
})

onUnmounted(() => {
  if (wheelTimer) {
    clearTimeout(wheelTimer)
    wheelTimer = null
  }
  unbindKeys()
  unbindResize()
  unlockScroll()
  if (animTimer) {
    clearTimeout(animTimer)
    animTimer = null
  }
})

defineExpose({ go, resetZoom })
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

/* ==================================================================
 * 根容器：fixed 铺满视口，层级由内联 z-index 提供（跨浮层要调用方裁决）
 * ================================================================== */
.cd-image-preview {
  @include cd-reset;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  animation: cd-preview-fade 200ms var(--cd-ease-out, ease);
}

.cd-image-preview__mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: var(--cd-preview-mask, rgba(0, 0, 0, 0.92));
}

/* ==================================================================
 * 舞台与轨道
 * 舞台承担「点击空白关闭」的语义（它在最上层且铺满），
 * 真正的黑色遮罩只是它下面的视觉层。
 * ================================================================== */
.cd-image-preview__stage {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.cd-image-preview__track {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  will-change: transform;
}

.cd-image-preview__slide {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cd-image-preview__frame {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cd-image-preview__image {
  display: block;
  width: 100%;
  height: 100%;
  /* 缩放以舞台中心为原点：翻页是轨道位移、缩放是这一层的变换，两者互不干扰 */
  transform-origin: center center;
}

/* ==================================================================
 * 加载中 / 失败
 * 与 cd-image 同一套三态语言，但配色反过来（这里是深色底）
 * ================================================================== */
.cd-image-preview__status {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--cd-preview-on-dark, rgba(255, 255, 255, 0.72));
  pointer-events: none;
}

.cd-image-preview__status-text {
  margin-top: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-preview-on-dark, rgba(255, 255, 255, 0.72));
}

/* ==================================================================
 * 计数与操作按钮
 * ================================================================== */
.cd-image-preview__index {
  position: absolute;
  top: calc(var(--cd-space-4, 16px) + env(safe-area-inset-top));
  left: 0;
  width: 100%;
  font-size: var(--cd-font-size-sm, 12px);
  line-height: 1.4;
  text-align: center;
  color: var(--cd-preview-on-dark, rgba(255, 255, 255, 0.72));
  pointer-events: none;
}

.cd-image-preview__btn {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #ffffff;
  background-color: var(--cd-preview-btn-bg, rgba(255, 255, 255, 0.14));
  border-radius: 50%;
  cursor: pointer;
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

/* hover 与 :active 双写：浏览器走 :hover / :active，小程序走 hover-class */
@include cd-hover {
  .cd-image-preview__btn:hover {
    background-color: var(--cd-preview-btn-bg-hover, rgba(255, 255, 255, 0.28));
  }
}

.cd-image-preview__btn:active,
.cd-image-preview__btn--active {
  background-color: var(--cd-preview-btn-bg-active, rgba(255, 255, 255, 0.4));
}

.cd-image-preview__btn--close {
  top: calc(var(--cd-space-4, 16px) + env(safe-area-inset-top));
  right: var(--cd-space-4, 16px);
}

.cd-image-preview__btn--prev {
  top: 50%;
  left: var(--cd-space-4, 16px);
  margin-top: -18px;
}

.cd-image-preview__btn--next {
  top: 50%;
  right: var(--cd-space-4, 16px);
  margin-top: -18px;
}

@keyframes cd-preview-fade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
