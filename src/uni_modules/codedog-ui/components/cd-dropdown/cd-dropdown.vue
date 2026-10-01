<template>
  <view class="cd-dropdown" @mouseenter="onEnter" @mouseleave="onLeave" @click="onTriggerTap">
    <view class="cd-floating__trigger">
      <slot name="reference">
        <cd-button type="default" size="small">
          {{ placeholder }}
          <cd-icon name="chevron-down" :size="14" class="cd-dropdown__caret" :class="{ 'cd-dropdown__caret--open': open }" />
        </cd-button>
      </slot>
    </view>

    <view v-if="open" class="cd-dropdown__panel" :class="uid" :style="panelStyle" @click.stop>
      <template v-for="(item, index) in items" :key="index">
        <view v-if="item.divided && index > 0" class="cd-dropdown__divider" />
        <view v-if="item.group" class="cd-dropdown__group">
          <text class="cd-dropdown__group-text">{{ item.group }}</text>
        </view>
        <view
          v-else
          class="cd-dropdown__item"
          :class="[
            item.danger ? 'cd-dropdown__item--danger' : '',
            item.disabled ? 'cd-dropdown__item--disabled' : '',
            highlightIndex === index ? 'cd-dropdown__item--highlight' : '',
          ]"
          @click="handleSelect(item, index)"
        >
          <cd-icon v-if="item.icon" class="cd-dropdown__item-icon" :name="item.icon" :size="15" />
          <text class="cd-dropdown__item-label">{{ item.label }}</text>
        </view>
      </template>
    </view>

    <!-- 点击空白处收起 -->
    <view v-if="open" class="cd-dropdown__shield" @click="requestClose('outside')" @touchmove.stop.prevent="noop" />
  </view>
</template>

<script setup>
/**
 * cd-dropdown —— 下拉菜单
 * ---------------------------------------------------------------
 * 与 cd-select 的语义分工要分清：
 *   select 是「表单控件」——选完要往表单里写值，有 v-model 与校验；
 *   dropdown 是「动作入口」——每一项是一个命令（编辑 / 删除 / 导出），
 *   没有 v-model，没有校验，选中即执行。
 * 长得像不代表是同一类东西，混在一起会让表单层和命令层互相污染。
 *
 * PC 交互：hover 或 click 触发（可配），↑↓ 移动高亮、Enter 选中、Esc 关闭。
 * 移动端：点击触发，无 hover。
 */
import { computed, ref, onUnmounted, watch } from 'vue'
import { useFloating, FLOAT_PLACEMENTS } from '../../composables/use-floating'
import { useDevice } from '../../composables/use-device'
import CdButton from '../cd-button/cd-button.vue'
import CdIcon from '../cd-icon/cd-icon.vue'

defineOptions({
  name: 'cd-dropdown',
  options: {
    addGlobalClass: true,
  },
})

