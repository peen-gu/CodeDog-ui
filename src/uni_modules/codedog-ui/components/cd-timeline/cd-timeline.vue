<template>
  <view class="cd-timeline" :class="rootClass" :style="customStyle">
    <slot />
  </view>
</template>

<script setup>
/**
 * cd-timeline —— 时间线
 * ---------------------------------------------------------------
 * 首尾项的处理和步骤条是同一类问题：某一项是否「有上文 / 有下文」
 * 只能由容器统计出来，所以这里复用「注册表 + 版本号」的做法。
 *
 * reverse 的实现不是反转数组（那会破坏插槽里业务的书写顺序，
 * 也会让 v-for 的 key 语义变得别扭），而是把容器改成 column-reverse。
 * 由此引出一个必须处理好的连带效果：
 * DOM 顺序没变、视觉顺序反了，于是「谁在上面」也反了 ——
 * 项的上下引线要跟着对调，否则最先写的那一项会在视觉上拖着一条断头线。
 */
import { computed, provide } from 'vue'
import { CD_TIMELINE_KEY } from '../../constants'
import { createOrderRegistry } from '../../utils/slot-order'

defineOptions({
  name: 'cd-timeline',
})

const props = defineProps({
  /** 倒序排列（最新的在最上面） */
  reverse: {
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

/** 顺序按真实渲染顺序校正，理由与时机见 utils/slot-order */
const order = createOrderRegistry()

provide(CD_TIMELINE_KEY, {
  reverse: computed(() => props.reverse),
  register: order.register,
  unregister: order.unregister,
  indexOf: order.indexOf,
  get total() {
    return order.total
  },
})

const rootClass = computed(() =>
  [props.reverse ? 'cd-timeline--reverse' : 'cd-timeline--normal', props.customClass].filter(Boolean).join(' ')
)
</script>

<script>
export default {
  name: 'cd-timeline',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-timeline {
  @include cd-reset;

  display: flex;
  flex-direction: column;
  width: 100%;
}

.cd-timeline--reverse {
  flex-direction: column-reverse;
}
</style>
