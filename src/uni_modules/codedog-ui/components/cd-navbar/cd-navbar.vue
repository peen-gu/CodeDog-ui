<template>
  <view class="cd-navbar" :class="rootClass" :style="rootStyle">
    <!-- fixed 模式下的占位块：不让导航栏把内容顶到自己下面去 -->
    <view v-if="fixed && placeholder" class="cd-navbar__placeholder" :style="placeholderStyle"></view>

    <view class="cd-navbar__bar" :style="barStyle">
      <!-- 状态栏留白：只有沉浸式（statusBar）才画，普通下单页不需要 -->
      <view v-if="statusBar" class="cd-navbar__status" :style="`height:${statusBarHeight}px;`"></view>

      <view class="cd-navbar__inner" :style="`height:${height}px;`">
        <view class="cd-navbar__side cd-navbar__side--left" @click.stop="onLeft">
          <slot name="left">
            <template v-if="leftArrow">
              <cd-icon class="cd-navbar__arrow" name="chevron-left" :size="20" />
              <text v-if="leftText" class="cd-navbar__left-text">{{ leftText }}</text>
            </template>
            <text v-else-if="leftText" class="cd-navbar__left-text">{{ leftText }}</text>
          </slot>
        </view>

        <view class="cd-navbar__center" @click.stop="emit('click-title')">
          <slot name="title">
            <text class="cd-navbar__title" :class="{ 'cd-navbar__title--ellipsis': ellipsis }">{{
              title
            }}</text>
            <text v-if="subtitle" class="cd-navbar__subtitle">{{ subtitle }}</text>
          </slot>
        </view>

        <view class="cd-navbar__side cd-navbar__side--right" @click.stop="emit('click-right')">
          <slot name="right" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-navbar —— 顶部导航栏
 * ---------------------------------------------------------------
 * 三端差异全部集中在「顶部到底该留多少」这一件事上：
 *   - 微信小程序：自定义导航栏要自己扣掉状态栏高度，否则标题会被胶囊压住；
 *     uni 里靠 `navigationStyle: custom` 接管，状态栏高度来自 getSystemInfo()。
 *   - H5：浏览器没有状态栏，留白必须是 0，否则顶部凭空多一条。
 *   - Electron：同 H5，但如果业务做的是桌面窗，往往需要更矮的标题行。
 * 所以这里**不写死任何高度**，状态栏留白由 statusBar 开关 × 实测高度决定，
 * 拿不到就退回 0 —— 宁可贴顶也不要留一条莫名的空白。
 *
 * 布局刻意用「左中右三段 + 中间绝对居中」而不是 flex 均分：
 * 左右两侧内容长度不一样（左边可能只有箭头，右边有两个按钮），
 * 均分会让标题偏心。中间绝对定位后，标题永远在正中。
 */
import { computed, onMounted, ref } from 'vue'
import { getSystemInfo } from '../../composables/use-platform'

defineOptions({
  name: 'cd-navbar',
})

const props = defineProps({
  /** 标题文案 */
  title: {
    type: String,
    default: '',
  },
  /** 副标题（标题下方小字） */
  subtitle: {
    type: String,
    default: '',
  },
  /** 左侧返回箭头 */
  leftArrow: {
    type: Boolean,
    default: false,
  },
  /** 左侧文字，常配合 leftArrow 显示「返回」 */
  leftText: {
    type: String,
    default: '',
  },
  /** 标题过长省略 */
  ellipsis: {
    type: Boolean,
    default: true,
  },
  /** 吸顶固定 */
  fixed: {
    type: Boolean,
    default: true,
  },
  /** fixed 时是否生成等高占位块 */
  placeholder: {
    type: Boolean,
    default: true,
  },
  /** 是否为状态栏留出空间（自定义导航栏场景必须开） */
  statusBar: {
    type: Boolean,
    default: false,
  },
  /** 底部分割线 */
  border: {
    type: Boolean,
    default: true,
  },
  /** 内容区高度（不含状态栏） */
  height: {
    type: Number,
    default: 44,
  },
  /** 背景色，默认走令牌 */
  background: {
    type: String,
    default: '',
  },
  zIndex: {
    type: Number,
    default: 1000,
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

const emit = defineEmits(['click-left', 'click-right', 'click-title'])

const statusBarHeight = ref(0)

onMounted(() => {
  if (!props.statusBar) return
  const info = getSystemInfo() || {}
  /* 拿不到就保持 0：贴顶也比留一条不明来历的空白强 */
  statusBarHeight.value = Number(info.statusBarHeight) || 0
})

const barHeight = computed(() => statusBarHeight.value + props.height)

const rootClass = computed(
  () => [props.border ? 'cd-navbar--border' : '', props.customClass].filter(Boolean).join(' '),
)

const rootStyle = computed(() => props.customStyle || '')

const barStyle = computed(() => {
  const parts = []
  if (props.fixed) parts.push('position:fixed;')
  parts.push(`z-index:${props.zIndex};`)
  if (props.background) parts.push(`background-color:${props.background};`)
  return parts.join('')
})

const placeholderStyle = computed(() => `height:${barHeight.value}px;`)

function onLeft() {
  emit('click-left')
}
</script>

<script>
export default {
  name: 'cd-navbar',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-navbar {
  @include cd-reset;

  position: relative;
  width: 100%;
}

.cd-navbar__bar {
  top: 0;
  right: 0;
  left: 0;
  display: block;
  background-color: var(--cd-navbar-bg, var(--cd-bg-container, #fff));
  border-bottom: var(--cd-border-width, 1px) solid transparent;
}

.cd-navbar--border .cd-navbar__bar {
  border-bottom-color: var(--cd-navbar-border-color, var(--cd-border-color, #e2e8f0));
}

/* 占位块不留 border：否则吸顶时底边线会在占位位置和吸顶位置各画一条 */
.cd-navbar__placeholder {
  display: block;
  width: 100%;
}

.cd-navbar__status {
  display: block;
  width: 100%;
}

.cd-navbar__inner {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: var(--cd-navbar-height, 44px);
  padding: 0 var(--cd-space-3, 12px);
}

/* 中间段用绝对定位保证视觉居中：左右长度不等时 flex 均分会让标题偏心 */
.cd-navbar__center {
  position: absolute;
  top: 0;
  right: 60px;
  bottom: 0;
  left: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cd-navbar__title {
  max-width: 100%;
  font-size: var(--cd-font-size-lg, 16px);
  font-weight: var(--cd-font-weight-medium, 500);
  color: var(--cd-navbar-title-color, var(--cd-text-primary, #1e293b));
}

.cd-navbar__title--ellipsis {
  @include cd-ellipsis;
}

.cd-navbar__subtitle {
  max-width: 100%;
  margin-top: 2px;
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-navbar-subtitle-color, var(--cd-text-secondary, #64748b));
}

.cd-navbar__side {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 40px;
  height: 100%;
}

.cd-navbar__side--left {
  justify-content: flex-start;
}

.cd-navbar__side--right {
  justify-content: flex-end;
  margin-left: auto;
}

.cd-navbar__arrow {
  color: var(--cd-navbar-arrow-color, var(--cd-text-primary, #1e293b));
}

.cd-navbar__left-text {
  margin-left: 2px;
  font-size: var(--cd-font-size-md, 14px);
  color: var(--cd-navbar-arrow-color, var(--cd-text-primary, #1e293b));
}
</style>
