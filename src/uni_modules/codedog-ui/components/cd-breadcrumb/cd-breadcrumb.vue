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
import { computed, provide, ref } from 'vue'
import { CD_BREADCRUMB_KEY } from '../../constants'

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

const registry = []
let uidSeed = 0
const version = ref(0)

function register() {
  uidSeed += 1
  registry.push(uidSeed)
  version.value += 1
  return uidSeed
}

function unregister(uid) {
  const i = registry.indexOf(uid)
  if (i > -1) registry.splice(i, 1)
  version.value += 1
}

provide(CD_BREADCRUMB_KEY, {
  separator: computed(() => props.separator),
  separatorIcon: computed(() => props.separatorIcon),
  register,
  unregister,
  isLast(uid) {
    void version.value
    return registry.indexOf(uid) === registry.length - 1
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
