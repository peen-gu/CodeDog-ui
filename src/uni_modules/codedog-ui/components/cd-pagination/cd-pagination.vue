<template>
  <view class="cd-pagination" :class="rootClass">
    <text v-if="showTotal" class="cd-pagination__total">{{ totalText }}</text>

    <!-- ============ 形态一：桌面端 —— 完整页码 ============ -->
    <template v-if="desktopShape">
      <view v-if="showSizeChanger" class="cd-pagination__sizer">
        <cd-select
          v-model="innerPageSize"
          :options="sizeOptions"
          :clearable="false"
          :mode="'desktop'"
          size="small"
        />
      </view>

      <view class="cd-pagination__list">
        <view class="cd-pagination__nav" :class="navClass('prev')" @click="go(current - 1)">
          <view class="cd-pagination__chevron cd-pagination__chevron--prev" />
        </view>

        <template v-for="item in pageItems" :key="item.key">
          <view v-if="item.type === 'ellipsis'" class="cd-pagination__ellipsis">
            <text class="cd-pagination__ellipsis-text">···</text>
          </view>
          <view
            v-else
            class="cd-pagination__item"
            :class="{ 'cd-pagination__item--active': item.value === current }"
            @click="go(item.value)"
          >
            <text class="cd-pagination__item-text">{{ item.value }}</text>
          </view>
        </template>

        <view class="cd-pagination__nav" :class="navClass('next')" @click="go(current + 1)">
          <view class="cd-pagination__chevron cd-pagination__chevron--next" />
        </view>
      </view>
    </template>

    <!-- ============ 形态二：移动端 —— 极简翻页 ============ -->
    <template v-else>
      <view class="cd-pagination__simple">
        <view class="cd-pagination__nav cd-pagination__nav--text" :class="navClass('prev')" @click="go(current - 1)">
          <text class="cd-pagination__nav-text">上一页</text>
        </view>

        <text class="cd-pagination__indicator">{{ current }} / {{ pageCount }}</text>

        <view class="cd-pagination__nav cd-pagination__nav--text" :class="navClass('next')" @click="go(current + 1)">
          <text class="cd-pagination__nav-text">下一页</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
/**
 * cd-pagination —— 双形态分页
 * ---------------------------------------------------------------
 * 移动端不做完整页码，是基于真实约束而不是偷懒：
 * 375px 宽的屏幕上放不下「1 2 3 … 10」，手指也点不准 32px 的方块。
 * 所以移动端只保留「上一页 / 当前第几页 / 下一页」——
 * 这是所有头部移动产品的通行做法。
 *
 * 桌面端则是完整的：页码 + 两端省略号 + 每页条数切换 + 总条数。
 * 页码数量恒定（maxButtons 控制），避免翻页时控件宽度跳动。
 */
import { computed } from 'vue'
import { useBreakpoint, resolveDesktopShape } from '../../composables/use-breakpoint'
import CdSelect from '../cd-select/cd-select.vue'

defineOptions({
  name: 'cd-pagination',
})

