<template>
  <view class="cd-popconfirm" @click="onTriggerTap">
    <view class="cd-floating__trigger">
      <slot name="reference" />
    </view>

    <view
      v-if="open"
      class="cd-popconfirm__panel"
      :class="[uid, arrowSize > 0 ? 'cd-popconfirm__panel--arrowed' : '']"
      :style="panelStyle + widthStyle"
      @click.stop
      @touchmove.stop
    >
      <view class="cd-popconfirm__body">
        <view v-if="icon" class="cd-popconfirm__icon" :class="`cd-popconfirm__icon--${confirmType}`">
          <cd-icon :name="icon" size="1.15em" />
        </view>

        <view class="cd-popconfirm__content">
          <view v-if="title || $slots.title" class="cd-popconfirm__title">
            <slot name="title">
              <text class="cd-popconfirm__title-text">{{ title }}</text>
            </slot>
          </view>

          <view class="cd-popconfirm__message">
            <slot>
              <text class="cd-popconfirm__message-text">{{ message }}</text>
            </slot>
          </view>
        </view>
      </view>

      <view class="cd-popconfirm__footer">
        <view v-if="showCancel" class="cd-popconfirm__btn cd-popconfirm__btn--cancel" @click="handleCancel">
          <text class="cd-popconfirm__btn-text">{{ cancelText }}</text>
        </view>
        <view class="cd-popconfirm__btn" :class="`cd-popconfirm__btn--${confirmType}`" @click="handleConfirm">
          <text class="cd-popconfirm__btn-text">{{ confirmText }}</text>
        </view>
      </view>

      <view v-if="arrowSize > 0" class="cd-popconfirm__arrow" :style="arrowStyle" />
    </view>

    <!-- 同 cd-popover：不加 .stop 时，点遮罩关闭后事件冒泡回根节点又被 onTriggerTap 打开，气泡永远关不掉 -->
    <view v-if="open" class="cd-popconfirm__shield" @click.stop="requestClose('outside')" @touchmove.stop.prevent="noop" />
  </view>
</template>

<script setup>
/**
 * cd-popconfirm —— 气泡确认框
 * ---------------------------------------------------------------
 * 和 cd-dialog 的分工：dialog 是「打断式」确认，用户必须先处理它；
 * popconfirm 是「贴着触发物」的轻确认，回答完之后视线不用搬家。
 * 删除单行、撤销一步这类动作用它比弹一个居中的 dialog 舒服得多 ——
 * 尤其在 PC 上，鼠标不用横跨半个屏幕去点确定。
 *
 * 技术形态上它属于「气泡族」，因此和 cd-popover 共用 useFloating：
 * 不遮罩、不锁滚动、不传送（传送出去会丢主题作用域，测量也麻烦）。
 * 与 popover 的差别只在内容结构：这里固定是「图标 + 文案 + 两个按钮」。
 *
 * 危险操作（confirmType="danger"）刻意把确认按钮做成实心红，
 * 取消按钮做成白底描边 —— 让「误点」永远落在视觉上更弱的那一侧。
 */
import { computed, watch } from 'vue'
import { useFloating, FLOAT_PLACEMENTS } from '../../composables/use-floating'
import { useEscLayer } from '../../composables/use-esc-stack'

defineOptions({
  name: 'cd-popconfirm',
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
  /** 提问文案。也可以用默认插槽写更复杂的内容 */
  message: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: '确定',
  },
  cancelText: {
    type: String,
    default: '取消',
  },
  /** primary / danger / warning */
  confirmType: {
    type: String,
    default: 'primary',
  },
  /** 左侧图标，传空则不显示 */
  icon: {
    type: String,
    default: 'help',
  },
  placement: {
    type: String,
    default: 'top',
  },
  width: {
    type: [String, Number],
    default: 240,
  },
  arrowSize: {
    type: Number,
    default: 6,
  },
  showCancel: {
    type: Boolean,
    default: true,
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

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'open', 'close'])

const floating = useFloating({
  triggerSelector: '.cd-floating__trigger',
  panelSelector: '.cd-popconfirm__panel',
  gap: 10,
  arrowSize: props.arrowSize,
  placement: computed(() => (FLOAT_PLACEMENTS.includes(props.placement) ? props.placement : 'top')),
})

/**
 * 面板宽度单独拼在定位样式后面，不塞进 useFloating 的 options。
 * 原因是 useFloating 内部的 customStyle 是一个「普通字符串」契约，
 * 传 computed 进去会被原样拼成 [object Object]。
 * 定位内核是三个气泡组件共用的，不值得为一个宽度参数去改它的契约。
 */
