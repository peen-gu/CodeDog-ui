<template>
  <view class="cd-badge" :class="rootClass" :style="customStyle" @click="handleClick">
    <slot />

    <view v-if="visible" class="cd-badge__content" :class="contentClass">
      <text v-if="!isDot" class="cd-badge__text">{{ displayValue }}</text>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-badge —— 徽标 / 角标
 * ---------------------------------------------------------------
 * 两种用法共用一套 DOM，靠「有没有默认插槽」区分：
 *   - 有插槽 → 角标模式：包裹子元素，徽标绝对定位到右上角
 *   - 无插槽 → 独立模式：徽标就是一个普通的内联标签
 *
 * 为什么不拆成两个组件？因为二者的数字裁剪、隐藏逻辑、颜色取用完全一致，
 * 拆开会产生两份需要同步维护的判断逻辑。用一个 wrapper 类切换定位方式更省事。
 *
 * 一个细节：数字超过 max 时显示 `max+`，这个判断必须放在 computed 里而不是模板里，
 * 因为 value 可能是字符串（如 'new'），`>` 比较前需要先确认它确实是数字。
 * 反过来，数字字符串（接口常返回 '200'）也必须按数字处理 ——
 * 否则同一个数字换个类型，裁剪与 showZero 的行为就不一样了。
 */
import { computed, useSlots } from 'vue'

defineOptions({
  name: 'cd-badge',
})

const props = defineProps({
  /** 展示内容。数字与「数字字符串」都会按 max 裁剪，其余字符串原样展示 */
  value: {
    type: [String, Number],
    default: '',
  },
  /** 数字上限，超过显示 max+。传 NaN 等非有限数时不裁剪 */
  max: {
    type: Number,
    default: 99,
  },
  /** 小圆点模式，不展示内容 */
  isDot: {
    type: Boolean,
    default: false,
  },
  /** 强制隐藏（不需要用 v-if 销毁组件时用） */
  hidden: {
    type: Boolean,
    default: false,
  },
  /** 值为 0 时是否展示。默认不展示 —— 0 条未读通常不值得打扰用户 */
  showZero: {
    type: Boolean,
    default: false,
  },
  /** danger / primary / success / warning / info */
  type: {
    type: String,
    default: 'danger',
  },
  /** 描边形态，用于徽标压在彩色底上时保证可辨识 */
  outlined: {
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

const slots = useSlots()

/**
 * 只判存在性，不调用 slots.default()。
 * 与 cd-divider 同源：mp 端调用会抛 TypeError: i.default is not a function。
 * 详见 cd-divider.vue 中 hasContent 处的四条依据。
 */
const hasSlot = computed(() => !!slots.default)

/**
 * 把 value 归一成数字；不是数字时返回 null。
 *
 * 必须把「数字字符串」也算进来：接口返回的未读数常常是 '200' 而不是 200，
 * 而 prop 又明写着接受 String。只判 typeof === 'number' 的话，
 * '200' 会既不被裁剪（显示成 200 而非 99+），也不受 showZero 约束 ——
 * 同一个数字换个类型行为就不一样，是典型的类型敏感性 bug。
 * 非数字字符串（'new'、'hot'）返回 null，走原样展示。
 */
const numericValue = computed(() => {
  const v = props.value
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') {
    const s = v.trim()
    if (s === '') return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }
  return null
})

/** max 也做一次有限性校验：传进 NaN / undefined 时不裁剪，而不是显示成 'NaN+' */
const maxLimit = computed(() => (typeof props.max === 'number' && Number.isFinite(props.max) ? props.max : null))

/** 有没有值可展示（0 需要 showZero 才作数） */
const hasValue = computed(() => {
  const v = props.value
  if (v === '' || v === null || v === undefined) return false
  const n = numericValue.value
  if (n !== null) {
    if (n === 0) return props.showZero
    return n > 0
  }
  return true
})

const displayValue = computed(() => {
  const n = numericValue.value
  const max = maxLimit.value
  if (n !== null && max !== null && n > max) return `${max}+`
  return String(props.value)
})

const visible = computed(() => {
  if (props.hidden) return false
  if (props.isDot) return true
  return hasValue.value
})

const rootClass = computed(() =>
  [
    hasSlot.value ? 'cd-badge--wrapper' : 'cd-badge--standalone',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const contentClass = computed(() =>
  [
    `cd-badge--${props.type}`,
    props.isDot ? 'cd-badge__content--dot' : '',
    props.outlined ? 'cd-badge__content--outlined' : '',
  ]
    .filter(Boolean)
    .join(' ')
)

function handleClick(event) {
  emit('click', event)
}
</script>

<script>
export default {
  name: 'cd-badge',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-badge {
  @include cd-reset;

  display: inline-flex;
  vertical-align: middle;
}

/* 角标模式：撑开一块相对定位区域，徽标挂在右上角 */
.cd-badge--wrapper {
  position: relative;
}

.cd-badge--standalone {
  position: relative;
}

/* ==================================================================
 * 徽标本体
 * ================================================================== */
.cd-badge__content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--cd-badge-height, 18px);
  height: var(--cd-badge-height, 18px);
  padding: 0 5px;
  border-radius: var(--cd-radius-round, 999px);
  background-color: var(--cd-badge-bg, var(--cd-color-danger, #ef4444));
  color: var(--cd-text-inverse, #ffffff);
  font-size: var(--cd-badge-font-size, 11px);
  line-height: 1;
  white-space: nowrap;
}

/* 有插槽时才绝对定位；独立模式跟着文档流走 */
.cd-badge--wrapper .cd-badge__content {
  position: absolute;
  top: 0;
  right: 0;
  /* 往右上角挪出约 1/3，压在子元素边缘上 —— 这是角标的通用视觉约定 */
  transform: translate(50%, -50%);
  transform-origin: 100% 0;
  z-index: var(--cd-z-normal, 1);
}

.cd-badge__content--dot {
  min-width: var(--cd-badge-dot-size, 8px);
  width: var(--cd-badge-dot-size, 8px);
  height: var(--cd-badge-dot-size, 8px);
  padding: 0;
}

.cd-badge__content--outlined {
  box-shadow: 0 0 0 1.5px var(--cd-bg-container, #ffffff);
}

.cd-badge__text {
  display: block;
  line-height: 1;
}

/* ==================================================================
 * 类型
 * ================================================================== */
.cd-badge--primary {
  --cd-badge-bg: var(--cd-color-primary, #3b76f6);
}

.cd-badge--success {
  --cd-badge-bg: var(--cd-color-success, #22c55e);
}

.cd-badge--warning {
  --cd-badge-bg: var(--cd-color-warning, #f59e0b);
}

.cd-badge--danger {
  --cd-badge-bg: var(--cd-color-danger, #ef4444);
}

.cd-badge--info {
  --cd-badge-bg: var(--cd-color-info, #64748b);
}
</style>
