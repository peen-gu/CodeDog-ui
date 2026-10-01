<template>
  <view
    v-if="visible"
    class="cd-backtop"
    :class="rootClass"
    :style="rootStyle"
    @click="handleClick"
  >
    <slot>
      <view v-if="icon" class="cd-backtop__icon">
        <cd-icon :name="icon" :size="iconSize" />
      </view>
      <text v-if="text" class="cd-backtop__text">{{ text }}</text>
    </slot>
  </view>
</template>

<script setup>
/**
 * cd-backtop —— 回到顶部
 * ---------------------------------------------------------------
 * 显示与否只取决于一个数：页面滚了多远。所以它本身没有任何状态，
 * 真正的难点是**怎么拿到那个数**——这件事在两端的能力不对等：
 *
 *   H5：监听 window 的 scroll 即可，组件自给自足；
 *   小程序：页面滚动只在 Page 的 onPageScroll 里回调，组件拿不到。
 *
 * 因此这里的约定是：**scroll-top 属性可选**。
 *   - 传了 → 用它（小程序必须这么用）；
 *   - 不传 → H5 自动监听，小程序下则永远不显示。
 * 与其假装两端都能自动工作，不如把这个差异写成明确的 API。
 *
 * 滚动定位用 uni.pageScrollTo 而不是 window.scrollTo：
 * 前者在 H5 与小程序都是同一套语义（认 #id 或像素值），
 * 后者在小程序里根本不存在。
 */
import { computed } from 'vue'
import { usePageScroll } from '../../composables/use-page-scroll'

defineOptions({
  name: 'cd-backtop',
})

const props = defineProps({
  /**
   * 页面滚动距离。不传（null）时 H5 自动监听；
   * 小程序端必须由页面的 onPageScroll 传进来。
   */
  scrollTop: {
    type: Number,
    default: null,
  },
  /** 超过这个距离才显示 */
  visibilityHeight: {
    type: Number,
    default: 360,
  },
  /** 返回顶部的动画时长（毫秒） */
  duration: {
    type: Number,
    default: 300,
  },
  icon: {
    type: String,
    default: 'arrow-up',
  },
  iconSize: {
    type: [String, Number],
    default: '1.25em',
  },
  text: {
    type: String,
    default: '',
  },
  /** circle / square */
  shape: {
    type: String,
    default: 'circle',
  },
  /** 距底部（px） */
  bottom: {
    type: [String, Number],
    default: '',
  },
  /** 距右侧（px） */
  right: {
    type: [String, Number],
    default: '',
  },
  zIndex: {
    type: Number,
    default: 1200,
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

const { scrollTop: pageScrollTop } = usePageScroll({
  propScrollTop: computed(() => (typeof props.scrollTop === 'number' ? props.scrollTop : -1)),
})

const visible = computed(() => pageScrollTop.value > props.visibilityHeight)

const rootClass = computed(() =>
  [
    `cd-backtop--${props.shape}`,
    props.text ? 'cd-backtop--with-text' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

function toPx(value, fallback) {
  if (value === '' || value === null || value === undefined) return fallback
  return typeof value === 'number' ? `${value}px` : String(value)
}

const rootStyle = computed(() => {
  const parts = [
    `z-index:${props.zIndex};`,
    `bottom:${toPx(props.bottom, 'var(--cd-space-8, 32px)')};`,
    `right:${toPx(props.right, 'var(--cd-space-6, 24px)')};`,
  ]
  if (props.customStyle) parts.push(props.customStyle)
  return parts.join('')
})

function handleClick(event) {
  emit('click', event)
  uni.pageScrollTo({
    scrollTop: 0,
    duration: props.duration,
  })
}
</script>

<script>
export default {
  name: 'cd-backtop',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-backtop {
  @include cd-reset;

  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: var(--cd-backtop-size, 44px);
  height: var(--cd-backtop-size, 44px);
  background-color: var(--cd-backtop-bg, #ffffff);
  color: var(--cd-backtop-color, #64748b);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #f1f5f9);
  box-shadow: var(--cd-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.1));
  cursor: pointer;
  /* 出现时的入场动画：不写的话它会「啪」地弹出来，很突兀 */
  animation: cd-backtop-in 200ms var(--cd-ease-out, ease);
  transition: color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-backtop--circle {
  border-radius: var(--cd-radius-round, 999px);
}

.cd-backtop--square {
  border-radius: var(--cd-radius-md, 8px);
}

/* 带文字时横向撑开，变成胶囊 */
.cd-backtop--with-text {
  width: auto;
  min-width: var(--cd-backtop-size, 44px);
  padding: 0 var(--cd-space-3, 12px);
}

.cd-backtop:active {
  background-color: var(--cd-bg-active, rgba(15, 23, 42, 0.08));
}

@include cd-hover {
  .cd-backtop:hover {
    color: var(--cd-color-primary, #3b76f6);
    border-color: var(--cd-color-primary-border, #bfd6fe);
  }
}

.cd-backtop__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cd-backtop__text {
  margin-top: 2px;
  font-size: var(--cd-font-size-xs, 11px);
  line-height: 1.2;
  white-space: nowrap;
}

@keyframes cd-backtop-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
