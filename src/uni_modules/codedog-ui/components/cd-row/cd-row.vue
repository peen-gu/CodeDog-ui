<template>
  <view class="cd-row" :class="rootClass" :style="rowStyle">
    <slot />
  </view>
</template>

<script setup>
/**
 * cd-row —— 24 栅格的行容器
 * ---------------------------------------------------------------
 * 为什么用「行负边距 + 列内边距」这种经典方案，而不是 flex 的 gap：
 *   1. gap 的百分比语义在两端不一致，且老版本小程序 WebView 对 flex gap 支持不全；
 *   2. 行负边距方案能让最左、最右两列的边缘与容器对齐 —— 这是栅格必须满足的硬要求，
 *      用 gap 的话内容会比容器窄 一个 gutter，视觉上缩进不齐。
 *
 * gutter 通过 CSS 变量下发到列，因此「列」不需要知道 gutter 是多少，
 * 也就避免了父传子的 props 透传。
 */
import { computed } from 'vue'

defineOptions({
  name: 'cd-row',
})

const props = defineProps({
  /**
   * 列间距。数字表示水平间距；
   * 数组 [水平, 垂直] 可分别控制两个方向（垂直间距在换行时生效）
   */
  gutter: {
    type: [Number, String, Array],
    default: 0,
  },
  /** start / center / end / between / around */
  justify: {
    type: String,
    default: 'start',
  },
  /** top / middle / bottom / stretch */
  align: {
    type: String,
    default: 'top',
  },
  /** 是否允许换行 */
  wrap: {
    type: Boolean,
    default: true,
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

const normGutter = computed(() => {
  const g = props.gutter
  if (Array.isArray(g)) {
    return { x: g[0], y: g[1] }
  }
  return { x: g, y: 0 }
})

/**
 * 把 gutter 展开成四个 CSS 变量下发。
 * 之所以在 JS 里就把「一半」和「负值」算好，而不是在 CSS 里写 calc(… / 2)：
 * 小程序 WXSS 对带 CSS 变量的 calc 除法支持并不一致，
 * 而列间距错了整个栅格会整体错位，属于不能赌的地方。
 * 数字直接算；字符串（如 '1rem'）无法在 JS 里折半，则退化成 calc 表达式。
 */
function halve(value) {
  if (typeof value === 'number') return `${value / 2}px`
  if (typeof value === 'string' && value) return `calc(${value} / 2)`
  return '0px'
}

function negate(value) {
  if (typeof value === 'number') return `${value / -2}px`
  if (typeof value === 'string' && value) return `calc(${value} / -2)`
  return '0px'
}

function negateFull(value) {
  if (typeof value === 'number') return `${-value}px`
  if (typeof value === 'string' && value) return `calc(${value} * -1)`
  return '0px'
}

const rowStyle = computed(() => {
  const { x, y } = normGutter.value
  return [
    `--cd-row-gutter-x-half:${halve(x)};`,
    `--cd-row-pull:${negate(x)};`,
    `--cd-row-gutter-y:${y ? (typeof y === 'number' ? `${y}px` : y) : '0px'};`,
    `--cd-row-pull-y:${negateFull(y)};`,
    props.customStyle,
  ].join('')
})

const rootClass = computed(() =>
  [
    `cd-row--justify-${props.justify}`,
    `cd-row--align-${props.align}`,
    props.wrap ? 'cd-row--wrap' : 'cd-row--nowrap',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)
</script>

<script>
export default {
  name: 'cd-row',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-row {
  @include cd-reset;

  display: flex;
  /* 负边距抵消列的内边距，让首尾列贴齐容器边缘。
     具体数值由组件在 JS 里算好下发，避免在 CSS 里对 CSS 变量做 calc 除法。 */
  margin-left: var(--cd-row-pull, 0px);
  margin-right: var(--cd-row-pull, 0px);
  /* 换行时的垂直间距由列的 margin-bottom 提供，
     这里用负边距抵消最后一行多余的空隙 */
  margin-bottom: var(--cd-row-pull-y, 0px);
}

.cd-row--wrap {
  flex-wrap: wrap;
}

.cd-row--nowrap {
  flex-wrap: nowrap;
}

/* ---------- 主轴对齐 ---------- */
.cd-row--justify-start {
  justify-content: flex-start;
}
.cd-row--justify-center {
  justify-content: center;
}
.cd-row--justify-end {
  justify-content: flex-end;
}
.cd-row--justify-between {
  justify-content: space-between;
}
.cd-row--justify-around {
  justify-content: space-around;
}

/* ---------- 交叉轴对齐 ---------- */
.cd-row--align-top {
  align-items: flex-start;
}
.cd-row--align-middle {
  align-items: center;
}
.cd-row--align-bottom {
  align-items: flex-end;
}
.cd-row--align-stretch {
  align-items: stretch;
}
</style>
