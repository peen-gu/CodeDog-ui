<template>
  <view class="cd-feedback" :class="scopeClass" :style="scopeStyle">
    <!-- ==================== toast 层 ==================== -->
    <view
      v-for="pos in TOAST_POSITIONS"
      :key="pos"
      class="cd-feedback__toast-layer"
      :class="`cd-feedback__toast-layer--${pos}`"
    >
      <view
        v-for="item in toastsAt(pos)"
        :key="item.id"
        class="cd-toast"
        :class="[`cd-toast--${item.type}`, `cd-toast--in-${pos}`]"
      >
        <cd-icon
          v-if="item.showIcon && iconOf(item.type)"
          class="cd-toast__icon"
          :name="iconOf(item.type)"
          :size="16"
        />
        <cd-loading v-if="item.type === 'loading'" class="cd-toast__icon" type="spinner" :size="14" />
        <text v-if="item.message" class="cd-toast__msg">{{ item.message }}</text>
      </view>
    </view>

    <!-- ==================== confirm / alert ==================== -->
    <cd-dialog
      v-if="modal"
      :model-value="true"
      :title="modal.title"
      :width="modalWidth"
      :show-cancel="modal.showCancel"
      :confirm-text="modal.confirmText"
      :cancel-text="modal.cancelText"
      :mask-closable="modal.maskClosable"
      :z-index="SERVICE_Z.modal"
      :mode="modalMode"
      @confirm="settleModal(true)"
      @cancel="settleModal(false)"
      @close="settleModal(false)"
    >
      <view class="cd-feedback__modal-body">
        <view v-if="iconOf(modal.type)" class="cd-feedback__modal-icon" :class="`cd-feedback__modal-icon--${modal.type}`">
          <cd-icon :name="iconOf(modal.type)" :size="20" />
        </view>
        <text class="cd-feedback__modal-text">{{ modal.content }}</text>
      </view>
    </cd-dialog>

    <!-- ==================== loading ==================== -->
    <view v-if="loading" class="cd-feedback__loading">
      <view v-if="loading.mask" class="cd-feedback__loading-mask" />
      <view class="cd-feedback__loading-body">
        <cd-loading type="spinner" :size="30" />
        <text v-if="loading.message" class="cd-feedback__loading-text">{{ loading.message }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-toast-host —— 命令式反馈服务的渲染宿主
 * ---------------------------------------------------------------
 * service/ 里的全局状态（toast 队列 / 模态 / loading）在这里变成真实节点。
 *
 * 挂载方式：
 *   H5    —— 不需要手动挂。service 首次调用时自动 createApp 到 body。
 *   小程序 —— 需要在页面里放一次 <cd-toast-host />；没放也能用，
 *             service 会降级到 uni.showToast / showModal / showLoading。
 *
 * 小程序多页面都挂了宿主怎么办：不做唯一宿主仲裁。所有宿主渲染同一份
 * 全局状态，内容与坐标完全一致，重叠视觉上就是一份。
 * 在小程序里拿不到「哪个页面在最上面」的可靠信号，仲裁是伪需求。
 */
import { computed } from 'vue'
import { toastList, modalState, loadingState, hostReady, TOAST_MAX } from '../../service/state'
import { settleModal } from '../../service/index'
import { useWotScope } from '../../composables/use-wot-scope'
import { useBreakpoint, resolveDesktopShape } from '../../composables/use-breakpoint'
import { SERVICE_Z } from '../../constants'
import CdIcon from '../cd-icon/cd-icon.vue'
import CdLoading from '../cd-loading/cd-loading.vue'
import CdDialog from '../cd-dialog/cd-dialog.vue'

defineOptions({
  name: 'cd-toast-host',
  options: {
    addGlobalClass: true,
  },
})

const TOAST_POSITIONS = ['top', 'middle', 'bottom']

const ICONS = {
  success: 'check-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'info',
}

function iconOf(type) {
  return ICONS[type] || ''
}

const { scopeClass, scopeStyle } = useWotScope()
const { isPC } = useBreakpoint()

/** 小程序端宿主就绪上报；H5 自动挂载流程也会走到这里 */
hostReady.value = true

/** PC 上确认框居中模态、移动端走底部抽屉 —— 与 cd-dialog 的双形态策略一致 */
const modalMode = computed(() => resolveDesktopShape('auto', isPC) ? 'desktop' : 'mobile')
const modalWidth = computed(() => (modalMode.value === 'desktop' ? 420 : 'auto'))

const modal = computed(() => modalState.value)
const loading = computed(() => loadingState.value)

/** 每个方位一层，层内纵向排列（新的在上、旧的在下） */
function toastsAt(position) {
  const list = toastList.value.filter((t) => t.position === position)
  return list.length > TOAST_MAX ? list.slice(list.length - TOAST_MAX) : list
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

/* 宿主根节点只承载主题作用域，自身不产生任何视觉与布局 */
.cd-feedback {
  position: static;
}

/* ==================== toast 层 ==================== */

.cd-feedback__toast-layer {
  position: fixed;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 不挡下层内容：命中判定交给 toast 本体 */
  pointer-events: none;
}

.cd-feedback__toast-layer--top {
  top: 0;
  padding: calc(12px + env(safe-area-inset-top)) 16px 0;
  z-index: var(--cd-z-toast, 3000);
}

.cd-feedback__toast-layer--middle {
  top: 50%;
  transform: translateY(-50%);
  padding: 0 16px;
  z-index: var(--cd-z-toast, 3000);
}

.cd-feedback__toast-layer--bottom {
  bottom: 0;
  padding: 0 16px calc(24px + env(safe-area-inset-bottom));
  z-index: var(--cd-z-toast, 3000);
}

/* 层内排列方向：顶部从上往下堆，底部从下往上堆 */
.cd-feedback__toast-layer--top .cd-toast + .cd-toast {
  margin-top: 10px;
}

.cd-feedback__toast-layer--bottom .cd-toast + .cd-toast {
  margin-top: 10px;
}

.cd-toast {
  @include cd-reset;

  display: inline-flex;
  align-items: center;
  max-width: 86%;
  padding: 10px 16px;
  border-radius: var(--cd-radius-md, 8px);
  background-color: var(--cd-toast-bg, rgba(15, 23, 42, 0.92));
  color: var(--cd-toast-text, #ffffff);
  font-size: var(--cd-font-size-base, 14px);
  line-height: 20px;
  box-shadow: var(--cd-shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.18));
  pointer-events: auto;
  animation: cd-toast-fade 180ms ease-out;
}

.cd-toast__msg {
  /* 文案很长时允许两行，再多就该用 confirm 而不是 toast */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-all;
}

.cd-toast__icon {
  flex-shrink: 0;
  margin-right: var(--cd-space-2, 8px);
}

.cd-toast--success .cd-toast__icon {
  color: var(--cd-toast-success, #4ade80);
}

.cd-toast--error .cd-toast__icon {
  color: var(--cd-toast-error, #f87171);
}

.cd-toast--warning .cd-toast__icon {
  color: var(--cd-toast-warning, #fbbf24);
}

.cd-toast--info .cd-toast__icon {
  color: var(--cd-toast-info, #93c5fd);
}

@keyframes cd-toast-fade {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== confirm / alert ==================== */

.cd-feedback__modal-body {
  display: flex;
  align-items: flex-start;
}

.cd-feedback__modal-icon {
  flex-shrink: 0;
  margin-right: var(--cd-space-3, 12px);
  line-height: 1;
}

.cd-feedback__modal-icon--warning {
  color: var(--cd-color-warning, #d97706);
}

.cd-feedback__modal-icon--error {
  color: var(--cd-color-danger, #dc2626);
}

.cd-feedback__modal-icon--success {
  color: var(--cd-color-success, #16a34a);
}

.cd-feedback__modal-icon--info {
  color: var(--cd-color-info, #2563eb);
}

.cd-feedback__modal-text {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  line-height: var(--cd-line-height-base, 1.6);
  color: var(--cd-text-secondary, #475569);
  word-break: break-all;
}

/* ==================== loading ==================== */

.cd-feedback__loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--cd-mask, rgba(15, 23, 42, 0.45));
  z-index: var(--cd-z-loading, 2900);
}

.cd-feedback__loading-body {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--cd-space-5, 20px) var(--cd-space-6, 24px);
  border-radius: var(--cd-radius-lg, 12px);
  background-color: var(--cd-toast-bg, rgba(15, 23, 42, 0.92));
  z-index: calc(var(--cd-z-loading, 2900) + 1);
}

.cd-feedback__loading-text {
  margin-top: var(--cd-space-3, 12px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-toast-text, #ffffff);
  line-height: var(--cd-line-height-base, 1.5);
}
</style>
