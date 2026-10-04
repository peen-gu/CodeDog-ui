<template>
  <view class="cd-tooltip" @mouseenter="onEnter" @mouseleave="onLeave" @longpress="onLongPress" @click="onTap">
    <view class="cd-floating__trigger">
      <slot />
    </view>

    <view v-if="open" class="cd-tooltip__panel" :class="uid" :style="panelStyle">
      <text class="cd-tooltip__content" :style="contentStyle">
        <slot name="content">{{ content }}</slot>
      </text>
      <view v-if="arrowSize > 0" class="cd-tooltip__arrow" :style="arrowStyle" />
    </view>

    <!-- 移动端点击空白处收起：一层透明的「盾」，比 document 监听跨端可靠 -->
    <!-- 同 cd-popover：shield 在触发容器内，不加 .stop 会冒泡回根节点的 onTap，收起后立刻又被打开 -->
    <view v-if="open && shield" class="cd-tooltip__shield" @click.stop="hide" @touchmove.stop.prevent="noop" />
  </view>
</template>

<script setup>
/**
 * cd-tooltip —— 文字气泡提示
 * ---------------------------------------------------------------
 * 交互随「有没有鼠标」分流，而不是随屏幕宽度：
 *   有鼠标（PC） → hover 进出，带延迟避免划过路径上的误闪
 *   无鼠标（移动）→ 长按唤出，点击空白处收起
 *
 * 定位交给 useFloating（两段式测量），面板用 position:fixed 直接渲染
 * 在组件内 —— 不传送、不遮罩、不锁滚动，这是气泡与弹窗的本质区别。
 */
import { computed, ref } from 'vue'
import { useFloating, FLOAT_PLACEMENTS } from '../../composables/use-floating'
import { useDevice } from '../../composables/use-device'

defineOptions({
  name: 'cd-tooltip',
  options: {
    addGlobalClass: true,
  },
})

const props = defineProps({
  /** 提示内容（也可用 content 插槽承载富文本） */
  content: {
    type: String,
    default: '',
  },
  /** 12 个方位：top / top-start / top-end / bottom / ... / right-end */
  placement: {
    type: String,
    default: 'top',
  },
  /** 最大宽度，超出折行 */
  maxWidth: {
    type: [String, Number],
    default: 240,
  },
  arrowSize: {
    type: Number,
    default: 6,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 移动端是否渲染「点击空白处收起」的透明盾 */
  shield: {
    type: Boolean,
    default: true,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['visible-change'])

const { canHover } = useDevice()

const floating = useFloating({
  triggerSelector: '.cd-floating__trigger',
  panelSelector: '.cd-tooltip__panel',
  gap: 8,
  arrowSize: props.arrowSize,
  placement: computed(() => (FLOAT_PLACEMENTS.includes(props.placement) ? props.placement : 'top')),
})

const open = floating.open

/* 定位与箭头的内联样式必须显式从 floating 里取出来。
   模板里写 panelStyle 只会落到 _ctx 上（undefined），
   面板就会失去 left/top，掉回文档流原位 —— 这是个截图都不容易发现的坑 */
const uid = floating.uid
const panelStyle = floating.panelStyle
const arrowStyle = floating.arrowStyle

/* hover 进出都要有延迟：没有延迟的 tooltip 会沿着鼠标轨迹一路闪过去 */
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

function onEnter() {
  if (!canHover.value || props.disabled) return
  clearTimers()
  enterTimer.value = setTimeout(() => {
    floating.show()
    emit('visible-change', true)
  }, 120)
}

function onLeave() {
  if (!canHover.value) return
  clearTimers()
  leaveTimer.value = setTimeout(() => {
    if (open.value) {
      floating.hide()
      emit('visible-change', false)
    }
  }, 80)
}

function onLongPress() {
  if (canHover.value || props.disabled) return
  clearTimers()
  floating.show()
  emit('visible-change', true)
}

/** 无鼠标设备上点一下也能唤出（发现性比长按好），有鼠标时 hover 已处理，忽略 click */
function onTap() {
  if (canHover.value || props.disabled) return
  clearTimers()
  floating.toggle()
  emit('visible-change', open.value)
}

function hide() {
  if (!open.value) return
  floating.hide()
  emit('visible-change', false)
}

function noop() {}

const contentStyle = computed(() => {
  const w = typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth
  return `max-width:${w};`
})
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

/* 触发物容器：inline-flex 让包裹行为尽量不改变宿主布局 */
.cd-tooltip {
  @include cd-reset;
  display: inline-flex;
  max-width: 100%;
}

.cd-floating__trigger {
  display: inline-flex;
  max-width: 100%;
}

.cd-tooltip__panel {
  @include cd-reset;
  position: fixed;
  padding: var(--cd-space-2, 8px) var(--cd-space-3, 12px);
  background-color: var(--cd-tooltip-bg, rgba(15, 23, 42, 0.92));
  border-radius: var(--cd-radius-md, 8px);
  box-shadow: var(--cd-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.12));
  animation: cd-tooltip-in 140ms ease-out;
}

.cd-tooltip__content {
  display: block;
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-tooltip-text, #ffffff);
  word-break: break-all;
}

/* 箭头：旋转 45 度的正方形，一半藏在面板里 */
.cd-tooltip__arrow {
  position: absolute;
  background-color: var(--cd-tooltip-bg, rgba(15, 23, 42, 0.92));
  transform: rotate(45deg);
}

/* 与 toast 同一套反色表面令牌：气泡在暗色下同样要比页面浅 */
.cd-theme-dark .cd-tooltip__panel,
.cd-theme-dark .cd-tooltip__arrow {
  background-color: var(--cd-toast-bg, rgba(51, 65, 85, 0.95));
}

.cd-tooltip__shield {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: calc(var(--cd-z-dropdown, 1500) - 1);
}

@keyframes cd-tooltip-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
