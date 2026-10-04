<template>
  <view class="cd-divider" :class="rootClass" :style="customStyle">
    <!-- ---------- 水平：可选前置线 + 内容 + 后置线 ---------- -->
    <template v-if="!isVertical">
      <view v-if="hasContent" class="cd-divider__line cd-divider__line--lead"></view>

      <view v-if="hasContent" class="cd-divider__content">
        <slot />
      </view>

      <view class="cd-divider__line cd-divider__line--tail"></view>
    </template>

    <!-- ---------- 垂直：根节点本身就是那条线 ---------- -->
    <slot v-else />
  </view>
</template>

<script setup>
/**
 * cd-divider —— 分割线
 * ---------------------------------------------------------------
 * 结构上只有一个小技巧：无内容时只渲染「后置线」。
 * 因为后置线是 flex:1，单独存在时自然铺满整行 ——
 * 不需要为「纯线条」再写一套分支。
 *
 * 用 border 而不是 background 画线：这样 dashed / solid 只需要换
 * border-style，不用引入 repeating-linear-gradient（小程序 WebView 对
 * 渐变的支持虽好，但虚线渐变在缩放时会糊）。
 */
import { computed, useSlots } from 'vue'

defineOptions({
  name: 'cd-divider',
})

const props = defineProps({
  /** horizontal / vertical */
  direction: {
    type: String,
    default: 'horizontal',
  },
  /** 文字位置：left / center / right */
  position: {
    type: String,
    default: 'center',
  },
  /** 虚线 */
  dashed: {
    type: Boolean,
    default: false,
  },
  /** 上下（水平线）或左右（垂直线）留白，数字按 px */
  spacing: {
    type: [String, Number],
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

const slots = useSlots()

const isVertical = computed(() => props.direction === 'vertical')

/**
 * 只判存在性，不调用 slots.default()。
 *
 * 依据（每条都有出处，无推测）：
 *   1. 2026-10-03 微信开发者工具运行日志出现
 *      TypeError: i.default is not a function（i 即本文件 useSlots() 的返回值）；
 *   2. 全量检索 mp 产物 js，.default( 调用仅此一处，变量名正是 i；
 *   3. H5 端 slots.default 是函数，因此同样写法在 H5 不报错 —— 两端行为差异；
 *   4. wot-design-uni 同需求处（wd-divider / wd-avatar）均写作 !!slots.default、
 *      从不调用，此处对齐成熟库写法。
 */
const hasContent = computed(() => !!slots.default)

const rootClass = computed(() =>
  [
    isVertical.value ? 'cd-divider--vertical' : 'cd-divider--horizontal',
    !isVertical.value && hasContent.value ? `cd-divider--${props.position}` : '',
    props.dashed ? 'cd-divider--dashed' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const customStyle = computed(() => {
  if (props.spacing === '' || props.spacing === null || props.spacing === undefined) {
    return props.customStyle || ''
  }
  const value = typeof props.spacing === 'number' ? `${props.spacing}px` : String(props.spacing)
  const styles = isVertical.value ? `margin-left:${value};margin-right:${value};` : `margin-top:${value};margin-bottom:${value};`
  return props.customStyle ? `${styles}${props.customStyle}` : styles
})
</script>

<script>
export default {
  name: 'cd-divider',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

/* ==================================================================
 * 水平
 * ================================================================== */
.cd-divider--horizontal {
  @include cd-reset;

  display: flex;
  align-items: center;
  width: 100%;
  margin: var(--cd-divider-margin, var(--cd-space-4, 16px)) 0;
}

.cd-divider__line {
  flex: 1;
  min-width: 0;
  height: 0;
  border-top: var(--cd-border-width, 1px) solid var(--cd-divider-color, var(--cd-border-color, #e2e8f0));
}

.cd-divider--dashed .cd-divider__line {
  border-top-style: dashed;
}

/* 有内容时，两侧线的宽度由 position 决定：
   center → 两侧各占一半；left → 前置线压缩到很短 */
.cd-divider--left .cd-divider__line--lead {
  flex: 0 0 var(--cd-divider-lead, 5%);
}

.cd-divider--right .cd-divider__line--tail {
  flex: 0 0 var(--cd-divider-lead, 5%);
}

.cd-divider__content {
  flex-shrink: 0;
  padding: 0 var(--cd-space-3, 12px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  line-height: var(--cd-line-height-tight, 1.25);
  /* 长文案不换行，超长由业务自己截断 —— 换行会让分割线结构塌掉 */
  white-space: nowrap;
}

/* ==================================================================
 * 垂直
 * ================================================================== */
.cd-divider--vertical {
  @include cd-reset;

  display: inline-block;
  width: 0;
  height: 1em;
  margin: 0 var(--cd-divider-margin-x, var(--cd-space-3, 12px));
  vertical-align: middle;
  border-left: var(--cd-border-width, 1px) solid var(--cd-divider-color, var(--cd-border-color, #e2e8f0));
}

.cd-divider--vertical.cd-divider--dashed {
  border-left-style: dashed;
}
</style>
