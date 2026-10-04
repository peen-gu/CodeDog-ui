<template>
  <view class="cd-swiper" :class="rootClass" :style="rootStyle">
    <!-- ---------- 滑动主体 ---------- -->
    <swiper
      class="cd-swiper__body"
      :current="innerIndex"
      :autoplay="false"
      :interval="interval"
      :duration="duration"
      :circular="circular"
      :vertical="vertical"
      :indicator-dots="false"
      @change="handleChange"
    >
      <swiper-item v-for="(item, index) in items" :key="index" class="cd-swiper__item">
        <view class="cd-swiper__slide" @click="handleItemClick(index)">
          <slot :item="item" :index="index">
            <image v-if="imageOf(item)" class="cd-swiper__image" :src="imageOf(item)" mode="aspectFill" />
            <text v-if="textOf(item)" class="cd-swiper__caption">{{ textOf(item) }}</text>
          </slot>
        </view>
      </swiper-item>
    </swiper>

    <!-- ---------- 指示点 ---------- -->
    <view v-if="showIndicator" class="cd-swiper__dots" :class="dotsClass">
      <slot name="indicator" :items="items" :current="innerIndex">
        <view
          v-for="(item, index) in items"
          :key="index"
          class="cd-swiper__dot"
          :class="{ 'cd-swiper__dot--active': index === innerIndex }"
          :style="dotStyle(index)"
        />
      </slot>
    </view>

    <!-- ---------- 桌面形态：左右翻页箭头 ---------- -->
    <view
      v-if="showArrow"
      class="cd-swiper__arrow cd-swiper__arrow--prev"
      :class="prevClass"
      :hover-class="pressClass"
      @click.stop="handlePrev"
    >
      <cd-icon :name="prevIcon" :size="18" />
    </view>

    <view
      v-if="showArrow"
      class="cd-swiper__arrow cd-swiper__arrow--next"
      :class="nextClass"
      :hover-class="pressClass"
      @click.stop="handleNext"
    >
      <cd-icon :name="nextIcon" :size="18" />
    </view>
  </view>
</template>

<script setup>
/**
 * cd-swiper —— 轮播
 * ---------------------------------------------------------------
 * 直接封装 uni 的 <swiper> / <swiper-item>，把三件事收拢成一套 API：
 *
 * 1) 数据驱动优先。
 *    原生 swiper 的用法是把 <swiper-item> 写在插槽里，于是「有几项」
 *    这件事散落在模板里，业务很难把它和「数据是异步回来的」对齐。
 *    这里改成 list 数组驱动，每一项既可以由默认渲染（image / text），
 *    也可以由默认插槽完全接管。
 *
 * 2) 自动播放自己管，不用原生 autoplay。
 *    原生 autoplay 由 swiper 组件内部控制，页面切走、列表变短、
 *    需要手动翻页后重置计时这些场景都插不上手。
 *    这里用一个 setInterval 推进 innerIndex —— 手能停（onUnmounted 必清）、
 *    能随时重启（手动翻页后重新计时，避免刚点完马上又自动跳）。
 *    代价是少了「触摸暂停」这类原生内建行为，见下方已知限制。
 *
 * 3) current 是受控值。
 *    props.current → innerIndex → <swiper :current> → @change → emit。
 *    整条链路单向：外部改 props 会同步进来，内部滑动会用 update:current 通知回去，
 *    两边谁改都不会打架，不会有第二个真值来源。
 *
 * 通知路径刻意只有一条：所有 change 事件都由原生 @change 驱动
 * （手势、箭头、自动播放全都算），所以程序化翻页不会额外回调一次，
 * 也不会一次翻页回调两次。
 *
 * 指示点不用原生 indicator-dots：原生那套的样式几乎改不动
 * （颜色能改，位置、形状、圆角都改不了），而且拿不到「第几个」去配 slot。
 *
 * 已知限制：
 *   - 列表超过约 12 项时指示点会挤成一行溢出，业务应在 indicator 插槽里做分页或省略；
 *     这里不做自动折叠，因为「折叠成什么」在每个产品里都不一样，猜错了比不做更糟。
 *   - 纵向模式（vertical）下指示点仍按水平方位渲染，没有做右侧竖排；
 *     纵向轮播本身是低频场景，加一套竖排方位会把 API 复杂度翻倍。
 *   - 非衔接模式（circular = false）下**自动播放**到末尾会跳回第一项，
 *     这一次跳转是反向滑动的（从末项倒着滑回首项）—— 这是原生 swiper 的行为，
 *     绕不过去，需要平滑循环就开 circular。
 *     手动翻页（箭头 / 手势）仍然受边界限制：末项再点「下一页」不会有反应，
 *     箭头也会置灰 —— 自动播放要能一直转下去，手点则必须尊重边界，两者语义不同。
 */
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useBreakpoint, resolveDesktopShape } from '../../composables/use-breakpoint'
import { isH5 } from '../../composables/use-platform'
import CdIcon from '../cd-icon/cd-icon.vue'

