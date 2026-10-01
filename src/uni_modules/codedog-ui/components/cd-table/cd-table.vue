<template>
  <view class="cd-table" :class="rootClass">
    <!-- ============ 形态一：桌面端 —— 多列表格 ============ -->
    <template v-if="desktopShape">
      <view class="cd-table__head">
        <view
          v-for="column in visibleColumns"
          :key="column.key"
          class="cd-table__th"
          :style="cellStyle(column)"
          :class="alignClass(column)"
        >
          <text class="cd-table__th-text">{{ column.title }}</text>
        </view>
      </view>

      <view v-if="loading" class="cd-table__state">
        <view class="cd-table__spinner" />
        <text class="cd-table__state-text">加载中…</text>
      </view>

      <view v-else-if="!data.length" class="cd-table__state">
        <text class="cd-table__state-text">{{ emptyText }}</text>
      </view>

      <view v-else class="cd-table__body">
        <view
          v-for="(row, rowIndex) in data"
          :key="resolveRowKey(row, rowIndex)"
          class="cd-table__row"
          :class="rowClass(rowIndex)"
          @click="emit('row-click', { row, index: rowIndex })"
        >
          <view
            v-for="column in visibleColumns"
            :key="column.key"
            class="cd-table__td"
            :style="cellStyle(column)"
            :class="alignClass(column)"
          >
            <text class="cd-table__td-text" :class="{ 'cd-table__td-text--ellipsis': column.ellipsis !== false }">
              {{ renderCell(row, column) }}
            </text>
          </view>
        </view>
      </view>
    </template>

    <!-- ============ 形态二：移动端 —— 卡片列表 ============ -->
    <template v-else>
      <view v-if="loading" class="cd-table__state">
        <view class="cd-table__spinner" />
        <text class="cd-table__state-text">加载中…</text>
      </view>

      <view v-else-if="!data.length" class="cd-table__state">
        <text class="cd-table__state-text">{{ emptyText }}</text>
      </view>

      <view v-else class="cd-table__cards">
        <view
          v-for="(row, rowIndex) in data"
          :key="resolveRowKey(row, rowIndex)"
          class="cd-table__card"
          @click="emit('row-click', { row, index: rowIndex })"
        >
          <!-- 首列升格为卡片标题：移动端最需要的改动，让列表一眼可扫 -->
          <text v-if="primaryColumn" class="cd-table__card-title">{{ renderCell(row, primaryColumn) }}</text>

          <view v-for="column in secondaryColumns" :key="column.key" class="cd-table__card-line">
            <text class="cd-table__card-label">{{ column.title }}</text>
            <text class="cd-table__card-value">{{ renderCell(row, column) }}</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
/**
 * cd-table —— 双形态表格
 * ---------------------------------------------------------------
 * 这是双形态改造收益最大的组件，因为两端的信息密度需求天然相反：
 *
 *   桌面端 → 真表格。列对齐、表头固定、斑马纹、横向信息可比对，
 *            用户可以一眼扫完 20 行 × 6 列
 *   移动端 → 卡片列表。没人会在 375px 宽的屏幕上左右拖着看表格，
 *            所以必须把「一行」重构成「一张卡」，首列升格为卡片标题
 *
 * 这里没有复用 wd-table，原因是它的定位是「移动端简单表格」，
 * 列宽、对齐、斑马纹这些 PC 必备能力都没有。
 * 而表格的难点（虚拟滚动、列宽拖拽）不在骨架范围内，所以自研更合适。
 *
 * 实现约束：小程序没有 <table> 标签，所以两端都用 flex 模拟列结构，
 * 这也正好让「列宽」可以完全走 flex 值而不是 table-layout 算法。
 */
import { computed } from 'vue'
import { useBreakpoint, resolveDesktopShape } from '../../composables/use-breakpoint'

defineOptions({
  name: 'cd-table',
})

