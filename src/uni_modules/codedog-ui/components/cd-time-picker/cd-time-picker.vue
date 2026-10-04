<template>
  <view class="cd-time-picker" :class="rootClass">
    <!-- ==================== 移动端：系统原生 picker ==================== -->
    <picker
      v-if="!desktopShape"
      mode="time"
      :value="innerValue || ''"
      :disabled="isDisabled"
      @change="onNativeChange"
      @cancel="notifyBlur"
    >
      <view class="cd-time-picker__trigger" :class="triggerClass">
        <text v-if="innerValue" class="cd-time-picker__value">{{ innerValue }}</text>
        <text v-else class="cd-time-picker__placeholder">{{ placeholder }}</text>
        <view v-if="showClear && innerValue" class="cd-time-picker__clear" @click.stop="handleClear">
          <view class="cd-time-picker__clear-bar cd-time-picker__clear-bar--a" />
          <view class="cd-time-picker__clear-bar cd-time-picker__clear-bar--b" />
        </view>
        <cd-icon v-if="!showClear || !innerValue" class="cd-time-picker__suffix" name="clock" :size="15" />
      </view>
    </picker>

    <!-- ==================== 触发区（PC） ==================== -->
    <view v-if="desktopShape" class="cd-time-picker__trigger" :class="triggerClass" @click="handleTriggerClick">
      <text v-if="innerValue" class="cd-time-picker__value">{{ innerValue }}</text>
      <text v-else class="cd-time-picker__placeholder">{{ placeholder }}</text>
      <view v-if="showClear && innerValue" class="cd-time-picker__clear" @click.stop="handleClear">
        <view class="cd-time-picker__clear-bar cd-time-picker__clear-bar--a" />
        <view class="cd-time-picker__clear-bar cd-time-picker__clear-bar--b" />
      </view>
      <cd-icon v-if="!showClear || !innerValue" class="cd-time-picker__suffix" name="clock" :size="15" />
    </view>

    <!-- ==================== PC：时 / 分双列 ==================== -->
    <view v-if="desktopShape && open" class="cd-time-picker__panel" :class="uid" :style="panelStyle">
      <view class="cd-time-picker__columns">
        <scroll-view class="cd-time-picker__col" scroll-y :scroll-top="hourScrollTop" :scroll-with-animation="true">
          <view
            v-for="h in hours"
            :key="h.value"
            class="cd-time-picker__option"
            :class="{ 'cd-time-picker__option--active': h.value === hourPart }"
            @click="pickHour(h.value)"
          >
            <text class="cd-time-picker__option-text">{{ h.label }}</text>
          </view>
        </scroll-view>
        <scroll-view class="cd-time-picker__col" scroll-y :scroll-top="minuteScrollTop" :scroll-with-animation="true">
          <view
            v-for="m in minutes"
            :key="m.value"
            class="cd-time-picker__option"
            :class="{ 'cd-time-picker__option--active': m.value === minutePart }"
            @click="pickMinute(m.value)"
          >
            <text class="cd-time-picker__option-text">{{ m.label }}</text>
          </view>
        </scroll-view>
      </view>
      <view class="cd-time-picker__foot">
        <cd-button size="small" type="default" @click="handleNow">此刻</cd-button>
        <view class="cd-time-picker__foot-space" />
        <cd-button size="small" type="primary" @click="handleConfirm">确定</cd-button>
      </view>
    </view>

    <view v-if="desktopShape && open" class="cd-time-picker__shield" @click="requestClose" @touchmove.stop.prevent />
  </view>
</template>

<script setup>
/**
 * cd-time-picker —— 时间选择（时:分）
 * ---------------------------------------------------------------
 * 与 cd-date-picker 同一套双形态策略：
 *   移动端走系统原生 <picker mode="time">，PC 端自研双列面板。
 *
 * 刻意不支持秒：时间选择的真实场景里「秒」几乎只出现在日志类需求，
 * 而它会让面板多一列、交互多一层。真需要时用两个 time-picker 拼比
 * 塞一个三列面板更清晰。
 *
 * PC 双列用 scroll-view + scroll-top 受控定位：点选时把列滚到
 * 「选中项 - 偏移」的位置，让选中项大致停在列中间。
 */
