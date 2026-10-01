<template>
  <view class="cd-loading" :class="rootClass" :style="customStyle">
    <!-- 遮罩层：只有全屏模式才渲染，用于阻断背景交互 -->
    <view v-if="fullscreen && mask" class="cd-loading__mask" />

    <view class="cd-loading__body" :class="bodyClass">
      <!-- ---------- 旋转图标 ---------- -->
      <!-- spinner 直接复用 cd-icon 的 loader + spin，不另写一套旋转动画：
           图标本来就是 mask 驱动的矢量，天然清晰且跟随字号 -->
      <cd-icon v-if="type === 'spinner'" name="loader" :size="iconSize" />

      <!-- ---------- 三点跳动 ---------- -->
      <view v-else-if="type === 'dots'" class="cd-loading__dots">
        <view
          v-for="(dot, index) in 3"
          :key="index"
          class="cd-loading__dot"
          :style="dotStyle(index)"
        />
      </view>

      <!-- ---------- 圆环 ---------- -->
      <view v-else class="cd-loading__ring" :style="ringStyle" />

      <text v-if="text || $slots.default" class="cd-loading__text">
        <slot>{{ text }}</slot>
      </text>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-loading —— 加载指示器
 * ---------------------------------------------------------------
 * 三种形态的取舍：
 *
 * spinner —— 复用 cd-icon 的 `loader` 图标 + spin 属性。
 *            图标是 mask + data URI 的矢量，任何尺寸都清晰，
 *            而且没有额外 CSS 动画需要维护。
 *
 * dots    —— 三个圆点依次缩放。适合按钮内联场景，
 *            因为它是横向展开的，不会把行高顶起来。
 *
 * ring    —— 纯 border 圆环。适合全屏加载，
 *            在深色遮罩上比图标更「有存在感」。
 *
 * 全屏模式的实现：position:fixed 挂在最上层（z-index 用 --cd-z-toast）。
 * 注意这里不做「滚动锁定」—— 锁滚动在 H5 上要操作 document，
 * 在小程序上没有对应能力，强行做会变成两套分支。遮罩已经能阻断点击了。
 */
import { computed } from 'vue'

defineOptions({
  name: 'cd-loading',
})

const props = defineProps({
  /** spinner / dots / ring */
  type: {
    type: String,
    default: 'spinner',
  },
  /** 尺寸，数字按 px */
  size: {
    type: [Number, String],
    default: 24,
  },
  /** 颜色，不传则用主色 */
  color: {
    type: String,
    default: '',
  },
  /** 加载文案 */
  text: {
    type: String,
    default: '',
  },
  /** 文字放在下方（否则在右侧） */
  vertical: {
    type: Boolean,
    default: false,
  },
  /** 全屏居中 */
  fullscreen: {
    type: Boolean,
    default: false,
  },
  /** 全屏时是否加半透明遮罩 */
  mask: {
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

const sizeCss = computed(() => (typeof props.size === 'number' ? `${props.size}px` : String(props.size)))

/** 图标和圆环内部还要留白，所以视觉尺寸比容器小一点 */
const iconSize = computed(() => `calc(${sizeCss.value} * 0.8)`)

const rootClass = computed(() =>
  [
    props.fullscreen ? 'cd-loading--fullscreen' : '',
    props.vertical ? 'cd-loading--vertical' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const bodyClass = computed(() => `cd-loading--${props.type}`)

const ringStyle = computed(() => {
  const parts = [`width:${sizeCss.value};`, `height:${sizeCss.value};`]
  if (props.color) parts.push(`border-top-color:${props.color};`)
  return parts.join('')
})

/** 三个点用不同的动画延迟错开，形成「依次跳动」而不是「一起闪」 */
function dotStyle(index) {
  const parts = [
    `animation-delay:${index * 0.16}s;`,
    `width:calc(${sizeCss.value} * 0.28);`,
    `height:calc(${sizeCss.value} * 0.28);`,
  ]
  if (props.color) parts.push(`background-color:${props.color};`)
  return parts.join('')
}
</script>

<script>
export default {
  name: 'cd-loading',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-loading {
  @include cd-reset;

  display: inline-flex;
}

.cd-loading--fullscreen {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--cd-z-toast, 3000);
}

.cd-loading__mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: var(--cd-loading-mask, var(--cd-bg-mask, rgba(15, 23, 42, 0.45)));
}

.cd-loading__body {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cd-loading-color, var(--cd-color-primary, #3b76f6));
}

/* 全屏模式给内容一个浮起的容器，否则在遮罩上就是一个孤零零的转圈 */
.cd-loading--fullscreen .cd-loading__body {
  flex-direction: column;
  padding: var(--cd-space-5, 20px) var(--cd-space-6, 24px);
  background-color: var(--cd-bg-elevated, #ffffff);
  border-radius: var(--cd-loading-radius, var(--cd-radius-lg, 12px));
  box-shadow: var(--cd-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.16));
}

.cd-loading--vertical .cd-loading__body {
  flex-direction: column;
}

/* ==================================================================
 * 三点
 * ================================================================== */
.cd-loading__dots {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cd-loading__dot {
  border-radius: var(--cd-radius-round, 999px);
  background-color: var(--cd-loading-color, var(--cd-color-primary, #3b76f6));
  animation: cd-loading-dot 0.9s ease-in-out infinite;
}

.cd-loading__dot + .cd-loading__dot {
  margin-left: calc(var(--cd-space-1, 4px) + 2px);
}

@keyframes cd-loading-dot {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-60%);
    opacity: 1;
  }
}

/* ==================================================================
 * 圆环
 * ================================================================== */
.cd-loading__ring {
  border: calc(var(--cd-loading-ring-width, 2px)) solid transparent;
  border-top-color: var(--cd-loading-color, var(--cd-color-primary, #3b76f6));
  border-right-color: var(--cd-loading-color, var(--cd-color-primary, #3b76f6));
  border-radius: 50%;
  animation: cd-loading-spin 0.8s linear infinite;
}

@keyframes cd-loading-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ==================================================================
 * 文案
 * ================================================================== */
.cd-loading__text {
  margin-left: var(--cd-space-3, 12px);
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-regular, #334155);
  line-height: var(--cd-line-height-base, 1.5);
}

.cd-loading--vertical .cd-loading__text,
.cd-loading--fullscreen .cd-loading__text {
  margin-left: 0;
  margin-top: var(--cd-space-3, 12px);
}

@media (prefers-reduced-motion: reduce) {
  .cd-loading__dot,
  .cd-loading__ring {
    animation-duration: 2s;
  }
}
</style>
