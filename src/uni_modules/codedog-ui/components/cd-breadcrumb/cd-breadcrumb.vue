<template>
  <view class="cd-breadcrumb" :class="customClass" :style="customStyle">
    <slot />
  </view>
</template>

<script setup>
/**
 * cd-breadcrumb —— 面包屑
 * ---------------------------------------------------------------
 * 分两层是为了「最后一个不可点」这件事有个明确的归属：
 * 分隔符与可点状态都取决于「我后面还有没有兄弟」，
 * 这个信息只有容器统计得出来。
 *
 * 和步骤条 / 时间线共用同一套注册表机制（普通数组 + 版本号），
 * 为什么不用 ref 数组的理由写在那两个组件里，不再重复。
 */
import { computed, provide } from 'vue'
import { CD_BREADCRUMB_KEY } from '../../constants'
import { createOrderRegistry } from '../../utils/slot-order'

defineOptions({
  name: 'cd-breadcrumb',
})

const props = defineProps({
  /** 分隔符文案 */
  separator: {
    type: String,
    default: '/',
  },
  /** 用图标替代文案分隔符 */
  separatorIcon: {
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

/** 顺序按真实渲染顺序校正，理由与时机见 utils/slot-order */
const order = createOrderRegistry()

provide(CD_BREADCRUMB_KEY, {
  separator: computed(() => props.separator),
  separatorIcon: computed(() => props.separatorIcon),
  register: order.register,
  unregister: order.unregister,
  isLast(uid) {
    return order.indexOf(uid) === order.total - 1
  },
})
</script>

<script>
export default {
  name: 'cd-breadcrumb',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-breadcrumb {
  @include cd-reset;

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  font-size: var(--cd-breadcrumb-font-size, 14px);
  line-height: var(--cd-line-height-base, 1.5);
}
</style>
