<template>
  <view
    class="cd-button"
    :class="rootClass"
    :style="customStyle"
    :hover-class="hoverClass"
    :hover-start-time="0"
    :hover-stay-time="80"
    @click="handleClick"
  >
    <view v-if="loading" class="cd-button__spinner" />
    <slot v-else name="icon" />
    <text v-if="$slots.default" class="cd-button__text"><slot /></text>
  </view>
</template>

<script setup>
/**
 * cd-button —— 单形态基准组件
 * ---------------------------------------------------------------
 * 为什么按钮不包 wd-button，而是自己实现：
 * 按钮没有遮罩、动画、层级、滚动锁这类「难的部分」，
 * 自研成本极低，却能 100% 掌控设计语言（圆角、密度、hover 反馈）。
 * 而 dialog / select 这类组件我们反过来复用 wot 的 popup —— 因为难点在别处。
 * 「简单组件自研、复杂组件复用」是这条路线的基本取舍。
 *
 * 跨端要点：
 * - 所有尺寸取自 --cd-* 令牌，单位是 px。绝不使用 rpx，
 *   否则在 1440px 宽的 PC 屏上按钮会被拉到 40px 以上高度。
 * - 按压反馈分两路：H5 用 :active（鼠标与触摸都准），
 *   小程序用 hover-class（WXSS 的 :active 支持不稳定）。
 * - hover 态包在 (hover:hover) 媒体查询里，避免触屏设备「点完颜色不恢复」。
 */
import { computed } from 'vue'
import { isH5 } from '../../composables/use-platform'

