<template>
  <view class="cd-checkbox" :class="rootClass" :style="customStyle" @click="handleClick">
    <!-- ---------- 勾选框 ---------- -->
    <view class="cd-checkbox__box">
      <!-- 不确定态优先于选中态：三态复选框里「部分选中」是更强的信息 -->
      <cd-icon v-if="indeterminate && !isChecked" name="minus" size="0.7em" />
      <cd-icon v-else-if="isChecked" name="check" size="0.7em" />
    </view>

    <!-- ---------- 文字 ---------- -->
    <view v-if="label || $slots.default" class="cd-checkbox__label">
      <slot>
        <text class="cd-checkbox__label-text">{{ label }}</text>
      </slot>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-checkbox —— 复选框
 * ---------------------------------------------------------------
 * 一个组件承担两种用法，靠「有没有被 cd-checkbox-group 包住」区分：
 *
 *   独立用法：v-model="agree"            modelValue 是布尔
 *   组内用法：<cd-checkbox-group v-model="list"><cd-checkbox value="a" />
 *              此时 modelValue 不参与，选中态由组的数组决定
 *
 * 为什么不在组内也用 modelValue？因为组内每一项的「值」和「选中态」是两件事，
 * 如果复用 modelValue，业务就得为每个选项准备一个 ref，写完 5 个选项就有 5 个
 * ref 加一个数组要同步 —— 这是 Element/Ant 都踩过并最终放弃的写法。
 *
 * Vue3 的 v-model 是单向的（props.modelValue + emit），所以独立用法下
 * 必须自己 emit，不能直接改 props —— 这在组内由 group.toggle 统一处理。
 */
import { computed, inject } from 'vue'
import { CD_CHECKBOX_GROUP_KEY } from '../../constants'
import { useField } from '../../composables/use-field'

defineOptions({
  name: 'cd-checkbox',
})