const props = defineProps({
  total: {
    type: Number,
    default: 0,
  },
  current: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
  /** 'auto' | 'mobile' | 'desktop' */
  mode: {
    type: String,
    default: 'auto',
  },
  showTotal: {
    type: Boolean,
    default: true,
  },
  /** 每页条数切换器，仅桌面端渲染 */
  showSizeChanger: {
    type: Boolean,
    default: true,
  },
  pageSizeOptions: {
    type: Array,
    default: () => [10, 20, 50, 100],
  },
  /** 页码按钮数量（含首尾），中间部分按需收缩并显示省略号 */
  maxButtons: {
    type: Number,
    default: 5,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:current', 'update:pageSize', 'change'])

const { isPC } = useBreakpoint()
const desktopShape = computed(() => resolveDesktopShape(props.mode, isPC))

/* -------------------- 派生数据 -------------------- */

const pageCount = computed(() => {
  const size = props.pageSize > 0 ? props.pageSize : 10
  return Math.max(1, Math.ceil((props.total || 0) / size))
})

const totalText = computed(() => `共 ${props.total || 0} 条`)

const sizeOptions = computed(() => {
  const options = props.pageSizeOptions.slice()
  if (options.indexOf(props.pageSize) === -1) options.push(props.pageSize)
  options.sort((a, b) => a - b)
  return options.map((size) => ({ label: `${size} 条/页`, value: size }))
})

const rootClass = computed(() =>
  [
    desktopShape.value ? 'cd-pagination--desktop' : 'cd-pagination--mobile',
    props.disabled ? 'cd-pagination--disabled' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

/**
 * 生成页码条目。
 * 双向补齐是关键：只按 current 取区间的话，靠近首页或末页时
 * 页码按钮数量会变少，控件宽度随之跳动，视觉上很廉价。
 */
const pageItems = computed(() => {
  const count = pageCount.value
  const max = Math.max(5, props.maxButtons)
  const currentPage = clamp(props.current, 1, count)

  if (count <= max) {
    const items = []
    for (let n = 1; n <= count; n += 1) items.push({ type: 'page', value: n, key: `p${n}` })
    return items
  }

  const side = Math.floor((max - 2) / 2)
  let start = Math.max(2, currentPage - side)
  let end = Math.min(count - 1, currentPage + side)

  if (currentPage - 1 <= side) end = Math.min(count - 1, max - 2)
  if (count - currentPage <= side) start = Math.max(2, count - (max - 3))

  const items = [{ type: 'page', value: 1, key: 'p1' }]
  if (start > 2) items.push({ type: 'ellipsis', key: 'ellipsis-head' })
  for (let n = start; n <= end; n += 1) items.push({ type: 'page', value: n, key: `p${n}` })
  if (end < count - 1) items.push({ type: 'ellipsis', key: 'ellipsis-tail' })
  items.push({ type: 'page', value: count, key: `p${count}` })
  return items
})

/* -------------------- 交互 -------------------- */

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function go(target) {
  if (props.disabled) return
  const next = clamp(target, 1, pageCount.value)
  if (next === props.current) return
  emit('update:current', next)
  emit('change', { current: next, pageSize: props.pageSize })
}

const innerPageSize = computed({
  get: () => props.pageSize,
  set: (value) => {
    const size = Number(value) || props.pageSize
    if (size === props.pageSize) return
    emit('update:pageSize', size)
    // 换每页条数后当前页大概率越界，重置到第 1 页是所有产品的一致预期
    const nextCount = Math.max(1, Math.ceil((props.total || 0) / size))
    const nextCurrent = clamp(props.current, 1, nextCount)
    if (nextCurrent !== props.current) emit('update:current', nextCurrent)
    emit('change', { current: nextCurrent, pageSize: size })
  },
})

function navClass(direction) {
  const isPrev = direction === 'prev'
  const blocked =
    props.disabled || (isPrev ? props.current <= 1 : props.current >= pageCount.value)
  return blocked ? 'cd-pagination__nav--disabled' : ''
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-pagination {
  @include cd-reset;
  display: flex;
  align-items: center;
  width: 100%;
}

/* ==================================================================
 * 桌面端
 * ================================================================== */
.cd-pagination--desktop {
  justify-content: flex-end;
}

.cd-pagination__total {
  margin-right: var(--cd-space-4, 16px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
}

.cd-pagination__sizer {
  width: 108px;
  margin-right: var(--cd-space-4, 16px);
}

.cd-pagination__list {
  display: flex;
  align-items: center;
}

.cd-pagination__item,
.cd-pagination__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--cd-pagination-item-size, 32px);
  height: var(--cd-pagination-item-size, 32px);
  margin-left: var(--cd-space-1, 4px);
  background-color: var(--cd-bg-container, #ffffff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-md, 8px);
  cursor: pointer;
  transition: border-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-pagination__item-text {
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-regular, #334155);
  line-height: 1;
}

.cd-pagination__item--active {
  background-color: var(--cd-color-primary, #3b76f6);
  border-color: var(--cd-color-primary, #3b76f6);
}

.cd-pagination__item--active .cd-pagination__item-text {
  color: var(--cd-text-inverse, #ffffff);
  font-weight: var(--cd-font-weight-medium, 500);
}

@include cd-hover {
  .cd-pagination__item:hover {
    border-color: var(--cd-color-primary, #3b76f6);
  }

  .cd-pagination__item--active:hover {
    border-color: var(--cd-color-primary-hover, #2560eb);
  }

  .cd-pagination__nav:not(.cd-pagination__nav--disabled):hover {
    border-color: var(--cd-color-primary, #3b76f6);
  }
}

/* 方向箭头：一条折线旋转出来，不依赖图标字体 */
.cd-pagination__chevron {
  width: 7px;
  height: 7px;
  border-top: 1.5px solid var(--cd-text-secondary, #64748b);
  border-right: 1.5px solid var(--cd-text-secondary, #64748b);
}

.cd-pagination__chevron--prev {
  transform: rotate(-135deg);
  margin-left: 2px;
}

.cd-pagination__chevron--next {
  transform: rotate(45deg);
  margin-right: 2px;
}

.cd-pagination__ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: var(--cd-pagination-item-size, 32px);
}

.cd-pagination__ellipsis-text {
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-placeholder, #94a3b8);
  letter-spacing: 1px;
}

/* ==================================================================
 * 移动端
 * ================================================================== */
.cd-pagination--mobile {
  flex-direction: column;
  align-items: stretch;
}

.cd-pagination--mobile .cd-pagination__total {
  margin-right: 0;
  margin-bottom: var(--cd-space-2, 8px);
  text-align: center;
}

.cd-pagination__simple {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cd-pagination__nav--text {
  width: auto;
  height: var(--cd-control-height, 36px);
  padding: 0 var(--cd-space-4, 16px);
  margin-left: 0;
}

.cd-pagination__nav-text {
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-regular, #334155);
  line-height: 1;
}

.cd-pagination__indicator {
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-medium, 500);
  color: var(--cd-text-primary, #0f172a);
}

/* ==================================================================
 * 禁用
 * ================================================================== */
.cd-pagination__nav--disabled,
.cd-pagination--disabled .cd-pagination__item {
  cursor: not-allowed;
  opacity: 0.45;
}

.cd-pagination__nav--disabled:active {
  background-color: var(--cd-bg-container, #ffffff);
}
</style>
