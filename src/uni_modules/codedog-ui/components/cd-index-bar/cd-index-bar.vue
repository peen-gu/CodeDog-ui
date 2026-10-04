<template>
  <view class="cd-index-bar" :class="rootClass" :style="rootStyle">
    <view
      class="cd-index-bar__list"
      :class="{ 'cd-index-bar__list--active': touching }"
      @touchstart.stop.prevent="onStart"
      @touchmove.stop.prevent="onMove"
      @touchend.stop="onEnd"
      @touchcancel.stop="onEnd"
      @mousedown.stop.prevent="onStart"
      @mousemove.stop.prevent="onMove"
      @mouseup.stop="onEnd"
      @mouseleave.stop="onEnd"
    >
      <view
        v-for="(item, i) in indexList"
        :key="item + '-' + i"
        class="cd-index-bar__item"
        :class="{ 'cd-index-bar__item--active': activeIndex === i }"
        :style="itemStyle"
        @click="onSelect(i)"
      >
        <text class="cd-index-bar__text" :style="textStyle">{{ item }}</text>
      </view>

      <!-- 拖动时的大号气泡：跟着手指走，位置按当前格推算。
           放在列表内部，top 才能直接按「第几格」算，不必再叠加列表在根容器里的居中偏移 -->
      <view
        v-if="showTip && touching && activeIndex >= 0"
        class="cd-index-bar__tip"
        :style="tipStyle"
      >
        <text class="cd-index-bar__tip-text">{{ indexList[activeIndex] }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-index-bar —— 字母索引栏
 * ---------------------------------------------------------------
 * 刻意**不接管滚动**。理由：
 *   锚点滚动要遍历业务列表里每个分组的 offsetTop，而业务列表几乎一定是
 *   scroll-view / 长页面 / 虚拟列表三种形态之一，组件既量不准也管不动。
 *   所以这里只做「手指落在第几个字母」这一件事，把结果 emit 出去，
 *   由业务用 `scroll-into-view` 自己跳 —— 这本来就是 uni 的标准能力。
 *   组件与其猜业务的结构，不如把边界划清楚。
 *
 * 触摸定位：量一次列表的 rect，再用 (y − top) / 单格高 取整。
 * 不用给每个格子单独绑 touchmove —— 那样手指滑出格子就断，
 * 而滑动正是索引栏最主要的操作方式。
 *
 * 鼠标端（H5 / Electron）没有 touch 事件，所以列表同时绑了一套 mouse*，
 * 每个格子另绑 click 兜底 —— 桌面用户拖动索引、单击字母都能用。
 */
import { computed, getCurrentInstance, onMounted, ref } from 'vue'

defineOptions({
  name: 'cd-index-bar',
})

const props = defineProps({
  /** 索引列表。留空用 A~Z */
  indexList: {
    type: Array,
    default: () => [],
  },
  /** 单格高度（px） */
  itemSize: {
    type: Number,
    default: 18,
  },
  /** 拖动时是否显示大号气泡 */
  showTip: {
    type: Boolean,
    default: true,
  },
  /** 激活态颜色 */
  activeColor: {
    type: String,
    default: '',
  },
  /** 固定定位（贴视口右侧）。关掉则贴父级右侧，父级需有定位 */
  fixed: {
    type: Boolean,
    default: true,
  },
  zIndex: {
    type: Number,
    default: 900,
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

const emit = defineEmits(['select'])

const instance = getCurrentInstance()

const DEFAULT_LIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const indexList = computed(() =>
  props.indexList.length ? props.indexList : DEFAULT_LIST,
)

const activeIndex = ref(-1)
const touching = ref(false)
/** 列表顶边，用于把手指坐标换算成第几格。量不到就退化为「点哪格算哪格」 */
const listTop = ref(0)

const rootClass = computed(() => [props.customClass].filter(Boolean).join(' '))

const rootStyle = computed(
  () =>
    `z-index:${props.zIndex};` +
    (props.fixed ? '' : 'position:absolute;') +
    props.customStyle,
)

const itemStyle = computed(() => `height:${props.itemSize}px;`)

const textStyle = computed(() =>
  props.activeColor ? `color:${props.activeColor};` : '',
)

/* 气泡跟着当前格走：垂直居中对齐那一格 */
const tipStyle = computed(
  () => `top:${activeIndex.value * props.itemSize + props.itemSize / 2}px;`,
)

function onSelect(i) {
  if (i < 0 || i >= indexList.value.length) return
  activeIndex.value = i
  emit('select', { index: i, value: indexList.value[i] })
}

/**
 * 触点纵坐标。**必须兼容鼠标事件**：桌面浏览器没有 touches，
 * 鼠标事件要把事件自身当触点用（字段名与触点一致，只读 clientY）。
 */
function pointY(e) {
  const p = (e && e.touches && e.touches[0]) || e
  return p && typeof p.clientY === 'number' ? p.clientY : null
}

function indexFromTouch(e) {
  const y = pointY(e)
  if (y === null) return -1
  const list = indexList.value
  /* 没量到 top 时，用 clientY 相对自身不可靠，直接放弃拖动而不是乱跳 */
  if (!listTop.value) return -1
  const i = Math.floor((y - listTop.value) / Math.max(props.itemSize, 1))
  return Math.min(Math.max(i, 0), list.length - 1)
}

/* 每次按下重新量一次列表顶边：页面滚动过 / 窗口缩放过都能算准。
   拖动过程中用缓存值 —— boundingClientRect 是异步的，每帧量会读上一帧的回调，
   手指/鼠标与高亮的格子之间会差一格。 */
function syncListTop() {
  measure().then((rect) => {
    if (rect && typeof rect.top === 'number') listTop.value = rect.top
  })
}

function onStart(e) {
  touching.value = true
  syncListTop()
  const i = indexFromTouch(e)
  if (i >= 0) onSelect(i)
}

function onMove(e) {
  /* 没按下时不响应：鼠标只是从索引栏上划过，不能带着业务列表乱跳 */
  if (!touching.value) return
  const i = indexFromTouch(e)
  /* 只在跨格时 emit：滑动一次触发几十次 select 会把业务的滚动打乱 */
  if (i >= 0 && i !== activeIndex.value) onSelect(i)
}

function onEnd() {
  touching.value = false
}

function measure() {
  return new Promise((resolve) => {
    if (typeof uni === 'undefined' || !uni.createSelectorQuery) return resolve(null)
    uni
      .createSelectorQuery()
      .in(instance)
      .select('.cd-index-bar__list')
      .boundingClientRect((rect) => resolve(rect || null))
      .exec()
  })
}

onMounted(async () => {
  const rect = await measure()
  if (rect && typeof rect.top === 'number') listTop.value = rect.top
})

defineExpose({
  /** 供外部（如滚动监听）同步高亮 */
  setActive: (i) => {
    activeIndex.value = i
  },
})
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-index-bar {
  @include cd-reset;

  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  /* 整条是贴着右边的通栏，绝不能吃掉业务内容的点击 */
  pointer-events: none;
}

.cd-index-bar__list {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 纵向不留 padding：气泡的 top 直接按「第几格 × 格高」算，
     有 padding 就会整体偏一格 —— 这类偏差在小屏上很明显 */
  padding: 0 var(--cd-space-1, 4px);
  pointer-events: auto;
  border-radius: var(--cd-radius-round, 999px);
  transition: background-color 0.15s;
}

.cd-index-bar__list--active {
  background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.06));
}

.cd-index-bar__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--cd-space-6, 24px);
}

.cd-index-bar__text {
  font-size: var(--cd-font-size-xs, 11px);
  font-weight: var(--cd-font-weight-medium, 500);
  line-height: 1;
  color: var(--cd-text-secondary, #64748b);
}

.cd-index-bar__item--active .cd-index-bar__text {
  color: var(--cd-color-primary, #3b82f6);
}

/* 气泡：相对列表定位，靠负 margin 与 top 对齐到当前格的垂直中心。
   不用 transform —— 那会和列表自己的过渡抢同一属性 */
.cd-index-bar__tip {
  position: absolute;
  /* 贴着列表左侧，而不是写死一个 px —— 列表宽度随字数变化 */
  right: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-top: -26px;
  background-color: var(--cd-color-primary, #3b82f6);
  border-radius: var(--cd-radius-round, 999px);
  box-shadow: var(--cd-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.12));
  pointer-events: none;
}

.cd-index-bar__tip-text {
  font-size: var(--cd-font-size-xl, 20px);
  font-weight: var(--cd-font-weight-semibold, 600);
  line-height: 1;
  color: var(--cd-text-inverse, #ffffff);
}
</style>
