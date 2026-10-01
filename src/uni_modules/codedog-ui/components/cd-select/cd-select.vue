<template>
  <view class="cd-select" :class="rootClass">
    <!-- 触发区：两种形态共用 -->
    <view class="cd-select__trigger" :class="triggerClass" @click="handleTriggerClick">
      <text v-if="selectedLabel" class="cd-select__value">{{ selectedLabel }}</text>
      <text v-else class="cd-select__placeholder">{{ placeholder }}</text>

      <view v-if="showClear" class="cd-select__clear" @click.stop="handleClear">
        <view class="cd-select__clear-bar cd-select__clear-bar--a" />
        <view class="cd-select__clear-bar cd-select__clear-bar--b" />
      </view>

      <view v-if="!showClear" class="cd-select__arrow" :class="{ 'cd-select__arrow--open': isOpen }" />
    </view>

    <!-- ============ 形态一：移动端 —— 底部动作面板 ============ -->
    <wd-action-sheet
      v-if="!desktopShape"
      :model-value="mobileOpen"
      :actions="sheetActions"
      :title="sheetTitle"
      :cancel-text="'取消'"
      @update:model-value="handleSheetUpdate"
      @select="handleSheetSelect"
    />

    <!-- ============ 形态二：桌面端 —— 下拉面板 ============ -->
    <template v-else>
      <!-- 透明全屏捕获层：点击任意空白处关闭。比监听 document 点击更可靠，
           因为小程序端没有可用的 DOM 事件委托，两端用同一套逻辑更省心 -->
      <view v-if="isOpen" class="cd-select__catcher" @click="close" />

      <view v-if="isOpen" class="cd-select__dropdown" :class="dropdownClass">
        <view v-if="!options.length" class="cd-select__empty">
          <text class="cd-select__empty-text">暂无选项</text>
        </view>

        <view
          v-for="(option, index) in options"
          :key="optionKey(option, index)"
          class="cd-select__option"
          :class="optionClass(option, index)"
          @click="handleOptionClick(option)"
        >
          <text class="cd-select__option-label">{{ option.label }}</text>
          <text v-if="option.description" class="cd-select__option-desc">{{ option.description }}</text>
          <view v-if="isSelected(option)" class="cd-select__tick" />
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
/**
 * cd-select —— 双形态选择器
 * ---------------------------------------------------------------
 * 这是「同一组件、两种交互模型」最典型的例子：
 *
 *   移动端 → 底部动作面板（wd-action-sheet）
 *            手指够得到、选项高度 52px、有取消按钮、贴合安全区
 *   桌面端 → 下拉面板（自研）
 *            鼠标悬停高亮、方向键移动、回车选中、点击外部关闭
 *
 * 为什么桌面端不复用 wd-popup：
 *   下拉面板需要「无遮罩 + 锚定在触发器下方 + 不阻塞页面其他交互」，
 *   而 wd-popup 是模态语义（遮罩 + 滚动锁 + 全屏定位），套用反而更麻烦。
 *
 * 一个重要的架构简化：PC 形态只可能出现在 H5（isPC 的判定里带了 isH5），
 * 所以桌面端分支可以放心使用 document 级别的键盘监听，
 * 不必为小程序写一套等价实现。
 */
import { computed, ref, watch, onUnmounted } from 'vue'
import { useBreakpoint, resolveDesktopShape } from '../../composables/use-breakpoint'
import { useField } from '../../composables/use-field'

defineOptions({
  name: 'cd-select',
})

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: '',
  },
  /**
   * 选项列表
   * @type {{ label: string, value: string|number, description?: string, disabled?: boolean }[]}
   */
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: '请选择',
  },
  /** 移动端面板标题，不传则用 placeholder */
  title: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 有值时是否显示一键清空 */
  clearable: {
    type: Boolean,
    default: false,
  },
  /** 'auto' | 'mobile' | 'desktop' */
  mode: {
    type: String,
    default: 'auto',
  },
  /** 桌面端下拉展开方向 */
  placement: {
    type: String,
    default: 'bottom',
  },
  /** 控件尺寸档位，透传给根节点类名，由 CSS 变量控制实际高度 */
  size: {
    type: String,
    default: 'medium',
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'clear', 'open', 'close'])

