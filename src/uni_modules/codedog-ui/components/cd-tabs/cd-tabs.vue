<template>
  <view class="cd-tabs" :class="rootClass" :style="customStyle">
    <!-- ================= 标签条 ================= -->
    <view class="cd-tabs__bar" :class="barClass">
      <!-- 可滚动形态：必须用 scroll-view，普通 view 在微信小程序里不会滚动 -->
      <scroll-view
        v-if="scrollable"
        class="cd-tabs__scroll"
        :scroll-x="true"
        :scroll-into-view="scrollIntoView"
        :scroll-with-animation="true"
        :show-scrollbar="false"
      >
        <view class="cd-tabs__track cd-tabs__track--scroll">
          <view
            v-for="(item, index) in tabs"
            :id="itemId(index)"
            :key="itemKey(item, index)"
            class="cd-tabs__item cd-tabs__item--shrink"
            :class="itemClass(item, index)"
            @click="handleSelect(item, index)"
          >
            <text class="cd-tabs__label">{{ item.label }}</text>
            <text v-if="item.badge" class="cd-tabs__badge">{{ item.badge }}</text>
          </view>
          <view v-if="showIndicator" class="cd-tabs__indicator" :style="indicatorStyle"></view>
        </view>
      </scroll-view>

      <!-- 等宽形态：纯百分比定位，不需要任何测量 -->
      <view v-else class="cd-tabs__track">
        <view
          v-for="(item, index) in tabs"
          :key="itemKey(item, index)"
          class="cd-tabs__item"
          :class="itemClass(item, index)"
          :style="itemStyle"
          @click="handleSelect(item, index)"
        >
          <text class="cd-tabs__label">{{ item.label }}</text>
          <text v-if="item.badge" class="cd-tabs__badge">{{ item.badge }}</text>
        </view>
        <view v-if="showIndicator" class="cd-tabs__indicator" :style="indicatorStyle"></view>
      </view>
    </view>

    <!-- ================= 内容区 =================
         内容不由组件托管，而是把 active / index 作为作用域插槽参数交回业务。
         原因：托管 pane 就得管懒加载、缓存、销毁时机，而这三件事
         各业务差异极大（有的要 keep-alive，有的要每次重建），
         强行统一只会让框架变难用。 -->
    <view v-if="$slots.default" class="cd-tabs__content">
      <slot :active="activeName" :index="activeIndex" />
    </view>
  </view>
</template>

<script setup>
/**
 * cd-tabs —— 标签页
 * ---------------------------------------------------------------
 * 指示器（那条会滑动的小横线）是本组件唯一有技术含量的地方，策略分两档：
 *
 *   等宽模式（默认）：left = (index + 0.5) / 总数 * 100%，纯 CSS 百分比。
 *     零测量、零时机问题，任何端、任何时刻都必然正确。
 *
 *   滚动模式：标签宽度不一致，百分比算不出来，只能用 createSelectorQuery 测量。
 *     测量是异步的且依赖布局完成，所以带兜底 —— 测不到就退回百分比，
 *     视觉上仍是「在激活项附近」，不会出现横线跑到屏幕外的情况。
 *
 * 这个分层是刻意的：把「必然正确」和「依赖测量」分开，
 * 让框架 90% 的用法（等宽标签）完全不承担测量的风险。
 */
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

defineOptions({
  name: 'cd-tabs',
})

/**
 * 每个实例一个 id 前缀，避免同页面多个 tabs 的 item id 冲突（scroll-into-view 依赖 id 唯一）。
 *
 * 用 Vue 分配的 instance.uid，不用「let uid = 0 自增」：
 * 后者写在 <script setup> 顶层看似模块级，编译后实际落在 setup() 体内，
 * 每个实例执行一次、每次从 0 重来，所有 tabs 的 id 会全撞成 `cd-tabs-0`。
 */
