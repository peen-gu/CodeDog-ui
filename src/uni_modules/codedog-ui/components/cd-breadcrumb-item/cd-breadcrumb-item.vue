<template>
  <view class="cd-breadcrumb-item" :class="rootClass" :style="customStyle" @click="handleClick">
    <view class="cd-breadcrumb-item__text">
      <slot>
        <text class="cd-breadcrumb-item__text-inner">{{ title }}</text>
      </slot>
    </view>

    <view v-if="!isLast" class="cd-breadcrumb-item__separator">
      <slot name="separator">
        <cd-icon v-if="separatorIcon" :name="separatorIcon" size="0.9em" />
        <text v-else class="cd-breadcrumb-item__separator-text">{{ separator }}</text>
      </slot>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-breadcrumb-item —— 面包屑项
 * ---------------------------------------------------------------
 * 最后一项被刻意做成「不可点、颜色更深」：
 * 面包屑的最后一项就是「你现在在这里」，让它可点会诱导用户点回当前页
 * （常见于把导航写成一整排链接的设计，结果最后一个点了没反应）。
 * 因此这里不是靠业务传 `disabled`，而是由位置自动决定。
 *
 * to 的跳转做了 navigateTo → switchTab 的降级，
 * 和 cd-grid-item 用同一套约定：目标是 tabBar 页时 navigateTo 必然失败。
 */
import { computed, inject, onUnmounted, useSlots } from 'vue'
import { CD_BREADCRUMB_KEY } from '../../constants'

defineOptions({
  name: 'cd-breadcrumb-item',
})

const props = defineProps({
  /** 无默认插槽时的文字 */
  title: {
    type: String,
    default: '',
  },
  /** 跳转地址（可选）。最后一项的 to 会被忽略 */
  to: {
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

const emit = defineEmits(['click'])

const slots = useSlots()
const breadcrumb = inject(CD_BREADCRUMB_KEY, null)

const uid = breadcrumb ? breadcrumb.register() : 0
onUnmounted(() => {
  if (breadcrumb) breadcrumb.unregister(uid)
})

const isLast = computed(() => (breadcrumb ? breadcrumb.isLast(uid) : true))
const separator = computed(() => (breadcrumb ? breadcrumb.separator.value : '/'))
const separatorIcon = computed(() => (breadcrumb ? breadcrumb.separatorIcon.value : ''))

const rootClass = computed(() =>
  [isLast.value ? 'cd-breadcrumb-item--current' : 'cd-breadcrumb-item--link', props.customClass]
    .filter(Boolean)
    .join(' ')
)

function handleClick(event) {
  emit('click', event)

  if (isLast.value || !props.to) return
  uni.navigateTo({
    url: props.to,
    fail: () => {
      uni.switchTab({ url: props.to, fail: () => {} })
    },
  })
}
</script>

<script>
export default {
  name: 'cd-breadcrumb-item',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-breadcrumb-item {
  @include cd-reset;

  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.cd-breadcrumb-item__text {
  min-width: 0;
}

.cd-breadcrumb-item__text-inner {
  font-size: var(--cd-breadcrumb-font-size, 14px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-breadcrumb-color, #64748b);
}

.cd-breadcrumb-item--link {
  cursor: pointer;
}

.cd-breadcrumb-item--link:active .cd-breadcrumb-item__text-inner {
  color: var(--cd-color-primary, #3b76f6);
}

@include cd-hover {
  .cd-breadcrumb-item--link:hover .cd-breadcrumb-item__text-inner {
    color: var(--cd-color-primary, #3b76f6);
  }
}

/* 当前页：颜色更重，且不给任何交互反馈 */
.cd-breadcrumb-item--current .cd-breadcrumb-item__text-inner {
  color: var(--cd-breadcrumb-current-color, #0f172a);
  font-weight: var(--cd-font-weight-medium, 500);
}

/* ==================================================================
 * 分隔符
 * ================================================================== */
.cd-breadcrumb-item__separator {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  /* 左右各半个间距，视觉上就是「两项之间一个间距」——
     比给两侧各写一整个间距要紧凑，也是面包屑该有的密度 */
  padding: 0 var(--cd-breadcrumb-gap, 8px);
  color: var(--cd-breadcrumb-separator-color, #94a3b8);
}

.cd-breadcrumb-item__separator-text {
  font-size: var(--cd-breadcrumb-font-size, 14px);
  line-height: 1;
  color: var(--cd-breadcrumb-separator-color, #94a3b8);
}
</style>