const props = defineProps({
  /**
   * 列定义
   * @type {{
   *   key: string, title: string,
   *   width?: number|string,
   *   align?: 'left'|'center'|'right',
   *   ellipsis?: boolean,
   *   hideOnMobile?: boolean,
   *   formatter?: (row: any, column: any) => string
   * }[]}
   */
  columns: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Array,
    default: () => [],
  },
  /** 'auto' | 'mobile' | 'desktop' */
  mode: {
    type: String,
    default: 'auto',
  },
  /** 行唯一键：字符串字段名或返回键的函数 */
  rowKey: {
    type: [String, Function],
    default: 'id',
  },
  stripe: {
    type: Boolean,
    default: true,
  },
  border: {
    type: Boolean,
    default: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  emptyText: {
    type: String,
    default: '暂无数据',
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['row-click'])

const { isPC } = useBreakpoint()
const desktopShape = computed(() => resolveDesktopShape(props.mode, isPC))

const visibleColumns = computed(() => props.columns)

/** 移动端卡片标题用的列 = 第一列 */
const primaryColumn = computed(() => props.columns[0] || null)

/** 移动端卡片正文用的列 = 除首列外、且未标记 hideOnMobile 的列 */
const secondaryColumns = computed(() =>
  props.columns.filter((column, index) => index > 0 && !column.hideOnMobile)
)

const rootClass = computed(() =>
  [
    desktopShape.value ? 'cd-table--desktop' : 'cd-table--mobile',
    props.border ? 'cd-table--border' : '',
    props.stripe ? 'cd-table--stripe' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

/* -------------------- 渲染辅助 -------------------- */

function resolveRowKey(row, index) {
  if (typeof props.rowKey === 'function') return props.rowKey(row, index)
  const value = row[props.rowKey]
  return value === undefined || value === null ? index : value
}

function renderCell(row, column) {
  if (typeof column.formatter === 'function') return column.formatter(row, column)
  const value = row[column.key]
  return value === undefined || value === null ? '' : String(value)
}

/**
 * 列宽一律用 flex 表达。
 * 不传 width 的列自动等分剩余空间，传了的列固定占位。
 * 这样 PC 端能做「操作列右对齐固定 120px」这种典型布局。
 */
function cellStyle(column) {
  if (column.width === undefined || column.width === null || column.width === '') {
    return 'flex:1 1 0;min-width:0;'
  }
  const width = typeof column.width === 'number' ? `${column.width}px` : column.width
  return `flex:0 0 ${width};min-width:0;`
}

function alignClass(column) {
  const align = column.align || 'left'
  return `cd-table__cell--${align}`
}

function rowClass(index) {
  return [
    props.stripe && index % 2 === 1 ? 'cd-table__row--stripe' : '',
    'cd-table__row--clickable',
  ]
    .filter(Boolean)
    .join(' ')
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-table {
  @include cd-reset;
  display: block;
  width: 100%;
  background-color: var(--cd-bg-container, #ffffff);
  color: var(--cd-text-primary, #0f172a);
}

/* ==================================================================
 * 桌面端：表格
 * ================================================================== */
.cd-table--desktop.cd-table--border {
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-lg, 12px);
  overflow: hidden;
}

.cd-table__head {
  display: flex;
  align-items: center;
  height: var(--cd-table-header-height, 44px);
  background-color: var(--cd-bg-sunken, #f1f5f9);
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
}

.cd-table__th {
  display: flex;
  align-items: center;
  padding: 0 var(--cd-space-4, 16px);
}

.cd-table__th-text {
  font-size: var(--cd-font-size-sm, 12px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-secondary, #64748b);
  letter-spacing: 0.02em;
}

.cd-table__row {
  display: flex;
  align-items: center;
  min-height: var(--cd-table-row-height, 48px);
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #f1f5f9);
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-table__row:last-child {
  border-bottom: none;
}

.cd-table--stripe .cd-table__row--stripe {
  background-color: var(--cd-bg-sunken, #f8fafc);
}

@include cd-hover {
  .cd-table__row--clickable:hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  }
}

.cd-table__td {
  display: flex;
  align-items: center;
  padding: var(--cd-space-3, 12px) var(--cd-space-4, 16px);
}

.cd-table__td-text {
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-regular, #334155);
  line-height: var(--cd-line-height-base, 1.5);
}

/* 长文本截断。默认开启，因为它避免了「一列撑破整行」这个最常见的翻车 */
.cd-table__td-text--ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cd-table__cell--center {
  justify-content: center;
}

.cd-table__cell--right {
  justify-content: flex-end;
}

/* ==================================================================
 * 移动端：卡片列表
 * ================================================================== */
.cd-table__cards {
  display: block;
}

.cd-table__card {
  display: flex;
  flex-direction: column;
  padding: var(--cd-space-4, 16px);
  background-color: var(--cd-bg-container, #ffffff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-lg, 12px);
}

.cd-table__card + .cd-table__card {
  margin-top: var(--cd-space-3, 12px);
}

.cd-table__card-title {
  margin-bottom: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-md, 16px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #0f172a);
  line-height: var(--cd-line-height-tight, 1.25);
}

.cd-table__card-line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--cd-space-1, 4px) 0;
}

.cd-table__card-label {
  flex-shrink: 0;
  margin-right: var(--cd-space-4, 16px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  line-height: var(--cd-line-height-base, 1.5);
}

.cd-table__card-value {
  flex: 1;
  min-width: 0;
  text-align: right;
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-primary, #0f172a);
  line-height: var(--cd-line-height-base, 1.5);
}

/* ==================================================================
 * 加载 / 空态
 * ================================================================== */
.cd-table__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--cd-space-10, 40px) var(--cd-space-4, 16px);
}

.cd-table__state-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-placeholder, #94a3b8);
}

.cd-table__spinner {
  width: 20px;
  height: 20px;
  margin-bottom: var(--cd-space-3, 12px);
  border: 2px solid var(--cd-border-color, #e2e8f0);
  border-top-color: var(--cd-color-primary, #3b76f6);
  border-radius: 50%;
  animation: cd-table-spin 0.7s linear infinite;
}

@keyframes cd-table-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
