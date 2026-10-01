<template>
  <view class="cd-step" :class="rootClass" :style="customStyle">
    <!-- ---------- 图标行 ----------
         两侧都放一个占位/线条：STEP 的图标必须在本格内水平居中，
         而连接线只负责「填满图标之间的空隙」。
         首尾那侧不放背景色，只留等宽占位，居中才不会被拉偏。 -->
    <view class="cd-step__head">
      <view class="cd-step__line cd-step__line--lead" :class="leadLineClass" />
      <view class="cd-step__icon" :class="`cd-step__icon--${stepStatus}`">
        <slot name="icon">
          <cd-icon v-if="iconName" :name="iconName" size="0.85em" />
          <text v-else class="cd-step__icon-text">{{ displayIndex }}</text>
        </slot>
      </view>
      <view class="cd-step__line cd-step__line--tail" :class="tailLineClass" />
    </view>

    <!-- ---------- 文案 ---------- -->
    <view class="cd-step__main">
      <view class="cd-step__title">
        <slot name="title">
          <text class="cd-step__title-text">{{ title }}</text>
        </slot>
      </view>
      <view v-if="description || $slots.description" class="cd-step__desc">
        <slot name="description">
          <text class="cd-step__desc-text">{{ description }}</text>
        </slot>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-step —— 步骤项
 * ---------------------------------------------------------------
 * 状态推导：先按「与 current 的相对位置」定基调（已完成 / 进行中 / 未开始），
 * 再允许单项覆盖 —— 这样业务不需要为「第 3 步报错了」去重算所有前序步骤的样式。
 *
 * 连线的着色有个容易写错的地方：一条连线属于「两个步骤之间」，
 * 它的颜色应该由**左边那个步骤**决定，所以：
 *   前置线（来自 i-1）→ 看 index <= current
 *   后置线（去往 i+1）→ 看 index <  current
 * 两个条件差了一格，这正是「最后一步的前置线已经变蓝、后置线还是灰的」的原因。
 */
import { computed, inject, onUnmounted, useSlots } from 'vue'
import { CD_STEPS_KEY } from '../../constants'