const props = defineProps({
  /** 独立用法下的选中态（布尔）。组内用法请忽略它 */
  modelValue: {
    type: Boolean,
    default: false,
  },
  /** 组内用法下本项的标识值 */
  value: {
    type: [String, Number, Boolean],
    default: '',
  },
  /** 文字，也可以用默认插槽 */
  label: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 不确定态（一般用于「全选」）：显示横杠而不是勾 */
  indeterminate: {
    type: Boolean,
    default: false,
  },
  /** small / default / large，不传则跟随所在组 */
  size: {
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

const group = inject(CD_CHECKBOX_GROUP_KEY, null)

const { field, formDisabled, notifyChange, notifyBlur } = useField()

const isGrouped = computed(() => !!group)

/** 表单校验失败时复选框自身也要有错误视觉，否则看不出是哪个控件错了 */
const hasFormError = computed(() => !!(field && field.validateState && field.validateState.value === 'error'))

const isChecked = computed(() => {
  if (isGrouped.value) {
    const list = group.selected.value || []
    return list.indexOf(props.value) > -1
  }
  return !!props.modelValue
})

const isDisabled = computed(() => {
  if (props.disabled) return true
  if (isGrouped.value && group.disabled.value) return true
  return formDisabled.value
})

const effectiveSize = computed(() => props.size || (isGrouped.value ? group.size.value : '') || 'default')

const rootClass = computed(() =>
  [
    `cd-checkbox--${effectiveSize.value}`,
    isChecked.value ? 'cd-checkbox--checked' : '',
    props.indeterminate && !isChecked.value ? 'cd-checkbox--indeterminate' : '',
    isDisabled.value ? 'cd-checkbox--disabled' : '',
    hasFormError.value ? 'cd-checkbox--error' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

function handleClick(event) {
  if (isDisabled.value) return

  if (isGrouped.value) {
    /* 组内：只管把「我被点了」告诉组，值数组与校验都由组负责。
       这里刻意不发 change / notifyChange —— 否则一次点击会触发多次校验 */
    group.toggle(props.value)
    return
  }

  const next = !props.modelValue
  emit('update:modelValue', next)
  emit('change', next)
  notifyChange(next)
  notifyBlur()
}
</script>

<script>
export default {
  name: 'cd-checkbox',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-checkbox {
  @include cd-reset;

  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

/* ==================================================================
 * 勾选框
 * ================================================================== */
.cd-checkbox__box {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  border: var(--cd-border-width, 1px) solid var(--cd-border-color-strong, #cbd5e1);
  border-radius: var(--cd-checkbox-radius, 4px);
  background-color: var(--cd-bg-container, #ffffff);
  color: var(--cd-text-inverse, #ffffff);
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    border-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-checkbox--small .cd-checkbox__box {
  width: var(--cd-checkbox-size-sm, 16px);
  height: var(--cd-checkbox-size-sm, 16px);
  font-size: 16px;
}

.cd-checkbox--default .cd-checkbox__box {
  width: var(--cd-checkbox-size, 18px);
  height: var(--cd-checkbox-size, 18px);
  font-size: 18px;
}

.cd-checkbox--large .cd-checkbox__box {
  width: var(--cd-checkbox-size-lg, 22px);
  height: var(--cd-checkbox-size-lg, 22px);
  font-size: 22px;
}

.cd-checkbox--checked .cd-checkbox__box,
.cd-checkbox--indeterminate .cd-checkbox__box {
  background-color: var(--cd-checkbox-color, var(--cd-color-primary, #3b76f6));
  border-color: var(--cd-checkbox-color, var(--cd-color-primary, #3b76f6));
}

/* ==================================================================
 * 文字
 * ================================================================== */
.cd-checkbox__label {
  margin-left: var(--cd-space-2, 8px);
  min-width: 0;
}

.cd-checkbox__label-text {
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-regular, #334155);
  line-height: var(--cd-line-height-base, 1.5);
}

.cd-checkbox--small .cd-checkbox__label-text {
  font-size: var(--cd-font-size-sm, 12px);
}

.cd-checkbox--large .cd-checkbox__label-text {
  font-size: var(--cd-font-size-md, 16px);
}

.cd-checkbox--checked .cd-checkbox__label-text {
  color: var(--cd-text-primary, #0f172a);
}

/* ==================================================================
 * 状态
 * ================================================================== */
/* 校验失败：勾选框描边转红。已勾选时底色本身就是主色，靠描边区分不现实，
   所以只在未勾选状态下生效 —— 未勾选正是「必勾没勾」这个最常见的错误态 */
.cd-checkbox--error:not(.cd-checkbox--checked):not(.cd-checkbox--indeterminate) .cd-checkbox__box {
  border-color: var(--cd-color-danger, #ef4444);
}

.cd-checkbox--disabled {
  opacity: 0.5;
}

.cd-checkbox--disabled .cd-checkbox__box {
  background-color: var(--cd-bg-disabled, #f1f5f9);
  border-color: var(--cd-border-color, #e2e8f0);
}

/* 禁用的已选项保留主色底但降透明度，
   否则「已选 + 禁用」会看起来像「未选 + 禁用」，用户会以为值丢了 */
.cd-checkbox--disabled.cd-checkbox--checked .cd-checkbox__box {
  background-color: var(--cd-checkbox-color, var(--cd-color-primary, #3b76f6));
  border-color: var(--cd-checkbox-color, var(--cd-color-primary, #3b76f6));
}

.cd-checkbox:not(.cd-checkbox--disabled):active .cd-checkbox__box {
  transform: scale(0.92);
}

@include cd-hover {
  .cd-checkbox:not(.cd-checkbox--disabled):hover .cd-checkbox__box {
    border-color: var(--cd-checkbox-color, var(--cd-color-primary, #3b76f6));
  }

  .cd-checkbox:not(.cd-checkbox--disabled):hover .cd-checkbox__label-text {
    color: var(--cd-checkbox-color, var(--cd-color-primary, #3b76f6));
  }
}
</style>
