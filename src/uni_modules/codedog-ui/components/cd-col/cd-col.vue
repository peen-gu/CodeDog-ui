<template>
  <view class="cd-col" :class="rootClass" :style="customStyle">
    <slot />
  </view>
</template>

<script setup>
/**
 * cd-col —— 24 栅格列
 * ---------------------------------------------------------------
 * 两个关键决定：
 *
 * 1. 宽度全部在**编译期**算好，不用运行期 calc。
 *    `calc(8 / 24 * 100%)` 这种写法在小程序 WXSS 里并不总是被正确求值，
 *    而栅格宽度是布局根基，不能赌。代价是产出 250 条静态规则，
 *    gzip 后约 1KB，换来确定性，非常划算。
 *
 * 2. 响应式用媒体查询类名，而不是 JS 监听断点改内联样式。
 *    前者是纯 CSS，首屏就没有布局跳动；后者要等 JS 执行完才正确，
 *    在 PC 上会看到明显的「先竖排后横排」闪动。
 *    也就是：能用 CSS 表达的响应式，绝不交给 JS。
 *
 * span 两种写法：
 *   :span="12"                        固定 12/24
 *   :span="{ xs: 24, md: 12, lg: 8 }" 移动端满宽、平板一半、桌面三分之一
 */
import { computed } from 'vue'

defineOptions({
  name: 'cd-col',
})

/** 与 scss-tokens.scss 的 $cd-bp-* 必须保持一致（xs 不设媒体查询，作为默认值） */
const BREAKPOINT_KEYS = ['sm', 'md', 'lg', 'xl']

const props = defineProps({
  /** 列宽，1-24；0 表示隐藏。也支持响应式对象 */
  span: {
    type: [Number, String, Object],
    default: 24,
  },
  /** 左侧偏移列数，同样支持响应式对象 */
  offset: {
    type: [Number, String, Object],
    default: 0,
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

/**
 * 钳制到 0~24。
 * SCSS 只生成到 24，所以 span=25 会产出 .cd-col--25 —— 这个类根本不存在，
 * 于是列静默退化成 .cd-col 的 width:100%（满宽）。
 * 「写错一个数字得到满宽」比报错难发现得多，所以这里直接钳住并告警。
 */
function clampGrid(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return value
  const clamped = Math.min(Math.max(Math.trunc(num), 0), 24)
  if (clamped !== num && process.env.NODE_ENV !== 'production') {
    console.warn(`[cd-col] span / offset 必须是 0~24，收到 ${value}，已按 ${clamped} 处理`)
  }
  return clamped
}

/**
 * @param {number|string|object} value 传入的 span / offset
 * @param {string} kind '' 表示列宽，'offset-' 表示偏移
 * @returns {string[]} 类名数组
 */
function toClasses(value, kind = '') {
  if (value === null || value === undefined || value === '') return []

  /* 数字 / 字符串：单一值 */
  if (typeof value !== 'object') {
    return [`cd-col--${kind}${clampGrid(value)}`]
  }

  const classes = []
  /* xs 不带媒体查询，等价于基准值 */
  if (value.xs !== undefined) {
    classes.push(`cd-col--${kind}${clampGrid(value.xs)}`)
  }
  BREAKPOINT_KEYS.forEach((bp) => {
    if (value[bp] !== undefined) {
      classes.push(`cd-col--${bp}-${kind}${clampGrid(value[bp])}`)
    }
  })
  /* 只写了断点、没写基准值时，基准补 24（满宽），
     这样移动端默认竖排堆叠 —— 这是响应式栅格最符合直觉的默认行为 */
  if (value.xs === undefined && kind === '' && !classes.length) {
    classes.push('cd-col--24')
  }
  return classes
}

const rootClass = computed(() =>
  [...toClasses(props.span, ''), ...toClasses(props.offset, 'offset-'), props.customClass]
    .filter(Boolean)
    .join(' ')
)
</script>

<script>
/**
 * virtualHost —— 小程序端必须开启，否则栅格在真机上会整体塌陷。
 * ---------------------------------------------------------------
 * 现象（2026-10-03 微信开发者工具实测，iPhone 14 Pro Max 430px）：
 *   12 个 grid-box 实测宽度 16.0px / 20.1px，而它们在 H5 375 视口下完全正常。
 *   16.0px 恰好等于 .grid-box 自己的左右 padding（8+8），即内容宽被算成了 0。
 *
 * 原因：小程序会给自定义组件套一层「宿主节点」<cd-col>，它才是真正的 flex item；
 *      而 width:33.33% 写在组件**内部**的根节点 .cd-col 上。
 *      宿主没有宽度 → 内部根节点的百分比去算一个「由内容决定」的宽度 →
 *      循环依赖 → 按规范解析成 0 → 列塌成 padding 那么宽。
 *      H5 没有宿主这一层，所以 H5 全对、小程序全错，且两端产物静态检查都「全对」。
 *
 * 开启 virtualHost 后宿主节点消失，内部根节点直接成为 cd-row 的 flex item，
 * 百分比得以对「有确定宽度的 flex 容器」求值，两端行为对齐。
 */
export default {
  name: 'cd-col',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
    virtualHost: true,
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

/**
 * 1/24 的百分比。
 * 用「乘法」而不是「除法」：sass 1.33 之后 `/` 做除法已被弃用，
 * 直接写 $i / 24 会在构建时刷一屏弃用警告。
 *
 * 精度取 6 位有效数字是刻意的：24 位小数的写法（4.1666666667%）
 * 会让产物里出现 `width:50.0000000004%` 这种噪音。
 * 6 位带来的最大误差约 0.0001%，在 1360px 容器上不到 0.002px，肉眼与渲染都无感。
 * 0 与 24 两个端点单独走字面量，避免浮点误差把 100% 算成 100.0001% 撑破容器。
 */
$cd-col-unit: 4.16667%;

$cd-col-breakpoints: (
  'sm': $cd-bp-sm,
  'md': $cd-bp-md,
  'lg': $cd-bp-lg,
  'xl': $cd-bp-xl,
);

@mixin cd-col-width($n) {
  @if $n == 0 {
    display: none;
  } @else if $n == 24 {
    width: 100%;
  } @else {
    width: $n * $cd-col-unit;
  }
}

@mixin cd-col-offset($n) {
  @if $n == 0 {
    margin-left: 0;
  } @else if $n == 24 {
    margin-left: 100%;
  } @else {
    margin-left: $n * $cd-col-unit;
  }
}

.cd-col {
  @include cd-reset;

  box-sizing: border-box;
  width: 100%;
  /* 列间距由 cd-row 通过 CSS 变量下发，列自己不需要知道 gutter 是多少。
     这里读的是 row 预先算好的「一半」，避免在 CSS 里做 calc 除法。 */
  padding-left: var(--cd-row-gutter-x-half, 0px);
  padding-right: var(--cd-row-gutter-x-half, 0px);
  margin-bottom: var(--cd-row-gutter-y, 0px);
}

/* ---------- 基准（不分断点） ---------- */
@for $i from 0 through 24 {
  .cd-col--#{$i} {
    @include cd-col-width($i);
  }

  .cd-col--offset-#{$i} {
    @include cd-col-offset($i);
  }
}

/* ---------- 响应式：移动端优先，后面的断点覆盖前面的 ---------- */
@each $name, $bp in $cd-col-breakpoints {
  @media (min-width: $bp) {
    @for $i from 0 through 24 {
      .cd-col--#{$name}-#{$i} {
        @include cd-col-width($i);
      }

      .cd-col--#{$name}-offset-#{$i} {
        @include cd-col-offset($i);
      }
    }
  }
}
</style>
