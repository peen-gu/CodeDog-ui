<template>
  <view class="cd-checkbox-group" :class="rootClass" :style="customStyle">
    <slot />
  </view>
</template>

<script setup>
/**
 * cd-checkbox-group —— 多选组
 * ---------------------------------------------------------------
 * 组的职责只有三件事：持有选中数组、下发选中态、统一触发校验。
 *
 * 为什么校验由「组」触发而不是每个 checkbox 各触发一次？
 * 因为表单里的一个 prop 通常对应整组（比如 prop="hobbies"），
 * 如果每个子项都回调一次 onFieldChange，一次点击会触发 N 次校验，
 * 而 N-1 次读到的都是同一个数组。让组独占触发权，语义才清晰。
 *
 * 子项通过 provide/inject 拿上下文，所以 cd-checkbox 不需要知道
 * 自己在不在组里以外的事 —— 它只判断「有没有组」，然后决定
 * 是回调组还是自己 emit。
 */
import { computed, provide } from 'vue'
import { CD_CHECKBOX_GROUP_KEY } from '../../constants'
import { useField } from '../../composables/use-field'

defineOptions({
  name: 'cd-checkbox-group',
})

const props = defineProps({
  /** 选中值数组 */
  modelValue: {
    type: Array,
    default: () => [],
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
  /** 最少选中几项，达到下限后不允许再取消 */
  min: {
    type: Number,
    default: 0,
  },
  /** 最多选中几项，达到上限后不允许再选中 */
  max: {
    type: Number,
    default: Infinity,
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

const emit = defineEmits(['update:modelValue', 'change', 'overlimit'])

const { formDisabled, notifyChange, notifyBlur } = useField()

const isDisabled = computed(() => props.disabled || formDisabled.value)

const selected = computed(() => props.modelValue || [])

function toggle(value) {
  if (isDisabled.value) return

  const current = [...selected.value]
  const index = current.indexOf(value)

  if (index > -1) {
    if (current.length <= props.min) {
      emit('overlimit', { type: 'min', value, limit: props.min })
      return
    }
    current.splice(index, 1)
  } else {
    if (current.length >= props.max) {
      emit('overlimit', { type: 'max', value, limit: props.max })
      return
    }
    current.push(value)
  }

  emit('update:modelValue', current)
  emit('change', current)
  notifyChange(current)
  notifyBlur()
}

/* 上下文键名用 selected 而不是 value：
   如果叫 value，子项里就会写出 group.value.value —— 三层 .value 叠在一起，
   读代码的人需要停下来数清楚每个 value 到底是 ref 还是数组。 */
const ctx = {
  selected,
  disabled: isDisabled,
  size: computed(() => props.size),
  toggle,
}

provide(CD_CHECKBOX_GROUP_KEY, ctx)

const rootClass = computed(() =>
  [
    `cd-checkbox-group--${props.direction}`,
    isDisabled.value ? 'cd-checkbox-group--disabled' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)
</script>

<script>
export default {
  name: 'cd-checkbox-group',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-checkbox-group {
  @include cd-reset;

  display: flex;
  flex-wrap: wrap;
}

.cd-checkbox-group--horizontal {
  flex-direction: row;
  align-items: center;
}

.cd-checkbox-group--vertical {
  flex-direction: column;
  align-items: flex-start;
}

/* 横向排列时的子项间距。
   用相邻兄弟选择器而不是 :not(:last-child) —— 后者在小程序 WXSS 支持不稳 */
.cd-checkbox-group--horizontal .cd-checkbox + .cd-checkbox {
  margin-left: var(--cd-checkbox-gap, var(--cd-space-5, 20px));
}

.cd-checkbox-group--vertical .cd-checkbox + .cd-checkbox {
  margin-top: var(--cd-checkbox-gap, var(--cd-space-3, 12px));
}
</style>