const props = defineProps({
  /** primary / success / warning / danger / info / default / text */
  type: {
    type: String,
    default: 'default',
  },
  /** small / medium / large */
  size: {
    type: String,
    default: 'medium',
  },
  /** 幽灵按钮：透明底 + 同色文字与描边 */
  plain: {
    type: Boolean,
    default: false,
  },
  /** 胶囊圆角 */
  round: {
    type: Boolean,
    default: false,
  },
  /** 撑满父容器宽度 */
  block: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  customClass: {
    type: String,
    default: '',
  },
  customStyle: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['click'])

/**
 * H5 端交给 CSS 伪类处理按压与悬停，关掉 uni-app 的 hover-class
 * （它在 H5 上由鼠标事件模拟，会和 :hover 叠加出脏效果）。
 * 小程序端没有可靠的 :active，则改用 hover-class。
 */
const hoverClass = isH5 ? 'none' : 'cd-button--pressed'

const rootClass = computed(() =>
  [
    `cd-button--${props.type}`,
    `cd-button--${props.size}`,
    props.plain ? 'cd-button--plain' : '',
    props.round ? 'cd-button--round' : '',
    props.block ? 'cd-button--block' : '',
    props.disabled ? 'cd-button--disabled' : '',
    props.loading ? 'cd-button--loading' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

function handleClick(event) {
  if (props.disabled || props.loading) return
  emit('click', event)
}
</script>

<script>
export default {
  name: 'cd-button',
  options: {
    // 小程序端：让业务方的全局类可以作用于组件内部节点，便于做局部位移 / 尺寸微调
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

/* ==================================================================
 * 基础骨架
 * ================================================================== */
.cd-button {
  @include cd-reset;

  /* 每种 type 只需覆写这几个色调变量，其余规则全部共用 */
  --cd-btn-tone: var(--cd-bg-container, #ffffff);
  --cd-btn-tone-hover: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  --cd-btn-tone-soft: var(--cd-bg-active, rgba(15, 23, 42, 0.08));
  --cd-btn-tone-border: var(--cd-border-color, #e2e8f0);
  --cd-btn-on: var(--cd-text-regular, #334155);

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--cd-button-height, 36px);
  padding: 0 var(--cd-button-padding-x, 16px);
  background-color: var(--cd-btn-tone);
  border: var(--cd-border-width, 1px) solid var(--cd-btn-tone-border);
  border-radius: var(--cd-radius-md, 8px);
  box-sizing: border-box;
  color: var(--cd-btn-on);
  font-size: var(--cd-button-font-size, 14px);
  font-weight: var(--cd-font-weight-medium, 500);
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    border-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    opacity var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-button__text {
  /* text 元素在小程序里默认是 inline，需要显式行高避免被压 */
  line-height: 1;
}

/* ==================================================================
 * 类型：只声明色调，结构由上面的基础规则消费
 * ================================================================== */
.cd-button--primary {
  --cd-btn-tone: var(--cd-color-primary, #3b76f6);
  --cd-btn-tone-hover: var(--cd-color-primary-hover, #2560eb);
  --cd-btn-tone-soft: var(--cd-color-primary-soft, #eff5ff);
  --cd-btn-tone-border: var(--cd-color-primary, #3b76f6);
  --cd-btn-on: var(--cd-text-inverse, #ffffff);
}

.cd-button--success {
  --cd-btn-tone: var(--cd-color-success, #10b981);
  --cd-btn-tone-hover: var(--cd-color-success-hover, #059669);
  --cd-btn-tone-soft: var(--cd-color-success-soft, #ecfdf5);
  --cd-btn-tone-border: var(--cd-color-success, #10b981);
  --cd-btn-on: var(--cd-text-inverse, #ffffff);
}

.cd-button--warning {
  --cd-btn-tone: var(--cd-color-warning, #f59e0b);
  --cd-btn-tone-hover: var(--cd-color-warning-hover, #d97706);
  --cd-btn-tone-soft: var(--cd-color-warning-soft, #fffbeb);
  --cd-btn-tone-border: var(--cd-color-warning, #f59e0b);
  --cd-btn-on: var(--cd-text-inverse, #ffffff);
}

.cd-button--danger {
  --cd-btn-tone: var(--cd-color-danger, #ef4444);
  --cd-btn-tone-hover: var(--cd-color-danger-hover, #dc2626);
  --cd-btn-tone-soft: var(--cd-color-danger-soft, #fef2f2);
  --cd-btn-tone-border: var(--cd-color-danger, #ef4444);
  --cd-btn-on: var(--cd-text-inverse, #ffffff);
}

.cd-button--info {
  --cd-btn-tone: var(--cd-color-info, #64748b);
  --cd-btn-tone-hover: var(--cd-color-info-hover, #475569);
  --cd-btn-tone-soft: var(--cd-color-info-soft, #f1f5f9);
  --cd-btn-tone-border: var(--cd-color-info, #64748b);
  --cd-btn-on: var(--cd-text-inverse, #ffffff);
}

.cd-button--default {
  --cd-btn-tone: var(--cd-bg-container, #ffffff);
  --cd-btn-tone-hover: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  --cd-btn-tone-soft: var(--cd-bg-active, rgba(15, 23, 42, 0.08));
  --cd-btn-tone-border: var(--cd-border-color, #e2e8f0);
  --cd-btn-on: var(--cd-text-regular, #334155);
}

.cd-button--text {
  --cd-btn-tone: transparent;
  --cd-btn-tone-hover: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  --cd-btn-tone-soft: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  --cd-btn-tone-border: transparent;
  --cd-btn-on: var(--cd-color-primary, #3b76f6);
}

/* ==================================================================
 * 幽灵按钮：透明底 + 本色文字与描边
 * ================================================================== */
.cd-button--plain {
  background-color: transparent;
  color: var(--cd-btn-tone);
  border-color: var(--cd-btn-tone-border);
}

/* default 的「本色」是白色，幽灵态需要改用描边色与常规文字色 */
.cd-button--plain.cd-button--default {
  color: var(--cd-text-regular, #334155);
  border-color: var(--cd-border-color-strong, #cbd5e1);
}

.cd-button--plain.cd-button--text {
  border-color: transparent;
}

/* ==================================================================
 * 尺寸
 * ================================================================== */
.cd-button--small {
  height: var(--cd-button-height-sm, 28px);
  padding: 0 var(--cd-button-padding-x-sm, 12px);
  font-size: var(--cd-font-size-sm, 12px);
}

.cd-button--large {
  height: var(--cd-button-height-lg, 44px);
  padding: 0 var(--cd-button-padding-x-lg, 20px);
  font-size: var(--cd-font-size-md, 16px);
}

.cd-button--round {
  border-radius: var(--cd-radius-round, 999px);
}

.cd-button--block {
  display: flex;
  width: 100%;
}

/* ==================================================================
 * 交互反馈
 * 三路由，按端分工，互不干扰：
 *   - H5 鼠标悬停 → :hover（仅精确指针设备）
 *   - H5 按下     → :active
 *   - 小程序按下   → hover-class 带上的 .cd-button--pressed
 * ================================================================== */
@include cd-hover {
  .cd-button:hover {
    background-color: var(--cd-btn-tone-hover);
  }

  .cd-button--plain:hover {
    background-color: var(--cd-btn-tone-soft);
    border-color: var(--cd-btn-tone);
    color: var(--cd-btn-tone);
  }

  .cd-button--plain.cd-button--default:hover {
    border-color: var(--cd-border-color-strong, #cbd5e1);
    color: var(--cd-text-primary, #0f172a);
  }

  .cd-button--text:hover {
    background-color: var(--cd-btn-tone-hover);
  }
}

.cd-button:active,
.cd-button--pressed {
  background-color: var(--cd-btn-tone-soft);
  opacity: 0.92;
}

.cd-button--primary:active,
.cd-button--primary.cd-button--pressed {
  background-color: var(--cd-btn-tone-hover);
}

/* ==================================================================
 * 禁用 / 加载
 * ================================================================== */
.cd-button--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.cd-button--disabled:active,
.cd-button--disabled.cd-button--pressed {
  background-color: var(--cd-btn-tone);
}

.cd-button--plain.cd-button--disabled:active {
  background-color: transparent;
}

.cd-button--loading {
  cursor: default;
  opacity: 0.75;
}

.cd-button__spinner {
  width: 0.9em;
  height: 0.9em;
  margin-right: 6px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  box-sizing: border-box;
  animation: cd-button-spin 0.7s linear infinite;
}

@keyframes cd-button-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
