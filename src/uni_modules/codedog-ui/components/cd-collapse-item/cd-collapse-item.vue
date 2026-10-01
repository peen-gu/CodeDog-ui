<template>
  <view class="cd-collapse-item" :class="rootClass" :style="customStyle">
    <!-- ---------- 头部 ---------- -->
    <view class="cd-collapse-item__header" @click="handleToggle">
      <view v-if="icon || $slots.icon" class="cd-collapse-item__icon">
        <slot name="icon">
          <cd-icon :name="icon" size="1.1em" />
        </slot>
      </view>

      <view class="cd-collapse-item__title">
        <slot name="title">
          <text class="cd-collapse-item__title-text">{{ title }}</text>
        </slot>
      </view>

      <view v-if="value || $slots.value" class="cd-collapse-item__value">
        <slot name="value">
          <text class="cd-collapse-item__value-text">{{ value }}</text>
        </slot>
      </view>

      <view class="cd-collapse-item__arrow">
        <slot name="arrow">
          <cd-icon name="chevron-right" size="1em" />
        </slot>
      </view>
    </view>

    <!-- ---------- 内容 ----------
         用 max-height 过渡而不是 v-if：v-if 会让内容在展开瞬间「跳」出来，
         因为闭合时根本没有高度可过渡。这里的内容始终渲染、
         由 max-height 从 0 长到实测高度，动画才连贯。 -->
    <view class="cd-collapse-item__body" :style="bodyStyle">
      <view class="cd-collapse-item__body-inner">
        <!-- lazy：内容昂贵时允许业务选择「首次展开后才挂载」 -->
        <slot v-if="!lazy || everOpened" />
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-collapse-item —— 折叠面板项
 * ---------------------------------------------------------------
 * 动画必须用「实测高度」而不是一个大数字（比如 max-height: 999px）。
 * 原因值得记一下：max-height 从 0 过渡到 999px 时，
 * 元素的实际渲染高度是 min(max-height, 内容高度) ——
 * 内容只有 80px 的话，前 92% 的时间都在「假装生长」，
 * 视觉上内容几乎瞬间出现，等于没做动画。
 * 所以这里在展开时用 createSelectorQuery 量一次内容真实高度，
 * 以纯值变量下发，过渡就是精确的。
 *
 * 已知取舍：高度只在「每次展开」时重量一次。
 * 展开状态下内容异步变高（比如加载完列表）不会自动跟上 ——
 * 真有这种场景请在数据到位后调用组件的 refresh()（已 expose）。
 */
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch, inject, useSlots } from 'vue'
import { CD_COLLAPSE_KEY } from '../../constants'

defineOptions({
  name: 'cd-collapse-item',
})

const props = defineProps({
  /** 面板标识，v-model 里存的就是它 */
  name: {
    type: [String, Number],
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  /** 标题右侧的值 */
  value: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  /** 首次展开后才渲染内容 */
  lazy: {
    type: Boolean,
    default: false,
  },
  disabled: {
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

const emit = defineEmits(['change'])

const slots = useSlots()
const instance = getCurrentInstance()

const collapse = inject(CD_COLLAPSE_KEY, null)

/** 脱离容器独立使用时，自己持有一份状态 */
const standaloneOpen = ref(false)

const open = computed(() => (collapse ? collapse.isActive(props.name) : standaloneOpen.value))

const everOpened = ref(open.value)

const contentHeight = ref(0)

watch(open, (value) => {
  if (value) {
    everOpened.value = true
    measure()
  }
})

onMounted(() => {
  if (open.value) measure()
})

/**
 * 量内容真实高度。
 * 统一走 uni.createSelectorQuery（H5 与小程序都实现了），
 * 不用 getBoundingClientRect 分支 —— 少一条代码路径就少一处两端差异。
 */
function measure() {
  nextTick(() => {
    const query = uni.createSelectorQuery().in(instance)
    query
      .select('.cd-collapse-item__body-inner')
      .boundingClientRect((rect) => {
        if (rect && rect.height) contentHeight.value = Math.ceil(rect.height)
      })
      .exec()
  })
}

const bodyStyle = computed(() =>
  contentHeight.value ? `--cd-collapse-body-h:${contentHeight.value}px;` : ''
)

const rootClass = computed(() =>
  [
    open.value ? 'cd-collapse-item--open' : '',
    props.disabled ? 'cd-collapse-item--disabled' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

function handleToggle() {
  if (props.disabled) return

  /* 先记下目标态再切换：Vue 的 computed 是惰性的，
     切换之后再读 open.value 拿到的是新值，取反就得到旧值了 */
  const next = !open.value

  if (collapse) collapse.toggle(props.name)
  else standaloneOpen.value = next

  emit('change', next)
}

defineExpose({ refresh: measure })
</script>

<script>
export default {
  name: 'cd-collapse-item',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-collapse-item {
  @include cd-reset;

  display: block;
  width: 100%;
}

/* ==================================================================
 * 头部
 * ================================================================== */
.cd-collapse-item__header {
  display: flex;
  align-items: center;
  min-height: var(--cd-collapse-header-height, 46px);
  padding: 0 var(--cd-collapse-padding-x, 16px);
  cursor: pointer;
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-collapse-item__header:active {
  background-color: var(--cd-bg-active, rgba(15, 23, 42, 0.08));
}

@include cd-hover {
  .cd-collapse-item__header:hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  }
}

.cd-collapse-item--disabled .cd-collapse-item__header {
  cursor: not-allowed;
}

.cd-collapse-item--disabled .cd-collapse-item__title-text,
.cd-collapse-item--disabled .cd-collapse-item__value-text,
.cd-collapse-item--disabled .cd-collapse-item__icon {
  color: var(--cd-text-disabled, #cbd5e1);
}

.cd-collapse-item__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: var(--cd-space-3, 12px);
  color: var(--cd-text-secondary, #64748b);
}

.cd-collapse-item__title {
  flex: 1;
  min-width: 0;
}

.cd-collapse-item__title-text {
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-medium, 500);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-primary, #0f172a);
}

.cd-collapse-item__value {
  flex-shrink: 0;
  max-width: 45%;
  margin-left: var(--cd-space-3, 12px);
}

.cd-collapse-item__value-text {
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-secondary, #64748b);
}

.cd-collapse-item__arrow {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: var(--cd-space-2, 8px);
  color: var(--cd-collapse-arrow-color, #94a3b8);
  /* 只转 90°：右箭头转到朝下，是「可展开」最省事的视觉信号，
     不需要为展开态再准备一个箭头图标 */
  transition: transform var(--cd-duration-base, 250ms) var(--cd-ease-in-out, ease);
}

.cd-collapse-item--open .cd-collapse-item__arrow {
  transform: rotate(90deg);
}

/* ==================================================================
 * 内容
 * ================================================================== */
.cd-collapse-item__body {
  max-height: 0;
  overflow: hidden;
  transition: max-height var(--cd-duration-base, 250ms) var(--cd-ease-in-out, ease);
}

.cd-collapse-item--open .cd-collapse-item__body {
  /* 兜底 999px 只在极少数「测不到高度」的情况下生效（如 display:none 的祖先） */
  max-height: var(--cd-collapse-body-h, 999px);
}

.cd-collapse-item__body-inner {
  padding: var(--cd-collapse-body-padding, 4px 16px 16px);
  font-size: var(--cd-font-size-base, 14px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-regular, #334155);
}
</style>