const { isPC } = useBreakpoint()

const desktopShape = computed(() => resolveDesktopShape(props.mode, isPC))

/**
 * 表单上下文（可选依赖）。
 * cd-select 同样要接入校验链：套在 cd-form-item 里时，
 * 「选中值」算 change、「面板关闭」算 blur，这样表单的 trigger 语义
 * 对下拉类控件与输入类控件完全一致。
 *
 * 顺带修掉一个缺口：原先这里只读 props.disabled，
 * 于是 <cd-form disabled> 对下拉框不生效（输入框是生效的，行为不一致）。
 * 改用 useField 的 formDisabled 后两者对齐。
 */
const { field, formDisabled, notifyChange, notifyBlur } = useField()

/* -------------------- 状态 -------------------- */

const mobileOpen = ref(false)
const desktopOpen = ref(false)
/** 键盘导航当前高亮项 */
const highlightIndex = ref(-1)

const isDisabled = computed(() => props.disabled || formDisabled.value)

const isOpen = computed(() => (desktopShape.value ? desktopOpen.value : mobileOpen.value))

const selectedIndex = computed(() => props.options.findIndex((item) => item.value === props.modelValue))
const selectedOption = computed(() => (selectedIndex.value > -1 ? props.options[selectedIndex.value] : null))
const selectedLabel = computed(() => (selectedOption.value ? selectedOption.value.label : ''))
const hasValue = computed(() => selectedIndex.value > -1)

