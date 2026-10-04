<template>
  <view class="cd-tag" :class="rootClass" :style="customStyle" @click="handleClick">
    <view v-if="icon" class="cd-tag__icon">
      <cd-icon :name="icon" size="1em" />
    </view>

    <text v-if="label" class="cd-tag__text">{{ label }}</text>
    <slot />

    <!-- .stop 不能省：叉号在标签内部，冒泡上去会同时触发 close 和 click，
         业务侧「点叉号」会收到两个事件，删除动作被执行两次 -->
    <view v-if="showClose" class="cd-tag__close" @click.stop="handleClose">
      <cd-icon name="close" size="0.85em" />
    </view>
  </view>
</template>

<script setup>
/**
 * cd-tag —— 标签
 * ---------------------------------------------------------------
 * 一个说明：为什么用 `--cd-tag-main` / `--cd-tag-soft` 两个内部变量，
 * 而不是给每个 type 写一整套 background/color/border？
 *
 * 因为标签有两种形态：实心（filled）与浅底（plain）。
 * 如果按 type 写死颜色，就得写 6 个 type × 2 种形态 = 12 组规则。
 * 改成「type 只负责声明两个颜色，形态负责决定怎么用」之后，
 * 规则数降到 6 + 2，而且以后新增 type 只需加一行。
 * 这是 CSS 变量在组件内部最实用的用法 —— 把「变数」和「用法」拆开。
 */
import { computed } from 'vue'

defineOptions({
  name: 'cd-tag',
})

