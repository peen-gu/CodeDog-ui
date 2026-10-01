<template>
  <view class="cd-empty" :class="rootClass" :style="customStyle">
    <!-- 图标区：优先用插槽，其次是内置图标 -->
    <view class="cd-empty__figure">
      <slot name="image">
        <cd-icon :name="resolvedIcon" :size="iconSize" />
      </slot>
    </view>

    <text v-if="resolvedText" class="cd-empty__text">{{ resolvedText }}</text>

    <view v-if="hasDesc" class="cd-empty__desc">
      <slot>
        <text class="cd-empty__desc-text">{{ description }}</text>
      </slot>
    </view>

    <!-- 只有真的传了 action 插槽才渲染，否则会留下一个空的带边距盒子 -->
    <view v-if="$slots.action" class="cd-empty__action">
      <slot name="action" />
    </view>
  </view>
</template>

<script setup>
/**
 * cd-empty —— 空状态 / 结果提示
 * ---------------------------------------------------------------
 * 为什么提供 mode（preset）而不是只让业务传图标和文案？
 * 因为「暂无数据 / 未找到结果 / 网络异常」这三种状态在每个项目里都会被写几十遍，
 * 而且每次文案都不一样（"暂无数据" vs "还没有内容" vs "空空如也"），
 * 同一款产品里出现三种说法是很常见的一致性事故。
 * 把高频场景固化成预设，业务想改文案仍然可以传 text 覆盖。
 */
import { computed, useSlots } from 'vue'

defineOptions({
  name: 'cd-empty',
})

/** 预设：图标 + 默认文案 */
const PRESETS = {
  default: { icon: 'inbox', text: '暂无数据' },
  search: { icon: 'search', text: '未找到相关内容' },
  network: { icon: 'cloud', text: '网络连接失败' },
  error: { icon: 'warning', text: '出错了' },
  permission: { icon: 'lock', text: '暂无访问权限' },
}

const props = defineProps({
  /** default / search / network / error / permission */
  mode: {
    type: String,
    default: 'default',
  },
  /** 覆盖预设图标 */
  icon: {
    type: String,
    default: '',
  },
  /** 覆盖预设主文案。显式传空字符串则完全不显示主文案 */
  text: {
    type: String,
    default: undefined,
  },
  /** 副文案，说明「为什么空」以及「该怎么办」 */
  description: {
    type: String,
    default: '',
  },
  /** small / default / large */
  size: {
    type: String,
    default: 'default',
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

const slots = useSlots()

const preset = computed(() => PRESETS[props.mode] || PRESETS.default)

const resolvedIcon = computed(() => props.icon || preset.value.icon)

/** text 传了就用传的（含空串），没传才用预设 —— 用 undefined 判空才能区分这两种情况 */
const resolvedText = computed(() => (props.text !== undefined ? props.text : preset.value.text))

const hasDesc = computed(() => !!props.description || !!slots.default)

const iconSize = computed(() => {
  if (props.size === 'small') return 'var(--cd-empty-icon-size-sm, 40px)'
  if (props.size === 'large') return 'var(--cd-empty-icon-size-lg, 88px)'
  return 'var(--cd-empty-icon-size, 64px)'
})

const rootClass = computed(() =>
  [`cd-empty--${props.size}`, props.customClass].filter(Boolean).join(' ')
)
</script>

<script>
export default {
  name: 'cd-empty',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-empty {
  @include cd-reset;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  padding: var(--cd-empty-padding, var(--cd-space-10, 40px) var(--cd-space-5, 20px));
  text-align: center;
}

/* 图标是灰的、文案是深的 —— 空状态的信息层级应该是「文案为主、图形为辅」 */
.cd-empty__figure {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--cd-space-4, 16px);
  color: var(--cd-empty-icon-color, var(--cd-border-color-strong, #cbd5e1));
}

.cd-empty__text {
  display: block;
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-medium, 500);
  color: var(--cd-text-regular, #334155);
  line-height: var(--cd-line-height-base, 1.5);
}

.cd-empty__desc {
  max-width: 320px;
  margin-top: var(--cd-space-2, 8px);
}

.cd-empty__desc-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  line-height: var(--cd-line-height-base, 1.5);
}

.cd-empty__action {
  margin-top: var(--cd-space-4, 16px);
}

/* ---------- 尺寸 ---------- */
.cd-empty--small {
  --cd-empty-padding: var(--cd-space-6) var(--cd-space-4);
}

.cd-empty--large {
  --cd-empty-padding: var(--cd-space-12) var(--cd-space-6);
}
</style>
