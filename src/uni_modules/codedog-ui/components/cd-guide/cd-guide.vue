<template>
  <view
    v-if="localVisible"
    class="cd-guide"
    :class="[uid, rootClass]"
    :style="rootStyle"
    @click.stop="onMaskTap"
  >
    <!-- ---------- 高亮框：用超大 box-shadow 当遮罩，天然挖出这个「洞」 ---------- -->
    <view
      v-if="hole"
      class="cd-guide__hole"
      :class="['cd-guide__hole--' + holeShape]"
      :style="holeStyle"
      @click.stop="onHoleTap"
    >
      <slot name="highlight" :step="currentStep" :index="current" />
    </view>

    <!-- ---------- 引导卡片 ---------- -->
    <view v-if="currentStep" class="cd-guide__popover" :class="popoverClass" :style="popoverStyle" @click.stop>
      <!-- 竖箭头：跟随 placement，水平方向对准目标中心 -->
      <view
        v-if="resolvedPlacement !== 'center'"
        class="cd-guide__arrow"
        :style="arrowStyle"
      ></view>

      <view class="cd-guide__head">
        <text v-if="currentStep.title" class="cd-guide__title">{{ currentStep.title }}</text>
        <text class="cd-guide__skip" @click.stop="skip">{{ skipText }}</text>
      </view>

      <text v-if="currentStep.content" class="cd-guide__content">{{ currentStep.content }}</text>
      <slot :step="currentStep" :index="current" />

      <view class="cd-guide__foot">
        <text v-if="showIndicator" class="cd-guide__indicator">{{ current + 1 }} / {{ steps.length }}</text>

        <view class="cd-guide__actions">
          <cd-button
            v-if="steps.length > 1 && current > 0"
            class="cd-guide__btn"
            size="small"
            plain
            @click.stop="prev"
            >{{ prevText }}</cd-button
          >
          <cd-button class="cd-guide__btn" size="small" type="primary" @click.stop="next">{{
            isLast ? finishText : nextText
          }}</cd-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-guide —— 新手指引 / 分步高亮
 * ---------------------------------------------------------------
 * 跨端最难的不是「画高亮」，是**怎么量目标位置**。这里全部走
 * `uni.createSelectorQuery()` 的**回调式**用法（`.boundingClientRect(cb)`），
 * 与 cd-collapse-item / cd-tabs / cd-affix 一致：回调式在小程序基础库各版本上
 * 比 `.exec()` 取数组稳定，不会因为返回顺序变动读错。
 *
 * 但**不加 `.in(instance)`** —— 那一句是给「量自己节点树里的子元素」用的，
 * 而指引的目标都在组件外面。加了之后 H5 端坐标会整体偏移一个页面头的高度。
 *
 * 三个关键决策：
 * 1. **遮罩用 box-shadow 而不是四块挡板拼**。
 *    `0 0 0 9999px 遮罩色` 一个值就能挖出任意矩形洞，不必在上/下/左/右贴四条
 *    挡板再按目标位置分别算高度；圆角（circle 模式只需改 border-radius）也免费
 *    得到，且目标位置变化时只改一个节点的 top/left，动画好写。
 * 2. **目标不在视口内先滚过去再量**。
 *    `boundingClientRect` 给的是视口坐标，目标在屏幕外时量出来的 top 是负的
 *    或超界，卡片会飞出屏幕。所以先 `selectViewport().scrollOffset()` 拿到
 *    滚动量，算目标绝对位置，`uni.pageScrollTo` 滚过去，等 350ms 再测第二次。
 * 3. **placement 写 'auto' 时由空间决定，不是固定往下**。
 *    目标贴着屏幕底部时往下放卡片会被截掉一半，此时自动翻到上面。
 *
 * 每一步支持 `target`（选择器，建议用 `#id`）为空 —— 空则退化成居中显示，
 * 用来做「第一步欢迎 / 最后一步总结」这种没有明确落点的步骤。
 */
