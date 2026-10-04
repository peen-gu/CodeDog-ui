<template>
  <view class="cd-affix" :style="wrapperStyle">
    <view class="cd-affix__inner" :class="rootClass" :style="innerStyle">
      <slot />
    </view>
  </view>
</template>

<script setup>
/**
 * cd-affix —— 固钉
 * ---------------------------------------------------------------
 * 为什么不用 position: sticky 一把梭：
 *   sticky 的支持面太不整齐了 —— 微信小程序在 webview 渲染下能用，
 *   但在部分内嵌容器、以及在祖先元素带 overflow:hidden 时会静默失效，
 *   而且它**没法告诉你「我现在钉住了没有」**。
 *   而业务经常需要这个信息（钉住时加投影、换个底色、把标题压缩）。
 *
 * 所以这里用「占位壳 + 固定内层」的经典方案：
 *   外层 .cd-affix 始终待在文档流里，负责报告「我滚到哪了」；
 *   内层 .cd-affix__inner 平时是静态的，一旦外层顶边越过 offsetTop
 *   就切成 position:fixed，并把外层的宽高与左边距原样抄过来。
 *   这样布局不塌、宽度不跳，且 fixed 状态是一个可读的响应式变量。
 *
 * 滚动信号与 cd-backtop 共用 usePageScroll（H5 自动监听 / 小程序由页面传入）。
 * 测量用 rAF 节流，一帧最多量一次 —— 滚动事件一秒能来上百次。
 *
 * 已知限制：固定期间如果页面发生横向布局变化（比如侧栏展开），
 * 抄下来的 left / width 会失准。真遇到这种场景请调用组件的 refresh()。
 */
import { computed, getCurrentInstance, onUnmounted, ref, watch } from 'vue'
import { usePageScroll } from '../../composables/use-page-scroll'
import { raf, cancelRaf } from '../../utils/raf'

defineOptions({
  name: 'cd-affix',
})

const props = defineProps({
  /** 距离顶部多少像素时开始固定 */
  offsetTop: {
    type: Number,
    default: 0,
  },
  /**
   * 页面滚动距离。不传（null）时 H5 自动监听；
   * 小程序端必须由页面的 onPageScroll 传进来。
   */
  scrollTop: {
    type: Number,
    default: null,
  },
  zIndex: {
    type: Number,
    default: 1100,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['change'])

const instance = getCurrentInstance()

const fixed = ref(false)
const anchor = ref({ left: 0, width: 0, height: 0 })

const { scrollTop: pageScrollTop } = usePageScroll({
  propScrollTop: computed(() => (typeof props.scrollTop === 'number' ? props.scrollTop : -1)),
})

const rootClass = computed(() => [fixed.value ? 'cd-affix__inner--fixed' : '', props.customClass].filter(Boolean).join(' '))

/** 固定后内层脱离文档流，必须由外层把高度顶住，否则下方内容会跳上来 */
const wrapperStyle = computed(() =>
  fixed.value && anchor.value.height ? `height:${anchor.value.height}px;` : ''
)

const innerStyle = computed(() => {
  if (!fixed.value) return ''
  return [
    'position:fixed;',
    `top:${props.offsetTop}px;`,
    `left:${anchor.value.left}px;`,
    `width:${anchor.value.width}px;`,
    `z-index:${props.zIndex};`,
  ].join('')
})

function measureRect() {
  return new Promise((resolve) => {
    /* #ifdef H5 */
    const el = instance && instance.proxy && instance.proxy.$el
    if (el && el.getBoundingClientRect) {
      const r = el.getBoundingClientRect()
      resolve({ left: r.left, top: r.top, width: r.width, height: r.height })
      return
    }
    /* #endif */

    const query = uni.createSelectorQuery().in(instance)
    query
      .select('.cd-affix')
      .boundingClientRect((rect) => resolve(rect || null))
      .exec()
  })
}

let rafId = null

async function update() {
  const rect = await measureRect()
  if (!rect) return

  const shouldFix = rect.top <= props.offsetTop

  if (shouldFix) {
    /* 只在「刚刚钉住」时记录尺寸：固定期间外层的高度已经被我们锁死，
       继续抄会让占位高度自我循环 */
    if (!fixed.value) {
      anchor.value = { left: rect.left, width: rect.width, height: rect.height }
      emit('change', true)
    }
    fixed.value = true
  } else if (fixed.value) {
    fixed.value = false
    emit('change', false)
  }
}

function schedule() {
  if (rafId) return
  rafId = raf(() => {
    rafId = null
    update()
  })
}

watch(pageScrollTop, schedule)

/* 首屏也要量一次：页面可能带着滚动位置直接进来（刷新 / 返回）。
   必须把 id 记下来 —— 否则组件在这一帧之前被卸载时 cancelRaf 拿不到它，
   这一帧里的 measure 会在已经销毁的实例上跑。
   回调里同时把 rafId 复位，否则它会一直是非空值，
   后面的 schedule() 会永远命中 `if (rafId) return` 而不再测量 */
rafId = raf(() => {
  rafId = null
  update()
})

onUnmounted(() => {
  cancelRaf(rafId)
})

defineExpose({ fixed, refresh: update })
</script>

<script>
export default {
  name: 'cd-affix',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

/* 外层只做「占位 + 报告位置」，不承担任何视觉 */
.cd-affix {
  display: block;
  width: 100%;
}

.cd-affix__inner {
  @include cd-reset;

  display: block;
  width: 100%;
  /* 未固定时完全透明地待在流里，业务看到的样式全部来自插槽内容 */
  background-color: transparent;
}

/**
 * 固定态。左内边距与圆角在这里补一点点「浮起来」的观感 ——
 * 但刻意不加投影：影子是业务很在意的东西（后台表格的固定表头
 * 到底要不要影子，各家规范都不一样），留白总比强加一个影子安全。
 * 需要影子的场景，业务在外层包一个带影子的容器即可。
 */
.cd-affix__inner--fixed {
  z-index: var(--cd-z-sticky, 1100);
}
</style>