const widthStyle = computed(() => {
  if (props.width === '' || props.width === null) return ''
  const w = typeof props.width === 'number' ? `${props.width}px` : props.width
  return `width:${w};`
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
  emit('cancel', action)
}

function handleCancel() {
  requestClose('cancel')
}

function handleConfirm() {
  /* 先关再抛事件：业务在回调里可能立刻发请求并调用 loading，
     浮层还挂在那里会挡住 loading 遮罩 */
  floating.hide()
  sync(false)
  emit('confirm')
}

function noop() {}

/* -------------------- Esc 收起（H5） -------------------- */

/* 同 cd-popover：走共享 Esc 层级栈，不再自建 document 监听。
   popconfirm 尤其需要它 —— 自己监听时，一次 Esc 会同时关掉气泡和它上面的
   confirm，confirm 被判成「取消」，等于替用户做了一个没做过的决定。 */
const esc = useEscLayer(() => {
  requestClose('esc')
})

watch(open, (value) => {
  if (value) esc.push()
  else esc.remove()
})

watch(
  () => props.modelValue,
  (value) => {
    if (value === open.value) return
    if (value) floating.show()
    else floating.hide()
  },
  { immediate: true }
)
</script>

<script>
export default {
  name: 'cd-popconfirm',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-popconfirm {
  @include cd-reset;
  display: inline-flex;
  max-width: 100%;
}

.cd-floating__trigger {
  display: inline-flex;
  max-width: 100%;
}

.cd-popconfirm__panel {
  @include cd-reset;
  position: fixed;
  min-width: 180px;
  max-width: 90vw;
  /* 同 cd-popover：面板限高、内容区自己滚，箭头才不会被 overflow 裁掉 */
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 16px);
  padding: var(--cd-space-4, 16px);
  background-color: var(--cd-bg-elevated, #ffffff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
  border-radius: var(--cd-radius-lg, 12px);
  box-shadow: var(--cd-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.16));
  animation: cd-popconfirm-in 160ms ease-out;
}

/* ==================================================================
 * 内容
 * ================================================================== */
.cd-popconfirm__body {
  display: flex;
  align-items: flex-start;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.cd-popconfirm__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: var(--cd-space-2, 8px);
  /* 与第一行文字视觉居中，而不是与整块内容居中 */
  margin-top: 1px;
}

.cd-popconfirm__icon--primary {
  color: var(--cd-color-primary, #3b76f6);
}

.cd-popconfirm__icon--warning {
  color: var(--cd-color-warning, #f59e0b);
}

.cd-popconfirm__icon--danger {
  color: var(--cd-color-danger, #ef4444);
}

.cd-popconfirm__content {
  flex: 1;
  min-width: 0;
}

.cd-popconfirm__title {
  margin-bottom: var(--cd-space-1, 4px);
}

.cd-popconfirm__title-text {
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-semibold, 600);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-primary, #0f172a);
}

.cd-popconfirm__message-text {
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-regular, #334155);
}

/* ==================================================================
 * 按钮组
 * ================================================================== */
.cd-popconfirm__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  margin-top: var(--cd-space-3, 12px);
}

.cd-popconfirm__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--cd-control-height-sm, 28px);
  padding: 0 var(--cd-space-3, 12px);
  border-radius: var(--cd-radius-sm, 4px);
  border: var(--cd-border-width, 1px) solid transparent;
  cursor: pointer;
}

.cd-popconfirm__btn + .cd-popconfirm__btn {
  margin-left: var(--cd-space-2, 8px);
}

.cd-popconfirm__btn-text {
  font-size: var(--cd-font-size-sm, 12px);
  font-weight: var(--cd-font-weight-medium, 500);
  line-height: 1;
}

/* 取消：永远是最弱的那一个（白底描边） */
.cd-popconfirm__btn--cancel {
  background-color: var(--cd-bg-container, #ffffff);
  border-color: var(--cd-border-color, #e2e8f0);
}

.cd-popconfirm__btn--cancel .cd-popconfirm__btn-text {
  color: var(--cd-text-regular, #334155);
}

.cd-popconfirm__btn--primary {
  background-color: var(--cd-color-primary, #3b76f6);
  border-color: var(--cd-color-primary, #3b76f6);
}

.cd-popconfirm__btn--warning {
  background-color: var(--cd-color-warning, #f59e0b);
  border-color: var(--cd-color-warning, #f59e0b);
}

.cd-popconfirm__btn--danger {
  background-color: var(--cd-color-danger, #ef4444);
  border-color: var(--cd-color-danger, #ef4444);
}

.cd-popconfirm__btn--primary .cd-popconfirm__btn-text,
.cd-popconfirm__btn--warning .cd-popconfirm__btn-text,
.cd-popconfirm__btn--danger .cd-popconfirm__btn-text {
  color: #ffffff;
}

@include cd-hover {
  .cd-popconfirm__btn--cancel:hover {
    border-color: var(--cd-border-color-strong, #cbd5e1);
  }

  .cd-popconfirm__btn--primary:hover {
    background-color: var(--cd-color-primary-hover, #2560eb);
    border-color: var(--cd-color-primary-hover, #2560eb);
  }

  .cd-popconfirm__btn--danger:hover {
    background-color: var(--cd-color-danger-hover, #dc2626);
    border-color: var(--cd-color-danger-hover, #dc2626);
  }
}

/* ==================================================================
 * 箭头与遮罩
 * ================================================================== */
.cd-popconfirm__arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: var(--cd-bg-elevated, #ffffff);
  /* 不带边框：带边框的箭头会在面板边缘露出一道斜线（popover 里同理） */
  transform: rotate(45deg);
}

.cd-popconfirm__shield {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: calc(var(--cd-z-dropdown, 1500) - 1);
}

@keyframes cd-popconfirm-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
