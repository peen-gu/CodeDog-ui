<template>
  <view class="cd-timeline-item" :class="rootClass" :style="customStyle">
    <!-- ---------- 左侧导轨：引线 + 圆点 + 引线 ---------- -->
    <view class="cd-timeline-item__rail">
      <view v-if="!isVisualFirst" class="cd-timeline-item__line" />
      <view v-else class="cd-timeline-item__spacer" />

      <view class="cd-timeline-item__dot" :class="dotClass">
        <slot name="dot">
          <cd-icon v-if="icon" :name="icon" size="0.8em" />
        </slot>
      </view>

      <view v-if="!isVisualLast" class="cd-timeline-item__line" />
      <view v-else class="cd-timeline-item__spacer" />
    </view>

    <!-- ---------- 右侧内容 ---------- -->
    <view class="cd-timeline-item__content">
      <view v-if="showTimestamp && placement === 'top'" class="cd-timeline-item__time">
        <slot name="timestamp">
          <text class="cd-timeline-item__time-text">{{ timestamp }}</text>
        </slot>
      </view>

      <view class="cd-timeline-item__body">
        <slot />
      </view>

      <view v-if="showTimestamp && placement === 'bottom'" class="cd-timeline-item__time">
        <slot name="timestamp">
          <text class="cd-timeline-item__time-text">{{ timestamp }}</text>
        </slot>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-timeline-item —— 时间线节点
 * ---------------------------------------------------------------
 * 导轨用「引线 + 圆点 + 引线」三件套，且首尾两端各换成一个透明占位。
 * 为什么不直接把首尾的引线删掉：删掉之后圆点的垂直位置会变
 * （上方少了 flex:1 的伸展），整条时间线的圆点就不在一条直线上了。
 * 占位块保留同样的高度分配，只把颜色去掉，圆点才始终压在轴的中间。
 *
 * 圆点形态三选一，由属性组合决定，而不是开一个 variant 枚举：
 *   有 icon  → 实心圆 + 白色图标（适合「提交」「审核」这类事件）
 *   hollow   → 空心圈（适合「次要节点」）
 *   都没有   → 实心小圆点（默认）
 * 这三种覆盖了真实产品里 95% 的时间线画法，加枚举反而要求业务记住取值。
 */
import { computed, inject, onUnmounted, useSlots } from 'vue'
import { CD_TIMELINE_KEY } from '../../constants'

defineOptions({
  name: 'cd-timeline-item',
})