const rootClass = computed(() =>
  [
    `cd-select--${props.size}`,
    desktopShape.value ? 'cd-select--desktop' : 'cd-select--mobile',
    isOpen.value ? 'cd-select--open' : '',
    isDisabled.value ? 'cd-select--disabled' : '',
    hasFormError.value ? 'cd-select--error' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

/** 表单校验报错时，触发区也要变红描边，否则用户看不出是哪个控件错了 */
const hasFormError = computed(() => !!(field && field.validateState && field.validateState.value === 'error'))

const triggerClass = computed(() =>
  [
    isOpen.value ? 'cd-select__trigger--open' : '',
    isDisabled.value ? 'cd-select__trigger--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')
)

const dropdownClass = computed(() => `cd-select__dropdown--${props.placement}`)

const showClear = computed(() => props.clearable && hasValue.value && !isDisabled.value && !isOpen.value)

const sheetTitle = computed(() => props.title || props.placeholder)

/** 映射成 wd-action-sheet 需要的结构，额外带上原始 value 以便回传 */
const sheetActions = computed(() =>
  props.options.map((option) => ({
    name: option.label,
    subname: option.description || '',
    disabled: !!option.disabled,
    value: option.value,
  }))
)

/* -------------------- 交互 -------------------- */

function handleTriggerClick() {
  if (isDisabled.value) return
  if (desktopShape.value) {
    desktopOpen.value = !desktopOpen.value
    if (desktopOpen.value) {
      highlightIndex.value = selectedIndex.value > -1 ? selectedIndex.value : findFirstEnabled()
      emit('open')
      bindKeyboard()
    } else {
      emit('close')
    }
  } else {
    mobileOpen.value = true
    emit('open')
  }
}

function handleSheetUpdate(value) {
  mobileOpen.value = value
  if (!value) emit('close')
}

function handleSheetSelect(event) {
  const option = props.options[event.index]
  if (!option || option.disabled) return
  commit(option)
}

function handleOptionClick(option) {
  if (option.disabled) return
  commit(option)
}

function commit(option) {
  emit('update:modelValue', option.value)
  emit('change', { value: option.value, option, index: props.options.indexOf(option) })
  close()
  /* 先关闭再回报 change：这样「关闭即失焦」的校验不会把刚选中的值判成未选 */
  notifyChange(option.value)
}

function close() {
  if (desktopShape.value) {
    desktopOpen.value = false
    unbindKeyboard()
  } else {
    mobileOpen.value = false
  }
  emit('close')
  /* 面板关闭等价于「操作结束」，此时回报一次 blur，
     让「打开了但没选就关掉」也能被必填规则捕获 */
  notifyBlur()
}

function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
}

function findFirstEnabled() {
  return props.options.findIndex((item) => !item.disabled)
}

/* -------------------- 桌面端键盘导航 -------------------- */

/**
 * 只在打开期间监听 document。
 * 不做焦点管理（不像完整实现那样给每个选项 tabindex），
 * 因为小程序的 view 不支持 tabindex，做成跨端一致的行为成本高于收益。
 * 方向键 + 回车 + Esc 已经覆盖了 PC 端最高频的键盘操作。
 */
function onKeydown(event) {
  const key = event.key
  if (key === 'Escape') {
    close()
    return
  }
  if (key === 'Enter') {
    const option = props.options[highlightIndex.value]
    if (option && !option.disabled) commit(option)
    return
  }
  if (key !== 'ArrowDown' && key !== 'ArrowUp') return

  const step = key === 'ArrowDown' ? 1 : -1
  const total = props.options.length
  if (!total) return

  let next = highlightIndex.value
  for (let i = 0; i < total; i += 1) {
    next = (next + step + total) % total
    if (!props.options[next].disabled) break
  }
  highlightIndex.value = next
}

let keyboardBound = false

function bindKeyboard() {
  /* #ifdef H5 */
  if (keyboardBound || typeof document === 'undefined') return
  keyboardBound = true
  document.addEventListener('keydown', onKeydown)
  /* #endif */
}

function unbindKeyboard() {
  /* #ifdef H5 */
  if (!keyboardBound || typeof document === 'undefined') return
  keyboardBound = false
  document.removeEventListener('keydown', onKeydown)
  /* #endif */
}

// 形态在打开状态中发生切换（例如 PC 上把窗口拖窄）时，
// 需要把另一套状态清干净，否则会同时出现面板和下拉
watch(desktopShape, () => {
  mobileOpen.value = false
  desktopOpen.value = false
  unbindKeyboard()
})

onUnmounted(unbindKeyboard)

/* -------------------- 渲染辅助 -------------------- */

function optionKey(option, index) {
  return option.value !== undefined && option.value !== null ? option.value : index
}

function isSelected(option) {
  return option.value === props.modelValue
}

function optionClass(option, index) {
  return [
    isSelected(option) ? 'cd-select__option--selected' : '',
    option.disabled ? 'cd-select__option--disabled' : '',
    highlightIndex.value === index ? 'cd-select__option--highlight' : '',
  ]
    .filter(Boolean)
    .join(' ')
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-select {
  @include cd-reset;
  position: relative;
  display: block;
  width: 100%;
}

/* ==================================================================
 * 触发区
 * ================================================================== */
.cd-select__trigger {
  position: relative;
  display: flex;
  align-items: center;
  height: var(--cd-control-height, 36px);
  padding: 0 var(--cd-space-3, 12px);
  background-color: var(--cd-bg-container, #ffffff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-md, 8px);
  cursor: pointer;
  transition: border-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    box-shadow var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

@include cd-hover {
  .cd-select__trigger:hover {
    border-color: var(--cd-border-color-strong, #cbd5e1);
  }
}

/* 打开态与聚焦态一致：PC 端用户需要明确的「我在操作哪个控件」的信号 */
.cd-select__trigger--open {
  border-color: var(--cd-color-primary, #3b76f6);
  box-shadow: 0 0 0 3px var(--cd-color-primary-soft, #eff5ff);
}

/* 表单校验失败：与 cd-input 的错误态保持同一视觉语言 */
.cd-select--error .cd-select__trigger {
  border-color: var(--cd-color-danger, #ef4444);
}

.cd-select--error .cd-select__trigger--open {
  box-shadow: 0 0 0 3px var(--cd-color-danger-soft, #fef2f2);
}

.cd-select__trigger--disabled {
  cursor: not-allowed;
  background-color: var(--cd-bg-disabled, #f1f5f9);
  color: var(--cd-text-disabled, #cbd5e1);
}

.cd-select__value {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-primary, #0f172a);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cd-select__placeholder {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-placeholder, #94a3b8);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 箭头：纯 CSS 三角，任意端都不用引图标资源 */
.cd-select__arrow {
  flex-shrink: 0;
  width: 0;
  height: 0;
  margin-left: var(--cd-space-2, 8px);
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid var(--cd-text-placeholder, #94a3b8);
  transition: transform var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-select__arrow--open {
  transform: rotate(180deg);
}

/* 清空按钮：两根细条叠成叉 */
.cd-select__clear {
  position: relative;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-left: var(--cd-space-2, 8px);
  border-radius: var(--cd-radius-round, 999px);
  background-color: var(--cd-text-placeholder, #94a3b8);
}

.cd-select__clear-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 1.5px;
  margin-top: -0.75px;
  margin-left: -4px;
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: 2px;
}

.cd-select__clear-bar--a {
  transform: rotate(45deg);
}

.cd-select__clear-bar--b {
  transform: rotate(-45deg);
}

@include cd-hover {
  .cd-select__clear:hover {
    background-color: var(--cd-text-secondary, #64748b);
  }
}

/* ==================================================================
 * 桌面端下拉面板
 * ================================================================== */
.cd-select__catcher {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--cd-z-dropdown, 1500);
  background-color: transparent;
}

.cd-select__dropdown {
  position: absolute;
  right: 0;
  left: 0;
  z-index: calc(var(--cd-z-dropdown, 1500) + 1);
  max-height: 280px;
  padding: var(--cd-space-1, 4px);
  background-color: var(--cd-bg-elevated, #ffffff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-md, 8px);
  box-shadow: var(--cd-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.1));
  overflow-y: auto;
}

.cd-select__dropdown--bottom {
  top: 100%;
  margin-top: var(--cd-space-1, 4px);
}

.cd-select__dropdown--top {
  bottom: 100%;
  margin-bottom: var(--cd-space-1, 4px);
}

.cd-select__option {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 34px;
  padding: 0 var(--cd-space-3, 12px);
  border-radius: var(--cd-radius-sm, 4px);
  cursor: pointer;
}

.cd-select__option-label {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-regular, #334155);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cd-select__option-desc {
  flex-shrink: 0;
  margin-left: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-placeholder, #94a3b8);
}

/* 键盘导航高亮与鼠标悬停高亮效果一致，用户不必区分输入方式 */
.cd-select__option--highlight {
  background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
}

@include cd-hover {
  .cd-select__option:hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  }

  .cd-select__option--disabled:hover {
    background-color: transparent;
  }
}

.cd-select__option--selected .cd-select__option-label {
  color: var(--cd-color-primary, #3b76f6);
  font-weight: var(--cd-font-weight-medium, 500);
}

.cd-select__option--disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

/* 选中勾：一个旋转 45 度的缺口方块，纯 CSS */
.cd-select__tick {
  flex-shrink: 0;
  width: 5px;
  height: 9px;
  margin-left: var(--cd-space-2, 8px);
  margin-top: -3px;
  border-right: 1.5px solid var(--cd-color-primary, #3b76f6);
  border-bottom: 1.5px solid var(--cd-color-primary, #3b76f6);
  transform: rotate(45deg);
}

.cd-select__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
}

.cd-select__empty-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-placeholder, #94a3b8);
}
</style>