const self = getCurrentInstance()
const instanceId = `cd-tabs-${self ? self.uid : 0}`

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  /**
   * 标签数据
   * @type {{ label: string, name: string|number, badge?: string|number, disabled?: boolean }[]}
   */
  tabs: {
    type: Array,
    default: () => [],
  },
  /** line（下划线）/ card（分段控件） */
  type: {
    type: String,
    default: 'line',
  },
  /** 标签数较多时开启横向滚动 */
  scrollable: {
    type: Boolean,
    default: false,
  },
  /** 标签条吸顶（PC 长页面阅读时很实用） */
  sticky: {
    type: Boolean,
    default: false,
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

const emit = defineEmits(['update:modelValue', 'change', 'click'])

const instance = getCurrentInstance()
const trackRef = ref(null)

/* -------------------- 激活项 -------------------- */

const activeIndex = computed(() => {
  const index = props.tabs.findIndex((item) => item.name === props.modelValue)
  /* 没匹配到（比如首屏 modelValue 为空）时默认落到第一个可用项，
     否则会出现「一个都没选中」的悬空状态，视觉上像坏了 */
  return index > -1 ? index : findFirstEnabled()
})

const activeName = computed(() => {
  const item = props.tabs[activeIndex.value]
  return item ? item.name : props.modelValue
})

function findFirstEnabled() {
  const index = props.tabs.findIndex((item) => !item.disabled)
  return index > -1 ? index : 0
}

/* -------------------- 指示器 -------------------- */

/** 滚动模式下测量得到的横线中心位置（px） */
const measuredLeft = ref(0)
const measured = ref(false)

/**
 * card 形态没有滑动横线，激活态直接由背景色表达。
 * tabs 为空时也必须不渲染：等宽分支会用「总数 1」算出 left:50%，
 * 于是一条 20px 的蓝线孤零零浮在空标签条正中间，看起来像渲染坏了。
 */
const showIndicator = computed(() => props.type === 'line' && props.tabs.length > 0)

const indicatorStyle = computed(() => {
  const width = 'var(--cd-tabs-indicator-width, 20px)'
  if (props.scrollable && measured.value) {
    return `left:${measuredLeft.value}px;width:${width};opacity:1;`
  }
  if (props.scrollable) {
    /* 测量尚未完成：先隐藏，避免横线从 0 位置滑过来的抽搐感 */
    return `left:0px;width:${width};opacity:0;`
  }
  const total = props.tabs.length || 1
  const percent = ((activeIndex.value + 0.5) / total) * 100
  return `left:${percent}%;width:${width};opacity:1;`
})

function measure() {
  if (!props.scrollable) return
  /* 只在 H5 与小程序上做测量，两侧的 createSelectorQuery 都已由 uni-app 统一 */
  if (typeof uni === 'undefined' || !uni.createSelectorQuery || !instance) return

  nextTick(() => {
    const query = uni.createSelectorQuery().in(instance.proxy)
    query.select('.cd-tabs__track--scroll').boundingClientRect()
    query.selectAll('.cd-tabs__item--shrink').boundingClientRect()
    query.exec((res) => {
      const track = res && res[0]
      const items = res && res[1]
      const el = items && items[activeIndex.value]
      if (!track || !el) {
        measured.value = false
        return
      }
      measuredLeft.value = el.left - track.left + el.width / 2
      measured.value = true
    })
  })
}

watch(activeIndex, measure)

/* tabs 常常是接口给的：挂载时还是空数组，onMounted 那次测量什么都量不到，
   measured 就一直停在 false —— 而 activeIndex 没变的话不会再触发测量，
   于是横线永久停在 opacity:0。数据到了必须重测。
   两条 watch 各管一种写法：整体替换（引用变）与原地增删（长度变）。 */
watch(() => props.tabs, measure)
watch(() => props.tabs.length, measure)

/** 是否真的挂过 onWindowResize。卸载时只看这个标记，不看 props.scrollable */
let resizeBound = false

onMounted(() => {
  if (!props.scrollable) return
  measure()
  /* 旋转屏幕 / 拖窗口都会改变标签宽度，必须重测 */
  if (typeof uni !== 'undefined' && typeof uni.onWindowResize === 'function') {
    uni.onWindowResize(measure)
    resizeBound = true
  }
})

onUnmounted(() => {
  /* 这里刻意不判断 props.scrollable：
     scrollable 可以在挂载后由 true 改成 false，而当时注册的监听器还在，
     按 props 判断就会把它永久留在全局 —— 只认「当初有没有挂过」 */
  if (resizeBound && typeof uni !== 'undefined' && typeof uni.offWindowResize === 'function') {
    uni.offWindowResize(measure)
  }
  resizeBound = false
})

/* -------------------- 滚动定位 -------------------- */

const scrollIntoView = computed(() => `${instanceId}-${activeIndex.value}`)

function itemId(index) {
  return `${instanceId}-${index}`
}

/* -------------------- 计算类名 -------------------- */

const rootClass = computed(() =>
  [
    `cd-tabs--${props.type}`,
    props.sticky ? 'cd-tabs--sticky' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const barClass = computed(() => (props.scrollable ? 'cd-tabs__bar--scroll' : ''))

/** 等宽模式下每项宽度 = 1/总数，用百分比（与栅格同样的理由：编译期算不出就交给 CSS） */
const itemStyle = computed(() => {
  const total = props.tabs.length || 1
  return `width:${100 / total}%;`
})

function itemKey(item, index) {
  return item.name !== undefined && item.name !== null ? item.name : index
}

function itemClass(item, index) {
  return [
    index === activeIndex.value ? 'cd-tabs__item--active' : '',
    item.disabled ? 'cd-tabs__item--disabled' : '',
    item.badge ? 'cd-tabs__item--has-badge' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

/* -------------------- 交互 -------------------- */

function handleSelect(item, index) {
  if (item.disabled || index === activeIndex.value) {
    emit('click', { tab: item, index })
    return
  }
  emit('update:modelValue', item.name)
  emit('change', { name: item.name, index, tab: item })
  emit('click', { tab: item, index })
}
</script>

<script>
export default {
  name: 'cd-tabs',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-tabs {
  @include cd-reset;

  display: block;
  width: 100%;
}

/* 吸顶：PC 端长内容页面的实用能力 */
.cd-tabs--sticky .cd-tabs__bar {
  position: sticky;
  top: 0;
  z-index: var(--cd-z-sticky, 1100);
  background-color: var(--cd-bg-container, #ffffff);
}

/* ==================================================================
 * 标签条
 * ================================================================== */
.cd-tabs__bar {
  position: relative;
  width: 100%;
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
}

/* card 形态：整条变成一个分段控件，去掉下边框 */
.cd-tabs--card .cd-tabs__bar {
  border-bottom: none;
}

.cd-tabs__scroll {
  display: block;
  width: 100%;
  height: var(--cd-tabs-height, 40px);
  white-space: nowrap;
}

.cd-tabs__track {
  position: relative;
  display: flex;
  align-items: center;
  height: var(--cd-tabs-height, 40px);
}

/* 滚动模式下轨道交给内容撑宽，overflow 由 scroll-view 负责 */
.cd-tabs__track--scroll {
  display: inline-flex;
  width: auto;
  min-width: 100%;
}

.cd-tabs__item {
  position: relative;
  /*
   * 必须显式 border-box：uni 的 view 默认是 content-box，
   * 而等宽模式给每项的是 `width: 25%` 这类百分比 + 左右 12px padding，
   * 在 content-box 下实际占宽 = 百分比 + 24px，四项叠起来直接把页面撑宽
   * （375 视口实测：每项 105px，整条 right=445 > 375，整页能横向滚动）。
   */
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: var(--cd-tabs-height, 40px);
  padding: 0 var(--cd-space-3, 12px);
  cursor: pointer;
  user-select: none;
  transition: color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-tabs__label {
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-medium, 500);
  color: var(--cd-text-secondary, #64748b);
  white-space: nowrap;
  transition: color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-tabs__item--active .cd-tabs__label {
  color: var(--cd-color-primary, #3b76f6);
  font-weight: var(--cd-font-weight-semibold, 600);
}

/* 触屏没有 hover，按下给一个即时反馈 */
.cd-tabs__item:active .cd-tabs__label {
  opacity: 0.7;
}

@include cd-hover {
  .cd-tabs__item:hover .cd-tabs__label {
    color: var(--cd-text-primary, #0f172a);
  }

  .cd-tabs__item--active:hover .cd-tabs__label {
    color: var(--cd-color-primary, #3b76f6);
  }

  .cd-tabs__item--disabled:hover .cd-tabs__label {
    color: var(--cd-text-disabled, #cbd5e1);
  }
}

.cd-tabs__item--disabled {
  cursor: not-allowed;
}

.cd-tabs__item--disabled .cd-tabs__label {
  color: var(--cd-text-disabled, #cbd5e1);
}

/* ---------- 角标 ---------- */
.cd-tabs__badge {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  margin-left: var(--cd-space-1, 4px);
  background-color: var(--cd-color-danger, #ef4444);
  border-radius: 8px;
  color: var(--cd-text-inverse, #ffffff);
  font-size: var(--cd-font-size-xs, 11px);
  line-height: 16px;
  text-align: center;
  box-sizing: border-box;
}

/* ---------- 滑动指示器 ----------
   left 由 JS 给出（百分比或测量值），这里只管外观与位移补偿：
   translateX(-50%) 让 left 语义为「中心点」，两种定位方式才能共用一套样式 */
.cd-tabs__indicator {
  position: absolute;
  bottom: 0;
  height: var(--cd-tabs-indicator-height, 2px);
  background-color: var(--cd-color-primary, #3b76f6);
  border-radius: 1px;
  transform: translateX(-50%);
  transition: left var(--cd-duration-base, 250ms) var(--cd-ease-out, ease),
    width var(--cd-duration-base, 250ms) var(--cd-ease-out, ease),
    opacity var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

/* ==================================================================
 * card 形态：分段控件
 * ================================================================== */
.cd-tabs--card .cd-tabs__track {
  padding: var(--cd-space-1, 4px);
  /* 分段控件的轨道用下沉底色，激活块浮在上面 */
  background-color: var(--cd-bg-sunken, #f1f5f9);
  border-radius: var(--cd-radius-md, 8px);
  height: calc(var(--cd-tabs-height, 40px) + var(--cd-space-2, 8px));
}

.cd-tabs--card .cd-tabs__item {
  height: var(--cd-tabs-height, 40px);
  border-radius: var(--cd-radius-sm, 4px);
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-tabs--card .cd-tabs__item--active {
  background-color: var(--cd-bg-container, #ffffff);
  box-shadow: var(--cd-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
}

.cd-tabs--card .cd-tabs__item--active .cd-tabs__label {
  color: var(--cd-text-primary, #0f172a);
}

/* ==================================================================
 * 内容区
 * ================================================================== */
.cd-tabs__content {
  display: block;
  padding-top: var(--cd-space-4, 16px);
}
</style>
