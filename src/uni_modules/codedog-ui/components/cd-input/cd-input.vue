<template>
  <view class="cd-input" :class="rootClass" :style="customStyle">
    <!-- ---------- 前置 ---------- -->
    <view v-if="prefixIcon || $slots.prefix" class="cd-input__affix cd-input__affix--prefix">
      <slot name="prefix">
        <cd-icon :name="prefixIcon" :size="iconSize" />
      </slot>
    </view>

    <!-- ---------- 输入体 ---------- -->
    <textarea
      v-if="isTextarea"
      class="cd-input__field cd-input__field--textarea"
      :class="fieldClass"
      :style="fieldStyle"
      :value="displayValue"
      :placeholder="placeholder"
      placeholder-class="cd-input__placeholder"
      :disabled="isDisabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :auto-height="autoHeight"
      :focus="focus"
      :cursor-spacing="20"
      :show-confirm-bar="false"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <input
      v-else
      class="cd-input__field"
      :class="fieldClass"
      :style="alignStyle"
      :value="displayValue"
      :type="effectiveType"
      :password="isPassword && !passwordVisible"
      :placeholder="placeholder"
      placeholder-class="cd-input__placeholder"
      :disabled="isDisabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :focus="focus"
      :confirm-type="confirmType"
      :cursor-spacing="20"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @confirm="handleConfirm"
    />

    <!-- ---------- 字数统计 ---------- -->
    <text v-if="showCounter" class="cd-input__counter">{{ currentLength }}/{{ maxlength }}</text>

    <!-- ---------- 密码可见切换（仅密码类型） ---------- -->
    <view v-if="isPassword && showPasswordToggle" class="cd-input__action" @click="togglePasswordVisible">
      <cd-icon :name="passwordVisible ? 'eye' : 'eye-off'" :size="iconSize" />
    </view>

    <!-- ---------- 一键清空 ---------- -->
    <view v-if="showClear" class="cd-input__action" @click.stop="handleClear">
      <cd-icon name="close-circle" :size="iconSize" />
    </view>

    <!-- ---------- 后置 ---------- -->
    <view v-if="suffixIcon || $slots.suffix" class="cd-input__affix cd-input__affix--suffix">
      <slot name="suffix">
        <cd-icon :name="suffixIcon" :size="iconSize" />
      </slot>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-input —— 输入框
 * ---------------------------------------------------------------
 * 跨端要点（每一条都是踩过的坑，不是理论）：
 *
 * 1. placeholder 颜色必须用 placeholder-class，不能用 placeholder-style。
 *    小程序的原生 input 是原生组件，它解析样式时拿不到页面作用域的 CSS 变量，
 *    `placeholder-style="color: var(--cd-text-placeholder)"` 会直接失效；
 *    而 placeholder-class 是一个真实类名，走正常样式层叠，变量能正确解析。
 *
 * 2. 密码态要同时给 type 和 password 两个属性。
 *    小程序 input 没有 type="password"，它靠布尔属性 password；
 *    H5 靠 type="password"。两个都给，两端各取所需。
 *
 * 3. textarea 在微信小程序里是原生组件，永远盖在最上层 ——
 *    它无法被 popup / dialog 的遮罩遮挡，这是小程序架构限制，无解（除非用 cover-view）。
 *    框架的处理方式是：弹层里尽量用 input，确需多行时接受这个限制，并在文档中写明。
 *
 * 4. 表单联动通过 inject 实现，且是「可选依赖」：
 *    inject(CD_FORM_ITEM_KEY, null) 的默认值必须是 null，
 *    这样 cd-input 单独使用（不套 cd-form-item）时完全不报错。
 */
import { computed, ref, watch } from 'vue'
import { useField } from '../../composables/use-field'

