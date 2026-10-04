<template>
  <view class="cd-steps" :class="rootClass" :style="customStyle">
    <slot />
  </view>
</template>

<script setup>
/**
 * cd-steps —— 步骤条
 * ---------------------------------------------------------------
 * 序号是「位置」而不是「属性」，所以只能由容器统计出来。
 * 这里用「注册表 + 版本号」而不是让业务传 index：
 * 业务多写一个 :index 就多一处能写错的地方，
 * 而步骤顺序在模板里本来就是天然的。
 *
 * 注册表刻意用普通数组（不是 ref 数组）：
 * 被 Proxy 包过的数组会让 indexOf 的引用比对失效 ——
 * 这个坑在 cd-form 的字段注册表那一批已经踩过一次了。
 * 因此另设一个 version 变量，谁读它谁就建立了响应式依赖。
 */
import { computed, provide } from 'vue'
import { CD_STEPS_KEY } from '../../constants'
import { createOrderRegistry } from '../../utils/slot-order'

defineOptions({
  name: 'cd-steps',
})

const props = defineProps({
  /** 当前步骤，从 0 开始 */
  current: {
    type: Number,
    default: 0,
  },
  /** 当前步骤的状态：process / finish / error */
  status: {
    type: String,
    default: 'process',
  },
  /** horizontal / vertical */
  direction: {
    type: String,
    default: 'horizontal',
  },
  /** 水平方向的标题对齐：center（移动端）/ start（PC 后台） */
  align: {
    type: String,
    default: 'center',
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
 * 注册表：只存自增的 uid，顺序按真实渲染顺序校正。
 * 为什么必须校正、以及为什么不能只靠 onUpdated，都写在 utils/slot-order 里。
 */
const order = createOrderRegistry()

provide(CD_STEPS_KEY, {
  current: computed(() => props.current),
  status: computed(() => props.status),
  direction: computed(() => (props.direction === 'vertical' ? 'vertical' : 'horizontal')),
  register: order.register,
  unregister: order.unregister,
  indexOf: order.indexOf,
  get total() {
    return order.total
  },
})

const rootClass = computed(() =>
  [
    props.direction === 'vertical' ? 'cd-steps--vertical' : 'cd-steps--horizontal',
    props.direction !== 'vertical' && props.align === 'start' ? 'cd-steps--align-start' : 'cd-steps--align-center',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)
</script>

<script>
export default {
  name: 'cd-steps',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-steps {
  @include cd-reset;

  display: flex;
  width: 100%;
  background-color: transparent;
}

.cd-steps--horizontal {
  flex-direction: row;
  align-items: flex-start;
}

.cd-steps--vertical {
  flex-direction: column;
}
</style>
