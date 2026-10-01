<template>
  <view class="cd-card" :class="rootClass" :style="customStyle">
    <!-- ---------- 头部 ---------- -->
    <view v-if="hasHeader" class="cd-card__header">
      <view class="cd-card__header-main">
        <slot name="header">
          <text v-if="title" class="cd-card__title">{{ title }}</text>
          <text v-if="desc" class="cd-card__desc">{{ desc }}</text>
        </slot>
      </view>

      <view v-if="$slots.extra" class="cd-card__extra">
        <slot name="extra" />
      </view>
    </view>

    <!-- ---------- 主体 ---------- -->
    <view class="cd-card__body" :class="bodyClass">
      <slot />
    </view>

    <!-- ---------- 底部 ---------- -->
    <view v-if="$slots.footer" class="cd-card__footer">
      <slot name="footer" />
    </view>
  </view>
</template>

<script setup>
/**
 * cd-card —— 内容容器
 * ---------------------------------------------------------------
 * 这不是「双形态」组件：卡片在手机上和在 PC 上是同一个东西。
 * 它需要的是密度可调 —— 也就是 padding 由 CSS 变量控制，
 * 于是同一个 cd-card 在 Provider 切换 density 时会自动收紧或放宽，
 * 不需要业务写第二套样式。
 *
 * 一个设计决策：body 默认是「无内边距」还是「有内边距」？
 * 这里的答案是「有，且与头部共用同一个 padding」，
 * 因为这符合 95% 的使用场景（标题 + 内容一起排）。
 * 需要表格、图片这类通铺内容时用 no-padding 关掉它。
 */
import { computed, useSlots } from 'vue'

defineOptions({
  name: 'cd-card',
})

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  /** 副标题，跟随 title 显示 */
  desc: {
    type: String,
    default: '',
  },
  /** 是否显示描边 */
  bordered: {
    type: Boolean,
    default: true,
  },
  /** never / hover / always */
  shadow: {
    type: String,
    default: 'never',
  },
  /** 整个卡片可点击（会有悬停浮起与按压反馈） */
  hoverable: {
    type: Boolean,
    default: false,
  },
  /** 关闭主体内边距，用于表格、图片等需要通铺的内容 */
  noPadding: {
    type: Boolean,
    default: false,
  },
  /** 收紧内边距（列表型卡片，信息密度更高） */
  compact: {
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

/** 有 title / desc / header 插槽 / extra 插槽 时才渲染头部，避免出现空的一条 */
const hasHeader = computed(() => !!(props.title || props.desc || slots.header || slots.extra))

const rootClass = computed(() =>
  [
    props.bordered ? 'cd-card--bordered' : 'cd-card--borderless',
    props.shadow !== 'never' ? `cd-card--shadow-${props.shadow}` : '',
    props.hoverable ? 'cd-card--hoverable' : '',
    props.compact ? 'cd-card--compact' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const bodyClass = computed(() => (props.noPadding ? 'cd-card__body--flush' : ''))

function handleClick(event) {
  emit('click', event)
}
</script>

<script>
export default {
  name: 'cd-card',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-card {
  @include cd-reset;

  position: relative;
  display: block;
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: var(--cd-card-radius, 12px);
  transition: border-color var(--cd-duration-base, 250ms) var(--cd-ease-in-out, ease),
    box-shadow var(--cd-duration-base, 250ms) var(--cd-ease-in-out, ease),
    transform var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-card--bordered {
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
}

.cd-card--borderless {
  border: none;
}

/* ---------- 阴影 ---------- */
.cd-card--shadow-always {
  box-shadow: var(--cd-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.1));
}

.cd-card--shadow-hover {
  box-shadow: var(--cd-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
}

@include cd-hover {
  .cd-card--hoverable:hover {
    border-color: var(--cd-border-color-strong, #cbd5e1);
    box-shadow: var(--cd-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.1));
    transform: translateY(-1px);
  }
}

/* 触屏没有 hover，改用按压反馈 —— 否则安卓上点完卡片会一直浮着 */
.cd-card--hoverable:active {
  transform: scale(0.995);
}

/* ---------- 头部 ---------- */
.cd-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--cd-card-padding, 20px) var(--cd-card-padding, 20px) 0;
}

.cd-card__header-main {
  flex: 1;
  min-width: 0;
}

.cd-card__title {
  display: block;
  font-size: var(--cd-font-size-md, 16px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #0f172a);
  line-height: var(--cd-line-height-tight, 1.25);
}

.cd-card__desc {
  display: block;
  margin-top: var(--cd-space-1, 4px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  line-height: var(--cd-line-height-base, 1.5);
}

.cd-card__extra {
  flex-shrink: 0;
  margin-left: var(--cd-space-3, 12px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
}

/* ---------- 主体 ---------- */
.cd-card__body {
  padding: var(--cd-card-padding, 20px);
}

/* 只有标题没有内容时，主体不该再占一份 padding */
.cd-card__header + .cd-card__body {
  padding-top: var(--cd-card-header-gap, 16px);
}

.cd-card__body--flush {
  padding: 0;
}

/* ---------- 底部 ---------- */
.cd-card__footer {
  padding: 0 var(--cd-card-padding, 20px) var(--cd-card-padding, 20px);
}

/* ---------- 紧凑 ---------- */
.cd-card--compact {
  --cd-card-padding: var(--cd-space-3);
  --cd-card-header-gap: var(--cd-space-2);
}
</style>