defineOptions({
  name: 'cd-swiper',
  options: {
    addGlobalClass: true,
  },
})

const props = defineProps({
  /** 轮播数据。每项形如 { image, text, ...任意字段 }；传字符串时按图片地址处理。不给默认插槽时用 image / text 做默认渲染 */
  list: {
    type: Array,
    default: () => [],
  },
  /** 当前下标，支持 v-model:current */
  current: {
    type: Number,
    default: 0,
  },
  /** 轮播高度，数字按 px 处理；不传时取 var(--cd-swiper-height) */
  height: {
    type: [String, Number],
    default: '',
  },
  /** 是否自动播放 */
  autoplay: {
    type: Boolean,
    default: false,
  },
  /** 自动播放间隔（毫秒），小于等于 0 时不播放 */
  interval: {
    type: Number,
    default: 3000,
  },
  /** 切换动画时长（毫秒） */
  duration: {
    type: Number,
    default: 500,
  },
  /** 是否首尾衔接循环 */
  circular: {
    type: Boolean,
    default: false,
  },
  /** 是否纵向滑动 */
  vertical: {
    type: Boolean,
    default: false,
  },
  /** 是否显示指示点 */
  indicator: {
    type: Boolean,
    default: true,
  },
  /** 指示点位置：bottom / top / bottom-left / bottom-right */
  indicatorPosition: {
    type: String,
    default: 'bottom',
  },
  /** 未选中指示点颜色，不传时取 var(--cd-swiper-dot-color) */
  indicatorColor: {
    type: String,
    default: '',
  },
  /** 选中指示点颜色，不传时取 var(--cd-swiper-dot-active-color) */
  indicatorActiveColor: {
    type: String,
    default: '',
  },
  /** 双形态：auto / mobile / desktop。desktop 时显示左右翻页箭头，mobile 时不显示（触屏不该出现鼠标箭头） */
  mode: {
    type: String,
    default: 'auto',
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

const emit = defineEmits(['update:current', 'change', 'click'])

const { isPC } = useBreakpoint()
const desktopShape = computed(() => resolveDesktopShape(props.mode, isPC))

/**
 * 按压反馈双写（同 cd-button 的做法）：
 * H5 交给 :active 伪类，小程序端 WXSS 的 :active 不可靠，改用 hover-class。
 * 这里只给箭头用 —— 滑动容器本身给按压态反而会在拖拽时闪一下，是负体验。
 */
const pressClass = isH5 ? 'none' : 'cd-swiper__arrow--pressed'

/* ==================================================================
 * 列表与下标
 * ================================================================== */

/**
 * props.list 刻意用 computed 派生，而不是 ref(new Array) 再往里塞。
 * 把数组塞进 ref 会变成 Proxy —— Proxy 会破坏引用比对
 * （同一个数组，两次读出来的代理对象不相等），
 * 一旦业务需要判断「列表是不是被整体换掉了」就会得出错的结论。
 * 本库对这类数据的统一写法是：保持普通数组，另配一个 version ref 做变更标记。
 */
const items = computed(() => (Array.isArray(props.list) ? props.list : []))

function clampIndex(value) {
  const max = Math.max(0, items.value.length - 1)
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.min(Math.max(Math.trunc(num), 0), max)
}

const innerIndex = ref(clampIndex(props.current))

/** 当前项，没有数据时给 null —— 让 change / click 的第二个参数类型稳定 */
const currentItem = computed(() => (items.value.length ? items.value[innerIndex.value] : null))

watch(
  () => props.current,
  (value) => {
    const next = clampIndex(value)
    if (next !== innerIndex.value) innerIndex.value = next
  }
)

/* 列表变短时下标可能越界，必须收回来并回报给 v-model，否则会停在一个空白帧上 */
watch(
  () => items.value.length,
  () => {
    setIndex(innerIndex.value)
  }
)

function setIndex(value) {
  const next = clampIndex(value)
  if (next === innerIndex.value) return
  innerIndex.value = next
  emit('update:current', next)
}

/**
 * @param {number} step 1 下一项 / -1 上一项
 * @param {boolean} resetTimer 手动翻页后是否重置自动播放计时
 */
function navigate(step, resetTimer) {
  const len = items.value.length
  if (len < 2) return

  if (!props.circular) {
    if (step < 0 && innerIndex.value === 0) return
    if (step > 0 && innerIndex.value === len - 1) return
  }

  let next = innerIndex.value + step
  if (next < 0) next = props.circular ? len - 1 : 0
  if (next > len - 1) next = props.circular ? 0 : len - 1

  setIndex(next)
  if (resetTimer) startAutoplay()
}

/* ==================================================================
 * 自动播放
 * ================================================================== */

let timer = null

function stopAutoplay() {
  if (timer === null) return
  clearInterval(timer)
  timer = null
}

function startAutoplay() {
  stopAutoplay()
  if (!props.autoplay || props.interval <= 0 || items.value.length < 2) return
  timer = setInterval(() => {
    /*
     * 非衔接模式走到末项时，navigate(1) 会被边界拦下 —— 结果就是定时器还在跑、
     * 界面却永久停在最后一张。自动播放的语义是「一直轮下去」，
     * 所以这里显式回跳首项（这一次是反向滑动，见文件头已知限制）。
     */
    if (!props.circular && innerIndex.value >= items.value.length - 1) setIndex(0)
    else navigate(1, false)
  }, props.interval)
}

watch(
  () => [props.autoplay, props.interval, items.value.length],
  () => {
    startAutoplay()
  },
  { immediate: true }
)

/* ----------------------------------------------------------------
 * 页面切到后台就停：定时器在后台继续跑，用户什么也看不到，
 * 但每一次触发都会走一遍 setData —— 白耗电。
 * H5 用 visibilitychange 处理；小程序切后台时页面本身会被冻结，
 * setInterval 不会持续触发，不需要（也没有等价的）额外处理。
 * ---------------------------------------------------------------- */
function handleVisibility() {
  /* #ifdef H5 */
  if (typeof document === 'undefined') return
  if (document.hidden) stopAutoplay()
  else startAutoplay()
  /* #endif */
}

onMounted(() => {
  /* #ifdef H5 */
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', handleVisibility)
  }
  /* #endif */
})

onUnmounted(() => {
  /* #ifdef H5 */
  if (typeof document !== 'undefined' && document.removeEventListener) {
    document.removeEventListener('visibilitychange', handleVisibility)
  }
  /* #endif */
  stopAutoplay()
})

/* ==================================================================
 * 事件
 * ================================================================== */

function handleChange(event) {
  /* detail.current 拿不到时宁可不处理：误跳回第 0 项比不处理更糟 */
  const raw = event && event.detail ? Number(event.detail.current) : NaN
  if (!Number.isFinite(raw)) return

  const next = clampIndex(raw)
  if (next !== innerIndex.value) {
    innerIndex.value = next
    emit('update:current', next)
  }
  emit('change', innerIndex.value, currentItem.value)
}

function handleItemClick(index) {
  emit('click', index, items.value[index] || null)
}

function handlePrev() {
  navigate(-1, true)
}

function handleNext() {
  navigate(1, true)
}

/* ==================================================================
 * 默认渲染：从数据项里取图与文案
 * ================================================================== */

/** 字符串项直接当图片地址用 —— 「只有一堆图」是最常见的用法，不该逼业务包装成对象 */
function imageOf(item) {
  if (typeof item === 'string') return item
  if (item && typeof item === 'object') return item.image || ''
  return ''
}

function textOf(item) {
  if (item && typeof item === 'object') return item.text || ''
  return ''
}

/* ==================================================================
 * 样式计算
 * ================================================================== */

function toSize(value) {
  if (value === '' || value === null || value === undefined) return ''
  return typeof value === 'number' ? `${value}px` : String(value)
}

const rootStyle = computed(() => {
  const parts = []
  const h = toSize(props.height)
  if (h) parts.push(`height:${h};`)
  if (props.customStyle) parts.push(props.customStyle)
  return parts.join('')
})

const rootClass = computed(() =>
  [
    desktopShape.value ? 'cd-swiper--desktop' : 'cd-swiper--mobile',
    props.vertical ? 'cd-swiper--vertical' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const dotsClass = computed(() => `cd-swiper__dots--${props.indicatorPosition}`)

const showIndicator = computed(() => props.indicator && items.value.length > 0)
const showArrow = computed(() => desktopShape.value && items.value.length > 1)

/* 非衔接模式下边界处的箭头置灰：看得见的「不能再翻了」比点了没反应友好 */
const prevDisabled = computed(() => !props.circular && innerIndex.value === 0)
const nextDisabled = computed(() => !props.circular && innerIndex.value === items.value.length - 1)
const prevClass = computed(() => (prevDisabled.value ? 'cd-swiper__arrow--disabled' : ''))
const nextClass = computed(() => (nextDisabled.value ? 'cd-swiper__arrow--disabled' : ''))

const prevIcon = computed(() => (props.vertical ? 'chevron-up' : 'chevron-left'))
const nextIcon = computed(() => (props.vertical ? 'chevron-down' : 'chevron-right'))

/** 只传了 indicatorColor / indicatorActiveColor 的点才加内联底色，其余交给 CSS 变量兜底 */
function dotStyle(index) {
  const active = index === innerIndex.value
  if (active && props.indicatorActiveColor) return `background-color:${props.indicatorActiveColor};`
  if (!active && props.indicatorColor) return `background-color:${props.indicatorColor};`
  return ''
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

/* ==================================================================
 * 外壳
 * ------------------------------------------------------------------
 * 这里集中声明组件私有的 --cd-swiper-* 令牌。
 * 全部带兜底值，业务既能整体换主题，也能单点覆盖其中某一个。
 * ================================================================== */
.cd-swiper {
  @include cd-reset;

  --cd-swiper-height: 180px;
  --cd-swiper-radius: var(--cd-radius-md, 8px);
  --cd-swiper-bg: var(--cd-bg-sunken, #f1f5f9);
  --cd-swiper-dot-size: 6px;
  --cd-swiper-dot-active-width: 16px;
  --cd-swiper-dot-gap: 6px;
  --cd-swiper-dot-color: rgba(255, 255, 255, 0.6);
  --cd-swiper-dot-active-color: var(--cd-color-primary, #3b76f6);
  --cd-swiper-dot-offset: var(--cd-space-3, 12px);
  --cd-swiper-arrow-size: 32px;
  --cd-swiper-arrow-offset: var(--cd-space-3, 12px);
  --cd-swiper-arrow-opacity: 0.55;
  --cd-swiper-arrow-color: #ffffff;
  --cd-swiper-arrow-bg: rgba(15, 23, 42, 0.35);
  --cd-swiper-arrow-bg-active: rgba(15, 23, 42, 0.6);
  --cd-swiper-caption-bg: rgba(15, 23, 42, 0.45);
  --cd-swiper-caption-color: #ffffff;

  position: relative;
  width: 100%;
  height: var(--cd-swiper-height, 180px);
  overflow: hidden;
  background-color: var(--cd-swiper-bg, var(--cd-bg-sunken, #f1f5f9));
  border-radius: var(--cd-swiper-radius, var(--cd-radius-md, 8px));
}

.cd-swiper__body {
  width: 100%;
  height: 100%;
}

.cd-swiper__item {
  @include cd-reset;

  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cd-swiper__slide {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cd-swiper__image {
  display: block;
  width: 100%;
  height: 100%;
}

.cd-swiper__caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: block;
  padding: var(--cd-space-2, 8px) var(--cd-space-3, 12px);
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-swiper-caption-color, #ffffff);
  background-color: var(--cd-swiper-caption-bg, rgba(15, 23, 42, 0.45));
}

/* ==================================================================
 * 指示点
 * ================================================================== */
.cd-swiper__dots {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--cd-space-3, 12px);
}

.cd-swiper__dots--bottom {
  bottom: var(--cd-swiper-dot-offset, var(--cd-space-3, 12px));
}

.cd-swiper__dots--bottom-left {
  bottom: var(--cd-swiper-dot-offset, var(--cd-space-3, 12px));
  justify-content: flex-start;
}

.cd-swiper__dots--bottom-right {
  bottom: var(--cd-swiper-dot-offset, var(--cd-space-3, 12px));
  justify-content: flex-end;
}

.cd-swiper__dots--top {
  top: var(--cd-swiper-dot-offset, var(--cd-space-3, 12px));
}

.cd-swiper__dot {
  flex-shrink: 0;
  width: var(--cd-swiper-dot-size, 6px);
  height: var(--cd-swiper-dot-size, 6px);
  background-color: var(--cd-swiper-dot-color, rgba(255, 255, 255, 0.6));
  border-radius: var(--cd-radius-round, 999px);
  transition: width var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

/* 「除第一个之外」一律用相邻兄弟选择器 —— WXSS 对结构化伪类的支持不完整 */
.cd-swiper__dot + .cd-swiper__dot {
  margin-left: var(--cd-swiper-dot-gap, 6px);
}

.cd-swiper__dot--active {
  width: var(--cd-swiper-dot-active-width, 16px);
  background-color: var(--cd-swiper-dot-active-color, var(--cd-color-primary, #3b76f6));
}

/* ==================================================================
 * 桌面形态：翻页箭头
 * ------------------------------------------------------------------
 * 垂直居中刻意用 top:50% + translateY(-50%)：
 * 换成 margin-top 就得把 CSS 变量放进 calc 里做除法 —— 负的一半是自反引用，
 * 部分小程序基础库算不出来。translateY(-50%) 是百分比自解算，跨端都稳。
 * ================================================================== */
.cd-swiper__arrow {
  position: absolute;
  top: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--cd-swiper-arrow-size, 32px);
  height: var(--cd-swiper-arrow-size, 32px);
  color: var(--cd-swiper-arrow-color, #ffffff);
  background-color: var(--cd-swiper-arrow-bg, rgba(15, 23, 42, 0.35));
  border-radius: var(--cd-radius-round, 999px);
  transform: translateY(-50%);
  opacity: var(--cd-swiper-arrow-opacity, 0.55);
  cursor: pointer;
  transition: opacity var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-swiper__arrow--prev {
  left: var(--cd-swiper-arrow-offset, var(--cd-space-3, 12px));
}

.cd-swiper__arrow--next {
  right: var(--cd-swiper-arrow-offset, var(--cd-space-3, 12px));
}

@include cd-hover {
  .cd-swiper__arrow:hover {
    opacity: 1;
  }
}

/* 按压态双写：H5 走 :active，小程序走 hover-class 挂上的 .cd-swiper__arrow--pressed */
.cd-swiper__arrow:active,
.cd-swiper__arrow.cd-swiper__arrow--pressed {
  opacity: 1;
  background-color: var(--cd-swiper-arrow-bg-active, rgba(15, 23, 42, 0.6));
}

.cd-swiper__arrow--disabled {
  opacity: 0.25;
  cursor: not-allowed;
}
</style>