const props = defineProps({
  /** 时间文案 */
  timestamp: {
    type: String,
    default: '',
  },
  /** primary / success / warning / danger / info */
  type: {
    type: String,
    default: 'primary',
  },
  /** 空心圆点 */
  hollow: {
    type: Boolean,
    default: false,
  },
  /** 圆点内图标，传了就是实心圆 + 图标 */
  icon: {
    type: String,
    default: '',
  },
  /** normal / large */
  size: {
    type: String,
    default: 'normal',
  },
  /** 时间戳在内容的上面还是下面 */
  placement: {
    type: String,
    default: 'top',
  },
  hideTimestamp: {
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

const slots = useSlots()
const timeline = inject(CD_TIMELINE_KEY, null)

const uid = timeline ? timeline.register() : 0
onUnmounted(() => {
  if (timeline) timeline.unregister(uid)
})

/* 容器靠这个把 vnode 与注册表对上，才能按书写顺序校正序号（中间插入时挂载顺序是错的） */
defineExpose({
  __cdOrderUid: uid,
})

const index = computed(() => (timeline ? timeline.indexOf(uid) : 0))
const total = computed(() => (timeline ? timeline.total : 1))
const isFirst = computed(() => index.value <= 0)
const isLast = computed(() => index.value >= total.value - 1)

/**
 * 视觉上的首尾 ≠ DOM 上的首尾。
 * 容器是 column-reverse 时两者正好对调，引线的取舍必须按视觉顺序来，
 * 否则最上面那一项会拖出一条指向屏幕外的断头线。
 */
const reverse = computed(() => (timeline ? timeline.reverse.value : false))
const isVisualFirst = computed(() => (reverse.value ? isLast.value : isFirst.value))
const isVisualLast = computed(() => (reverse.value ? isFirst.value : isLast.value))

const showTimestamp = computed(() => !props.hideTimestamp && (!!props.timestamp || !!slots.timestamp))

const dotClass = computed(() =>
  [
    `cd-timeline-item__dot--${props.type}`,
    props.icon ? 'cd-timeline-item__dot--icon' : '',
    !props.icon && props.hollow ? 'cd-timeline-item__dot--hollow' : '',
    props.size === 'large' ? 'cd-timeline-item__dot--large' : '',
  ]
    .filter(Boolean)
    .join(' ')
)

const rootClass = computed(() =>
  [
    `cd-timeline-item--${props.type}`,
    isVisualFirst.value ? 'cd-timeline-item--first' : '',
    isVisualLast.value ? 'cd-timeline-item--last' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)
</script>

<script>
export default {
  name: 'cd-timeline-item',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-timeline-item {
  @include cd-reset;

  display: flex;
  align-items: stretch;
  width: 100%;
}

/* ==================================================================
 * 导轨
 * ================================================================== */
.cd-timeline-item__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: var(--cd-timeline-rail-width, 24px);
}

.cd-timeline-item__line {
  flex: 1;
  min-height: 0;
  width: var(--cd-timeline-line-width, 2px);
  background-color: var(--cd-timeline-line-color, #e2e8f0);
}

/* 首尾占位：只保留高度分配，不画颜色。
   用透明背景而不是 display:none —— 后者会让圆点失去 flex:1 的配重而被顶到边上 */
.cd-timeline-item__spacer {
  flex: 1;
  min-height: 0;
  width: var(--cd-timeline-line-width, 2px);
  background-color: transparent;
}

.cd-timeline-item__dot {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--cd-timeline-dot-size, 10px);
  height: var(--cd-timeline-dot-size, 10px);
  border-radius: var(--cd-radius-round, 999px);
  box-sizing: border-box;
  background-color: var(--cd-color-primary, #3b76f6);
  /* 上下各留一点空隙，圆点才不会贴着前一条事件的文字 */
  margin: 3px 0;
}

.cd-timeline-item__dot--large {
  width: calc(var(--cd-timeline-dot-size, 10px) + 4px);
  height: calc(var(--cd-timeline-dot-size, 10px) + 4px);
}

/* 空心：透明底 + 同色描边 */
.cd-timeline-item__dot--hollow {
  width: var(--cd-timeline-hollow-size, 12px);
  height: var(--cd-timeline-hollow-size, 12px);
  background-color: transparent;
  border: var(--cd-timeline-line-width, 2px) solid var(--cd-color-primary, #3b76f6);
}

.cd-timeline-item__dot--hollow.cd-timeline-item__dot--large {
  width: calc(var(--cd-timeline-hollow-size, 12px) + 6px);
  height: calc(var(--cd-timeline-hollow-size, 12px) + 6px);
}

/* 带图标：实心大圆 */
.cd-timeline-item__dot--icon {
  width: var(--cd-timeline-icon-size, 24px);
  height: var(--cd-timeline-icon-size, 24px);
  color: #ffffff;
  margin: 1px 0;
}

.cd-timeline-item__dot--icon.cd-timeline-item__dot--large {
  width: calc(var(--cd-timeline-icon-size, 24px) + 6px);
  height: calc(var(--cd-timeline-icon-size, 24px) + 6px);
}

/* -------------------- 语义色 -------------------- */
.cd-timeline-item__dot--success {
  background-color: var(--cd-color-success, #22c55e);
}

.cd-timeline-item__dot--warning {
  background-color: var(--cd-color-warning, #f59e0b);
}

.cd-timeline-item__dot--danger {
  background-color: var(--cd-color-danger, #ef4444);
}

.cd-timeline-item__dot--info {
  background-color: var(--cd-color-info, #64748b);
}

.cd-timeline-item__dot--hollow.cd-timeline-item__dot--success {
  background-color: transparent;
  border-color: var(--cd-color-success, #22c55e);
}

.cd-timeline-item__dot--hollow.cd-timeline-item__dot--warning {
  background-color: transparent;
  border-color: var(--cd-color-warning, #f59e0b);
}

.cd-timeline-item__dot--hollow.cd-timeline-item__dot--danger {
  background-color: transparent;
  border-color: var(--cd-color-danger, #ef4444);
}

.cd-timeline-item__dot--hollow.cd-timeline-item__dot--info {
  background-color: transparent;
  border-color: var(--cd-color-info, #64748b);
}

/* ==================================================================
 * 内容
 * ================================================================== */
.cd-timeline-item__content {
  flex: 1;
  min-width: 0;
  padding: 0 0 var(--cd-space-5, 20px) var(--cd-timeline-content-gap, 12px);
}

/* 最后一项不留底部间距，否则整条时间线下面会多一截空白 */
.cd-timeline-item--last .cd-timeline-item__content {
  padding-bottom: 0;
}

.cd-timeline-item__time {
  margin-bottom: var(--cd-timeline-item-gap, 8px);
}

.cd-timeline-item__time-text {
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-placeholder, #94a3b8);
}

.cd-timeline-item__body {
  font-size: var(--cd-font-size-base, 14px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-regular, #334155);
}
</style>
