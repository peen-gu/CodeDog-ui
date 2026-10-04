<template>
  <wd-popup
    :model-value="modelValue"
    :position="popupPosition"
    :custom-class="panelClass"
    :custom-style="panelStyle"
    :z-index="zIndex"
    :close-on-click-modal="maskClosable"
    :safe-area-inset-bottom="isMobileShape"
    :root-portal="true"
    :duration="240"
    :lock-scroll="true"
    @update:model-value="handlePopupUpdate"
    @after-enter="handleAfterEnter"
  >
    <view class="cd-dialog" :class="dialogClass">
      <view v-if="hasHeader" class="cd-dialog__header">
        <slot name="title">
          <text class="cd-dialog__title">{{ title }}</text>
        </slot>
        <view v-if="showClose" class="cd-dialog__close" @click="requestClose('close')">
          <view class="cd-dialog__close-bar cd-dialog__close-bar--a" />
          <view class="cd-dialog__close-bar cd-dialog__close-bar--b" />
        </view>
      </view>

      <view class="cd-dialog__body">
        <slot>{{ content }}</slot>
      </view>

      <view v-if="!hideFooter" class="cd-dialog__footer">
        <slot name="footer">
          <view v-if="showCancel" class="cd-dialog__footer-item">
            <cd-button type="default" :block="true" @click="requestClose('cancel')">
              {{ cancelText }}
            </cd-button>
          </view>
          <view class="cd-dialog__footer-item">
            <cd-button type="primary" :block="true" :loading="confirmLoading" @click="handleConfirm">
              {{ confirmText }}
            </cd-button>
          </view>
        </slot>
      </view>
    </view>
  </wd-popup>
</template>

<script setup>
/**
 * cd-dialog —— 双形态弹窗
 * ---------------------------------------------------------------
 * 一个组件，两种形态，由「交互能力」而不是单纯的屏幕宽度决定：
 *   移动端  → 底部抽屉（slide-up，顶部圆角，贴安全区，按钮纵向堆叠）
 *   桌面端  → 居中模态（zoom-in，固定宽度 480px，按钮右对齐，支持 Esc 关闭）
 *
 * 复用 wd-popup 的「难的部分」：遮罩、进出场动画生命周期、滚动锁、
 * z-index 管理、root-portal 传送。我们自己只负责三件事：
 *   1. 依据 isPC 决定 position 与视觉规格
 *   2. 补齐被传送出去后丢失的主题作用域（见 useWotScope）
 *   3. 桌面端的键盘交互（Esc）
 *
 * 为什么遮罩不自己写：它要在小程序端处理 touchmove 穿透、在 H5 端处理
 * 滚动锁与 iOS 橡皮筋、还要管多层弹窗的层级，这些坑不值得重踩一遍。
 */
import { computed, watch } from 'vue'
import { useBreakpoint, resolveDesktopShape } from '../../composables/use-breakpoint'
import { useWotScope } from '../../composables/use-wot-scope'
import { useEscLayer } from '../../composables/use-esc-stack'
import CdButton from '../cd-button/cd-button.vue'

