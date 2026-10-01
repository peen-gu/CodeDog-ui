<template>
  <view class="cd-popover" @click="onTriggerTap">
    <view class="cd-floating__trigger">
      <slot name="reference" />
    </view>

    <view
      v-if="open"
      class="cd-popover__panel"
      :class="uid"
      :style="panelStyle"
      @click.stop
      @touchmove.stop
    >
      <view v-if="title" class="cd-popover__title">
        <text class="cd-popover__title-text">{{ title }}</text>
      </view>
      <view class="cd-popover__body" :style="bodyStyle">
        <slot />
      </view>
      <view v-if="arrowSize > 0" class="cd-popover__arrow" :style="arrowStyle" />
    </view>

    <!-- 点击空白处收起：透明的盾，同时阻断对页面其它部分的误触 -->
    <view v-if="open" class="cd-popover__shield" @click="requestClose('outside')" @touchmove.stop.prevent="noop" />
  </view>
</template>

<script setup>
/**
 * cd-popover —— 内容气泡
 * ---------------------------------------------------------------
 * 与 cd-tooltip 的分工：tooltip 只承载一句话；popover 承载一块
 * 可交互的内容（筛选面板、确认气泡、快捷操作）。所以 popover：
 *   - 点击触发（hover 触发的可交互浮层是可用性灾难）
 *   - 面板内点击不会关闭（@click.stop）
 *   - 点击空白 / Esc 收起
 */
import { computed, onUnmounted, watch } from 'vue'
import { useFloating, FLOAT_PLACEMENTS } from '../../composables/use-floating'

defineOptions({
  name: 'cd-popover',
  options: {
    addGlobalClass: true,
  },
})

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  placement: {
    type: String,
    default: 'bottom',
  },
  /** 面板宽度；不传由内容决定，但会钳制在 90vw 内 */
  width: {
    type: [String, Number],
    default: '',
  },
  arrowSize: {
    type: Number,
    default: 6,
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

const emit = defineEmits(['update:modelValue', 'open', 'close'])

const floating = useFloating({
  triggerSelector: '.cd-floating__trigger',
  panelSelector: '.cd-popover__panel',
  gap: 10,
  arrowSize: props.arrowSize,
  placement: computed(() => (FLOAT_PLACEMENTS.includes(props.placement) ? props.placement : 'bottom')),
})

const open = floating.open

/* 定位与箭头的内联样式必须显式从 floating 里取出来。
   模板里写 panelStyle 只会落到 _ctx 上（undefined），
   面板就会失去 left/top，掉回文档流原位 —— 这是个截图都不容易发现的坑 */
const uid = floating.uid
const panelStyle = floating.panelStyle
const arrowStyle = floating.arrowStyle

function sync(value) {
  emit('update:modelValue', value)
  emit(value ? 'open' : 'close')
}

function onTriggerTap() {
  if (props.disabled) return
  if (open.value) {
    floating.hide()
    sync(false)
    return
  }
  floating.show()
  sync(true)
}

function requestClose(action) {
  if (!open.value) return
  floating.hide()
  sync(false)
  emit('close', action)
}

function noop() {}

const bodyStyle = computed(() => {
  const parts = []
  if (props.width !== '') {
    const w = typeof props.width === 'number' ? `${props.width}px` : props.width
    parts.push(`width:${w};`)
  }
  return parts.join('')
})

/* -------------------- Esc 收起（H5） -------------------- */

function onKeydown(event) {
  if (event.key !== 'Escape' && event.keyCode !== 27) return
  requestClose('esc')
}

let escBound = false

function bindEsc() {
  /* #ifdef H5 */
  if (escBound || typeof document === 'undefined') return
  escBound = true
  document.addEventListener('keydown', onKeydown)
  /* #endif */
}

function unbindEsc() {
  /* #ifdef H5 */
  if (!escBound || typeof document === 'undefined') return
  escBound = false
  document.removeEventListener('keydown', onKeydown)
  /* #endif */
}

/* floating.open 变化时同步 Esc 监听 */
watch(open, (value) => {
  if (value) bindEsc()
  else unbindEsc()
})

/** 支持外部受控：v-model 置 true / false 都能驱动面板 */
watch(
  () => props.modelValue,
  (value) => {
    if (value === open.value) return
    if (value) floating.show()
    else floating.hide()
  },
  { immediate: true }
)

onUnmounted(unbindEsc)
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-popover {
  @include cd-reset;
  display: inline-flex;
  max-width: 100%;
}

.cd-floating__trigger {
  display: inline-flex;
  max-width: 100%;
}

.cd-popover__panel {
  @include cd-reset;
  position: fixed;
  min-width: 120px;
  max-width: 90vw;
  background-color: var(--cd-bg-elevated, #ffffff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
  border-radius: var(--cd-radius-lg, 12px);
  box-shadow: var(--cd-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.16));
  animation: cd-popover-in 160ms ease-out;
}

.cd-popover__title {
  padding: var(--cd-space-3, 12px) var(--cd-space-4, 16px) 0;
}

.cd-popover__title-text {
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #0f172a);
  line-height: var(--cd-line-height-tight, 1.25);
}

.cd-popover__body {
  padding: var(--cd-space-3, 12px) var(--cd-space-4, 16px) var(--cd-space-4, 16px);
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-regular, #334155);
}

/* 有标题时正文与标题之间不需要额外间距，正文自己留出即可 */
.cd-popover__title + .cd-popover__body {
  padding-top: var(--cd-space-2, 8px);
}

.cd-popover__arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: var(--cd-bg-elevated, #ffffff);
  /* 刻意不带边框：带边框的箭头会在面板边缘露出一道斜线，
     要消掉它得做双层嵌套方块，为一个 1px 的接缝不值当 */
  transform: rotate(45deg);
}

.cd-popover__shield {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: calc(var(--cd-z-dropdown, 1500) - 1);
}

@keyframes cd-popover-in {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
