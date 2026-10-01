<template>
  <view class="cd-cell" :class="rootClass" :style="customStyle" @click="handleClick">
    <!-- ---------- 左侧图标 ---------- -->
    <view v-if="icon || $slots.icon" class="cd-cell__icon">
      <slot name="icon">
        <cd-icon :name="icon" size="1.15em" />
      </slot>
    </view>

    <!-- ---------- 主文案 + 副文案 ---------- -->
    <view class="cd-cell__body">
      <view class="cd-cell__title-row">
        <text v-if="required" class="cd-cell__required">*</text>
        <text v-if="title || $slots.title" class="cd-cell__title">
          <slot name="title">{{ title }}</slot>
        </text>
      </view>

      <view v-if="label || $slots.label" class="cd-cell__desc">
        <slot name="label">
          <text class="cd-cell__desc-text">{{ label }}</text>
        </slot>
      </view>
    </view>

    <!-- ---------- 右侧值区：值 → 自由内容（默认插槽） → 箭头 ---------- -->
    <view class="cd-cell__value">
      <slot name="value">
        <text v-if="value" class="cd-cell__value-text">{{ value }}</text>
      </slot>

      <slot />

      <view v-if="showArrow" class="cd-cell__arrow">
        <slot name="arrow">
          <cd-icon name="chevron-right" size="1em" />
        </slot>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-cell —— 单元格
 * ---------------------------------------------------------------
 * 这是移动端信息架构里最高频的一块积木：左边标题、右边值、末尾一个箭头。
 * 它本身不做任何业务，价值全在「一套对齐规则」——
 * 不同页面里手写十几行样式拼出来的「标题 + 值 + 箭头」，
 * 十有八九在图标宽度、文字基线、右边距上互相对不齐。
 *
 * 三个刻意的设计取舍：
 *
 * 1. 底边线归属容器，不归属自己。
 *    单元格单独使用时（props.border）自带一条底边线；
 *    一旦被 cd-cell-group 包住，底边线交给容器统一画在两格交界处。
 *    这样天然不会在最后一格下面多出一条悬空的线 ——
 *    因为 `:last-child` 在小程序 WXSS 的支持并不可靠，
 *    而「相邻兄弟选择器」是稳的（cd-checkbox-group 已经在用同一招）。
 *
 * 2. arrow 是三态而不是布尔。
 *    arrow 未显式传入时跟随 clickable —— 能点的格子才该有箭头，
 *    这在绝大多数场景下就是用户想要的，不必两处都写。
 *
 * 3. 值区是一个 flex 行而不是一个 text。
 *    真实业务里右边经常不止一个值（数字 + 标签 + 按钮），
 *    所以除了 value 属性还留了默认插槽，且默认插槽永远排在箭头左边。
 */
import { computed, inject, useSlots } from 'vue'
import { CD_CELL_GROUP_KEY } from '../../constants'

defineOptions({
  name: 'cd-cell',
})

