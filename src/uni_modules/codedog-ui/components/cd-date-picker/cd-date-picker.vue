<template>
  <view class="cd-date-picker" :class="rootClass">
    <!-- ==================== 移动端：系统原生 picker ==================== -->
    <picker
      v-if="!desktopShape"
      mode="date"
      :value="innerValue || ''"
      :start="min || ''"
      :end="max || ''"
      :disabled="isDisabled"
      @change="onNativeChange"
      @cancel="onFieldBlur"
    >
      <view class="cd-date-picker__trigger" :class="triggerClass">
        <text v-if="innerValue" class="cd-date-picker__value">{{ innerValue }}</text>
        <text v-else class="cd-date-picker__placeholder">{{ placeholder }}</text>
        <view v-if="showClear && innerValue" class="cd-date-picker__clear" @click.stop="handleClear">
          <view class="cd-date-picker__clear-bar cd-date-picker__clear-bar--a" />
          <view class="cd-date-picker__clear-bar cd-date-picker__clear-bar--b" />
        </view>
        <cd-icon v-if="!showClear || !innerValue" class="cd-date-picker__suffix" name="calendar" :size="15" />
      </view>
    </picker>

    <!-- ==================== 触发区（PC / 无 picker 包裹的兜底） ==================== -->
    <view
      v-if="desktopShape"
      class="cd-date-picker__trigger"
      :class="triggerClass"
      @click="handleTriggerClick"
    >
      <text v-if="innerValue" class="cd-date-picker__value">{{ innerValue }}</text>
      <text v-else class="cd-date-picker__placeholder">{{ placeholder }}</text>
      <view v-if="showClear && innerValue" class="cd-date-picker__clear" @click.stop="handleClear">
        <view class="cd-date-picker__clear-bar cd-date-picker__clear-bar--a" />
        <view class="cd-date-picker__clear-bar cd-date-picker__clear-bar--b" />
      </view>
      <cd-icon v-if="!showClear || !innerValue" class="cd-date-picker__suffix" name="calendar" :size="15" />
    </view>

    <!-- ==================== PC：日历面板 ==================== -->
    <view v-if="desktopShape && open" class="cd-date-picker__panel" :class="uid" :style="panelStyle">
      <view class="cd-date-picker__head">
        <view class="cd-date-picker__nav" @click="shiftMonth(-1)">
          <view class="cd-date-picker__nav-tri cd-date-picker__nav-tri--left" />
        </view>
        <text class="cd-date-picker__head-title">{{ headTitle }}</text>
        <view class="cd-date-picker__nav" @click="shiftMonth(1)">
          <view class="cd-date-picker__nav-tri cd-date-picker__nav-tri--right" />
        </view>
      </view>

      <view class="cd-date-picker__week">
        <text v-for="(label, i) in weekRow" :key="i" class="cd-date-picker__week-label">{{ label }}</text>
      </view>

      <view class="cd-date-picker__grid">
        <view
          v-for="(cell, i) in grid"
          :key="i"
          class="cd-date-picker__cell"
          :class="[
            cell.inCurrentMonth ? '' : 'cd-date-picker__cell--outside',
            isCellSelected(cell) ? 'cd-date-picker__cell--selected' : '',
            isCellToday(cell) ? 'cd-date-picker__cell--today' : '',
            isCellDisabled(cell) ? 'cd-date-picker__cell--disabled' : '',
          ]"
          @click="handlePick(cell)"
        >
          <text class="cd-date-picker__cell-text">{{ cell.day }}</text>
        </view>
      </view>

      <view class="cd-date-picker__foot">
        <cd-button size="small" type="default" @click="handleToday">今天</cd-button>
        <view class="cd-date-picker__foot-space" />
        <cd-button size="small" type="default" @click="handleClear">清除</cd-button>
      </view>
    </view>

    <!-- 点击空白处收起 -->
    <view v-if="desktopShape && open" class="cd-date-picker__shield" @click="requestClose" @touchmove.stop.prevent />
  </view>
</template>

<script setup>
/**
 * cd-date-picker —— 日期选择
 * ---------------------------------------------------------------
 * 双形态的策略性取舍：
 *   移动端直接用 uni 内置 <picker mode="date">。原生滚轮的手感、
 *   惯性、无障碍都是系统级的，自研滚轮要处理 scroll-top 回环、
 *   惯性结束判定、逐平台差异，投入产出比极差 —— 而且「原生控件」
 *   在移动端本来就是正确的设计语言。
 *   PC 端自研日历面板：宽屏上滚轮选择日期是倒退，日历才是正解。
 *
 * 范围选择（range）刻意没做：一个组件同时做单选 + 范围会让
 * 面板状态机翻倍，等有真实场景再加 cd-date-range。
 */
import { computed, ref, watch, onUnmounted } from 'vue'
import { useBreakpoint, resolveDesktopShape } from '../../composables/use-breakpoint'
import { useField } from '../../composables/use-field'
import { useFloating } from '../../composables/use-floating'
import {
  toDate,
  formatDate,
  buildMonthGrid,
  weekLabels,
  isSameDay,
  isToday,
  inRange,
  clampDay,
} from '../../utils/date'
import CdButton from '../cd-button/cd-button.vue'
import CdIcon from '../cd-icon/cd-icon.vue'

