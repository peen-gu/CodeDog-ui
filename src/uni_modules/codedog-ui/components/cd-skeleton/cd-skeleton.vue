<template>
  <view class="cd-skeleton" :class="rootClass" :style="customStyle">
    <template v-if="loading">
      <!-- 完全自定义骨架时走这个插槽；给了它就不再渲染内置行 -->
      <slot v-if="$slots.template" name="template" />

      <template v-else>
        <view
          v-if="image"
          class="cd-skeleton__item cd-skeleton__image"
          :style="imageStyle"
        />

        <view class="cd-skeleton__profile">
          <view
            v-if="avatar"
            class="cd-skeleton__item cd-skeleton__avatar"
            :style="avatarStyle"
          />

          <view class="cd-skeleton__body">
            <view v-if="title" class="cd-skeleton__item cd-skeleton__title" :style="titleStyle" />

            <view
              v-for="(width, index) in rowWidths"
              :key="index"
              class="cd-skeleton__item cd-skeleton__line"
              :style="`width:${width};`"
            />
          </view>
        </view>
      </template>
    </template>

    <!-- 加载完成后渲染真实内容 —— 用同一个组件包住两态，
         业务不需要在模板里写 v-if / v-else 两套结构 -->
    <slot v-else />
  </view>
</template>

<script setup>
/**
 * cd-skeleton —— 骨架屏
 * ---------------------------------------------------------------
 * 两个设计决定值得说明：
 *
 * 1. 动画用「渐变扫光」而不是「透明度呼吸」。
 *    呼吸动画的问题是全屏几十个骨架块同时明暗闪动，视觉噪音很大；
 *    扫光是 background-position 位移，感知上更接近「正在加载」。
 *    同时用 background-size:400% + 位移动画，实现成本比 SVG 或 canvas 低得多。
 *
 * 2. 最后一行默认宽度收窄到 60%。
 *    因为真实段落最后一行几乎不会是满行，全部 100% 会让骨架看起来像条形码。
 *    这个细节是骨架屏「像不像真实内容」的关键。
 *
 * 另外：`loading` 为 false 时直接渲染默认插槽，这样业务可以
 * `<cd-skeleton :loading="!data"><RealContent /></cd-skeleton>` 一句话接管两态。
 */
import { computed } from 'vue'

defineOptions({
  name: 'cd-skeleton',
})

const props = defineProps({
  /** 加载中。false 时渲染默认插槽 */
  loading: {
    type: Boolean,
    default: true,
  },
  /** 扫光动画。尊重 prefers-reduced-motion，系统开启减弱动效时自动关闭 */
  animated: {
    type: Boolean,
    default: true,
  },
  /** 正文行数（不含标题行） */
  rows: {
    type: Number,
    default: 3,
  },
  /** 是否显示标题行（更粗更高的一行） */
  title: {
    type: Boolean,
    default: true,
  },
  /** 是否显示圆形头像块 */
  avatar: {
    type: Boolean,
    default: false,
  },
  /** 头像块尺寸，数字按 px */
  avatarSize: {
    type: [Number, String],
    default: 40,
  },
  /** 是否显示顶部图片块 */
  image: {
    type: Boolean,
    default: false,
  },
  /** 图片块高度，数字按 px */
  imageHeight: {
    type: [Number, String],
    default: 120,
  },
  /**
   * 自定义每行宽度，数组会按 rows 循环取用。
   * 注意：**数字按百分比解释**（写 60 就是 60%），
   * 因为行宽的意义就是相对宽度；需要绝对宽度请直接写 '120px'。
   */
  rowWidth: {
    type: [Array, String],
    default: () => [],
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

function toCssSize(value, unit = 'px') {
  return typeof value === 'number' ? `${value}${unit}` : String(value)
}

const avatarStyle = computed(
  () => `width:${toCssSize(props.avatarSize)};height:${toCssSize(props.avatarSize)};`
)

const imageStyle = computed(() => `height:${toCssSize(props.imageHeight)};`)

/** 标题行固定占 40%，视觉上接近「卡片标题」的真实长度 */
const titleStyle = computed(() => 'width:40%;')

const rowWidths = computed(() => {
  const count = Math.max(0, props.rows)
  const raw = props.rowWidth

  if (Array.isArray(raw) && raw.length) {
    return Array.from({ length: count }, (_, index) => toCssSize(raw[index % raw.length], '%'))
  }

  if (typeof raw === 'string' && raw) {
    return Array(count).fill(raw)
  }

  return Array.from({ length: count }, (_, index) => {
    /* 只有一行时不收窄，否则会出现一个孤零零的短条 */
    const isLast = index === count - 1
    return isLast && count > 1 ? '60%' : '100%'
  })
})

const rootClass = computed(() =>
  [
    props.animated ? 'cd-skeleton--animated' : '',
    props.avatar ? 'cd-skeleton--has-avatar' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)
</script>

<script>
export default {
  name: 'cd-skeleton',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-skeleton {
  @include cd-reset;

  display: block;
  width: 100%;
}

/* ==================================================================
 * 骨架块本体
 * ================================================================== */
.cd-skeleton__item {
  border-radius: var(--cd-skeleton-radius, 4px);
  background-color: var(--cd-skeleton-bg, var(--cd-bg-sunken, #f1f5f9));
}

.cd-skeleton--animated .cd-skeleton__item {
  background-image: linear-gradient(
    90deg,
    var(--cd-skeleton-bg, var(--cd-bg-sunken, #f1f5f9)) 25%,
    var(--cd-skeleton-highlight, var(--cd-border-color, #e2e8f0)) 37%,
    var(--cd-skeleton-bg, var(--cd-bg-sunken, #f1f5f9)) 63%
  );
  background-size: 400% 100%;
  animation: cd-skeleton-shimmer 1.4s ease infinite;
}

@keyframes cd-skeleton-shimmer {
  from {
    background-position: 100% 50%;
  }
  to {
    background-position: 0 50%;
  }
}

/* 系统开启「减弱动效」时停掉扫光。
   持续闪烁对前庭敏感人群是真实的不适来源，这不是可选项 */
@media (prefers-reduced-motion: reduce) {
  .cd-skeleton--animated .cd-skeleton__item {
    animation: none;
  }
}

/* ==================================================================
 * 布局
 * ================================================================== */
.cd-skeleton__image {
  width: 100%;
  margin-bottom: var(--cd-space-4, 16px);
  border-radius: var(--cd-skeleton-image-radius, var(--cd-radius-md, 8px));
}

.cd-skeleton__profile {
  display: flex;
  align-items: flex-start;
}

.cd-skeleton__avatar {
  flex-shrink: 0;
  margin-right: var(--cd-space-4, 16px);
  border-radius: var(--cd-radius-round, 999px);
}

.cd-skeleton__body {
  flex: 1;
  min-width: 0;
}

.cd-skeleton__title {
  height: var(--cd-skeleton-title-height, 20px);
  margin-bottom: var(--cd-space-3, 12px);
}

.cd-skeleton__line {
  height: var(--cd-skeleton-line-height, 14px);
}

/* 行间距用相邻兄弟选择器，后置的 margin 不会让最后一行多出一段空白。
   注意这里用 + 而不是 :not(:last-child) —— 小程序 WXSS 对后者的支持不稳 */
.cd-skeleton__line + .cd-skeleton__line {
  margin-top: var(--cd-skeleton-line-gap, 12px);
}
</style>
