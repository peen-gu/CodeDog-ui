<template>
  <view class="cd-notice-bar" :class="rootClass" :style="customStyle" @click="handleClick">
    <!-- ---------- 图标 ---------- -->
    <view v-if="showIcon" class="cd-notice-bar__icon">
      <slot name="icon">
        <cd-icon :name="iconName" size="1.05em" />
      </slot>
    </view>

    <!-- ---------- 内容 ---------- -->
    <view class="cd-notice-bar__content">
      <!-- 多条：纵向轮播 -->
      <template v-if="isArray">
        <view class="cd-notice-bar__viewport">
          <view class="cd-notice-bar__track" :style="trackStyle">
            <view v-for="(item, index) in text" :key="index" class="cd-notice-bar__vitem">
              <slot :text="item" :index="index">
                <text class="cd-notice-bar__text">{{ item }}</text>
              </slot>
            </view>
          </view>
        </view>
      </template>

      <!-- 单条 + scrollable：横向跑马灯 -->
      <template v-else-if="scrollable">
        <view class="cd-notice-bar__viewport">
          <view class="cd-notice-bar__marquee" :style="marqueeStyle">
            <slot>
              <text class="cd-notice-bar__text">{{ text }}</text>
            </slot>
          </view>
        </view>
      </template>

      <!-- 单条静态 -->
      <template v-else>
        <slot>
          <text class="cd-notice-bar__text" :class="wrapable ? 'cd-notice-bar__text--wrap' : 'cd-notice-bar__text--single'">
            {{ text }}
          </text>
        </slot>
      </template>
    </view>

    <!-- ---------- 右侧 ---------- -->
    <view v-if="$slots.action" class="cd-notice-bar__action">
      <slot name="action" />
    </view>

    <view v-if="closable" class="cd-notice-bar__close" @click.stop="handleClose">
      <cd-icon name="close" size="0.9em" />
    </view>
  </view>
</template>

<script setup>
/**
 * cd-notice-bar —— 通知栏
 * ---------------------------------------------------------------
 * 三种形态共用一个组件，而不是拆成三个：
 *   单条静态 / 单条跑马灯 / 多条纵向轮播 —— 它们在真实产品里
 *   就是同一块位置的不同数据量，业务不该因为「今天有两条公告」
 *   就换一个组件标签。
 *
 * 跑马灯的速度处理有个必须交代的取舍：
 *   正确的做法是量出文字宽度，再按「像素/秒」反算动画时长。
 *   这里用的是按字数估算 —— 因为量宽度必须等渲染完成（异步），
 *   而异步测量会让首屏出现「先静止、再突然开始跑」的闪跳。
 *   按字数估算的代价是：中英文混排时速度略有偏差，
 *   换来的是首屏一次成型、任何时刻都在匀速走。
 */

import { computed, onUnmounted, ref, watch } from 'vue'

defineOptions({
  name: 'cd-notice-bar',
})

