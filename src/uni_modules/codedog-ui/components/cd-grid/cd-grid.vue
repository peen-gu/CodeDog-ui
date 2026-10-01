<template>
  <view class="cd-grid" :class="rootClass" :style="rootStyle">
    <slot />
  </view>
</template>

<script setup>
/**
 * cd-grid —— 宫格
 * ---------------------------------------------------------------
 * 实现上最值得说的一点：**列宽不走 calc 除法**。
 *
 * 常见的写法是 `.cd-grid-item { width: calc(100% / var(--cd-grid-cols)) }`，
 * 但小程序 WebView 对「CSS 变量参与 calc 除法」的支持并不一致 ——
 * 这是本框架里已经记录在案的坑（栅格那一批改用编译期百分比绕开了）。
 * 这里改用「JS 先算好百分比、以纯值变量下发」：
 *   grid 根节点内联 --cd-grid-item-w: 25%
 *   子项 width: var(--cd-grid-item-w, 25%)
 * 变量只做值传递、不参与运算，两端行为完全一致。
 *
 * 第二个取舍是边框的归属：外框画在容器上（上 + 左），
 * 内线画在每一格上（右 + 下），这样每一格的四条边都能被画到，
 * 且不需要任何 nth-child 选择器 —— 后者在小程序 WXSS 里不可靠。
 * 代价是最后一格不满行时右下角会缺一小段边线，
 * 这是所有用「格自画边」方案的通病，换来的是零 JS 测量与两端一致。
 */
import { computed } from 'vue'

defineOptions({
  name: 'cd-grid',
})

const props = defineProps({
  /** 列数 */
  columns: {
    type: Number,
    default: 4,
  },
  /** 显示网格线 */
  border: {
    type: Boolean,
    default: true,
  },
  /** 单元格最小高度，数字按 px */
  itemMinHeight: {
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

const rootClass = computed(() =>
  [props.border ? 'cd-grid--bordered' : 'cd-grid--plain', props.customClass].filter(Boolean).join(' ')
)

const rootStyle = computed(() => {
  const cols = props.columns > 0 ? props.columns : 4
  const parts = [`--cd-grid-item-w:${(100 / cols).toFixed(4)}%;`]

  if (props.itemMinHeight !== '') {
    const h = typeof props.itemMinHeight === 'number' ? `${props.itemMinHeight}px` : props.itemMinHeight
    parts.push(`--cd-grid-item-min-h:${h};`)
  }

  if (props.customStyle) parts.push(props.customStyle)
  return parts.join('')
})
</script>

<script>
export default {
  name: 'cd-grid',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-grid {
  @include cd-reset;

  display: flex;
  flex-wrap: wrap;
  width: 100%;
  background-color: var(--cd-bg-container, #ffffff);
}

.cd-grid--bordered {
  border-top: var(--cd-border-width, 1px) solid var(--cd-grid-divider-color, #f1f5f9);
  border-left: var(--cd-border-width, 1px) solid var(--cd-grid-divider-color, #f1f5f9);
}
</style>
