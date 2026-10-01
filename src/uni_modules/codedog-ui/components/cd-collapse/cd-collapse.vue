<template>
  <view class="cd-collapse" :class="rootClass" :style="customStyle">
    <slot />
  </view>
</template>

<script setup>
/**
 * cd-collapse —— 折叠面板
 * ---------------------------------------------------------------
 * 状态放在容器而不是每个面板里，原因有两个：
 *   1. 手风琴（accordion）本质是一个「单选组」，状态必须由容器统一裁决 ——
 *      面板各自持有 open 的话，展开第二个时无法可靠地关掉第一个；
 *   2. 业务常常需要在外部读 / 写「当前展开了哪些」，
 *      收敛成一个 v-model 比让业务去挨个操作面板干净得多。
 *
 * 与表单一样，面板不通过 props 拿状态 —— 插槽内容由业务书写，
 * 没办法自动注入属性，所以走 provide/inject。
 *
 * v-model 的形态会跟随 accordion 自动变化：
 *   accordion=true  → 单值（'' / 'panel-1'）
 *   否则            → 数组（['panel-1', 'panel-2']）
 * 这是有意的：让「手风琴」在类型层面就是单选，业务不用自己维持数组长度为 1。
 */
import { computed, provide, ref, watch } from 'vue'
import { CD_COLLAPSE_KEY } from '../../constants'

defineOptions({
  name: 'cd-collapse',
})

const props = defineProps({
  /** 展开项：手风琴模式是单值，否则是数组 */
  modelValue: {
    type: [Array, String, Number],
    default: () => [],
  },
  /** 手风琴模式：同时只能展开一项 */
  accordion: {
    type: Boolean,
    default: false,
  },
  /** 外框与面板间的分隔线 */
  border: {
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

const emit = defineEmits(['update:modelValue', 'change'])

/** 归一化成数组，内部永远按数组处理，出口再按模式还原 */
const activeNames = ref(normalize(props.modelValue))

function normalize(value) {
  if (value === null || value === undefined || value === '') return []
  return Array.isArray(value) ? [...value] : [value]
}

/** 出口：手风琴模式吐单值，其他吐数组 */
function output() {
  if (props.accordion) return activeNames.value.length ? activeNames.value[0] : ''
  return [...activeNames.value]
}

watch(
  () => props.modelValue,
  (value) => {
    const next = normalize(value)
    /* 只在真的不同时同步，避免业务侧回写触发无意义的二次更新 */
    if (next.length === activeNames.value.length && next.every((n, i) => n === activeNames.value[i])) return
    activeNames.value = next
  }
)

function isActive(name) {
  return activeNames.value.indexOf(name) > -1
}

function toggle(name) {
  if (props.accordion) {
    const next = isActive(name) ? [] : [name]
    activeNames.value = next
    /* 手风琴通常允许全部收起，所以不强制留一项 */
    emit('update:modelValue', output())
    emit('change', output())
    return
  }

  const index = activeNames.value.indexOf(name)
  if (index > -1) activeNames.value.splice(index, 1)
  else activeNames.value.push(name)

  emit('update:modelValue', output())
  emit('change', output())
}

function setActive(names) {
  activeNames.value = normalize(names)
  emit('update:modelValue', output())
  emit('change', output())
}

provide(CD_COLLAPSE_KEY, {
  isActive,
  toggle,
  accordion: computed(() => props.accordion),
})

const rootClass = computed(() =>
  [props.accordion ? 'cd-collapse--accordion' : '', props.border ? 'cd-collapse--bordered' : 'cd-collapse--plain', props.customClass]
    .filter(Boolean)
    .join(' ')
)

defineExpose({ setActive })
</script>

<script>
export default {
  name: 'cd-collapse',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-collapse {
  @include cd-reset;

  display: block;
  width: 100%;
  background-color: var(--cd-bg-container, #ffffff);
}

.cd-collapse--bordered {
  border-radius: var(--cd-collapse-radius, 12px);
  overflow: hidden;
  border: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #f1f5f9);
}

/* 相邻面板之间的分隔线由「后一项的上边」承担 ——
   与单元格分组同一招，永远不会在最后一项下面留下孤线 */
.cd-collapse--bordered .cd-collapse-item + .cd-collapse-item {
  border-top: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #f1f5f9);
}
</style>
