<template>
  <view class="cd-stepper" :class="rootClass" :style="customStyle">
    <!-- ---------- 减 ---------- -->
    <view
      class="cd-stepper__btn cd-stepper__btn--minus"
      @touchstart="startPress('minus')"
      @mousedown="startPress('minus')"
      @touchend="stopPress"
      @touchcancel="stopPress"
      @mouseup="stopPress"
      @mouseleave="stopPress"
    >
      <cd-icon name="minus" size="0.9em" />
    </view>

    <!-- ---------- 数值 ---------- -->
    <view class="cd-stepper__field" :style="fieldStyle">
      <input
        v-if="editable"
        class="cd-stepper__input"
        type="digit"
        :value="displayValue"
        :disabled="isDisabled"
        :style="inputStyle"
        @input="handleInput"
        @blur="handleBlur"
      />
      <text v-else class="cd-stepper__text">{{ displayValue }}</text>
    </view>

    <!-- ---------- 加 ---------- -->
    <view
      class="cd-stepper__btn cd-stepper__btn--plus"
      @touchstart="startPress('plus')"
      @mousedown="startPress('plus')"
      @touchend="stopPress"
      @touchcancel="stopPress"
      @mouseup="stopPress"
      @mouseleave="stopPress"
    >
      <cd-icon name="plus" size="0.9em" />
    </view>
  </view>
</template>

<script setup>
/**
 * cd-stepper —— 步进器
 * ---------------------------------------------------------------
 * 三个不那么显然的决定：
 *
 * 1. 用「按下」而不是「点击」触发加减。
 *    因为要支持长按连加：如果同时绑 @click 和长按，长按结束时会再补一次 click，
 *    结果是「松手多跳一格」。改成按下即响应 + 延时进入连加，行为就和原生一致了。
 *
 * 2. 同时绑 touchstart 和 mousedown。
 *    只绑 touch* 在 PC 浏览器上完全没反应（鼠标不产生 touch 事件），
 *    只绑 mouse* 在移动端也不可靠。两者都绑是最省事的跨端答案，
 *    并且用 pressing 标志位防止移动端 touchstart 之后紧跟的 mousedown 造成重复触发。
 *
 * 3. 手动输入的中间态不立即提交。
 *    用户想输 "15" 时会先经过 "1" 这个状态。如果每次 input 都提交并钳制，
 *    输 15 的过程中就会被 min 拦成 min 值，用户永远输不进想要的值。
 *    所以内部存 displayValue，只在失焦时提交。
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import { useField } from '../../composables/use-field'

/** 长按多久进入连加（毫秒） */
const HOLD_DELAY = 450
/** 连加间隔（毫秒） */
const REPEAT_INTERVAL = 80