const props = defineProps({
  /**
   * 菜单项。结构：{ label, value?, icon?, disabled?, danger?, divided?, group? }
   * group 项只做分组标题渲染，不可点、不占高亮序号。
   */
  options: {
    type: Array,
    default: () => [],
  },
  trigger: {
    /** 'hover' | 'click' */
    type: String,
    default: 'auto',
  },
  placement: {
    type: String,
    default: 'bottom-start',
  },
  /** 未提供 reference 插槽时渲染的默认按钮文案 */
  placeholder: {
    type: String,
    default: '更多操作',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select', 'visible-change'])

const { canHover } = useDevice()

const floating = useFloating({
  triggerSelector: '.cd-floating__trigger',
  panelSelector: '.cd-dropdown__panel',
  gap: 6,
  arrowSize: 0,
  placement: computed(() => (FLOAT_PLACEMENTS.includes(props.placement) ? props.placement : 'bottom-start')),
})

const open = floating.open

/* 定位内联样式必须显式从 floating 里取出来。
   模板里写 panelStyle 只会落到 _ctx 上（undefined），
   面板就会失去 left/top，掉回文档流原位 —— 这是个截图都不容易发现的坑 */
const uid = floating.uid
const panelStyle = floating.panelStyle

const highlightIndex = ref(-1)

/** 触发方式：auto = 有鼠标 hover、无鼠标 click */
const effectiveTrigger = computed(() => {
  if (props.trigger === 'hover' || props.trigger === 'click') return props.trigger
  return canHover.value ? 'hover' : 'click'
})

const enterTimer = ref(null)
const leaveTimer = ref(null)

function clearTimers() {
  if (enterTimer.value) {
    clearTimeout(enterTimer.value)
    enterTimer.value = null
  }
  if (leaveTimer.value) {
    clearTimeout(leaveTimer.value)
    leaveTimer.value = null
  }
}

function syncVisible(value) {
  emit('visible-change', value)
}

function onEnter() {
  if (effectiveTrigger.value !== 'hover' || props.disabled) return
  clearTimers()
  enterTimer.value = setTimeout(() => {
    floating.show()
    resetHighlight()
    syncVisible(true)
  }, 120)
}

function onLeave() {
  if (effectiveTrigger.value !== 'hover') return
  clearTimers()
  leaveTimer.value = setTimeout(() => {
    if (open.value) {
      floating.hide()
      syncVisible(false)
    }
  }, 120)
}

function onTriggerTap() {
  if (effectiveTrigger.value !== 'click' || props.disabled) return
  clearTimers()
  if (open.value) {
    floating.hide()
    syncVisible(false)
    return
  }
  floating.show()
  resetHighlight()
  syncVisible(true)
}

function requestClose(action) {
  if (!open.value) return
  floating.hide()
  highlightIndex.value = -1
  syncVisible(false)
  emit('close', action)
}

function noop() {}

function resetHighlight() {
  const first = props.options.findIndex((item) => !item.group && !item.disabled)
  highlightIndex.value = first
}

function handleSelect(item, index) {
  if (item.disabled) return
  emit('select', { ...item, index })
  requestClose('select')
}

/* -------------------- PC 键盘导航 -------------------- */

function onKeydown(event) {
  if (!open.value) return
  const key = event.key
  const navigable = props.options
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.group && !item.disabled)

  if (key === 'Escape' || event.keyCode === 27) {
    event.preventDefault()
    requestClose('esc')
    return
  }
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    event.preventDefault()
    if (!navigable.length) return
    const currentPos = navigable.findIndex(({ index }) => index === highlightIndex.value)
    const delta = key === 'ArrowDown' ? 1 : -1
    const nextPos = currentPos < 0 ? 0 : (currentPos + delta + navigable.length) % navigable.length
    highlightIndex.value = navigable[nextPos].index
    return
  }
  if (key === 'Enter') {
    event.preventDefault()
    const current = navigable.find(({ index }) => index === highlightIndex.value)
    if (current) handleSelect(current.item, current.index)
  }
}

let keyBound = false

function bindKey() {
  /* #ifdef H5 */
  if (keyBound || typeof document === 'undefined') return
  keyBound = true
  document.addEventListener('keydown', onKeydown)
  /* #endif */
}

function unbindKey() {
  /* #ifdef H5 */
  if (!keyBound || typeof document === 'undefined') return
  keyBound = false
  document.removeEventListener('keydown', onKeydown)
  /* #endif */
}

watch(open, (value) => {
  if (value && canHover.value) bindKey()
  else unbindKey()
})

onUnmounted(() => {
  clearTimers()
  unbindKey()
})
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-dropdown {
  @include cd-reset;
  display: inline-flex;
  max-width: 100%;
}

.cd-floating__trigger {
  display: inline-flex;
  max-width: 100%;
}

.cd-dropdown__caret {
  margin-left: var(--cd-space-1, 4px);
  transition: transform var(--cd-duration-fast, 150ms) var(--cd-ease-out, cubic-bezier(0.16, 1, 0.3, 1));
}

.cd-dropdown__caret--open {
  transform: rotate(180deg);
}

/* ==================== 面板 ==================== */

.cd-dropdown__panel {
  @include cd-reset;
  position: fixed;
  min-width: 140px;
  max-width: 280px;
  max-height: 60vh;
  overflow-y: auto;
  padding: var(--cd-space-1, 4px) 0;
  background-color: var(--cd-bg-elevated, #ffffff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
  border-radius: var(--cd-radius-md, 8px);
  box-shadow: var(--cd-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.16));
  animation: cd-dropdown-in 140ms ease-out;
}

.cd-dropdown__item {
  display: flex;
  align-items: center;
  padding: 0 var(--cd-space-3, 12px);
  height: var(--cd-dropdown-item-height, 34px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-regular, #334155);
  cursor: pointer;
}

.cd-dropdown__item-icon {
  flex-shrink: 0;
  margin-right: var(--cd-space-2, 8px);
  color: var(--cd-text-secondary, #64748b);
}

.cd-dropdown__item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cd-dropdown__item--danger {
  color: var(--cd-color-danger, #dc2626);
}

.cd-dropdown__item--danger .cd-dropdown__item-icon {
  color: var(--cd-color-danger, #dc2626);
}

.cd-dropdown__item--disabled {
  color: var(--cd-text-disabled, #cbd5e1);
  cursor: not-allowed;
}

.cd-dropdown__item--disabled .cd-dropdown__item-icon {
  color: var(--cd-text-disabled, #cbd5e1);
}

/* hover 高亮与键盘高亮共用一套视觉，两套入口一个出口 */
@include cd-hover {
  .cd-dropdown__item:hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  }
}

.cd-dropdown__item--highlight {
  background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
}

.cd-dropdown__divider {
  height: 1px;
  margin: var(--cd-space-1, 4px) var(--cd-space-2, 8px);
  background-color: var(--cd-border-color-light, #eef2f7);
}

.cd-dropdown__group {
  padding: var(--cd-space-2, 8px) var(--cd-space-3, 12px) var(--cd-space-1, 4px);
}

.cd-dropdown__group-text {
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-tertiary, #94a3b8);
}

.cd-dropdown__shield {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: calc(var(--cd-z-dropdown, 1500) - 1);
}

@keyframes cd-dropdown-in {
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
