<template>
  <view class="cd-alert" :class="rootClass" :style="customStyle" @click="handleClick">
    <!-- ---------- 图标 ---------- -->
    <view v-if="showIcon" class="cd-alert__icon">
      <slot name="icon">
        <cd-icon :name="iconName" size="1.15em" />
      </slot>
    </view>

    <!-- ---------- 内容 ---------- -->
    <view class="cd-alert__content">
      <text v-if="title || $slots.title" class="cd-alert__title">
        <slot name="title">{{ title }}</slot>
      </text>

      <view v-if="hasDescription" class="cd-alert__desc">
        <slot>
          <text class="cd-alert__desc-text">{{ description }}</text>
        </slot>
      </view>
    </view>

    <!-- ---------- 操作区 ---------- -->
    <view v-if="$slots.action" class="cd-alert__action">
      <slot name="action" />
    </view>

    <!-- ---------- 关闭 ---------- -->
    <view v-if="closable" class="cd-alert__close" @click="handleClose">
      <cd-icon name="close" size="0.95em" />
    </view>
  </view>
</template>

<script setup>
/**
 * cd-alert —— 提示条
 * ---------------------------------------------------------------
 * 与 cd-empty 的分工：empty 是「整块区域没有内容」，
 * alert 是「针对当前上下文的一条说明」。前者占满容器，后者通铺一行。
 *
 * 颜色策略和 cd-tag 一样：type 只声明两个颜色（主色 + 浅底），
 * 由形态决定怎么用。所以想加一种语义色只需要加两行。
 *
 * banner 形态（无圆角、无左右留白）存在的意义是能贴在页面顶部通铺，
 * 这是后台系统里很常见的一种用法，用一个布尔量比让业务写覆盖样式更省事。
 */
import { computed, useSlots } from 'vue'

defineOptions({
  name: 'cd-alert',
})

/** 每种语义对应的图标 */
const TYPE_ICONS = {
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  danger: 'close-circle',
}

const props = defineProps({
  /** info / success / warning / danger */
  type: {
    type: String,
    default: 'info',
  },
  title: {
    type: String,
    default: '',
  },
  /** 描述文案。也可以用默认插槽传更复杂的内容 */
  description: {
    type: String,
    default: '',
  },
  /** 显示左侧语义图标 */
  showIcon: {
    type: Boolean,
    default: true,
  },
  /** 显示关闭按钮 */
  closable: {
    type: Boolean,
    default: false,
  },
  /** 通铺形态：去掉圆角和左右留白，适合贴在页面或卡片顶部 */
  banner: {
    type: Boolean,
    default: false,
  },
  /** 描边形态：白底 + 语义色描边，视觉更轻 */
  outlined: {
    type: Boolean,
    default: false,
  },
  /** 内容居中（一般用于通铺的公告条） */
  center: {
    type: Boolean,
    default: false,
  },
  /** 自定义图标，覆盖 type 的默认图标 */
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

const emit = defineEmits(['close', 'click'])

const slots = useSlots()

const hasDescription = computed(() => !!props.description || !!slots.default)

const iconName = computed(() => props.icon || TYPE_ICONS[props.type] || TYPE_ICONS.info)

const rootClass = computed(() =>
  [
    `cd-alert--${props.type}`,
    props.banner ? 'cd-alert--banner' : '',
    props.outlined ? 'cd-alert--outlined' : 'cd-alert--filled',
    props.center ? 'cd-alert--center' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

/** 关闭只是「请求关闭」，是否真的隐藏由业务决定 —— 组件自己不持有可见状态 */
function handleClose(event) {
  emit('close', event)
}

function handleClick(event) {
  emit('click', event)
}
</script>

<script>
export default {
  name: 'cd-alert',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-alert {
  @include cd-reset;

  display: flex;
  align-items: flex-start;
  width: 100%;
  padding: var(--cd-alert-padding, var(--cd-space-3, 12px) var(--cd-space-4, 16px));
  border: var(--cd-border-width, 1px) solid transparent;
  border-radius: var(--cd-alert-radius, var(--cd-radius-md, 8px));
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

/* ==================================================================
 * 类型：只声明颜色
 * ================================================================== */
.cd-alert--info {
  --cd-alert-main: var(--cd-color-info, #64748b);
  --cd-alert-soft: var(--cd-color-info-soft, #f1f5f9);
}

.cd-alert--success {
  --cd-alert-main: var(--cd-color-success, #22c55e);
  --cd-alert-soft: var(--cd-color-success-soft, #f0fdf4);
}

.cd-alert--warning {
  --cd-alert-main: var(--cd-color-warning, #f59e0b);
  --cd-alert-soft: var(--cd-color-warning-soft, #fffbeb);
}

.cd-alert--danger {
  --cd-alert-main: var(--cd-color-danger, #ef4444);
  --cd-alert-soft: var(--cd-color-danger-soft, #fef2f2);
}

/* ==================================================================
 * 形态：决定颜色怎么用
 * ================================================================== */
.cd-alert--filled {
  background-color: var(--cd-alert-soft);
  /* 浅底配同色描边收边，否则在白卡片上会显得发虚 */
  border-color: var(--cd-alert-main);
  color: var(--cd-text-primary, #0f172a);
}

.cd-alert--outlined {
  background-color: var(--cd-bg-container, #ffffff);
  border-color: var(--cd-alert-main);
}

/* ==================================================================
 * 图标
 * ================================================================== */
.cd-alert__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  /* 微调 1px 让图标视觉上和中文字的第一行居中对齐 */
  margin-top: 1px;
  margin-right: var(--cd-space-2, 8px);
  color: var(--cd-alert-main);
}

/* ==================================================================
 * 内容
 * ================================================================== */
.cd-alert__content {
  flex: 1;
  min-width: 0;
}

.cd-alert__title {
  display: block;
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-medium, 500);
  color: var(--cd-text-primary, #0f172a);
  line-height: var(--cd-line-height-base, 1.5);
}

.cd-alert__desc {
  margin-top: var(--cd-space-1, 4px);
}

.cd-alert__desc-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-regular, #334155);
  line-height: var(--cd-line-height-base, 1.5);
}

/* ==================================================================
 * 操作区 / 关闭
 * ================================================================== */
.cd-alert__action {
  flex-shrink: 0;
  margin-left: var(--cd-space-3, 12px);
}

.cd-alert__close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* 图标只有 12px 左右，直接当点击目标太小，用 padding 撑到可点尺寸 */
  padding: var(--cd-space-1, 4px);
  margin: -2px -4px -2px var(--cd-space-2, 8px);
  color: var(--cd-text-secondary, #64748b);
  cursor: pointer;
}

@include cd-hover {
  .cd-alert__close:hover {
    color: var(--cd-text-primary, #0f172a);
  }
}

/* ==================================================================
 * 通铺 / 居中
 * ================================================================== */
.cd-alert--banner {
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.cd-alert--center {
  align-items: center;
  justify-content: center;
}

.cd-alert--center .cd-alert__icon {
  margin-top: 0;
}

.cd-alert--center .cd-alert__content {
  flex: 0 1 auto;
  text-align: center;
}
</style>