const props = defineProps({
  /** default / primary / success / warning / danger / info */
  type: {
    type: String,
    default: 'default',
  },
  /** small / default / large */
  size: {
    type: String,
    default: 'default',
  },
  /** 浅底描边形态，视觉更弱，适合大量并列 */
  plain: {
    type: Boolean,
    default: false,
  },
  /** 圆角胶囊形态 */
  round: {
    type: Boolean,
    default: false,
  },
  /** 显示关闭按钮。关闭只是「请求关闭」，是否真的移除由业务决定 */
  closable: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 文字。也可以用默认插槽传更复杂的内容 */
  label: {
    type: String,
    default: '',
  },
  /** 左侧图标名 */
  icon: {
    type: String,
    default: '',
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

const emit = defineEmits(['click', 'close'])

/** 禁用态下不给关闭按钮 —— 一个点不动的叉号比没有叉号更让人困惑 */
const showClose = computed(() => props.closable && !props.disabled)

const rootClass = computed(() =>
  [
    `cd-tag--${props.type}`,
    /*
     * 尺寸类名必须带 size- 前缀。
     * 原因是 type 与 size 都有 'default' 取值：若都写成 `cd-tag--default`，
     * 一个「default 类型 + large 尺寸」的标签会同时命中 `cd-tag--default`（含默认尺寸规则）
     * 与 `cd-tag--large`，两者特异性相同，最终高度取决于规则书写顺序 —— 这是隐形的顺序依赖。
     * 加上前缀后两个命名空间彻底分开，尺寸与类型互不干扰。
     */
    `cd-tag--size-${props.size}`,
    props.plain ? 'cd-tag--plain' : 'cd-tag--filled',
    props.round ? 'cd-tag--round' : '',
    props.disabled ? 'cd-tag--disabled' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

function handleClick(event) {
  if (props.disabled) return
  emit('click', event)
}

function handleClose(event) {
  if (props.disabled) return
  emit('close', event)
}
</script>

<script>
export default {
  name: 'cd-tag',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-tag {
  @include cd-reset;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  border: var(--cd-border-width, 1px) solid transparent;
  border-radius: var(--cd-tag-radius, 4px);
  line-height: 1;
  white-space: nowrap;
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    border-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

/* ==================================================================
 * 尺寸
 * ================================================================== */
.cd-tag--size-small {
  height: var(--cd-tag-height-sm, 20px);
  padding: 0 var(--cd-space-1, 4px);
  font-size: var(--cd-font-size-xs, 11px);
}

.cd-tag--size-default {
  height: var(--cd-tag-height, 24px);
  padding: 0 var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-sm, 12px);
}

.cd-tag--size-large {
  height: var(--cd-tag-height-lg, 30px);
  padding: 0 var(--cd-space-3, 12px);
  font-size: var(--cd-font-size-base, 14px);
}

.cd-tag--round {
  border-radius: var(--cd-radius-round, 999px);
}

/* ==================================================================
 * 类型：只声明颜色，不声明用法
 * ================================================================== */
.cd-tag--default {
  --cd-tag-main: var(--cd-text-regular, #334155);
  --cd-tag-soft: var(--cd-bg-sunken, #f1f5f9);
  --cd-tag-border: var(--cd-border-color-strong, #cbd5e1);
}

.cd-tag--primary {
  --cd-tag-main: var(--cd-color-primary, #3b76f6);
  --cd-tag-soft: var(--cd-color-primary-soft, #eff5ff);
  --cd-tag-border: var(--cd-color-primary-border, #bfdbfe);
}

.cd-tag--success {
  --cd-tag-main: var(--cd-color-success, #22c55e);
  --cd-tag-soft: var(--cd-color-success-soft, #f0fdf4);
  --cd-tag-border: var(--cd-color-success, #22c55e);
}

.cd-tag--warning {
  --cd-tag-main: var(--cd-color-warning, #f59e0b);
  --cd-tag-soft: var(--cd-color-warning-soft, #fffbeb);
  --cd-tag-border: var(--cd-color-warning, #f59e0b);
}

.cd-tag--danger {
  --cd-tag-main: var(--cd-color-danger, #ef4444);
  --cd-tag-soft: var(--cd-color-danger-soft, #fef2f2);
  --cd-tag-border: var(--cd-color-danger, #ef4444);
}

.cd-tag--info {
  --cd-tag-main: var(--cd-color-info, #64748b);
  --cd-tag-soft: var(--cd-color-info-soft, #f1f5f9);
  --cd-tag-border: var(--cd-color-info, #64748b);
}

/* ==================================================================
 * 形态：决定上面那两个颜色怎么用
 * ================================================================== */
.cd-tag--filled {
  background-color: var(--cd-tag-main);
  border-color: var(--cd-tag-main);
  color: var(--cd-text-inverse, #ffffff);
}

/* default 类型的 filled 是深灰底，白字对比度足够；其余同色描边即可 */
.cd-tag--filled.cd-tag--default {
  background-color: var(--cd-bg-sunken, #f1f5f9);
  border-color: var(--cd-border-color, #e2e8f0);
  color: var(--cd-text-regular, #334155);
}

.cd-tag--plain {
  background-color: var(--cd-tag-soft);
  border-color: var(--cd-tag-border);
  color: var(--cd-tag-main);
}

.cd-tag--disabled {
  opacity: 0.5;
}

/* ==================================================================
 * 内部元素
 * ================================================================== */
.cd-tag__icon {
  display: flex;
  align-items: center;
  /* 用 margin 而不是 flex gap：小程序 WebView 内核对 flex gap 支持不齐 */
  margin-right: var(--cd-space-1, 4px);
}

.cd-tag__text {
  display: block;
  line-height: 1;
}

.cd-tag__close {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: var(--cd-space-1, 4px);
  /* 关闭按钮的可点区域要比图标大，否则手指点不中 */
  padding: 2px;
  margin-right: -2px;
  opacity: 0.75;
}

.cd-tag__close:active {
  opacity: 1;
}

@include cd-hover {
  .cd-tag--filled:not(.cd-tag--disabled):hover {
    opacity: 0.88;
  }

  .cd-tag--plain:not(.cd-tag--disabled):hover {
    background-color: var(--cd-tag-main);
    border-color: var(--cd-tag-main);
    color: var(--cd-text-inverse, #ffffff);
  }

  .cd-tag__close:hover {
    opacity: 1;
  }
}
</style>