defineOptions({
  name: 'cd-input',
})

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  /** text / number / digit / idcard / password / textarea */
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /**
   * 只读：可看不可改。
   * 必须同时透传给原生 input / textarea —— 只加一个「看起来只读」的类名，
   * 用户照样能往里打字。
   */
  readonly: {
    type: Boolean,
    default: false,
  },
  /** 有值且聚焦以外时显示清空按钮 */
  clearable: {
    type: Boolean,
    default: false,
  },
  /**
   * 最大长度。-1 表示不限制。
   * 刻意不采用小程序默认的 140 —— 一个 UI 框架不该在用户没要求时截断输入。
   */
  maxlength: {
    type: [Number, String],
    default: -1,
  },
  /** 显示 x/y 字数统计，仅在 maxlength > 0 时生效 */
  showWordLimit: {
    type: Boolean,
    default: false,
  },
  prefixIcon: {
    type: String,
    default: '',
  },
  suffixIcon: {
    type: String,
    default: '',
  },
  /** small / medium / large */
  size: {
    type: String,
    default: 'medium',
  },
  /** 输入内容对齐方式，金额类输入常用 right */
  align: {
    type: String,
    default: 'left',
  },
  /** 外部传入的错误态（与表单校验态取或） */
  error: {
    type: Boolean,
    default: false,
  },
  /** textarea 初始行数 */
  rows: {
    type: Number,
    default: 3,
  },
  /** textarea 随内容自动增高 */
  autoHeight: {
    type: Boolean,
    default: false,
  },
  /** 密码类型是否显示「小眼睛」 */
  showPasswordToggle: {
    type: Boolean,
    default: true,
  },
  focus: {
    type: Boolean,
    default: false,
  },
  /** 键盘右下角按钮文案：done / send / search / next / go */
  confirmType: {
    type: String,
    default: 'done',
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

const emit = defineEmits(['update:modelValue', 'input', 'change', 'focus', 'blur', 'confirm', 'clear'])

/* -------------------- 表单上下文（可选） -------------------- */

/**
 * 这里刻意用 inject 而不是 findParent 之类的实现：
 * 小程序端没有可用的组件实例树遍历，provide/inject 是唯一两端一致的方式。
 */
const { field, formDisabled, notifyChange, notifyBlur } = useField()

/* -------------------- 状态 -------------------- */

const isFocused = ref(false)
const passwordVisible = ref(false)
/** 本地长度，用于字数统计。以输入事件为准，而非 props，避免受控组件回写延迟影响显示 */
const localLength = ref(String(props.modelValue ?? '').length)

watch(
  () => props.modelValue,
  (value) => {
    localLength.value = String(value ?? '').length
  }
)

/* -------------------- 计算 -------------------- */

const isTextarea = computed(() => props.type === 'textarea')
const isPassword = computed(() => props.type === 'password')

/** 与表单的 disabled 取或：任一来源要求禁用就禁用 */
const isDisabled = computed(() => props.disabled || formDisabled.value)

const isError = computed(() => props.error || !!(field && field.validateState && field.validateState.value === 'error'))

const displayValue = computed(() => (props.modelValue === null || props.modelValue === undefined ? '' : props.modelValue))

const effectiveType = computed(() => {
  if (!isPassword.value) return props.type
  return passwordVisible.value ? 'text' : 'password'
})

const showCounter = computed(() => props.showWordLimit && Number(props.maxlength) > 0)
const currentLength = computed(() => localLength.value)

const hasValue = computed(() => String(props.modelValue ?? '').length > 0)
const showClear = computed(() => props.clearable && hasValue.value && !isDisabled.value && !props.readonly)

const iconSize = computed(() => (props.size === 'small' ? 14 : props.size === 'large' ? 18 : 16))

const rootClass = computed(() =>
  [
    `cd-input--${props.size}`,
    isTextarea.value ? 'cd-input--textarea' : '',
    isFocused.value ? 'cd-input__wrap--focused' : '',
    isError.value ? 'cd-input__wrap--error' : '',
    isDisabled.value ? 'cd-input__wrap--disabled' : '',
    props.readonly ? 'cd-input__wrap--readonly' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const fieldClass = computed(() => `cd-input__field--align-${props.align}`)

/**
 * 对齐方式走内联样式而不是类名：
 * 小程序的原生 input 是原生组件，类名样式在部分机型上对 text-align 不稳定，
 * 内联样式是唯一被所有内核一致处理的形式。
 */
const alignStyle = computed(() => `text-align:${props.align};`)

/** textarea 用行数控制初始高度；autoHeight 时交给原生组件自适应 */
const fieldStyle = computed(() => {
  if (isTextarea.value && !props.autoHeight) {
    return `height:${props.rows * 22 + 12}px;`
  }
  return ''
})

/* -------------------- 交互 -------------------- */

function handleInput(event) {
  const value = event.detail.value
  localLength.value = String(value ?? '').length
  emit('update:modelValue', value)
  emit('input', value)
  /* 表单校验的 change 触发器依赖这个回调 */
  notifyChange(value)
}

function handleFocus(event) {
  isFocused.value = true
  emit('focus', event)
}

function handleBlur(event) {
  isFocused.value = false
  emit('blur', event.detail.value)
  notifyBlur()
}

function handleConfirm(event) {
  emit('confirm', event.detail.value)
}

function handleClear() {
  localLength.value = 0
  emit('update:modelValue', '')
  emit('input', '')
  emit('clear')
  notifyChange('')
}

function togglePasswordVisible() {
  passwordVisible.value = !passwordVisible.value
}

defineExpose({
  /** 供表单 resetFields 后强制清空本地计数 */
  resetLength() {
    localLength.value = String(props.modelValue ?? '').length
  },
})
</script>

<script>
export default {
  name: 'cd-input',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

/* ==================================================================
 * 外壳
 * ================================================================== */
.cd-input {
  @include cd-reset;

  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--cd-input-height, 36px);
  padding: 0 var(--cd-input-padding-x, 12px);
  background-color: var(--cd-bg-container, #ffffff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-input-radius, 8px);
  transition: border-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    box-shadow var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-input--small {
  min-height: var(--cd-input-height-sm, 28px);
  font-size: var(--cd-font-size-sm, 12px);
}

.cd-input--large {
  min-height: var(--cd-input-height-lg, 44px);
  font-size: var(--cd-font-size-md, 16px);
}

/* textarea 形态：内容决定高度，外壳改为顶部对齐 */
.cd-input--textarea {
  align-items: flex-start;
  padding-top: var(--cd-space-2, 8px);
  padding-bottom: var(--cd-space-2, 8px);
}

@include cd-hover {
  .cd-input:hover {
    border-color: var(--cd-border-color-strong, #cbd5e1);
  }

  .cd-input.cd-input__wrap--disabled:hover {
    border-color: var(--cd-border-color, #e2e8f0);
  }
}

/* 聚焦：主色描边 + 柔和外发光。PC 端这是「当前焦点在哪」的唯一视觉线索 */
.cd-input.cd-input__wrap--focused {
  border-color: var(--cd-color-primary, #3b76f6);
  box-shadow: 0 0 0 3px var(--cd-color-primary-soft, #eff5ff);
}

.cd-input.cd-input__wrap--error {
  border-color: var(--cd-color-danger, #ef4444);
}

.cd-input.cd-input__wrap--error.cd-input__wrap--focused {
  box-shadow: 0 0 0 3px var(--cd-color-danger-soft, #fef2f2);
}

.cd-input.cd-input__wrap--disabled {
  cursor: not-allowed;
  background-color: var(--cd-bg-disabled, #f1f5f9);
}

.cd-input.cd-input__wrap--readonly {
  background-color: var(--cd-bg-sunken, #f1f5f9);
}

/* ==================================================================
 * 输入体
 * ================================================================== */
.cd-input__field {
  flex: 1;
  min-width: 0;
  height: 100%;
  min-height: 20px;
  padding: 0;
  margin: 0;
  background-color: transparent;
  border: none;
  outline: none;
  font-size: inherit;
  font-family: inherit;
  color: var(--cd-text-primary, #0f172a);
  /* 小程序 input 默认有内边距，不清掉会和外壳 padding 叠加 */
  box-sizing: border-box;
}

.cd-input__field--textarea {
  width: 100%;
  height: auto;
  min-height: 44px;
  line-height: 22px;
}

.cd-input__field--align-right {
  text-align: right;
}

.cd-input__field--align-center {
  text-align: center;
}

.cd-input__wrap--disabled .cd-input__field {
  color: var(--cd-text-disabled, #cbd5e1);
}

/* 占位符：必须通过 placeholder-class 命中，见文件头注释第 1 条 */
.cd-input__placeholder {
  color: var(--cd-text-placeholder, #94a3b8);
  font-size: inherit;
  font-weight: 400;
}

/* ==================================================================
 * 前后缀与操作区
 * ================================================================== */
.cd-input__affix {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: var(--cd-text-placeholder, #94a3b8);
}

.cd-input__affix--prefix {
  margin-right: var(--cd-space-2, 8px);
}

.cd-input__affix--suffix {
  margin-left: var(--cd-space-2, 8px);
}

.cd-input__action {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 2px;
  margin-left: var(--cd-space-2, 8px);
  color: var(--cd-text-placeholder, #94a3b8);
  cursor: pointer;
}

@include cd-hover {
  .cd-input__action:hover {
    color: var(--cd-text-secondary, #64748b);
  }
}

.cd-input__counter {
  flex-shrink: 0;
  margin-left: var(--cd-space-2, 8px);
  font-family: var(--cd-font-family-mono, monospace);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-placeholder, #94a3b8);
}

/* 计数超限（理论上不会出现，因为原生已截断，仅作兜底视觉） */
.cd-input__wrap--error .cd-input__counter {
  color: var(--cd-color-danger, #ef4444);
}
</style>
