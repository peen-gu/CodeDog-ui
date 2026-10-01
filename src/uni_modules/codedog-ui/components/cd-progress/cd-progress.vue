<template>
  <!-- ==================== 线形 ==================== -->
  <view v-if="type === 'line'" class="cd-progress" :class="rootClass" :style="rootStyle">
    <view class="cd-progress__bar">
      <view class="cd-progress__fill" :style="fillStyle">
        <text v-if="effectiveTextInside" class="cd-progress__text cd-progress__text--inside">
          {{ textContent }}
        </text>
      </view>
    </view>

    <text v-if="showText && !effectiveTextInside" class="cd-progress__text">
      {{ textContent }}
    </text>
  </view>

  <!-- ==================== 环形 ==================== -->
  <view v-else class="cd-progress cd-progress--circle" :class="rootClass" :style="rootStyle">
    <view class="cd-progress__ring"></view>

    <view class="cd-progress__center">
      <slot>
        <text v-if="showText" class="cd-progress__text cd-progress__text--circle">
          {{ textContent }}
        </text>
      </slot>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-progress —— 进度条
 * ---------------------------------------------------------------
 * 两种形态的实现方式刻意不同：
 *
 * 线形 —— 两个嵌套 view，外层是轨道、内层是填充，宽度用百分比。
 *          最朴素的方案，没有兼容性可言，也不需要任何测量。
 *
 * 环形 —— conic-gradient 画弧 + mask 挖圆心。
 *          不用 canvas，是因为 canvas 在小程序里要处理 canvas-id、层级、
 *          以及组件不可见时的绘制时机，为了一个进度环引入这套东西不划算。
 *          也刻意不用「两个半圆旋转」那套纯 CSS 方案 —— 它的 DOM 结构要四层，
 *          而且边界值（0% / 50% / 100%）需要额外的特判。
 *          mask 的支持要求本框架已经在承担了（cd-icon 全靠 mask），
 *          所以这里复用同一基线，没有引入新的兼容风险。
 *
 * 一个容易被忽略的细节：百分比必须钳制在 0~100。
 * 接口返回 120 或者 -5 是常有的事，不钳制的话线形会溢出容器、
 * 环形会画出一整圈外加一段多余的弧。
 */
import { computed } from 'vue'

defineOptions({
  name: 'cd-progress',
})

