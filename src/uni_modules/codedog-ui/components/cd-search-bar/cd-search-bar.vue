<template>
  <view class="cd-search-bar" :class="rootClass" :style="customStyle">
    <view class="cd-search-bar__field" :class="fieldClass">
      <view class="cd-search-bar__icon">
        <slot name="prefix">
          <cd-icon :name="searchIcon" size="1.05em" />
        </slot>
      </view>

      <input
        class="cd-search-bar__input"
        :class="inputClass"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="isDisabled"
        :maxlength="maxlength"
        :focus="focus"
        :confirm-type="confirmType"
        :cursor-spacing="20"
        placeholder-class="cd-search-bar__placeholder"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @confirm="handleConfirm"
      />

      <view v-if="showClear" class="cd-search-bar__clear" @click.stop="handleClear">
        <cd-icon name="close-circle" size="1.05em" />
      </view>
    </view>

    <view v-if="showAction" class="cd-search-bar__action" @click="handleAction">
      <slot name="action">
        <text class="cd-search-bar__action-text">{{ actionText }}</text>
      </slot>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-search-bar —— 搜索栏
 * ---------------------------------------------------------------
 * 和 cd-input 的分工：input 是「通用输入」，search-bar 是「一个带图标的
 * 药丸形容器 + 右侧动作位」，视觉约定完全不同（无边框、有底色、圆角大）。
 * 把它做成一个独立组件而不是「input 的又一个 type」，
 * 是因为它的默认形态本身就是产品语义的一部分。
 *
 * 一个刻意保留的细节：placeholder 的颜色同样走 placeholder-class 而不是
 * placeholder-style —— 小程序的原生 input 解析不了带 CSS 变量的内联样式，
 * 这个坑在 cd-input 那里已经踩过一次。
 *
 * align="center"（空且未聚焦时文字居中）在部分小程序基础库上对原生 input 的
 * text-align 支持不完全，会退化成左对齐。这是可接受的降级：
 * 居中是「更好看」，左对齐是「还能用」，不值得为它引入测量与手动定位。
 */
import { computed, ref } from 'vue'
import { useField } from '../../composables/use-field'

defineOptions({
  name: 'cd-search-bar',
})

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '搜索',
  },
  /** square / round */
  shape: {
    type: String,
    default: 'round',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  /** 有值时显示一键清空 */
  clearable: {
    type: Boolean,
    default: true,
  },
  /** 右侧动作按钮 */
  showAction: {
    type: Boolean,
    default: false,
  },
  actionText: {
    type: String,
    default: '取消',
  },
  /** 空值且未聚焦时文字居中 */
  align: {
    type: String,
    default: 'left',
  },
  maxlength: {
    type: [Number, String],
    default: -1,
  },
  confirmType: {
    type: String,
    default: 'search',
  },
  searchIcon: {
    type: String,
    default: 'search',
  },
  focus: {
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

const emit = defineEmits([
  'update:modelValue',
  'input',
  'search',
  'clear',
  'action',
  'focus',
  'blur',
])

const { formDisabled, notifyChange, notifyBlur } = useField()

const focused = ref(false)

const isDisabled = computed(() => props.disabled || formDisabled.value)

const showClear = computed(
  () => props.clearable && !isDisabled.value && !props.readonly && !!props.modelValue
)

const centered = computed(
  () => props.align === 'center' && !props.modelValue && !focused.value
)

const rootClass = computed(() =>
  [
    props.shape === 'square' ? 'cd-search-bar--square' : 'cd-search-bar--round',
    props.showAction ? 'cd-search-bar--with-action' : '',
    isDisabled.value ? 'cd-search-bar--disabled' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const fieldClass = computed(() => [
  focused.value ? 'cd-search-bar__field--focused' : '',
  props.readonly ? 'cd-search-bar__field--readonly' : '',
])

const inputClass = computed(() =>
  [centered.value ? 'cd-search-bar__input--center' : '', props.readonly ? 'cd-search-bar__input--readonly' : '']
    .filter(Boolean)
    .join(' ')
)

function handleInput(event) {
  const value = event.detail.value
  emit('update:modelValue', value)
  emit('input', value)
  notifyChange(value)
}

function handleFocus(event) {
  focused.value = true
  emit('focus', event)
}

function handleBlur(event) {
  focused.value = false
  emit('blur', event)
  notifyBlur()
}

function handleConfirm(event) {
  emit('search', event.detail.value)
}

function handleClear() {
  emit('update:modelValue', '')
  emit('input', '')
  emit('clear')
  notifyChange('')
}

function handleAction() {
  if (isDisabled.value) return
  emit('action')
}
</script>

<script>
export default {
  name: 'cd-search-bar',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-search-bar {
  @include cd-reset;

  display: flex;
  align-items: center;
  width: 100%;
}

/* ==================================================================
 * 输入体
 * ================================================================== */
.cd-search-bar__field {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: var(--cd-search-height, 36px);
  padding: 0 var(--cd-space-3, 12px);
  background-color: var(--cd-search-bg, #f1f5f9);
  border: var(--cd-border-width, 1px) solid transparent;
  transition: border-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-search-bar--round .cd-search-bar__field {
  border-radius: var(--cd-radius-round, 999px);
}

.cd-search-bar--square .cd-search-bar__field {
  border-radius: var(--cd-search-radius, 8px);
}

/* 聚焦时给一圈品牌色描边 + 浅底，是「我在这个框里打字」最省事的信号 */
.cd-search-bar__field--focused {
  border-color: var(--cd-color-primary, #3b76f6);
  background-color: var(--cd-bg-container, #ffffff);
}

.cd-search-bar--disabled .cd-search-bar__field {
  background-color: var(--cd-bg-disabled, #f1f5f9);
}

.cd-search-bar__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: var(--cd-space-2, 8px);
  color: var(--cd-search-icon-color, #94a3b8);
}

.cd-search-bar__field--focused .cd-search-bar__icon {
  color: var(--cd-color-primary, #3b76f6);
}

.cd-search-bar__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  font-size: var(--cd-font-size-base, 14px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-primary, #0f172a);
  background-color: transparent;
  border: none;
}

.cd-search-bar__input--center {
  text-align: center;
}

.cd-search-bar__input--readonly {
  color: var(--cd-text-regular, #334155);
}

.cd-search-bar__placeholder {
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-placeholder, #94a3b8);
}

.cd-search-bar__clear {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: var(--cd-space-2, 8px);
  color: var(--cd-text-placeholder, #94a3b8);
  cursor: pointer;
}

@include cd-hover {
  .cd-search-bar__clear:hover {
    color: var(--cd-text-secondary, #64748b);
  }
}

/* ==================================================================
 * 右侧动作
 * ================================================================== */
.cd-search-bar__action {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: var(--cd-search-height, 36px);
  /* 用 padding 撑点击区而不是给固定宽度：中文「取消」和英文「Cancel」都能装下 */
  padding: 0 var(--cd-space-1, 4px) 0 var(--cd-space-3, 12px);
  cursor: pointer;
}

.cd-search-bar__action-text {
  font-size: var(--cd-font-size-base, 14px);
  line-height: 1;
  color: var(--cd-color-primary, #3b76f6);
  white-space: nowrap;
}

.cd-search-bar__action:active .cd-search-bar__action-text {
  color: var(--cd-color-primary-active, #1d4cd8);
}
</style>