defineOptions({
  name: 'cd-stepper',
})

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
  min: {
    type: Number,
    default: -Infinity,
  },
  max: {
    type: Number,
    default: Infinity,
  },
  step: {
    type: Number,
    default: 1,
  },
  /**
   * 小数位数。默认 -1 表示「按 step 自动推断」：
   * step=0.1 得到 1 位小数，step=1 得到 0 位。
   */
  precision: {
    type: Number,
    default: -1,
  },
  /** 强制整数（优先级高于 precision） */
  integer: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** small / default / large */
  size: {
    type: String,
    default: 'default',
  },
  /** 允许手动输入 */
  editable: {
    type: Boolean,
    default: true,
  },
  /** 数值区的宽度 */
  fieldWidth: {
    type: [String, Number],
    default: 48,
  },
  /** 加减前的钩子，返回 false / reject 则取消。可以是 async 函数 */
  beforeChange: {
    type: Function,
    default: null,
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

const emit = defineEmits(['update:modelValue', 'change', 'overlimit', 'focus', 'blur'])

const { formDisabled, notifyChange, notifyBlur } = useField()

const isDisabled = computed(() => props.disabled || formDisabled.value)

/** 手动输入的中间态。null 表示「没有正在编辑」，此时展示 props.modelValue */
const draft = ref(null)

const effectivePrecision = computed(() => {
  if (props.integer) return 0
  if (props.precision >= 0) return props.precision
  const text = String(props.step)
  const dot = text.indexOf('.')
  return dot > -1 ? text.length - dot - 1 : 0
})

function round(value) {
  const factor = Math.pow(10, effectivePrecision.value)
  return Math.round(value * factor) / factor
}

function clamp(value) {
  let result = value
  if (result < props.min) result = props.min
  if (result > props.max) result = props.max
  return round(result)
}

const currentValue = computed(() => clamp(Number(props.modelValue) || 0))

const displayValue = computed(() => {
  if (draft.value !== null) return draft.value
  return String(currentValue.value)
})

const minusDisabled = computed(() => isDisabled.value || currentValue.value <= props.min)
const plusDisabled = computed(() => isDisabled.value || currentValue.value >= props.max)

const rootClass = computed(() =>
  [
    `cd-stepper--${props.size}`,
    isDisabled.value ? 'cd-stepper--disabled' : '',
    minusDisabled.value ? 'cd-stepper--minus-disabled' : '',
    plusDisabled.value ? 'cd-stepper--plus-disabled' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const fieldStyle = computed(() => {
  const width = typeof props.fieldWidth === 'number' ? `${props.fieldWidth}px` : String(props.fieldWidth)
  return `width:${width};`
})

/** 输入框的字号要跟着尺寸档位走，否则大号步进器里会是一行小字 */
const inputStyle = computed(() => {
  const sizeMap = { small: 12, default: 14, large: 16 }
  return `font-size:${sizeMap[props.size] || 14}px;`
})

/* ------------------------------------------------------------------
 * 提交
 * ------------------------------------------------------------------ */

async function commit(nextValue, source) {
  const next = clamp(nextValue)
  const previous = currentValue.value

  if (next === previous) {
    /* 撞到边界：通知业务，但不要静默 —— 静默会让业务以为是自己的数据有问题 */
    if (source === 'plus' && nextValue !== previous) {
      emit('overlimit', { type: 'max', limit: props.max, value: nextValue })
    } else if (source === 'minus' && nextValue !== previous) {
      emit('overlimit', { type: 'min', limit: props.min, value: nextValue })
    }
    return
  }

  if (props.beforeChange) {
    let allowed = false
    try {
      allowed = await props.beforeChange(next)
    } catch (error) {
      allowed = false
    }
    if (allowed === false) return
  }

  emit('update:modelValue', next)
  emit('change', next)
  notifyChange(next)
}

function stepBy(direction) {
  const delta = direction === 'plus' ? props.step : -props.step
  commit(currentValue.value + delta, direction)
}

/* ------------------------------------------------------------------
 * 长按连加
 * ------------------------------------------------------------------ */

let holdTimer = null
let repeatTimer = null
let pressing = false
/** 记录当前按住的方向，连加时方向不变 */
let pressDirection = ''

function clearTimers() {
  if (holdTimer) {
    clearTimeout(holdTimer)
    holdTimer = null
  }
  if (repeatTimer) {
    clearInterval(repeatTimer)
    repeatTimer = null
  }
}

function startPress(direction) {
  if (isDisabled.value || pressing) return
  /* 越界方向的按钮点下去不该有任何反应，包括连加 */
  if (direction === 'plus' && plusDisabled.value) return
  if (direction === 'minus' && minusDisabled.value) return

  pressing = true
  pressDirection = direction

  /* 按下即响应，不等待长按判定 —— 等 450ms 才动会让人以为按钮失灵 */
  stepBy(direction)

  holdTimer = setTimeout(() => {
    repeatTimer = setInterval(() => {
      /* 连加过程中撞到边界就停下来，否则会一直空转并持续触发 overlimit */
      if (pressDirection === 'plus' && plusDisabled.value) {
        stopPress()
        return
      }
      if (pressDirection === 'minus' && minusDisabled.value) {
        stopPress()
        return
      }
      stepBy(pressDirection)
    }, REPEAT_INTERVAL)
  }, HOLD_DELAY)
}

function stopPress() {
  pressing = false
  pressDirection = ''
  clearTimers()
}

onUnmounted(clearTimers)

/* ------------------------------------------------------------------
 * 手动输入
 * ------------------------------------------------------------------ */

function handleInput(event) {
  draft.value = event.detail.value
}

function handleBlur(event) {
  const raw = draft.value
  draft.value = null

  emit('blur', event)
  notifyBlur()

  if (raw === '' || raw === null || raw === undefined) return

  const parsed = Number(raw)
  /* 输了个非数字（比如只敲了一个小数点）就当没改过，回退到当前值 */
  if (isNaN(parsed)) return

  commit(parsed, 'input')
}

/* 外部改了 modelValue 时清掉草稿，否则输入框会一直显示用户上次没提交的内容 */
watch(
  () => props.modelValue,
  () => {
    draft.value = null
  }
)
</script>

<script>
export default {
  name: 'cd-stepper',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-stepper {
  @include cd-reset;

  display: inline-flex;
  align-items: stretch;
  vertical-align: middle;
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-stepper-radius, var(--cd-radius-md, 8px));
  overflow: hidden;
  background-color: var(--cd-bg-container, #ffffff);
}

/* ==================================================================
 * 加减按钮
 * ================================================================== */
.cd-stepper__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: var(--cd-bg-sunken, #f1f5f9);
  color: var(--cd-text-regular, #334155);
  /* 长按连加时浏览器会尝试选中文字，压掉它 */
  user-select: none;
  -webkit-user-select: none;
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-stepper__btn--minus {
  border-right: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
}

.cd-stepper__btn--plus {
  border-left: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
}

/* ==================================================================
 * 尺寸
 * ================================================================== */
.cd-stepper--small .cd-stepper__btn {
  width: var(--cd-stepper-btn-sm, 26px);
  height: var(--cd-control-height-sm, 28px);
}

.cd-stepper--default .cd-stepper__btn {
  width: var(--cd-stepper-btn, 32px);
  height: var(--cd-control-height, 36px);
}

.cd-stepper--large .cd-stepper__btn {
  width: var(--cd-stepper-btn-lg, 40px);
  height: var(--cd-control-height-lg, 44px);
}

/* ==================================================================
 * 数值区
 * ================================================================== */
.cd-stepper__field {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cd-stepper__input,
.cd-stepper__text {
  width: 100%;
  height: 100%;
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-medium, 500);
  color: var(--cd-text-primary, #0f172a);
  text-align: center;
  line-height: 1;
  /* 等宽数字让加减时数字不会左右抖动 —— 这在步进器上特别明显 */
  font-variant-numeric: tabular-nums;
}

/* input 是原生组件，默认带一层自己的背景和边框，必须显式清掉 */
.cd-stepper__input {
  padding: 0;
  margin: 0;
  border: none;
  background-color: transparent;
  min-height: 0;
}

.cd-stepper__text {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ==================================================================
 * 状态
 * ================================================================== */
.cd-stepper--disabled {
  opacity: 0.6;
  background-color: var(--cd-bg-disabled, #f1f5f9);
}

/* 到达边界的那个按钮要明显「点不动」，否则用户会反复戳 */
.cd-stepper--minus-disabled .cd-stepper__btn--minus,
.cd-stepper--plus-disabled .cd-stepper__btn--plus {
  color: var(--cd-text-disabled, #cbd5e1);
  background-color: var(--cd-bg-disabled, #f1f5f9);
}

@include cd-hover {
  .cd-stepper:not(.cd-stepper--disabled):not(.cd-stepper--minus-disabled) .cd-stepper__btn--minus:hover,
  .cd-stepper:not(.cd-stepper--disabled):not(.cd-stepper--plus-disabled) .cd-stepper__btn--plus:hover {
    background-color: var(--cd-bg-active, rgba(15, 23, 42, 0.08));
    color: var(--cd-color-primary, #3b76f6);
  }
}
</style>