defineOptions({
  name: 'cd-dialog',
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
  /** 不使用默认插槽时的纯文本内容 */
  content: {
    type: String,
    default: '',
  },
  /** 'auto' | 'mobile' | 'desktop' —— 强制形态，用于测试或窄容器内嵌 */
  mode: {
    type: String,
    default: 'auto',
  },
  /** 'auto' | 'center' | 'bottom' —— 覆盖由形态推导出的位置 */
  position: {
    type: String,
    default: 'auto',
  },
  /** 桌面端宽度，数字会被当作 px */
  width: {
    type: [String, Number],
    default: 480,
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  maskClosable: {
    type: Boolean,
    default: true,
  },
  showCancel: {
    type: Boolean,
    default: true,
  },
  cancelText: {
    type: String,
    default: '取消',
  },
  confirmText: {
    type: String,
    default: '确定',
  },
  confirmLoading: {
    type: Boolean,
    default: false,
  },
  hideFooter: {
    type: Boolean,
    default: false,
  },
  zIndex: {
    type: Number,
    default: 2200,
  },
  /**
   * 关闭前拦截。返回 false 可阻止关闭，适合「表单有未保存改动」的场景。
   * @type {(action: 'mask'|'close'|'cancel'|'confirm') => boolean | Promise<boolean> | void}
   */
  beforeClose: {
    type: Function,
    default: null,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'open', 'confirm', 'cancel', 'close'])

const { isPC } = useBreakpoint()
const { scopeClass, scopeStyle, isDark } = useWotScope()

/* -------------------- 形态推导 -------------------- */

/** true = 使用桌面形态 */
const desktopShape = computed(() => resolveDesktopShape(props.mode, isPC))
const isMobileShape = computed(() => !desktopShape.value)

const popupPosition = computed(() => {
  if (props.position !== 'auto') return props.position
  return desktopShape.value ? 'center' : 'bottom'
})

const hasHeader = computed(() => !!props.title || !!props.$slots?.title || props.showClose)

const dialogClass = computed(() =>
  [
    desktopShape.value ? 'cd-dialog--desktop' : 'cd-dialog--mobile',
    isDark.value ? 'cd-dialog--dark' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

/**
 * 面板类名 = 主题作用域 + 弹层自身的类。
 * 弹层被传送到 body 后不再继承 Provider 的变量，所以必须自带一份。
 */
const panelClass = computed(() =>
  ['cd-dialog__panel', `cd-dialog__panel--${popupPosition.value}`, scopeClass.value].filter(Boolean).join(' ')
)

/**
 * 面板内联样式。
 * 这里用内联而不是 CSS 覆盖，是因为 wd-popup 的 `background: #fff` 与
 * `overflow-y: auto` 是写死的，且选择器是 `.wd-popup-wrapper .wd-popup`。
 * 内联样式优先级天然高于外部样式表，不必用 !important 硬碰。
 * 外层面板保持透明，视觉全部交给内部的 .cd-dialog 负责。
 */
const panelStyle = computed(() => {
  const parts = [
    scopeStyle.value,
    'background:transparent;',
    'overflow:visible;',
    'max-height:100%;',
  ]
  if (desktopShape.value) {
    const w = typeof props.width === 'number' ? `${props.width}px` : props.width
    parts.push(`width:${w};`)
  }
  return parts.join('')
})

const modelValue = computed(() => props.modelValue)

/* -------------------- 交互 -------------------- */

/**
 * 拦截 wd-popup 的关闭意图。
 * 如果直接 v-model 双向绑定，弹层会在点击遮罩时自行关闭，
 * 从而绕过 beforeClose 的拦截。所以这里只单向接收。
 */
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
  if (action === 'cancel') emit('cancel')
  emit('close', action)
}

async function handleConfirm() {
  if (props.beforeClose) {
    const result = await props.beforeClose('confirm')
    if (result === false) return
  }
  emit('confirm')
}

/* -------------------- 桌面端键盘：Esc 关闭 -------------------- */

/* 走共享的 Esc 层级栈：同时开着多层浮层时，Esc 只关最上面那一层。
   自己监听 document.keydown 的话，一次 Esc 会把所有层一起关掉。 */
const esc = useEscLayer((event) => {
  if (event.key !== 'Escape' && event.keyCode !== 27) return
  if (!props.maskClosable) return
  requestClose('mask')
})

/**
 * 入栈必须发生在「modelValue 变 true」的那一刻，而不是动画结束的 after-enter。
 * 之前放在 handleAfterEnter 里：抽屉 240ms / 弹窗 260ms 的入场动画期间，
 * 任何后开的浮层都会先入栈、站到它上面，
 * 于是按 Esc 关掉的是那个后开的层而不是最上面的这一个 —— 栈序反了。
 * 栈的语义是「打开的先后顺序」，打开瞬间入栈才对得上。
 */
watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      /* 键盘交互只可能出现在 H5；栈内部已按平台跳过 */
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

/* 外层面板：透明定位容器。它自带 cd-root 类，已携带全套主题变量 */
.cd-dialog__panel {
  display: block;
}

/* ==================================================================
 * 对话框主体 —— 两种形态共用的骨架
 * ================================================================== */
.cd-dialog {
  @include cd-reset;
  display: flex;
  flex-direction: column;
  background-color: var(--cd-bg-elevated, #ffffff);
  color: var(--cd-text-primary, #0f172a);
  overflow: hidden;
}

.cd-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cd-dialog__title {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-md, 16px);
  font-weight: var(--cd-font-weight-semibold, 600);
  line-height: var(--cd-line-height-tight, 1.25);
  color: var(--cd-text-primary, #0f172a);
}

/* 关闭按钮：两根细条旋转成叉。不引图标字体，省一份字体文件与首屏闪烁 */
.cd-dialog__close {
  position: relative;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-left: var(--cd-space-3, 12px);
  border-radius: var(--cd-radius-sm, 4px);
  cursor: pointer;
}

.cd-dialog__close-bar {
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

.cd-dialog__close-bar--a {
  transform: rotate(45deg);
}

.cd-dialog__close-bar--b {
  transform: rotate(-45deg);
}

@include cd-hover {
  .cd-dialog__close:hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  }
}

.cd-dialog__body {
  flex: 1;
  min-height: 0;
  font-size: var(--cd-font-size-base, 14px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-regular, #334155);
  overflow-y: auto;
}

.cd-dialog__footer {
  display: flex;
}

/**
 * 按钮外面套一层 item 容器，而不是直接给 cd-button 加类。
 * 原因：小程序端自定义组件会渲染出宿主节点，直接加类只能改到宿主，
 * 且 `A + B` 兄弟选择器会作用在宿主上而非内部按钮节点，行为不可控。
 * 用普通 view 做容器，尺寸与间距就完全在我们自己的样式作用域内。
 */
.cd-dialog__footer-item {
  flex: 1 1 auto;
  min-width: 0;
}

/* ==================================================================
 * 形态一：移动端 —— 底部抽屉
 * ================================================================== */
.cd-dialog--mobile {
  border-radius: var(--cd-radius-xl, 16px) var(--cd-radius-xl, 16px) 0 0;
  max-height: 86vh;
}

.cd-dialog--mobile .cd-dialog__header {
  padding: var(--cd-space-5, 20px) var(--cd-space-4, 16px) 0;
}

.cd-dialog--mobile .cd-dialog__body {
  padding: var(--cd-space-3, 12px) var(--cd-space-4, 16px) 0;
}

.cd-dialog--mobile .cd-dialog__footer {
  /* column-reverse：DOM 顺序不变，视觉上主按钮在上、次按钮在下 */
  flex-direction: column-reverse;
  padding: var(--cd-space-4, 16px);
  padding-bottom: calc(var(--cd-space-4, 16px) + env(safe-area-inset-bottom));
}

.cd-dialog--mobile .cd-dialog__footer-item {
  width: 100%;
  flex: 0 0 auto;
}

.cd-dialog--mobile .cd-dialog__footer-item + .cd-dialog__footer-item {
  margin-bottom: var(--cd-space-2, 8px);
}

/* ==================================================================
 * 形态二：桌面端 —— 居中模态
 * ================================================================== */
.cd-dialog--desktop {
  border-radius: var(--cd-dialog-radius, 12px);
  box-shadow: var(--cd-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.16));
  max-height: 80vh;
}

.cd-dialog--desktop .cd-dialog__header {
  padding: var(--cd-space-5, 20px) var(--cd-space-5, 20px) 0;
}

.cd-dialog--desktop .cd-dialog__body {
  padding: var(--cd-space-3, 12px) var(--cd-space-5, 20px) 0;
}

/* 桌面端按钮不撑满，按内容宽度右对齐 —— PC 表单对话框的标准形态 */
.cd-dialog--desktop .cd-dialog__footer {
  flex-direction: row;
  justify-content: flex-end;
  padding: var(--cd-space-5, 20px);
}

.cd-dialog--desktop .cd-dialog__footer-item {
  flex: 0 0 auto;
  min-width: 88px;
}

.cd-dialog--desktop .cd-dialog__footer-item + .cd-dialog__footer-item {
  margin-left: var(--cd-space-3, 12px);
}

/* 暗色底下阴影要更实，否则浮层感会消失 */
.cd-dialog--dark {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
}
</style>