import { computed, ref, watch } from 'vue'

defineOptions({
  name: 'cd-guide',
})

const props = defineProps({
  /** 是否显示 */
  visible: {
    type: Boolean,
    default: false,
  },
  /**
   * 步骤列表。每项：
   *   { target, title, content, placement, shape }
   * target 为空串时不高亮任何元素，卡片居中展示
   */
  steps: {
    type: Array,
    default: () => [],
  },
  /** 起始步骤下标 */
  startIndex: {
    type: Number,
    default: 0,
  },
  /** 'auto' 由可用空间自动决定；bottom / top / center 强制 */
  placement: {
    type: String,
    default: 'auto',
  },
  /** 高亮形状：rect 圆角矩形 / circle 正圆 */
  shape: {
    type: String,
    default: 'rect',
  },
  /** 高亮框相对目标的外扩 */
  padding: {
    type: Number,
    default: 6,
  },
  nextText: {
    type: String,
    default: '下一步',
  },
  prevText: {
    type: String,
    default: '上一步',
  },
  finishText: {
    type: String,
    default: '知道了',
  },
  skipText: {
    type: String,
    default: '跳过',
  },
  /** 是否显示 n / m 计数 */
  showIndicator: {
    type: Boolean,
    default: true,
  },
  /** 点遮罩是否跳过 */
  maskClosable: {
    type: Boolean,
    default: false,
  },
  zIndex: {
    type: Number,
    default: 2300,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:visible', 'change', 'finish', 'skip'])

const localVisible = ref(props.visible)

/**
 * 本实例专属类名。用途只有一个：量自己的根节点做坐标基准。
 * 用随机后缀而不是固定的 `.cd-guide`，是为了同页面存在多个指引时
 * （比如列表里每行一个新手引导）不会查到别人的节点上。
 */
const uid = 'cd-guide-' + Math.random().toString(36).slice(2, 8)

const current = ref(Math.max(props.startIndex, 0))
const rect = ref(null)
const winHeight = ref(600)
const winWidth = ref(375)
const resolvedPlacement = ref('bottom')
let measureTimer = null

const currentStep = computed(() => props.steps[current.value] || null)
const isLast = computed(() => current.value >= props.steps.length - 1)

const rootClass = computed(() => [props.customClass].filter(Boolean).join(' '))

const rootStyle = computed(() => `z-index:${props.zIndex};`)

/** 正圆模式：边长取长边，保证椭圆目标也能完整圈住 */
const holeShape = computed(() => currentStep.value?.shape || props.shape || 'rect')

const hole = computed(() => {
  const r = rect.value
  if (!r || !currentStep.value || !currentStep.value.target) return null
  const p = Math.max(props.padding, 0)
  let width = r.width + p * 2
  let height = r.height + p * 2
  if (holeShape.value === 'circle') {
    const edge = Math.max(width, height)
    width = edge
    height = edge
  }
  return {
    top: r.top - (height - r.height) / 2,
    left: r.left - (width - r.width) / 2,
    width,
    height,
  }
})

const holeStyle = computed(() => {
  const h = hole.value
  if (!h) return ''
  return `top:${h.top}px;left:${h.left}px;width:${h.width}px;height:${h.height}px;`
})

const popoverClass = computed(() => ['cd-guide__popover--' + resolvedPlacement.value])

/**
 * 卡片定位：
 * - 有目标时贴着目标走（bottom 贴下、top 贴上），左右吸可以和窗口边缘对齐但不越界；
 * - 无目标或 center 时固定在屏幕中部。
 *
 * ⚠️ 左边界必须同时受**最小宽度**约束，不能只写 `max(left, 12)`。
 *    目标靠右时（比如整行右侧的小按钮），卡片左边跟着贴到目标左边，
 *    右边又固定贴着屏幕右边 —— 卡片只剩几十像素宽，底部的
 *    「上一步 / 下一步」会各自折成两行。实测第一步就是这个现象。
 *    所以再夹一次上界：左边最多推到「右边留 12、宽度至少 240」的位置。
 */
const MIN_POPOVER_WIDTH = 240
const WINDOW_MARGIN = 12

/** 卡片的左边界（px），箭头定位也要用它，所以单独提出来 */
const popoverLeft = computed(() => {
  const h = hole.value
  if (!h || resolvedPlacement.value === 'center') return WINDOW_MARGIN
  const maxLeft = winWidth.value - WINDOW_MARGIN - MIN_POPOVER_WIDTH
  return Math.min(Math.max(h.left, WINDOW_MARGIN), Math.max(maxLeft, WINDOW_MARGIN))
})

const popoverStyle = computed(() => {
  const h = hole.value
  if (!h || resolvedPlacement.value === 'center') {
    return 'left:12px;right:12px;bottom:auto;top:50%;transform:translateY(-50%);'
  }
  const horizontal = `left:${popoverLeft.value}px;right:12px;`
  if (resolvedPlacement.value === 'top') {
    return `${horizontal}bottom:auto;top:${Math.max(h.top - 12, 12)}px;transform:translateY(-100%);`
  }
  return `${horizontal}top:${h.top + h.height + 12}px;bottom:auto;`
})

/**
 * 箭头：对准**目标中心**，而不是卡片中心。
 * 卡片因为最小宽度会被推离目标，箭头再钉在卡片中点就指偏了。
 * 夹在卡片内部 ±20px 处，保证箭头不会跑出圆角外。
 */
const arrowStyle = computed(() => {
  const h = hole.value
  if (!h || resolvedPlacement.value === 'center') return ''
  const targetCenter = h.left + h.width / 2
  const width = winWidth.value - WINDOW_MARGIN - popoverLeft.value
  const left = Math.min(Math.max(targetCenter - popoverLeft.value, 20), Math.max(width - 20, 20))
  return `left:${left}px;`
})

/** 量单个节点的包围盒（回调式，与仓库其它组件一致） */
function queryRect(selector, cb) {
  if (typeof uni === 'undefined' || !uni.createSelectorQuery) return cb(null)
  uni
    .createSelectorQuery()
    .select(selector)
    .boundingClientRect((res) => cb(res || null))
    .exec()
}

/**
 * 量目标：拿不到就让 hole 为空，卡片退化为居中，绝不抛错中断指引。
 *
 * ⚠️ 坐标必须取「**目标相对本组件根节点**」的差值，不能直接用目标自己的 rect。
 *    原因是 `boundingClientRect` 的坐标系在两端并不一致：
 *      - 小程序端：给的是视口坐标，直接用没问题；
 *      - H5 端：给的是**相对页面内容区**的坐标。实测目标真实视口 top = 251，
 *        量出来是 206.6 —— 正好少了一个页面头（H5 上 uni 会渲染一条 44px 的
 *        原生风格导航条）的高度。高亮框于是整体画到目标上方一行。
 *    这类偏差编译期查不出来，只有跑起来量 DOM 才看得见。
 *
 *    两次查询用的是**同一个坐标系**，所以差值把页面头那一段消掉了，
 *    而本组件根节点是 `position: fixed` 贴视口左上角 —— 差值即视口坐标，
 *    下游（高亮框 / 卡片定位 / 滚动判断）全都不用改。
 */
function measure() {
  const step = currentStep.value
  if (!step || !step.target) {
    rect.value = null
    resolveAutoPlacement()
    return
  }
  refreshRect(step.target, () => {
    /* 视口高度用于判断上下空间，顺手一起取回来 */
    queryToWindow()
    ensureInViewport(step.target)
    resolveAutoPlacement()
  })
}

/**
 * 重算 rect（不含「先滚过去」那一步）。
 * 单独拆出来是因为滚动之后要再量一次，而那次**不能再触发滚动** ——
 * 否则目标永远不可见时（比如比视口还高的元素）会滚一次量一次，无限循环。
 */
function refreshRect(target, done, attempt = 0) {
  queryRect('.' + uid, (root) => {
    /*
     * 根节点量不到 = 视图刚由 false 变 true，节点还没上屏。
     * 此时绝不能拿 base = 0 硬算：那会把整张遮罩按「相对页面内容区」的坐标画，
     * 高亮框整整偏一个页面头的高度（实测第一步就偏 44px，后面几步反而正常）。
     * 重试几次；实在量不到才退化成原样。
     */
    if (!root && attempt < 4) {
      setTimeout(() => refreshRect(target, done, attempt + 1), 40)
      return
    }
    queryRect(target, (res) => {
      if (res) {
        const base = root ? { top: root.top, left: root.left } : { top: 0, left: 0 }
        rect.value = {
          top: res.top - base.top,
          left: res.left - base.left,
          width: res.width,
          height: res.height,
        }
      } else {
        rect.value = null
      }
      if (done) done()
    })
  })
}

function queryToWindow() {
  if (typeof uni === 'undefined' || !uni.getWindowInfo) return
  try {
    const info = uni.getWindowInfo()
    if (info && info.windowHeight) winHeight.value = info.windowHeight
    /* 宽度用于给卡片夹一个最小宽度，见 popoverStyle 的注释 */
    if (info && info.windowWidth) winWidth.value = info.windowWidth
  } catch (e) {
    /* 拿不到就用默认值，不影响流程 */
  }
}

/** 目标不在视口内时先滚过去，滚完再量一次 */
function ensureInViewport(target) {
  const r = rect.value
  if (!r || typeof uni === 'undefined') return
  const vh = winHeight.value
  const fullyVisible = r.top >= 0 && r.top + r.height <= vh
  if (fullyVisible) return

  const query = uni.createSelectorQuery()
  query
    .selectViewport()
    .scrollOffset((res) => {
      const scrollTop = (res && res.scrollTop) || 0
      /* 目标顶到屏幕 1/3 处最舒服：既不贴顶也能看到上下文 */
      const dest = Math.max(scrollTop + r.top - Math.floor(vh / 3), 0)
      if (typeof uni === 'undefined' || !uni.pageScrollTo) return
      uni.pageScrollTo({ scrollTop: dest, duration: 300 })
      clearAfterScroll(target)
    })
    .exec()
}

function clearAfterScroll(target) {
  if (measureTimer !== null) clearTimeout(measureTimer)
  measureTimer = setTimeout(() => {
    measureTimer = null
    if (!localVisible.value) return
    /* 滚完重测：坐标口径与 measure() 必须一致，所以复用同一套差值算法，
       但**不再触发滚动**（见 refreshRect 注释） */
    refreshRect(target, resolveAutoPlacement)
  }, 360)
}

/** placement 为 auto 时按剩余空间决定：目标下半空间不够就翻到上面 */
function resolveAutoPlacement() {
  const h = hole.value
  if (!h) {
    resolvedPlacement.value = 'center'
    return
  }
  if (props.placement !== 'auto') {
    resolvedPlacement.value = props.placement
    return
  }
  const below = winHeight.value - (h.top + h.height)
  const above = h.top
  const need = 150
  if (below >= need || below >= above) resolvedPlacement.value = 'bottom'
  else resolvedPlacement.value = 'top'
}

function next() {
  if (isLast.value) {
    finish()
    return
  }
  current.value += 1
  emit('change', { index: current.value, step: currentStep.value })
  measure()
}

function prev() {
  if (current.value === 0) return
  current.value -= 1
  emit('change', { index: current.value, step: currentStep.value })
  measure()
}

function finish() {
  localVisible.value = false
  emit('update:visible', false)
  emit('finish', { index: current.value, step: currentStep.value })
}

function skip() {
  localVisible.value = false
  emit('update:visible', false)
  emit('skip', { index: current.value, step: currentStep.value })
}

function restart(from = 0) {
  current.value = from
  localVisible.value = true
  measure()
}

/**
 * 点中心的高亮区默认什么都不做。
 * 刻意区分「点目标」与「点遮罩」：目标上往往挂着业务自己的点击逻辑，
 * 把「下一步」也绑上去会让用户点一下跳两步。
 */
function onHoleTap() {
  /* 只负责吃掉事件，避免冒泡到遮罩层被当成「点遮罩」 */
}

/** 点遮罩：开了 maskClosable 才算「跳过」，否则整层只是阻挡操作 */
function onMaskTap() {
  if (props.maskClosable) skip()
}

defineExpose({ next, prev, finish, skip, restart })

watch(
  () => props.visible,
  (v) => {
    localVisible.value = v
    if (!v) {
      if (measureTimer !== null) clearTimeout(measureTimer)
      measureTimer = null
      return
    }
    current.value = Math.max(Math.min(props.startIndex, Math.max(props.steps.length - 1, 0)), 0)
    measure()
  },
)
</script>

<script>
export default {
  name: 'cd-guide',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-guide {
  @include cd-reset;

  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  /* 根节点铺满整屏且吃事件：指引期间业务不该还能盲点到底下的按钮。
     这也是 maskClosable 的落点 —— 点不到任何子节点的区域就是「点遮罩」 */
  pointer-events: auto;
}

/* 洞本身就是遮罩：一圈巨大的外发光把四周变暗，中间保持透明。
   比「四块挡板拼」少三个节点，圆角也不用单独算 */
.cd-guide__hole {
  position: fixed;
  pointer-events: auto;
  border-radius: var(--cd-radius-md, 8px);
  box-shadow:
    0 0 0 9999px var(--cd-guide-mask-color, rgba(15, 23, 42, 0.6)),
    0 0 0 var(--cd-guide-ring-width, 2px) var(--cd-guide-ring-color, rgba(37, 99, 235, 0.9)) inset;
  transition:
    top 0.22s ease,
    left 0.22s ease,
    width 0.22s ease,
    height 0.22s ease;
}

.cd-guide__hole--circle {
  border-radius: 999px;
}

.cd-guide__popover {
  position: fixed;
  pointer-events: auto;
  padding: var(--cd-space-4, 16px);
  background-color: var(--cd-bg-elevated, #fff);
  border-radius: var(--cd-radius-lg, 12px);
  box-shadow: var(--cd-shadow-lg, 0 10px 30px rgba(15, 23, 42, 0.18));
}

/* 箭头水平位置由 arrowStyle 内联给出（对准目标中心），这里只负责尺寸与形状，
   所以不写 left —— 写了会和内联值打架，变成「卡片中点」而不是「目标中点」 */
.cd-guide__arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  background-color: var(--cd-bg-elevated, #fff);
  transform: rotate(45deg);
}

.cd-guide__popover--bottom .cd-guide__arrow {
  top: -5px;
}

.cd-guide__popover--top .cd-guide__arrow {
  bottom: -5px;
}

.cd-guide__popover--center .cd-guide__arrow {
  display: none;
}

.cd-guide__head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--cd-space-2, 8px);
}

.cd-guide__title {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-md, 14px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #1e293b);
}

.cd-guide__skip {
  padding-left: var(--cd-space-3, 12px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-tertiary, #94a3b8);
}

.cd-guide__content {
  display: block;
  margin-bottom: var(--cd-space-4, 16px);
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.6);
  color: var(--cd-text-secondary, #64748b);
}

.cd-guide__foot {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.cd-guide__indicator {
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-tertiary, #94a3b8);
}

.cd-guide__actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
}

/* 相邻按钮间距：用相邻兄弟而不是 :not(:last-child)，
   WXSS 不支持结构伪类 */
.cd-guide__btn + .cd-guide__btn {
  margin-left: var(--cd-space-2, 8px);
}
</style>
