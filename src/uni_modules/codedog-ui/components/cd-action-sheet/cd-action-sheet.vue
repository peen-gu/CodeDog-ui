<template>
  <wd-popup
    :model-value="modelValue"
    position="bottom"
    :custom-class="panelClass"
    :custom-style="panelStyle"
    :z-index="zIndex"
    :close-on-click-modal="maskClosable"
    :safe-area-inset-bottom="safeArea"
    :root-portal="true"
    :duration="260"
    :lock-scroll="true"
    @update:model-value="handlePopupUpdate"
    @after-enter="handleAfterEnter"
  >
    <view class="cd-action-sheet" :class="sheetClass">
      <view v-if="hasHeader" class="cd-action-sheet__header">
        <slot name="header">
          <text v-if="title" class="cd-action-sheet__title">{{ title }}</text>
          <text v-if="description" class="cd-action-sheet__description">{{ description }}</text>
        </slot>
      </view>

      <view class="cd-action-sheet__list">
        <slot>
          <view
            v-for="(item, index) in actions"
            :key="item.name !== undefined ? item.name : index"
            class="cd-action-sheet__item"
            :class="[
              item.disabled ? 'cd-action-sheet__item--disabled' : '',
              item.danger ? 'cd-action-sheet__item--danger' : '',
            ]"
            @click="handleSelect(item, index)"
          >
            <view v-if="item.icon" class="cd-action-sheet__item-icon">
              <cd-icon :name="item.icon" size="1.1em" />
            </view>

            <view class="cd-action-sheet__item-body">
              <text class="cd-action-sheet__item-label" :style="item.color ? `color:${item.color};` : ''">
                {{ item.label }}
              </text>
              <text v-if="item.description" class="cd-action-sheet__item-desc">{{ item.description }}</text>
            </view>
          </view>
        </slot>
      </view>

      <view v-if="showCancel" class="cd-action-sheet__gap" />

      <view v-if="showCancel" class="cd-action-sheet__cancel" @click="handleCancel">
        <slot name="cancel">
          <text class="cd-action-sheet__cancel-text">{{ cancelText }}</text>
        </slot>
      </view>
    </view>
  </wd-popup>
</template>

<script setup>
/**
 * cd-action-sheet —— 动作面板
 * ---------------------------------------------------------------
 * 复用 wd-popup 的遮罩 / 上滑动画 / 滚动锁 / root-portal，
 * 主题作用域由 useWotScope 补齐 —— 与 cd-dialog / cd-drawer 同一套约定
 * （弹层被传送到 body 后会脱离页面主题作用域，必须自己带上）。
 *
 * 两个移动端专属的设计细节：
 *
 * 1. 取消按钮与动作列表之间有一条「视觉间隙」而不是一条分隔线。
 *    这是 iOS 动作面板的经典做法，语义是「这一块和上面不是一类」，
 *    比一根线更能表达「取消不属于任何动作」。
 *
 * 2. 危险动作不是靠传一个颜色值，而是提供了一个 danger 布尔。
 *    因为「销毁」这类动作要同时处理：文字变红、按压反馈变红、
 *    且永远排在用户预期的位置。让业务每处都写 style 迟早会漏。
 *
 * 面板固定在底部，不做 PC 形态适配 —— 动作面板本身就是移动端的交互范式，
 * 在 PC 上应当改用 cd-dropdown 或 cd-popover（文档里有写）。
 */
import { computed, useSlots } from 'vue'
import { useWotScope } from '../../composables/use-wot-scope'