const props = defineProps({
  /** 进度值，超出 0~100 会被钳制 */
  percentage: {
    type: Number,
    default: 0,
  },
  /** line / circle */
  type: {
    type: String,
    default: 'line',
  },
  /** 线形：条的粗细。环形：圆环宽度 */
  strokeWidth: {
    type: Number,
    default: 6,
  },
  /** 环形直径，数字按 px */
  size: {
    type: [Number, String],
    default: 100,
  },
  /** normal / success / warning / danger / active
   *  active 在线形上是流动的斜纹，适合用在「处理中」这类没有确定进度的场景 */
  status: {
    type: String,
    default: 'normal',
  },
  /** 直接指定填充色，优先级高于 status */
  color: {
    type: String,
    default: '',
  },
  /** 直接指定轨道色 */
  trackColor: {
    type: String,
    default: '',
  },
  /** 是否显示右侧百分比文字 */
  showText: {
    type: Boolean,
    default: true,
  },
  /** 文字显示在条内。条太细时会被自动忽略，见 effectiveTextInside */
  textInside: {
    type: Boolean,
    default: false,
  },
  /** 自定义文字内容，不传则显示「xx%」 */
  text: {
    type: String,
    default: '',
  },
  /** 圆头 */
  round: {
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

const clamped = computed(() => Math.min(100, Math.max(0, Number(props.percentage) || 0)))

const textContent = computed(() => props.text || `${clamped.value}%`)

/**
 * 条内文字需要足够的高度才放得下。
 * 不满足条件时静默回退到右侧显示 —— 与其把文字裁掉一半，
 * 不如换个位置放，用户根本不会察觉这里发生过一次降级。
 */
const effectiveTextInside = computed(() => props.type === 'line' && props.textInside && props.strokeWidth >= 16)

const rootClass = computed(() =>
  [
    `cd-progress--${props.status}`,
    props.round ? 'cd-progress--round' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

/** 进度值通过 CSS 变量下发给样式表，这样颜色才能留在 CSS 里用 var() 取，主题切换才有效 */
const rootStyle = computed(() => {
  const parts = [`--cd-progress-pct:${clamped.value};`]

  if (props.color) parts.push(`--cd-progress-color:${props.color};`)
  if (props.trackColor) parts.push(`--cd-progress-track:${props.trackColor};`)

  if (props.type === 'line') {
    parts.push(`--cd-progress-stroke:${props.strokeWidth}px;`)
  } else {
    const diameter = typeof props.size === 'number' ? `${props.size}px` : String(props.size)
    parts.push(`width:${diameter};height:${diameter};`)
    parts.push(`--cd-progress-stroke:${props.strokeWidth}px;`)
  }

  if (props.customStyle) parts.push(props.customStyle)
  return parts.join('')
})

const fillStyle = computed(() => `width:${clamped.value}%;`)
</script>

<script>
export default {
  name: 'cd-progress',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-progress {
  @include cd-reset;
}

/* ==================================================================
 * 线形
 * ================================================================== */
.cd-progress {
  display: flex;
  align-items: center;
  width: 100%;
}

.cd-progress__bar {
  flex: 1;
  min-width: 0;
  /* 高度必须显式给：view 里没有内容时会塌成 0 高，
     线形进度条就会彻底看不见（而且不会报错，只是"没渲染出来"） */
  height: var(--cd-progress-stroke, 6px);
  overflow: hidden;
  background-color: var(--cd-progress-track, var(--cd-bg-sunken, #f1f5f9));
}

.cd-progress--round .cd-progress__bar {
  border-radius: var(--cd-radius-round, 999px);
}

.cd-progress__fill {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  background-color: var(--cd-progress-color, var(--cd-color-primary, #3b76f6));
  transition: width var(--cd-duration-base, 250ms) var(--cd-ease-out, cubic-bezier(0.16, 1, 0.3, 1));
}

.cd-progress--round .cd-progress__fill {
  border-radius: var(--cd-radius-round, 999px);
}

.cd-progress__text {
  flex-shrink: 0;
  margin-left: var(--cd-space-3, 12px);
  min-width: 36px;
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.cd-progress__text--inside {
  margin-left: 0;
  padding-right: var(--cd-space-2, 8px);
  min-width: 0;
  color: var(--cd-text-inverse, #ffffff);
  /* 条内文字不参与换行，否则细条上会被挤成两行 */
  white-space: nowrap;
}

/* ==================================================================
 * 状态
 * ================================================================== */
.cd-progress--success {
  --cd-progress-color: var(--cd-color-success, #22c55e);
}

.cd-progress--warning {
  --cd-progress-color: var(--cd-color-warning, #f59e0b);
}

.cd-progress--danger {
  --cd-progress-color: var(--cd-color-danger, #ef4444);
}

/* 处理中：填充条上叠一层流动斜纹，暗示「进度还会继续走」 */
.cd-progress--active .cd-progress__fill {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.22) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.22) 50%,
    rgba(255, 255, 255, 0.22) 75%,
    transparent 75%,
    transparent
  );
  background-size: 16px 16px;
  animation: cd-progress-stripes 0.8s linear infinite;
}

@keyframes cd-progress-stripes {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 16px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cd-progress--active .cd-progress__fill {
    animation: none;
  }
}

/* ==================================================================
 * 环形
 * ================================================================== */
.cd-progress--circle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
}

.cd-progress__ring {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 50%;
  /* from -90deg 让 0% 从 12 点方向开始，这符合所有人对进度环的默认预期 */
  background-image: conic-gradient(
    from -90deg,
    var(--cd-progress-color, var(--cd-color-primary, #3b76f6)) calc(var(--cd-progress-pct, 0) * 1%),
    var(--cd-progress-track, var(--cd-bg-sunken, #f1f5f9)) 0
  );
  /* 挖掉圆心做成圆环。标准属性写前面、-webkit- 前缀写后面，与 cd-icon 的约定一致 */
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - var(--cd-progress-stroke, 6px)),
    #000 calc(100% - var(--cd-progress-stroke, 6px))
  );
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - var(--cd-progress-stroke, 6px)),
    #000 calc(100% - var(--cd-progress-stroke, 6px))
  );
}

.cd-progress__center {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--cd-z-normal, 1);
}

.cd-progress__text--circle {
  margin-left: 0;
  min-width: 0;
  font-size: var(--cd-font-size-md, 16px);
  font-weight: var(--cd-font-weight-medium, 500);
  color: var(--cd-text-primary, #0f172a);
  text-align: center;
}
</style>
