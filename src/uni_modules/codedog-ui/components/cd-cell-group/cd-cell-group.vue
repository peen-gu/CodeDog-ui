<template>
  <view class="cd-cell-group" :class="rootClass" :style="customStyle">
    <view v-if="title || $slots.title" class="cd-cell-group__title">
      <slot name="title">
        <text class="cd-cell-group__title-text">{{ title }}</text>
      </slot>
    </view>

    <view class="cd-cell-group__body">
      <slot />
    </view>

    <view v-if="$slots.footer" class="cd-cell-group__footer">
      <slot name="footer" />
    </view>
  </view>
</template>

<script setup>
/**
 * cd-cell-group —— 单元格分组
 * ---------------------------------------------------------------
 * 这一层不做任何布局计算，只解决两件事：
 *
 * 1. 分组分隔线的归属。
 *    组内相邻两格之间的线由这里统一画（`.cd-cell + .cd-cell { border-top }`），
 *    所以最后一格下面永远干净。单元格通过 inject 感知「我在组里」，
 *    相应关掉自己的底边线。用相邻兄弟选择器而不是 `:last-child`，
 *    是因为后者在小程序 WXSS 的支持不稳（这一点 cd-checkbox-group 已经踩过）。
 *
 * 2. 形态切换。
 *    inset=false（默认）：通铺，左右贴边，适合移动端设置页；
 *    inset=true：两侧留白 + 圆角卡片，适合 PC 后台与卡片式页面。
 *    这两种形态在真实产品里都会出现，做成一个布尔量比让业务写覆盖样式省事。
 */
import { computed, provide } from 'vue'
import { CD_CELL_GROUP_KEY } from '../../constants'

defineOptions({
  name: 'cd-cell-group',
})

const props = defineProps({
  /** 分组标题 */
  title: {
    type: String,
    default: '',
  },
  /** 卡片形态：两侧留白 + 圆角 */
  inset: {
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

/**
 * 只下发一个布尔语义：子单元格在组里。
 * 用 provide 而不是给子组件传 props —— 插槽内容由业务书写，
 * 无法自动注入属性；provide/inject 是唯一不需要业务配合的通道。
 * 与 cd-form / cd-checkbox-group 同一套约定。
 */
provide(CD_CELL_GROUP_KEY, true)

const rootClass = computed(() =>
  [props.inset ? 'cd-cell-group--inset' : 'cd-cell-group--flush', props.customClass]
    .filter(Boolean)
    .join(' ')
)
</script>

<script>
export default {
  name: 'cd-cell-group',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-cell-group {
  @include cd-reset;

  display: block;
  width: 100%;
  background-color: var(--cd-bg-container, #ffffff);
}

/* ==================================================================
 * 标题 / 页脚
 * ================================================================== */
.cd-cell-group__title {
  padding: var(--cd-space-4, 16px) var(--cd-cell-padding-x, 16px) var(--cd-space-2, 8px);
}

.cd-cell-group__title-text {
  font-size: var(--cd-font-size-sm, 12px);
  font-weight: var(--cd-font-weight-medium, 500);
  line-height: var(--cd-line-height-tight, 1.25);
  color: var(--cd-cell-group-title-color, var(--cd-text-secondary, #64748b));
}

.cd-cell-group__footer {
  padding: var(--cd-space-2, 8px) var(--cd-cell-padding-x, 16px) var(--cd-space-3, 12px);
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-secondary, #64748b);
}

/* ==================================================================
 * 组内分隔线 —— 只画在「第二格起」的上边缘
 * ================================================================== */
.cd-cell-group__body .cd-cell + .cd-cell {
  border-top: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #f1f5f9);
}

/* ==================================================================
 * 形态：通铺 vs 卡片
 * ================================================================== */
.cd-cell-group--flush .cd-cell-group__body {
  border-top: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #f1f5f9);
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #f1f5f9);
}

.cd-cell-group--inset {
  padding: 0 var(--cd-space-4, 16px);
  background-color: transparent;
  border-radius: var(--cd-cell-group-radius, 12px);
  overflow: hidden;
}

.cd-cell-group--inset .cd-cell-group__title {
  padding-left: 0;
  padding-right: 0;
}

.cd-cell-group--inset .cd-cell-group__body {
  border-radius: var(--cd-cell-group-radius, 12px);
  overflow: hidden;
  box-shadow: var(--cd-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
}

.cd-cell-group--inset .cd-cell-group__footer {
  padding-left: 0;
  padding-right: 0;
}
</style>