const props = defineProps({
  /** 左侧主文案 */
  title: {
    type: String,
    default: '',
  },
  /** 主文案下方的小字说明 */
  label: {
    type: String,
    default: '',
  },
  /** 右侧值 */
  value: {
    type: [String, Number],
    default: '',
  },
  /** 左侧图标名 */
  icon: {
    type: String,
    default: '',
  },
  /** 标题前显示必填星号 */
  required: {
    type: Boolean,
    default: false,
  },
  /**
   * 是否显示右箭头。不传（null）时跟随 clickable：
   * 能点击的格子才应该有箭头，这是默认语义。
   */
  arrow: {
    type: Boolean,
    default: null,
  },
  /** 可点击：加光标与按压反馈 */
  clickable: {
    type: Boolean,
    default: false,
  },
  /** 底部分隔线。在 cd-cell-group 内部由容器负责，本属性不再生效 */
  border: {
    type: Boolean,
    default: true,
  },
  /** 垂直居中。关闭后内容顶部对齐，适合右侧是多行文本的场景 */
  center: {
    type: Boolean,
    default: true,
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

/**
 * 组上下文只用来回答一个问题：我在不在组里。
 * 不在组里 → 底边线自己画；在组里 → 交给容器（避免双线，也避免末行多一条）。
 */
const group = inject(CD_CELL_GROUP_KEY, null)
const inGroup = computed(() => !!group)

const showArrow = computed(() => (props.arrow === null ? props.clickable : props.arrow))

const rootClass = computed(() =>
  [
    props.clickable || showArrow.value ? 'cd-cell--clickable' : '',
    props.center ? 'cd-cell--center' : 'cd-cell--top',
    props.label ? 'cd-cell--has-desc' : '',
    props.disabled ? 'cd-cell--disabled' : '',
    props.border && !inGroup.value ? 'cd-cell--bordered' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

function handleClick(event) {
  if (props.disabled) return
  emit('click', event)
}
</script>

<script>
export default {
  name: 'cd-cell',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-cell {
  @include cd-reset;

  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--cd-cell-min-height, 48px);
  padding: var(--cd-cell-padding-y, 12px) var(--cd-cell-padding-x, 16px);
  background-color: var(--cd-bg-container, #ffffff);
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-cell--top {
  align-items: flex-start;
}

.cd-cell--bordered {
  /* 用 border 而不是阴影：阴影在暗色主题下要靠主题变量重写，
     而 border 直接吃 --cd-border-color，两端自动一致 */
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #f1f5f9);
}

.cd-cell--clickable {
  cursor: pointer;
}

.cd-cell--clickable:active {
  background-color: var(--cd-bg-active, rgba(15, 23, 42, 0.08));
}

@include cd-hover {
  .cd-cell--clickable:hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  }
}

.cd-cell--disabled {
  cursor: not-allowed;
}

.cd-cell--disabled .cd-cell__title,
.cd-cell--disabled .cd-cell__value-text,
.cd-cell--disabled .cd-cell__desc-text,
.cd-cell--disabled .cd-cell__icon {
  color: var(--cd-text-disabled, #cbd5e1);
}

/* ==================================================================
 * 左侧图标
 * ================================================================== */
.cd-cell__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* 图标按 1em 跟随文字，宽度靠 margin 撑，避免图标大小不同导致标题错位 */
  margin-right: var(--cd-space-3, 12px);
  color: var(--cd-cell-icon-color, var(--cd-text-secondary, #64748b));
}

/* ==================================================================
 * 主文案
 * ================================================================== */
.cd-cell__body {
  flex: 1;
  min-width: 0;
}

.cd-cell__title-row {
  display: flex;
  align-items: center;
  min-width: 0;
}

.cd-cell__required {
  flex-shrink: 0;
  margin-right: 2px;
  font-size: var(--cd-font-size-base, 14px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-cell-required-color, #ef4444);
}

.cd-cell__title {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-cell-label-color, #0f172a);
}

/* 只有一行时不需要额外行高撑开，靠 min-height 居中即可 */
.cd-cell__desc {
  margin-top: 2px;
}

.cd-cell__desc-text {
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-tight, 1.25);
  color: var(--cd-cell-desc-color, #64748b);
}

/* ==================================================================
 * 右侧值区
 * ================================================================== */
.cd-cell__value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  /* 值区最宽占一半，再多就该换行了 —— 与左侧标题的 flex:1 配合，
     保证「标题长、值也长」时两边都不会把对方挤没 */
  max-width: 60%;
  margin-left: var(--cd-space-3, 12px);
}

.cd-cell__value-text {
  font-size: var(--cd-font-size-base, 14px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-cell-value-color, #64748b);
  text-align: right;
}

.cd-cell__arrow {
  display: flex;
  align-items: center;
  margin-left: var(--cd-space-1, 4px);
  color: var(--cd-cell-arrow-color, #94a3b8);
}

/* 顶部对齐时箭头跟着第一行走，而不是浮在两行的中间 */
.cd-cell--top .cd-cell__arrow {
  margin-top: 2px;
}
</style>
