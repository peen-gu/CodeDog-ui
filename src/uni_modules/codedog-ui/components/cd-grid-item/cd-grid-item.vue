<template>
  <view class="cd-grid-item" :class="rootClass" :style="customStyle" @click="handleClick">
    <view class="cd-grid-item__inner">
      <view v-if="icon || $slots.icon" class="cd-grid-item__icon">
        <slot name="icon">
          <cd-icon :name="icon" :size="iconSize" />
        </slot>
      </view>

      <view v-if="text || $slots.text" class="cd-grid-item__text">
        <slot name="text">
          <text class="cd-grid-item__text-inner">{{ text }}</text>
        </slot>
      </view>

      <slot />

      <!-- 角标：宫格里的红点往往是「有多少条待办」，位置必须绝对可控 -->
      <view v-if="hasBadge" class="cd-grid-item__badge" :class="badgeClass">
        <slot name="badge">
          <text v-if="!isDot" class="cd-grid-item__badge-text">{{ badgeText }}</text>
        </slot>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-grid-item —— 宫格单元
 * ---------------------------------------------------------------
 * 列宽不是自己算的，而是读容器下发的 --cd-grid-item-w。
 * CSS 变量天然沿 DOM 继承，因此这里不需要任何 provide/inject ——
 * 变量既能传值又不需要父子组件通信，是这一层最省事的通道。
 *
 * 角标用绝对定位而不是插进图标行里：宫格的图标是居中的，
 * 把角标塞进流内会把图标挤偏，而角标本来的语义就是「浮在上面」。
 */
import { computed, useSlots } from 'vue'

defineOptions({
  name: 'cd-grid-item',
})

const props = defineProps({
  /** 图标名 */
  icon: {
    type: String,
    default: '',
  },
  /** 图标尺寸，数字按 px；不传取 --cd-grid-item-icon-size */
  iconSize: {
    type: [String, Number],
    default: '',
  },
  /** 文案 */
  text: {
    type: String,
    default: '',
  },
  /** 右上角角标数值，传 0 / 空则按规则决定是否显示 */
  badge: {
    type: [String, Number],
    default: null,
  },
  /** 角标显示为圆点 */
  isDot: {
    type: Boolean,
    default: false,
  },
  /** badge 为 0 时是否仍然显示 */
  showZero: {
    type: Boolean,
    default: false,
  },
  /** 跳转地址，传了就在点击后自动 navigateTo */
  url: {
    type: String,
    default: '',
  },
  disabled: {
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

const slots = useSlots()

const hasBadge = computed(() => {
  if (props.isDot) return props.badge !== null && props.badge !== ''
  if (props.badge === null || props.badge === '') return false
  if (Number(props.badge) === 0 && !props.showZero) return false
  return true
})

const badgeText = computed(() => {
  const v = props.badge
  const n = Number(v)
  if (!Number.isNaN(n) && n > 99) return '99+'
  return String(v)
})

const badgeClass = computed(() => [props.isDot ? 'cd-grid-item__badge--dot' : '', slots.badge ? 'cd-grid-item__badge--slot' : ''].filter(Boolean).join(' '))

const rootClass = computed(() =>
  [props.disabled ? 'cd-grid-item--disabled' : '', props.url ? 'cd-grid-item--link' : '', props.customClass]
    .filter(Boolean)
    .join(' ')
)

function handleClick(event) {
  if (props.disabled) return
  emit('click', event)

  if (props.url) {
    /* 先试 navigateTo（页面栈可退），tabBar 页会失败，再退回 switchTab。
       这是业务里最常写的两行，收敛进组件省得每个宫格都抄一遍 */
    uni.navigateTo({
      url: props.url,
      fail: () => {
        uni.switchTab({ url: props.url, fail: () => {} })
      },
    })
  }
}
</script>

<script>
export default {
  name: 'cd-grid-item',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-grid-item {
  @include cd-reset;

  /* 宽度来自容器下发的纯值变量：不参与 calc 运算，两端行为一致 */
  width: var(--cd-grid-item-w, 25%);
  background-color: var(--cd-bg-container, #ffffff);
  border-right: var(--cd-border-width, 1px) solid var(--cd-grid-divider-color, #f1f5f9);
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-grid-divider-color, #f1f5f9);
  cursor: pointer;
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-grid-item:active {
  background-color: var(--cd-bg-active, rgba(15, 23, 42, 0.08));
}

@include cd-hover {
  .cd-grid-item:hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  }
}

.cd-grid-item--disabled {
  cursor: not-allowed;
}

.cd-grid-item--disabled .cd-grid-item__icon,
.cd-grid-item--disabled .cd-grid-item__text-inner {
  color: var(--cd-text-disabled, #cbd5e1);
}

/* 未开启网格线时，格子自己的边线要收掉，否则会留下孤立的线段 */
.cd-grid--plain .cd-grid-item {
  border-right: none;
  border-bottom: none;
}

/* ==================================================================
 * 内部布局
 * ================================================================== */
.cd-grid-item__inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: var(--cd-grid-item-min-h, 0px);
  padding: var(--cd-grid-item-padding, 16px 8px);
}

.cd-grid-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cd-color-primary, #3b76f6);
  --cd-icon-size: var(--cd-grid-item-icon-size, 24px);
}

.cd-grid-item__text {
  margin-top: var(--cd-space-2, 8px);
  max-width: 100%;
}

.cd-grid-item__text-inner {
  display: block;
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-grid-item-color, #334155);
  text-align: center;
  /* 固定两行高度：文案长短不一时整行仍能对齐，
     否则「两字」和「四字」的格子图标会一高一低 */
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* ==================================================================
 * 角标
 * ================================================================== */
.cd-grid-item__badge {
  position: absolute;
  top: var(--cd-space-2, 8px);
  left: 50%;
  /* 从中心往右推，而不是用 right 定位 ——
     图标宽度随内容变化，用 left:50% + margin 才能保证「贴着图标右上角」 */
  margin-left: var(--cd-space-3, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--cd-badge-height, 18px);
  height: var(--cd-badge-height, 18px);
  padding: 0 5px;
  background-color: var(--cd-color-danger, #ef4444);
  border-radius: var(--cd-radius-round, 999px);
  border: 2px solid var(--cd-bg-container, #ffffff);
}

.cd-grid-item__badge--dot {
  min-width: var(--cd-badge-dot-size, 8px);
  width: var(--cd-badge-dot-size, 8px);
  height: var(--cd-badge-dot-size, 8px);
  padding: 0;
  margin-left: var(--cd-space-2, 8px);
}

.cd-grid-item__badge--slot {
  min-width: 0;
  height: auto;
  padding: 0;
  background-color: transparent;
  border: none;
}

.cd-grid-item__badge-text {
  font-size: var(--cd-badge-font-size, 11px);
  font-weight: var(--cd-font-weight-medium, 500);
  line-height: 1;
  color: #ffffff;
}
</style>
