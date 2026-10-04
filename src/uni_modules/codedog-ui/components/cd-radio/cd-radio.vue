<template>
  <view class="cd-radio" :class="rootClass" :style="customStyle" @click="handleClick">
    <!-- ---------- 圆点（button 形态下由 CSS 隐藏） ---------- -->
    <view class="cd-radio__dot">
      <view class="cd-radio__dot-inner" />
    </view>

    <!-- ---------- 文字 ---------- -->
    <view v-if="label || $slots.default" class="cd-radio__label">
      <slot>
        <text class="cd-radio__label-text">{{ label }}</text>
      </slot>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-radio —— 单选框
 * ---------------------------------------------------------------
 * 与 cd-checkbox 一样支持「独立 / 组内」两种用法，区别只在值语义：
 * checkbox 组内是「集合是否包含我」，radio 组内是「当前值是否等于我」。
 *
 * button 形态的要点：圆点必须由 CSS 隐藏（display:none），
 * 而不是用 v-if 不渲染。因为如果靠 v-if，组件在切换 variant 时
 * DOM 会重建，focus 和过渡都会丢；而且业务如果自己在外面套了
 * 依赖子元素数量的逻辑也会受影响。视觉状态变化就交给 CSS。
 */
import { computed, inject } from 'vue'
import { CD_RADIO_GROUP_KEY } from '../../constants'
import { useField } from '../../composables/use-field'

defineOptions({
  name: 'cd-radio',
})