import { computed, ref, watch, onUnmounted } from 'vue'
import { useBreakpoint, resolveDesktopShape } from '../../composables/use-breakpoint'
import { useField } from '../../composables/use-field'
import { useFloating } from '../../composables/use-floating'
import CdButton from '../cd-button/cd-button.vue'
import CdIcon from '../cd-icon/cd-icon.vue'

defineOptions({
  name: 'cd-time-picker',
  options: {
    addGlobalClass: true,
  },
})

const props = defineProps({
  /** 'HH:mm'；空串表示未选择 */
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '请选择时间',
  },
  /** 最小时间 'HH:mm'（仅 PC 面板禁用越界项；原生 picker 不支持时间范围） */
  min: {
    type: String,
    default: '',
  },
  max: {
    type: String,
    default: '',
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
  [isDisabled.value ? 'cd-time-picker--disabled' : '', hasError.value ? 'cd-time-picker--error' : '', props.customClass]
    .filter(Boolean)
    .join(' ')
)

const triggerClass = computed(() => (isDisabled.value ? 'cd-time-picker__trigger--disabled' : ''))
const showClear = computed(() => props.clearable && !!innerValue.value && !isDisabled.value)

/* -------------------- 浮层（仅 PC） -------------------- */

const floating = useFloating({
  triggerSelector: '.cd-time-picker__trigger',
  panelSelector: '.cd-time-picker__panel',
  gap: 8,
  arrowSize: 0,
  placement: computed(() => 'bottom-start'),
})

const panelStyle = floating.panelStyle
/* uid 同样必须显式取出：面板用它做测量选择器的命名空间，
   漏掉会让 useFloating 量不到面板尺寸，退化成估算定位 */
const uid = floating.uid
/** 面板开关唯一状态源：floating.open（与 cd-date-picker 同因同果） */
const open = floating.open

const OPTION_HEIGHT = 32
/** 列视口高度的一半减去半行，让选中项停在列中间 */
const CENTER_OFFSET = OPTION_HEIGHT * 5

const hourScrollTop = ref(0)
const minuteScrollTop = ref(0)

const hours = Array.from({ length: 24 }, (_, i) => ({
  value: i < 10 ? `0${i}` : String(i),
  label: `${i < 10 ? '0' : ''}${i} 时`,
}))

const minutes = Array.from({ length: 60 }, (_, i) => ({
  value: i < 10 ? `0${i}` : String(i),
  label: `${i < 10 ? '0' : ''}${i} 分`,
}))

const hourPart = computed(() => (innerValue.value ? innerValue.value.split(':')[0] : ''))
const minutePart = computed(() => (innerValue.value ? innerValue.value.split(':')[1] : ''))

/** 打开面板时把两列滚到当前选中值附近 */
watch(open, (value) => {
  if (!value) return
  const h = Number(hourPart.value || 0)
  const m = Number(minutePart.value || 0)
  hourScrollTop.value = Math.max(0, h * OPTION_HEIGHT - CENTER_OFFSET)
  minuteScrollTop.value = Math.max(0, m * OPTION_HEIGHT - CENTER_OFFSET)
})

/* -------------------- 交互 -------------------- */

function commit(value) {
  emit('update:modelValue', value)
  emit('change', value)
  notifyChange(value)
}

function toMinutes(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function isOutOfBounds(hhmm) {
  const v = toMinutes(hhmm)
  if (v === null) return false
  const lo = toMinutes(props.min)
  const hi = toMinutes(props.max)
  if (lo !== null && v < lo) return true
  if (hi !== null && v > hi) return true
  return false
}

function onNativeChange(event) {
  const value = event?.detail?.value || ''
  if (!value) return
  commit(value)
  notifyBlur()
}

function pickHour(h) {
  if (isOutOfBounds(`${h}:${minutePart.value || '00'}`)) return
  const m = minutePart.value || '00'
  commit(`${h}:${m}`)
}

function pickMinute(m) {
  const h = hourPart.value || '00'
  if (isOutOfBounds(`${h}:${m}`)) return
  commit(`${h}:${m}`)
}

function handleNow() {
  const now = new Date()
  const value = `${now.getHours() < 10 ? '0' : ''}${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`
  if (isOutOfBounds(value)) return
  commit(value)
  floating.hide()
  notifyBlur()
}

function handleConfirm() {
  floating.hide()
  notifyBlur()
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
 * 颜色命名约定：本组件私有的颜色令牌统一 --cd-time-picker-* 前缀，
 * 一律写成 var(--x, 兜底原色) —— 业务不传变量时视觉与此前完全一致。
 * 共用语义色（--cd-color-danger 等）走库级令牌，不另起名字。
 */

.cd-time-picker {
  @include cd-reset;
  display: inline-flex;
  max-width: 100%;
}

/* 触发区与 cd-select / cd-date-picker 共用同一套视觉语言 */
.cd-time-picker__trigger {
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
  .cd-time-picker__trigger:hover {
    border-color: var(--cd-border-color-strong, #cbd5e1);
  }
}

.cd-time-picker__trigger--disabled {
  background-color: var(--cd-bg-disabled, #f8fafc);
  cursor: not-allowed;
}

.cd-time-picker--error .cd-time-picker__trigger {
  border-color: var(--cd-color-danger, #ef4444);
}

.cd-time-picker__value {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-primary, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cd-time-picker__placeholder {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-placeholder, #94a3b8);
}

.cd-time-picker__suffix {
  flex-shrink: 0;
  margin-left: var(--cd-space-2, 8px);
  color: var(--cd-text-tertiary, #94a3b8);
}

.cd-time-picker__clear {
  position: relative;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-left: var(--cd-space-2, 8px);
  border-radius: 50%;
  background-color: var(--cd-text-placeholder, #94a3b8);
  cursor: pointer;
}

.cd-time-picker__clear-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 1.5px;
  margin-top: -0.75px;
  margin-left: -4px;
  background-color: var(--cd-time-picker-clear-bar, #ffffff);
  border-radius: 2px;
}

.cd-time-picker__clear-bar--a {
  transform: rotate(45deg);
}

.cd-time-picker__clear-bar--b {
  transform: rotate(-45deg);
}

/* ==================== 双列面板 ==================== */

.cd-time-picker__panel {
  @include cd-reset;
  position: fixed;
  width: 216px;
  background-color: var(--cd-bg-elevated, #ffffff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
  border-radius: var(--cd-radius-lg, 12px);
  box-shadow: var(--cd-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.16));
  animation: cd-time-in 150ms ease-out;
}

.cd-time-picker__columns {
  display: flex;
  height: 224px;
}

.cd-time-picker__col {
  flex: 1;
  min-width: 0;
  height: 100%;
}

/* 两列之间一条分隔线，视觉上分成「时」「分」 */
.cd-time-picker__col + .cd-time-picker__col {
  border-left: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
}

.cd-time-picker__option {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  cursor: pointer;
}

.cd-time-picker__option-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-regular, #334155);
}

@include cd-hover {
  .cd-time-picker__option:hover .cd-time-picker__option-text {
    color: var(--cd-color-primary, #3b76f6);
  }
}

.cd-time-picker__option--active .cd-time-picker__option-text {
  color: var(--cd-color-primary, #3b76f6);
  font-weight: var(--cd-font-weight-semibold, 600);
}

.cd-time-picker__foot {
  display: flex;
  align-items: center;
  padding: var(--cd-space-2, 8px) var(--cd-space-3, 12px);
  border-top: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
}

.cd-time-picker__foot-space {
  flex: 1;
}

.cd-time-picker__shield {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: calc(var(--cd-z-dropdown, 1500) - 1);
}

@keyframes cd-time-in {
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
