<template>
  <wd-popup
    :model-value="modelValue"
    :position="popupPosition"
    :custom-class="panelClass"
    :custom-style="panelStyle"
    :z-index="zIndex"
    :close-on-click-modal="maskClosable"
    :safe-area-inset-bottom="popupPosition === 'bottom'"
    :root-portal="true"
    :duration="260"
    :lock-scroll="true"
    @update:model-value="handlePopupUpdate"
    @after-enter="handleAfterEnter"
  >
    <view class="cd-drawer" :class="drawerClass">
      <view v-if="hasHeader" class="cd-drawer__header">
        <slot name="title">
          <text class="cd-drawer__title">{{ title }}</text>
        </slot>
        <view v-if="showClose" class="cd-drawer__close" @click="requestClose('close')">
          <view class="cd-drawer__close-bar cd-drawer__close-bar--a" />
          <view class="cd-drawer__close-bar cd-drawer__close-bar--b" />
        </view>
      </view>

      <view class="cd-drawer__body">
        <slot />
      </view>

      <view v-if="$slots.footer" class="cd-drawer__footer">
        <slot name="footer" />
      </view>
    </view>
  </wd-popup>
</template>

<script setup>
/**
 * cd-drawer —— 双形态抽屉
 * ---------------------------------------------------------------
 * 与 cd-dialog 的分工要分清：
 *   dialog 是「浮在内容上的一小块」，强调当下决策（确认 / 表单）；
 *   drawer 是「从边上滑进来的面板」，强调承载一块完整工作区
 *   （筛选栏、详情侧栏、移动端导航菜单）。所以 drawer 默认无 footer、
 *   body 独立滚动、支持四向 —— 这些都不是给 dialog 加参数能替代的。
 *
 * 双形态策略：
 *   position="auto" 时移动端从底部滑入（拇指可达），PC 从右侧滑入
 *   （后台侧栏的肌肉记忆）。显式传 left/right/top/bottom 则两端一致。
 *
 * 复用 wd-popup 的遮罩 / 动画 / 滚动锁 / root-portal，
 * 主题作用域由 useWotScope 补齐 —— 与 cd-dialog 同一套约定。
 */
import { computed, watch, useSlots } from 'vue'
import { useBreakpoint, resolveDesktopShape } from '../../composables/use-breakpoint'
import { useWotScope } from '../../composables/use-wot-scope'
import { useEscLayer } from '../../composables/use-esc-stack'

defineOptions({
  name: 'cd-drawer',
})

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  /** 'auto' | 'left' | 'right' | 'top' | 'bottom' */
  position: {
    type: String,
    default: 'auto',
  },
  /**
   * 抽屉尺寸：left/right 是宽度，top/bottom 是高度。
   * 数字按 px；字符串原样透传，所以 '80%' / '320px' / 'min(90vw, 400px)' 都可以。
   */
  size: {
    type: [String, Number],
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  /** 'auto' | 'mobile' | 'desktop' */
  mode: {
    type: String,
    default: 'auto',
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  maskClosable: {
    type: Boolean,
    default: true,
  },
  zIndex: {
    type: Number,
    default: 2200,
  },
  beforeClose: {
    type: Function,
    default: null,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'open', 'close'])

const slots = useSlots()

const { isPC } = useBreakpoint()
const { scopeClass, scopeStyle, isDark } = useWotScope()

/** 是否使用桌面形态（决定 auto 位置与 Esc 行为） */
const desktopShape = computed(() => resolveDesktopShape(props.mode, isPC))

const DIRECTIONS = ['left', 'right', 'top', 'bottom']

const popupPosition = computed(() => {
  if (DIRECTIONS.includes(props.position)) return props.position
  return desktopShape.value ? 'right' : 'bottom'
})

/** 横向抽屉（左右）还是纵向抽屉（上下） */
const isHorizontal = computed(() => popupPosition.value === 'left' || popupPosition.value === 'right')

const hasHeader = computed(() => !!props.title || !!slots.title || props.showClose)

const drawerClass = computed(() =>
  [
    `cd-drawer--${popupPosition.value}`,
    desktopShape.value ? 'cd-drawer--desktop' : 'cd-drawer--mobile',
    isDark.value ? 'cd-drawer--dark' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const panelClass = computed(() =>
  [`cd-drawer__panel`, `cd-drawer__panel--${popupPosition.value}`, scopeClass.value].filter(Boolean).join(' ')
)

const panelStyle = computed(() => {
  const parts = [
    scopeStyle.value,
    'background:transparent;',
    'overflow:visible;',
    'max-height:100%;',
  ]
  if (props.size !== '') {
    const size = typeof props.size === 'number' ? `${props.size}px` : props.size
    /* 横向抽屉限宽、纵向抽屉限高，另一个方向交给 wd-popup（已是全宽 / 全高） */
    parts.push(isHorizontal.value ? `width:${size};` : `height:${size};`)
  }
  return parts.join('')
})

/* -------------------- 交互 -------------------- */

/** 单向接收 wd-popup 的关闭意图，保证 beforeClose 有机会拦截 */
function handlePopupUpdate(value) {
  if (value === false) {
    requestClose('mask')
    return
  }
  emit('update:modelValue', value)
}

async function requestClose(action) {
  if (props.beforeClose) {
    const result = await props.beforeClose(action)
    if (result === false) return
  }
  emit('update:modelValue', false)
  emit('close', action)
}

/* -------------------- 桌面端键盘：Esc 关闭 -------------------- */

/* 同 cd-dialog：走共享 Esc 层级栈，多层浮层同时打开时 Esc 只关最上面那层 */
const esc = useEscLayer((event) => {
  if (event.key !== 'Escape' && event.keyCode !== 27) return
  if (!props.maskClosable) return
  requestClose('mask')
})

/**
 * 同 cd-dialog：入栈放在「modelValue 变 true」的那一刻，
 * 不能等 after-enter —— 入场动画的 260ms 里后开的浮层会抢到栈顶。
 */
watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      if (desktopShape.value) esc.push()
      return
    }
    esc.remove()
  },
  { immediate: true }
)

