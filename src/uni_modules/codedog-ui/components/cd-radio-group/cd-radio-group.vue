<template>
  <view class="cd-radio-group" :class="rootClass" :style="customStyle">
    <slot />
  </view>
</template>

<script setup>
/**
 * cd-radio-group —— 单选组
 * ---------------------------------------------------------------
 * 结构与 cd-checkbox-group 对称，但状态是「单个值」而不是数组，
 * 所以没有 min/max 的概念，选中新值天然就是取消旧值。
 *
 * variant 支持两种视觉：
 *   radio  —— 圆点 + 文字，适合内容型选项（一段描述较长的选项）
 *   button —— 分段控件，选项少且名字短时占位更省，PC 上尤其常见
 * 视觉差异完全由 CSS 承担，DOM 结构只多一个类名。
 */
import { computed, provide } from 'vue'
import { CD_RADIO_GROUP_KEY } from '../../constants'
import { useField } from '../../composables/use-field'

defineOptions({
  name: 'cd-radio-group',
})

const props = defineProps({
  /** 当前选中值 */
  modelValue: {
    type: [String, Number, Boolean],
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** small / default / large */
  size: {
    type: String,
    default: '',
  },
  /** horizontal / vertical */
  direction: {
    type: String,
    default: 'horizontal',
  },
  /** radio / button */
  variant: {
    type: String,
    default: 'radio',
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

const { formDisabled, notifyChange, notifyBlur } = useField()

const isDisabled = computed(() => props.disabled || formDisabled.value)

/** 用 computed 包一层而不是直接传 prop：
   这样子项 inject 到的是 ref，能跟着父组件更新走 */
const selected = computed(() => props.modelValue)

function select(value) {
  if (isDisabled.value) return
  /* 重复点已选中项不再触发，避免业务收到无意义的 change */
  if (value === props.modelValue) return

  emit('update:modelValue', value)
  emit('change', value)
  notifyChange(value)
  notifyBlur()
}

const ctx = {
  selected,
  disabled: isDisabled,
  size: computed(() => props.size),
  variant: computed(() => props.variant),
  select,
}

provide(CD_RADIO_GROUP_KEY, ctx)

const rootClass = computed(() =>
  [
    `cd-radio-group--${props.direction}`,
    `cd-radio-group--${props.variant}`,
    isDisabled.value ? 'cd-radio-group--disabled' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)
</script>

<script>
export default {
  name: 'cd-radio-group',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-radio-group {
  @include cd-reset;

  display: flex;
  flex-wrap: wrap;
}

.cd-radio-group--horizontal {
  flex-direction: row;
  align-items: center;
}

.cd-radio-group--vertical {
  flex-direction: column;
  align-items: flex-start;
}

.cd-radio-group--horizontal .cd-radio + .cd-radio {
  margin-left: var(--cd-radio-gap, var(--cd-space-5, 20px));
}

.cd-radio-group--vertical .cd-radio + .cd-radio {
  margin-top: var(--cd-radio-gap, var(--cd-space-3, 12px));
}

/* 分段控件形态：选项之间不留空隙，由边框拼成一个整体 */
.cd-radio-group--button {
  display: inline-flex;
  flex-wrap: nowrap;
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radio-button-radius, var(--cd-radius-md, 8px));
  overflow: hidden;
}

.cd-radio-group--button.cd-radio-group--horizontal .cd-radio + .cd-radio,
.cd-radio-group--button.cd-radio-group--vertical .cd-radio + .cd-radio {
  margin: 0;
}

.cd-radio-group--button .cd-radio + .cd-radio {
  border-left: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
}
</style>