defineOptions({
  name: 'cd-date-picker',
  options: {
    addGlobalClass: true,
  },
})

const props = defineProps({
  /** 'YYYY-MM-DD'；空串表示未选择 */
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '请选择日期',
  },
  /** 最早可选日期 'YYYY-MM-DD' */
  min: {
    type: String,
    default: '',
  },
  /** 最晚可选日期 'YYYY-MM-DD' */
  max: {
    type: String,
    default: '',
  },
  /** 0 = 周日开头，1 = 周一开头（默认，国内习惯） */
  weekStart: {
    type: Number,
    default: 1,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'auto',
  },
  error: {
    type: Boolean,
    default: false,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'clear'])

const { field, formDisabled, notifyChange, notifyBlur } = useField()

const { isPC } = useBreakpoint()
const desktopShape = computed(() => resolveDesktopShape(props.mode, isPC))

const isDisabled = computed(() => props.disabled || formDisabled.value)

const innerValue = computed(() => props.modelValue || '')

const rootClass = computed(() =>
  [
    isDisabled.value ? 'cd-date-picker--disabled' : '',
    hasError.value ? 'cd-date-picker--error' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const triggerClass = computed(() => (isDisabled.value ? 'cd-date-picker__trigger--disabled' : ''))

const showClear = computed(() => props.clearable && !!innerValue.value && !isDisabled.value)

/* -------------------- 浮层（仅 PC） -------------------- */

const floating = useFloating({
  triggerSelector: '.cd-date-picker__trigger',
  panelSelector: '.cd-date-picker__panel',
  gap: 8,
  arrowSize: 0,
  placement: computed(() => 'bottom-start'),
})

const panelStyle = floating.panelStyle
/* uid 同样必须显式取出：面板用它做测量选择器的命名空间，
   漏掉会让 useFloating 量不到面板尺寸，退化成估算定位 */
const uid = floating.uid
/**
 * 面板开关的唯一状态源就是 floating.open。
 * 之前这里有一个本地 open 与之并存，结果「滚动自动收起」只改了
 * floating 那份，面板会残留 —— 两个状态源就是一个 bug 的别名。
 */
const open = floating.open

/* -------------------- 日历状态 -------------------- */

const today = new Date()
/** 面板正在展示的年月（month 0-11） */
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

/** 打开面板时定位到已选值（没有则今天），这是日历的基本礼节 */
watch(open, (value) => {
  if (!value) return
  const selected = toDate(props.modelValue)
  const base = selected || clampDay(new Date(), props.min, props.max) || new Date()
  viewYear.value = base.getFullYear()
  viewMonth.value = base.getMonth()
})

const weekRow = computed(() => weekLabels(props.weekStart))
const grid = computed(() => buildMonthGrid(viewYear.value, viewMonth.value, props.weekStart))

const MONTH_CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
const headTitle = computed(() => `${viewYear.value} 年 ${MONTH_CN[viewMonth.value]} 月`)

function shiftMonth(delta) {
  const target = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = target.getFullYear()
  viewMonth.value = target.getMonth()
}

function cellDate(cell) {
  return new Date(cell.year, cell.month, cell.day)
}

function isCellSelected(cell) {
  return isSameDay(cellDate(cell), props.modelValue)
}

function isCellToday(cell) {
  return isToday(cellDate(cell))
}

function isCellDisabled(cell) {
  return !inRange(cellDate(cell), props.min, props.max)
}

/* -------------------- 交互 -------------------- */

function commit(value) {
  emit('update:modelValue', value)
  emit('change', value)
  notifyChange(value)
}

function onNativeChange(event) {
  const value = event?.detail?.value || ''
  if (!value) return
  commit(value)
  notifyBlur()
}

function handlePick(cell) {
  if (!cell.inCurrentMonth || isCellDisabled(cell)) return
  commit(formatDate(cellDate(cell)))
  notifyBlur()
  floating.hide()
}

function handleToday() {
  const value = formatDate(clampDay(new Date(), props.min, props.max) || new Date())
  commit(value)
  floating.hide()
}

function handleClear() {
  if (isDisabled.value) return
  commit('')
  emit('clear')
  notifyChange('')
}

function handleTriggerClick() {
  if (isDisabled.value) return
  if (open.value) {
    floating.hide()
    notifyBlur()
    return
  }
  floating.show()
}

function requestClose() {
  if (!open.value) return
  floating.hide()
  notifyBlur()
}

/* Esc 收起 + floating 的滚动自动收起联动 */
function onKeydown(event) {
  if (event.key !== 'Escape' && event.keyCode !== 27) return
  requestClose()
}

let keyBound = false

watch(open, (value) => {
  /* #ifdef H5 */
  if (typeof document === 'undefined') return
  if (value && !keyBound) {
    keyBound = true
    document.addEventListener('keydown', onKeydown)
  } else if (!value && keyBound) {
    keyBound = false
    document.removeEventListener('keydown', onKeydown)
  }
  /* #endif */
})

onUnmounted(() => {
  /* #ifdef H5 */
  if (keyBound && typeof document !== 'undefined') {
    document.removeEventListener('keydown', onKeydown)
  }
  /* #endif */
})

const hasError = computed(() => props.error || !!(field && field.validateState && field.validateState.value === 'error'))
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

/**
 * 颜色命名约定：本组件私有的颜色令牌统一 --cd-date-picker-* 前缀，
 * 一律写成 var(--x, 兜底原色) —— 业务不传变量时视觉与此前完全一致。
 * 共用语义色（--cd-color-danger 等）走库级令牌，不另起名字。
 */

.cd-date-picker {
  @include cd-reset;
  display: inline-flex;
  max-width: 100%;
}

/* ==================== 触发区：与 cd-select 同一套视觉语言 ==================== */

.cd-date-picker__trigger {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
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
  .cd-date-picker__trigger:hover {
    border-color: var(--cd-border-color-strong, #cbd5e1);
  }
}

.cd-date-picker__trigger--disabled {
  background-color: var(--cd-bg-disabled, #f8fafc);
  cursor: not-allowed;
}

.cd-date-picker--error .cd-date-picker__trigger {
  border-color: var(--cd-color-danger, #ef4444);
}

.cd-date-picker__value {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-primary, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cd-date-picker__placeholder {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-placeholder, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cd-date-picker__suffix {
  flex-shrink: 0;
  margin-left: var(--cd-space-2, 8px);
  color: var(--cd-text-tertiary, #94a3b8);
}

/* 清除按钮：与 cd-select 同构的两根细条 */
.cd-date-picker__clear {
  position: relative;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-left: var(--cd-space-2, 8px);
  border-radius: 50%;
  background-color: var(--cd-text-placeholder, #94a3b8);
  cursor: pointer;
}

.cd-date-picker__clear-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 1.5px;
  margin-top: -0.75px;
  margin-left: -4px;
  background-color: var(--cd-date-picker-clear-bar, #ffffff);
  border-radius: 2px;
}

.cd-date-picker__clear-bar--a {
  transform: rotate(45deg);
}

.cd-date-picker__clear-bar--b {
  transform: rotate(-45deg);
}

/* ==================== 日历面板 ==================== */

.cd-date-picker__panel {
  @include cd-reset;
  position: fixed;
  width: 268px;
  padding: var(--cd-space-4, 16px);
  background-color: var(--cd-bg-elevated, #ffffff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
  border-radius: var(--cd-radius-lg, 12px);
  box-shadow: var(--cd-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.16));
  animation: cd-picker-in 150ms ease-out;
}

.cd-date-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--cd-space-2, 8px);
}

.cd-date-picker__head-title {
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #0f172a);
}

.cd-date-picker__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--cd-radius-sm, 4px);
  cursor: pointer;
}

@include cd-hover {
  .cd-date-picker__nav:hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  }
}

.cd-date-picker__nav-tri {
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}

.cd-date-picker__nav-tri--left {
  border-right: 5px solid var(--cd-text-secondary, #64748b);
}

.cd-date-picker__nav-tri--right {
  border-left: 5px solid var(--cd-text-secondary, #64748b);
}

.cd-date-picker__week,
.cd-date-picker__grid {
  display: flex;
  flex-wrap: wrap;
}

.cd-date-picker__week-label {
  width: 14.28%;
  text-align: center;
  font-size: var(--cd-font-size-xs, 11px);
  line-height: 26px;
  color: var(--cd-text-tertiary, #94a3b8);
}

.cd-date-picker__cell {
  width: 14.28%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  cursor: pointer;
}

.cd-date-picker__cell-text {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 2px;
  border-radius: var(--cd-radius-round, 999px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-regular, #334155);
}

.cd-date-picker__cell--outside .cd-date-picker__cell-text {
  color: var(--cd-text-disabled, #cbd5e1);
}

.cd-date-picker__cell--today .cd-date-picker__cell-text {
  color: var(--cd-color-primary, #3b76f6);
  font-weight: var(--cd-font-weight-semibold, 600);
}

.cd-date-picker__cell--selected .cd-date-picker__cell-text {
  background-color: var(--cd-color-primary, #3b76f6);
  color: var(--cd-text-inverse, #ffffff);
}

@include cd-hover {
  .cd-date-picker__cell:not(.cd-date-picker__cell--disabled):hover .cd-date-picker__cell-text {
    background-color: var(--cd-color-primary-soft, #eff5ff);
  }
}

.cd-date-picker__cell--disabled {
  cursor: not-allowed;
}

.cd-date-picker__cell--disabled .cd-date-picker__cell-text {
  color: var(--cd-text-disabled, #cbd5e1);
}

.cd-date-picker__foot {
  display: flex;
  align-items: center;
  margin-top: var(--cd-space-3, 12px);
  padding-top: var(--cd-space-3, 12px);
  border-top: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
}

.cd-date-picker__foot-space {
  flex: 1;
}

.cd-date-picker__shield {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: calc(var(--cd-z-dropdown, 1500) - 1);
}

@keyframes cd-picker-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