function handleAfterEnter() {
  emit('open')
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-drawer__panel {
  display: block;
}

/**
 * 抽屉主体。
 * 不像 dialog 那样居中，抽屉永远是「贴边的一整条」，
 * 所以圆角只出现在与屏幕边缘相接的那一侧的开口处。
 */
.cd-drawer {
  @include cd-reset;
  display: flex;
  flex-direction: column;
  background-color: var(--cd-bg-elevated, #ffffff);
  color: var(--cd-text-primary, #0f172a);
  overflow: hidden;
}

.cd-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.cd-drawer__title {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-md, 16px);
  font-weight: var(--cd-font-weight-semibold, 600);
  line-height: var(--cd-line-height-tight, 1.25);
  color: var(--cd-text-primary, #0f172a);
}

.cd-drawer__close {
  position: relative;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-left: var(--cd-space-3, 12px);
  border-radius: var(--cd-radius-sm, 4px);
  cursor: pointer;
}

.cd-drawer__close-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 1.5px;
  margin-top: -0.75px;
  margin-left: -6px;
  background-color: var(--cd-text-secondary, #64748b);
  border-radius: 2px;
}

.cd-drawer__close-bar--a {
  transform: rotate(45deg);
}

.cd-drawer__close-bar--b {
  transform: rotate(-45deg);
}

@include cd-hover {
  .cd-drawer__close:hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  }
}

/* body 独立滚动：抽屉承载的是工作区，内容超出很常见 */
.cd-drawer__body {
  flex: 1;
  min-height: 0;
  font-size: var(--cd-font-size-base, 14px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-regular, #334155);
  overflow-y: auto;
}

.cd-drawer__footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  border-top: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
}

/* ==================================================================
 * 方向形态 —— 圆角只给「开口侧」
 * ================================================================== */
.cd-drawer--bottom {
  border-radius: var(--cd-radius-xl, 16px) var(--cd-radius-xl, 16px) 0 0;
}

.cd-drawer--top {
  border-radius: 0 0 var(--cd-radius-xl, 16px) var(--cd-radius-xl, 16px);
}

/* 左右抽屉的圆角只在靠内容的一侧 */
.cd-drawer--left {
  border-radius: 0 var(--cd-radius-xl, 16px) var(--cd-radius-xl, 16px) 0;
}

.cd-drawer--right {
  border-radius: var(--cd-radius-xl, 16px) 0 0 var(--cd-radius-xl, 16px);
}

/* ==================================================================
 * 密度差异 —— PC 紧凑、移动宽松
 * ================================================================== */
.cd-drawer--mobile .cd-drawer__header {
  padding: var(--cd-space-5, 20px) var(--cd-space-4, 16px) 0;
}

.cd-drawer--mobile .cd-drawer__body {
  padding: var(--cd-space-3, 12px) var(--cd-space-4, 16px) var(--cd-space-4, 16px);
}

.cd-drawer--mobile .cd-drawer__footer {
  padding: var(--cd-space-3, 12px) var(--cd-space-4, 16px);
  padding-bottom: calc(var(--cd-space-3, 12px) + env(safe-area-inset-bottom));
}

.cd-drawer--desktop .cd-drawer__header {
  padding: var(--cd-space-5, 20px) var(--cd-space-5, 20px) var(--cd-space-3, 12px);
}

.cd-drawer--desktop .cd-drawer__body {
  padding: 0 var(--cd-space-5, 20px) var(--cd-space-5, 20px);
}

.cd-drawer--desktop .cd-drawer__footer {
  padding: var(--cd-space-4, 16px) var(--cd-space-5, 20px);
}

/* 默认尺寸：抽屉不该窄到放不下内容，也不该宽到像全屏 */
.cd-drawer--bottom,
.cd-drawer--top {
  max-height: 86vh;
}

/**
 * 左右抽屉必须撑满整高。
 * wd-popup 的 --right/--left 只把「外层定位壳」拉成 top:0~bottom:0，
 * 内层 .cd-drawer 高度还是 auto —— 不补这条，抽屉会塌成内容高，
 * 看起来像右上角贴了一张卡片。
 */
.cd-drawer--left,
.cd-drawer--right {
  height: 100%;
  max-width: 92vw;
}

/* 暗色底下阴影更实，否则浮层感消失 */
.cd-drawer--dark {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
}
</style>
