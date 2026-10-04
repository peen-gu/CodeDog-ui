<template>
  <view class="cd-descriptions" :class="rootClass" :style="customStyle">
    <view v-if="title || hasExtra" class="cd-descriptions__head">
      <text v-if="title" class="cd-descriptions__title">{{ title }}</text>
      <view class="cd-descriptions__extra">
        <slot name="extra" />
      </view>
    </view>

    <view class="cd-descriptions__body" :class="`cd-descriptions__body--${direction}`">
      <!-- 横向：按列数切成若干行，每行内部按 span 分宽度 -->
      <template v-if="direction === 'horizontal'">
        <view v-for="(row, r) in rows" :key="r" class="cd-descriptions__row">
          <view
            v-for="(cell, c) in row"
            :key="c"
            class="cd-descriptions__item"
            :style="`width:${widthOf(cell)};`"
          >
            <text class="cd-descriptions__label" :style="labelWidthStyle">{{ cell.label }}</text>
            <text class="cd-descriptions__value">{{ display(cell) }}</text>
          </view>
        </view>
      </template>

      <!-- 纵向：标签与值各自成列，一行就是一条 -->
      <template v-else>
        <view v-for="(item, i) in items" :key="i" class="cd-descriptions__row">
          <view class="cd-descriptions__item cd-descriptions__item--vertical">
            <text class="cd-descriptions__label" :style="labelWidthStyle">{{ item.label }}</text>
            <text class="cd-descriptions__value">{{ display(item) }}</text>
          </view>
        </view>
      </template>
    </view>

    <slot />
  </view>
</template>

<script setup>
/**
 * cd-descriptions —— 描述列表
 * ---------------------------------------------------------------
 * 看着是表格，实际**不能用原生 table**（template 里禁 HTML 标签），
 * 也不能用 `<component :is>` 做列渲染（mp-weixin 编译期报错）。
 *
 * 所以用「先切行、再按 span 分宽度」的两步法：
 *   1. 预处理阶段把 items 按累计 span 切成 rows，累计超过 column 就换行；
 *   2. 渲染时每个格子写死百分比宽度 `width: (span/column)*100%`。
 * 百分比而不是 flex-basis 的原因：小程序 flex 在嵌套深时对 `flex-basis: 25%`
 * 的解释与 H5 不一致，写 width 是最笨也最稳的一条路。
 *
 * 边框 crossover 由「每个格子自己画左上两边 + 容器画右下两边」完成，
 * 避开 `:last-child` 这类结构伪类（WXSS 支持不可靠）。
 */
import { computed, useSlots } from 'vue'

defineOptions({
  name: 'cd-descriptions',
})

const props = defineProps({
  /** 描述项：{ label, value, span }，span 缺省为 1 */
  items: {
    type: Array,
    default: () => [],
  },
  /** 每行几项 */
  column: {
    type: Number,
    default: 3,
  },
  /** horizontal 标签在左 / vertical 标签在上 */
  direction: {
    type: String,
    default: 'horizontal',
  },
  /** 显示边框 */
  border: {
    type: Boolean,
    default: false,
  },
  /** 标签固定宽度，数字按 px；空则不限制 */
  labelWidth: {
    type: [String, Number],
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  /** 内容为空时的占位 */
  emptyText: {
    type: String,
    default: '-',
  },
  size: {
    type: String,
    default: 'default',
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

const hasExtra = computed(() => !!slots.extra)

const rootClass = computed(() =>
  [
    props.border ? 'cd-descriptions--border' : '',
    props.size === 'small' ? 'cd-descriptions--small' : '',
    props.size === 'large' ? 'cd-descriptions--large' : '',
    `cd-descriptions--${props.direction}`,
    props.customClass,
  ]
    .filter(Boolean)
    .join(' '),
)

const labelWidthStyle = computed(() => {
  if (props.labelWidth === '' || props.labelWidth === null || props.labelWidth === undefined) {
    return props.direction === 'vertical' ? '' : 'min-width:auto;'
  }
  const w = typeof props.labelWidth === 'number' ? `${props.labelWidth}px` : String(props.labelWidth)
  return `width:${w};flex:0 0 ${w};`
})

/** 有效列数至少为 1，避免 column 传 0 时除零 */
const cols = computed(() => Math.max(Math.floor(props.column) || 1, 1))

/**
 * 切行：累计 span 超过cols就换行。
 * 单项 span 大于 cols 的情况（业务写错）按 cols 截断，
 * 否则这一项会把整行撑成 >100%，后面全部错位。
 */
const rows = computed(() => {
  const out = []
  let row = []
  let used = 0
  for (const item of props.items) {
    const span = Math.min(Math.max(Number(item.span) || 1, 1), cols.value)
    if (used + span > cols.value && row.length) {
      out.push(row)
      row = []
      used = 0
    }
    row.push({ ...item, span })
    used += span
    if (used >= cols.value) {
      out.push(row)
      row = []
      used = 0
    }
  }
  if (row.length) out.push(row)
  return out
})

function widthOf(cell) {
  return `${(cell.span / cols.value) * 100}%`
}

function display(cell) {
  const v = cell.value
  if (v === '' || v === null || v === undefined) return props.emptyText
  return String(v)
}
</script>

<script>
export default {
  name: 'cd-descriptions',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-descriptions {
  @include cd-reset;

  width: 100%;
}

.cd-descriptions__head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--cd-space-3, 12px);
}

.cd-descriptions__title {
  font-size: var(--cd-font-size-md, 14px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #1e293b);
}

.cd-descriptions__extra {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.cd-descriptions__body--vertical {
  display: flex;
  flex-direction: column;
}

.cd-descriptions__row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

.cd-descriptions__item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  min-width: 0;
  padding: var(--cd-descriptions-padding-y, 10px) var(--cd-descriptions-padding-x, 12px);
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.6);
}

.cd-descriptions__item--vertical {
  width: 100%;
}

.cd-descriptions--vertical .cd-descriptions__item {
  flex-direction: column;
  align-items: stretch;
}

.cd-descriptions__label {
  flex-shrink: 0;
  padding-right: var(--cd-space-3, 12px);
  color: var(--cd-text-secondary, #64748b);
}

.cd-descriptions__value {
  flex: 1;
  min-width: 0;
  color: var(--cd-text-primary, #1e293b);
  word-break: break-all;
}

.cd-descriptions--small .cd-descriptions__item {
  padding: 6px 8px;
  font-size: var(--cd-font-size-xs, 11px);
}

.cd-descriptions--large .cd-descriptions__item {
  padding: 14px 16px;
  font-size: var(--cd-font-size-md, 14px);
}

/* ---------- 边框模式 ---------- */
/*
 * 每个格子只画「上 + 左」两条边，容器画「右 + 下」两条。
 * 这样不需要 :last-child / :nth-child 去判断谁是该收边的那个，
 * 也不会在最后一行下面多留一条。
 */
.cd-descriptions--border .cd-descriptions__body {
  border-right: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
}

.cd-descriptions--border .cd-descriptions__item {
  border-top: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-left: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
}

.cd-descriptions--border .cd-descriptions__label {
  background-color: var(--cd-bg-sunken, #f8fafc);
}
</style>