defineOptions({
  name: 'cd-action-sheet',
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
  description: {
    type: String,
    default: '',
  },
  /** [{ name, label, icon, description, color, disabled, danger }] */
  actions: {
    type: Array,
    default: () => [],
  },
  cancelText: {
    type: String,
    default: '取消',
  },
  showCancel: {
    type: Boolean,
    default: true,
  },
  maskClosable: {
    type: Boolean,
    default: true,
  },
  /** 底部安全区适配 */
  safeArea: {
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

const emit = defineEmits(['update:modelValue', 'select', 'cancel', 'close', 'open'])

const slots = useSlots()
const { scopeClass, scopeStyle, isDark } = useWotScope()

const hasHeader = computed(() => !!props.title || !!props.description || !!slots.header)

const sheetClass = computed(() => [isDark.value ? 'cd-action-sheet--dark' : '', props.customClass].filter(Boolean).join(' '))

const panelClass = computed(() =>
  ['cd-action-sheet__panel', scopeClass.value].filter(Boolean).join(' ')
)

/**
 * wd-popup 写死了白色背景与 overflow:auto，
 * 这里用内联样式盖掉（内联优先级天然高于选择器，不需要 !important）。
 * 与 cd-drawer 里的处理完全一致。
 */
const panelStyle = computed(() =>
  [
    scopeStyle.value,
    'background:transparent;',
    'overflow:visible;',
    'max-height:86vh;',
  ].join('')
)

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

function handleSelect(item, index) {
  if (!item || item.disabled) return
  /* 先关再抛：业务常在 select 里立刻发起请求并弹 loading，
     面板还挂着会盖住 loading 遮罩 */
  emit('update:modelValue', false)
  emit('select', item, index)
  emit('close', 'select')
}

function handleCancel() {
  requestClose('cancel')
  emit('cancel')
}

function handleAfterEnter() {
  emit('open')
}
</script>

<script>
export default {
  name: 'cd-action-sheet',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-action-sheet__panel {
  display: block;
}

.cd-action-sheet {
  @include cd-reset;

  /* 面板限高 + 列表自己滚动。
     外层是 overflow:hidden（为了裁掉顶部圆角外的内容），
     动作项一多就会把超出部分直接吃掉 —— 底部若干项永远点不到。
     所以这里做成纵向弹性容器：头 / 间隙 / 取消固定不缩，
     列表拿走剩余空间并自己滚，与 cd-dialog__body / cd-drawer__body 同一套。 */
  display: flex;
  flex-direction: column;
  max-height: 86vh;
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: var(--cd-action-radius, 16px) var(--cd-action-radius, 16px) 0 0;
  overflow: hidden;
}

/* ==================================================================
 * 头部
 * ================================================================== */
.cd-action-sheet__header {
  flex-shrink: 0;
  padding: var(--cd-space-5, 20px) var(--cd-space-4, 16px) var(--cd-space-3, 12px);
  text-align: center;
}

.cd-action-sheet__title {
  display: block;
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-secondary, #64748b);
}

.cd-action-sheet__description {
  display: block;
  margin-top: var(--cd-space-1, 4px);
  font-size: var(--cd-font-size-xs, 11px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-placeholder, #94a3b8);
}

/* ==================================================================
 * 动作列表
 * ================================================================== */
.cd-action-sheet__list {
  display: block;
  /* min-height:0 是弹性容器里「允许收缩到内容以下」的开关，
     没有它 flex:1 的子项会被内容顶开，max-height 形同虚设 */
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.cd-action-sheet__item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--cd-action-item-height, 50px);
  padding: var(--cd-space-2, 8px) var(--cd-space-4, 16px);
  cursor: pointer;
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-action-sheet__item:active {
  background-color: var(--cd-bg-active, rgba(15, 23, 42, 0.08));
}

@include cd-hover {
  .cd-action-sheet__item:hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  }
}

.cd-action-sheet__item-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: var(--cd-space-2, 8px);
  color: var(--cd-text-secondary, #64748b);
}

.cd-action-sheet__item-body {
  min-width: 0;
  text-align: center;
}

.cd-action-sheet__item-label {
  font-size: var(--cd-font-size-md, 16px);
  line-height: var(--cd-line-height-tight, 1.25);
  color: var(--cd-text-primary, #0f172a);
}

.cd-action-sheet__item-desc {
  display: block;
  margin-top: 2px;
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-tight, 1.25);
  color: var(--cd-text-secondary, #64748b);
}

.cd-action-sheet__item--danger .cd-action-sheet__item-label,
.cd-action-sheet__item--danger .cd-action-sheet__item-icon {
  color: var(--cd-action-danger-color, #ef4444);
}

.cd-action-sheet__item--danger:active {
  background-color: var(--cd-color-danger-soft, #fef2f2);
}

.cd-action-sheet__item--disabled {
  cursor: not-allowed;
}

.cd-action-sheet__item--disabled .cd-action-sheet__item-label,
.cd-action-sheet__item--disabled .cd-action-sheet__item-desc,
.cd-action-sheet__item--disabled .cd-action-sheet__item-icon {
  color: var(--cd-text-disabled, #cbd5e1);
}

/* ==================================================================
 * 取消
 * ================================================================== */
/**
 * 用「大间隙」而不是「一根线」分隔取消与动作列表。
 * 间隙本身也是可点的空白（视觉上属于面板底部），但这里刻意不给它绑定事件 ——
 * 点在间隙上什么都不发生，比误判成取消更安全。
 */
.cd-action-sheet__gap {
  flex-shrink: 0;
  height: var(--cd-space-2, 8px);
  background-color: var(--cd-bg-sunken, #f1f5f9);
}

.cd-action-sheet__cancel {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: var(--cd-action-item-height, 50px);
  padding: var(--cd-space-2, 8px) var(--cd-space-4, 16px);
  background-color: var(--cd-bg-container, #ffffff);
  cursor: pointer;
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-action-sheet__cancel:active {
  background-color: var(--cd-bg-active, rgba(15, 23, 42, 0.08));
}

@include cd-hover {
  .cd-action-sheet__cancel:hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  }
}

.cd-action-sheet__cancel-text {
  font-size: var(--cd-font-size-md, 16px);
  font-weight: var(--cd-font-weight-medium, 500);
  line-height: 1;
  color: var(--cd-text-regular, #334155);
}

/* 暗色下圆角处会露出页面背景，补一层更实的阴影让面板「浮」起来 */
.cd-action-sheet--dark {
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.55);
}
</style>