const props = defineProps({
  /** 独立用法下的选中态。组内用法请忽略它 */
  modelValue: {
    type: [String, Number, Boolean],
    default: '',
  },
  /** 组内用法下本项代表的值 */
  value: {
    type: [String, Number, Boolean],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** small / default / large，不传则跟随所在组 */
  size: {
    type: String,
    default: '',
  },
  /** radio / button，不传则跟随所在组 */
  variant: {
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

const emit = defineEmits(['update:modelValue', 'change'])

const group = inject(CD_RADIO_GROUP_KEY, null)

const { field, formDisabled, notifyChange, notifyBlur } = useField()

const isGrouped = computed(() => !!group)

/** 表单校验失败时单选框自身也要有错误视觉，否则看不出是哪个控件错了 */
const hasFormError = computed(() => !!(field && field.validateState && field.validateState.value === 'error'))

const isChecked = computed(() => {
  if (isGrouped.value) return group.selected.value === props.value
  /*
   * 独立用法且没传 value 时，modelValue 的默认值 '' 与 value 的默认值 ''
   * 相等，于是组件「天生就是选中的」。空 value 不参与相等判定。
   * modelValue 显式给 true 时（业务拿它当布尔开关用）仍然算选中。
   */
  if (props.modelValue === true) return true
  return props.value !== '' && props.modelValue === props.value
})

const isDisabled = computed(() => {
  if (props.disabled) return true
  if (isGrouped.value && group.disabled.value) return true
  return formDisabled.value
})

const effectiveSize = computed(() => props.size || (isGrouped.value ? group.size.value : '') || 'default')

const effectiveVariant = computed(
  () => props.variant || (isGrouped.value ? group.variant.value : '') || 'radio'
)

const rootClass = computed(() =>
  [
    `cd-radio--${effectiveSize.value}`,
    `cd-radio--${effectiveVariant.value}`,
    isChecked.value ? 'cd-radio--checked' : '',
    isDisabled.value ? 'cd-radio--disabled' : '',
    hasFormError.value ? 'cd-radio--error' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

function handleClick(event) {
  if (isDisabled.value) return

  if (isGrouped.value) {
    group.select(props.value)
    return
  }

  emit('update:modelValue', props.value)
  emit('change', props.value)
  notifyChange(props.value)
  notifyBlur()
}
</script>

<script>
export default {
  name: 'cd-radio',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-radio {
  @include cd-reset;

  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

/* ==================================================================
 * 圆点
 * ================================================================== */
.cd-radio__dot {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  border: var(--cd-border-width, 1px) solid var(--cd-border-color-strong, #cbd5e1);
  border-radius: var(--cd-radius-round, 999px);
  background-color: var(--cd-bg-container, #ffffff);
  transition: border-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

/* 内点用 scale 从 0 长到 1，比改宽高少一次重排，动效更跟手 */
.cd-radio__dot-inner {
  border-radius: var(--cd-radius-round, 999px);
  background-color: var(--cd-radio-color, var(--cd-color-primary, #3b76f6));
  transform: scale(0);
  transition: transform var(--cd-duration-fast, 150ms) var(--cd-ease-out, cubic-bezier(0.16, 1, 0.3, 1));
}

.cd-radio--small .cd-radio__dot {
  width: var(--cd-radio-size-sm, 16px);
  height: var(--cd-radio-size-sm, 16px);
}

.cd-radio--small .cd-radio__dot-inner {
  width: 6px;
  height: 6px;
}

.cd-radio--default .cd-radio__dot {
  width: var(--cd-radio-size, 18px);
  height: var(--cd-radio-size, 18px);
}

.cd-radio--default .cd-radio__dot-inner {
  width: 8px;
  height: 8px;
}

.cd-radio--large .cd-radio__dot {
  width: var(--cd-radio-size-lg, 22px);
  height: var(--cd-radio-size-lg, 22px);
}

.cd-radio--large .cd-radio__dot-inner {
  width: 10px;
  height: 10px;
}

.cd-radio--checked .cd-radio__dot {
  border-color: var(--cd-radio-color, var(--cd-color-primary, #3b76f6));
}

.cd-radio--checked .cd-radio__dot-inner {
  transform: scale(1);
}

/* ==================================================================
 * 文字
 * ================================================================== */
.cd-radio__label {
  margin-left: var(--cd-space-2, 8px);
  min-width: 0;
}

.cd-radio__label-text {
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-regular, #334155);
  line-height: var(--cd-line-height-base, 1.5);
}

.cd-radio--small .cd-radio__label-text {
  font-size: var(--cd-font-size-sm, 12px);
}

.cd-radio--large .cd-radio__label-text {
  font-size: var(--cd-font-size-md, 16px);
}

.cd-radio--checked .cd-radio__label-text {
  color: var(--cd-text-primary, #0f172a);
}

/* ==================================================================
 * 分段控件形态
 * ================================================================== */
.cd-radio--button {
  padding: 0 var(--cd-space-4, 16px);
  height: var(--cd-radio-button-height, var(--cd-control-height, 36px));
  justify-content: center;
  background-color: var(--cd-bg-container, #ffffff);
  color: var(--cd-text-regular, #334155);
  /* 去掉圆点，形态完全由背景色与文字色承担 */
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-radio--button .cd-radio__dot {
  display: none;
}

.cd-radio--button .cd-radio__label {
  margin-left: 0;
}

.cd-radio--button.cd-radio--small {
  height: var(--cd-control-height-sm, 28px);
  padding: 0 var(--cd-space-3, 12px);
}

.cd-radio--button.cd-radio--large {
  height: var(--cd-control-height-lg, 44px);
  padding: 0 var(--cd-space-5, 20px);
}

.cd-radio--button.cd-radio--checked {
  background-color: var(--cd-radio-color, var(--cd-color-primary, #3b76f6));
}

.cd-radio--button.cd-radio--checked .cd-radio__label-text {
  color: var(--cd-text-inverse, #ffffff);
}

/* ==================================================================
 * 状态
 * ================================================================== */
/* 校验失败：圆点描边转红 */
.cd-radio--error .cd-radio__dot {
  border-color: var(--cd-color-danger, #ef4444);
}

/* button 形态没有圆点，用一圈红环表达错误 */
.cd-radio--error.cd-radio--button {
  box-shadow: 0 0 0 1px var(--cd-color-danger, #ef4444);
}

.cd-radio--disabled {
  opacity: 0.5;
}

.cd-radio--disabled .cd-radio__dot {
  background-color: var(--cd-bg-disabled, #f1f5f9);
  border-color: var(--cd-border-color, #e2e8f0);
}

.cd-radio--disabled.cd-radio--checked .cd-radio__dot {
  border-color: var(--cd-radio-color, var(--cd-color-primary, #3b76f6));
}

.cd-radio--disabled.cd-radio--button {
  background-color: var(--cd-bg-disabled, #f1f5f9);
}

.cd-radio:not(.cd-radio--disabled):active .cd-radio__dot {
  transform: scale(0.92);
}

@include cd-hover {
  .cd-radio:not(.cd-radio--disabled):hover .cd-radio__dot {
    border-color: var(--cd-radio-color, var(--cd-color-primary, #3b76f6));
  }

  .cd-radio--button:not(.cd-radio--disabled):not(.cd-radio--checked):hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
    color: var(--cd-radio-color, var(--cd-color-primary, #3b76f6));
  }
}
</style>