const props = defineProps({
  /** 单条传字符串；多条传数组（自动纵向轮播） */
  text: {
    type: [String, Array],
    default: '',
  },
  /** default / info / success / warning / danger */
  type: {
    type: String,
    default: 'default',
  },
  /** 单条时开启横向跑马灯 */
  scrollable: {
    type: Boolean,
    default: false,
  },
  /** 跑马灯速度，约等于每秒多少像素 */
  speed: {
    type: Number,
    default: 60,
  },
  /** 单条时允许换行（关闭省略号） */
  wrapable: {
    type: Boolean,
    default: false,
  },
  showIcon: {
    type: Boolean,
    default: true,
  },
  /** 自定义图标 */
  icon: {
    type: String,
    default: '',
  },
  closable: {
    type: Boolean,
    default: false,
  },
  /** 多条轮播的切换间隔（毫秒） */
  interval: {
    type: Number,
    default: 3000,
  },
  /** 自定义跳转地址 */
  url: {
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

const emit = defineEmits(['click', 'close', 'change'])

const TYPE_ICONS = {
  default: 'bell',
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  danger: 'close-circle',
}

const isArray = computed(() => Array.isArray(props.text))
const list = computed(() => (isArray.value ? props.text : []))

const iconName = computed(() => props.icon || TYPE_ICONS[props.type] || TYPE_ICONS.default)

const rootClass = computed(() =>
  [
    `cd-notice-bar--${props.type}`,
    isArray.value ? 'cd-notice-bar--multi' : '',
    props.scrollable && !isArray.value ? 'cd-notice-bar--scrollable' : '',
    props.wrapable && !isArray.value && !props.scrollable ? 'cd-notice-bar--wrapable' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

/* ==================================================================
 * 多条：纵向轮播
 * ================================================================== */

const activeIndex = ref(0)

const trackStyle = computed(() => `transform:translateY(-${activeIndex.value * 100}%);`)

let rotateTimer = null

function stopRotate() {
  if (rotateTimer) {
    clearInterval(rotateTimer)
    rotateTimer = null
  }
}

function startRotate() {
  stopRotate()
  if (!isArray.value || list.value.length < 2 || props.interval <= 0) return
  rotateTimer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % list.value.length
    emit('change', activeIndex.value)
  }, props.interval)
}

watch(
  () => [isArray.value, list.value.length, props.interval],
  () => {
    /* 数据条数变化时把下标收回合法范围，否则会停在一个空白项上 */
    if (activeIndex.value >= list.value.length) activeIndex.value = 0
    startRotate()
  },
  { immediate: true }
)

onUnmounted(stopRotate)

/* ==================================================================
 * 单条：跑马灯
 * ================================================================== */

/** 以中文字符宽约等于 1 个字号、西文约 0.55 个字号估算整段宽度 */
function estimateWidth(content) {
  let width = 0
  for (let i = 0; i < content.length; i += 1) {
    width += content.charCodeAt(i) > 255 ? 14 : 8
  }
  return width
}

const marqueeStyle = computed(() => {
  const seconds = Math.max(6, (estimateWidth(String(props.text || '')) + 240) / Math.max(10, props.speed))
  return `animation-duration:${seconds.toFixed(2)}s;`
})

/* ==================================================================
 * 交互
 * ================================================================== */

function handleClick(event) {
  emit('click', event)
  if (props.url) {
    uni.navigateTo({
      url: props.url,
      fail: () => {
        uni.switchTab({ url: props.url, fail: () => {} })
      },
    })
  }
}

function handleClose(event) {
  emit('close', event)
}
</script>

<script>
export default {
  name: 'cd-notice-bar',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-notice-bar {
  @include cd-reset;

  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--cd-notice-height, 36px);
  padding: 0 var(--cd-space-3, 12px);
  border-radius: var(--cd-notice-radius, 8px);
  background-color: var(--cd-color-info-soft, #f1f5f9);
  color: var(--cd-color-info, #64748b);
  cursor: pointer;
}

/* 通铺形态（在页面顶部时）不需要圆角 */
.cd-notice-bar--multi,
.cd-notice-bar--scrollable {
  border-radius: var(--cd-notice-radius, 8px);
}

/* -------------------- 语义色 -------------------- */
.cd-notice-bar--info {
  background-color: var(--cd-color-primary-soft, #eff5ff);
  color: var(--cd-color-primary, #3b76f6);
}

.cd-notice-bar--success {
  background-color: var(--cd-color-success-soft, #f0fdf4);
  color: var(--cd-color-success, #22c55e);
}

.cd-notice-bar--warning {
  background-color: var(--cd-color-warning-soft, #fffbeb);
  color: var(--cd-color-warning, #f59e0b);
}

.cd-notice-bar--danger {
  background-color: var(--cd-color-danger-soft, #fef2f2);
  color: var(--cd-color-danger, #ef4444);
}

/* ==================================================================
 * 图标
 * ================================================================== */
.cd-notice-bar__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: var(--cd-space-2, 8px);
}

/* ==================================================================
 * 内容
 * ================================================================== */
.cd-notice-bar__content {
  flex: 1;
  min-width: 0;
  /* 有固定高度才能给纵向轮播和跑马灯一个「窗口」 */
  overflow: hidden;
}

.cd-notice-bar__viewport {
  position: relative;
  width: 100%;
  height: var(--cd-notice-height, 36px);
  overflow: hidden;
}

.cd-notice-bar__text {
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.5);
  color: inherit;
}

.cd-notice-bar__text--single {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cd-notice-bar__text--wrap {
  display: block;
  padding: var(--cd-space-2, 8px) 0;
  white-space: normal;
}

/* -------------------- 多条轮播 -------------------- */
.cd-notice-bar__track {
  transition: transform var(--cd-duration-base, 250ms) var(--cd-ease-in-out, ease);
}

.cd-notice-bar__vitem {
  display: flex;
  align-items: center;
  height: var(--cd-notice-height, 36px);
  overflow: hidden;
}

.cd-notice-bar__vitem .cd-notice-bar__text {
  display: block;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* -------------------- 跑马灯 -------------------- */
/**
 * padding-left: 100% 让文字从容器右侧外开始，再整体左移自身宽度，
 * 于是「从右边进来、从左边走光」这一趟正好铺满，衔接无缝。
 * 这是跑马灯最省事也最稳的写法（不依赖任何测量）。
 */
.cd-notice-bar__marquee {
  display: inline-block;
  padding-left: 100%;
  white-space: nowrap;
  animation-name: cd-notice-scroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-duration: var(--cd-notice-speed, 18s);
}

.cd-notice-bar__marquee .cd-notice-bar__text {
  white-space: nowrap;
}

@keyframes cd-notice-scroll {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    transform: translate3d(-100%, 0, 0);
  }
}

/* ==================================================================
 * 右侧
 * ================================================================== */
.cd-notice-bar__action {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: var(--cd-space-2, 8px);
}

.cd-notice-bar__close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* 图标本身很小，靠 padding 撑到可点尺寸 */
  padding: var(--cd-space-1, 4px);
  margin-left: var(--cd-space-1, 4px);
  opacity: 0.7;
  cursor: pointer;
}

@include cd-hover {
  .cd-notice-bar__close:hover {
    opacity: 1;
  }
}
</style>