defineOptions({
  name: 'cd-step',
})

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  /** 自定义图标，覆盖数字 */
  icon: {
    type: String,
    default: '',
  },
  /** 单独覆盖本步骤状态：wait / process / finish / error */
  status: {
    type: String,
    default: '',
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

const steps = inject(CD_STEPS_KEY, null)

/** 脱离容器时退化为「单步、进行中」，不报错 */
const uid = steps ? steps.register() : 0
onUnmounted(() => {
  if (steps) steps.unregister(uid)
})

const index = computed(() => (steps ? steps.indexOf(uid) : 0))
const total = computed(() => (steps ? steps.total : 1))
const isFirst = computed(() => index.value <= 0)
const isLast = computed(() => index.value >= total.value - 1)
const current = computed(() => (steps ? steps.current.value : 0))

const stepStatus = computed(() => {
  if (props.status) return props.status
  if (!steps) return 'process'
  if (index.value < current.value) return 'finish'
  if (index.value === current.value) return steps.status.value
  return 'wait'
})

const iconName = computed(() => {
  if (props.icon) return props.icon
  if (stepStatus.value === 'finish') return 'check'
  if (stepStatus.value === 'error') return 'close'
  return ''
})

/** 数字展示从 1 开始 —— 说「第 0 步」没人能听懂 */
const displayIndex = computed(() => index.value + 1)

const leadLineClass = computed(() =>
  [isFirst.value ? 'cd-step__line--hidden' : '', !isFirst.value && index.value <= current.value ? 'cd-step__line--active' : '']
    .filter(Boolean)
    .join(' ')
)

const tailLineClass = computed(() =>
  [isLast.value ? 'cd-step__line--hidden' : '', !isLast.value && index.value < current.value ? 'cd-step__line--active' : '']
    .filter(Boolean)
    .join(' ')
)

const rootClass = computed(() =>
  [
    `cd-step--${stepStatus.value}`,
    isFirst.value ? 'cd-step--first' : '',
    isLast.value ? 'cd-step--last' : '',
    steps && steps.direction.value === 'vertical' ? 'cd-step--vertical' : 'cd-step--horizontal',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)
</script>

<script>
export default {
  name: 'cd-step',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-step {
  @include cd-reset;

  display: flex;
  min-width: 0;
}

/* ==================================================================
 * 图标
 * ================================================================== */
.cd-step__head {
  display: flex;
  align-items: center;
  min-width: 0;
}

.cd-step__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--cd-step-icon-size, 24px);
  height: var(--cd-step-icon-size, 24px);
  border-radius: var(--cd-radius-round, 999px);
  border: var(--cd-step-line-width, 2px) solid var(--cd-step-wait-border, #cbd5e1);
  background-color: var(--cd-bg-container, #ffffff);
  color: var(--cd-step-wait-color, #94a3b8);
  box-sizing: border-box;
}

.cd-step__icon-text {
  font-size: var(--cd-step-icon-font-size, 12px);
  font-weight: var(--cd-font-weight-medium, 500);
  line-height: 1;
}

/* 已完成 / 进行中：实心主色，边框同色 */
.cd-step__icon--finish,
.cd-step__icon--process {
  border-color: var(--cd-color-primary, #3b76f6);
  background-color: var(--cd-color-primary, #3b76f6);
  color: var(--cd-text-inverse, #ffffff);
}

/* 报错：只把当前这一步染红 */
.cd-step__icon--error {
  border-color: var(--cd-color-danger, #ef4444);
  background-color: var(--cd-color-danger, #ef4444);
  color: #ffffff;
}

/* 进行中再补一圈光晕，让「当前」在一排圆点里一眼可辨 */
.cd-step__icon--process {
  box-shadow: 0 0 0 3px var(--cd-color-primary-soft, #eff5ff);
}

.cd-step__line {
  flex: 1;
  min-width: 0;
  height: var(--cd-step-line-width, 2px);
  background-color: var(--cd-step-line-color, #e2e8f0);
}

.cd-step__line--active {
  background-color: var(--cd-color-primary, #3b76f6);
}

/* 首 / 尾那侧的占位：撑宽度但不画颜色 */
.cd-step__line--hidden {
  background-color: transparent;
}

/* ==================================================================
 * 水平：图标在上、文案在下，每格等宽
 * ================================================================== */
.cd-step--horizontal {
  flex: 1;
  flex-direction: column;
}

.cd-step--horizontal .cd-step__main {
  margin-top: var(--cd-space-2, 8px);
  padding: 0 var(--cd-space-1, 4px);
  text-align: center;
}

.cd-steps--align-start .cd-step--horizontal .cd-step__main {
  text-align: left;
}

/* ==================================================================
 * 垂直：图标成为左侧导轨，文案在右
 * ================================================================== */
.cd-step--vertical {
  flex-direction: row;
  align-items: stretch;
  width: 100%;
}

.cd-step--vertical .cd-step__head {
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: var(--cd-step-icon-size, 24px);
}

.cd-step--vertical .cd-step__line {
  flex: 1;
  width: var(--cd-step-line-width, 2px);
  height: auto;
  min-height: 12px;
}

/* 垂直时「占位」那一段直接收掉：图标的垂直居中对齐靠的是 flex 布局，
   不像水平方向那样需要一个等宽邻居来撑中心 */
.cd-step--vertical .cd-step__line--hidden {
  display: none;
}

.cd-step--vertical .cd-step__main {
  flex: 1;
  min-width: 0;
  padding: 0 0 var(--cd-space-5, 20px) var(--cd-space-3, 12px);
  text-align: left;
}

/* 垂直方向最后一步下方不留白，否则容器底部会多出一截空隙 */
.cd-step--vertical.cd-step--last .cd-step__main {
  padding-bottom: 0;
}

/* ==================================================================
 * 文案
 * ================================================================== */
.cd-step__title-text {
  font-size: var(--cd-step-title-font-size, 14px);
  font-weight: var(--cd-font-weight-medium, 500);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-secondary, #64748b);
}

.cd-step--finish .cd-step__title-text,
.cd-step--process .cd-step__title-text {
  color: var(--cd-text-primary, #0f172a);
}

.cd-step--error .cd-step__title-text {
  color: var(--cd-color-danger, #ef4444);
}

.cd-step__desc {
  margin-top: 2px;
}

.cd-step__desc-text {
  font-size: var(--cd-step-desc-font-size, 12px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-placeholder, #94a3b8);
}
</style>
