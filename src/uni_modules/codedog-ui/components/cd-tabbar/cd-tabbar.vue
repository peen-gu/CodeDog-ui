<template>
  <view class="cd-tabbar" :class="rootClass" :style="rootStyle">
    <view v-if="fixed && placeholder" class="cd-tabbar__placeholder" :style="placeholderStyle"></view>

    <view class="cd-tabbar__bar" :style="barStyle">
      <view class="cd-tabbar__row" :style="`height:${height}px;`">
        <view
          v-for="(item, i) in items"
        :key="keyOf(item, i)"
        class="cd-tabbar__item"
        :class="{ 'cd-tabbar__item--active': isActive(item, i) }"
        @click.stop="onPick(item, i)"
      >
        <view class="cd-tabbar__icon-wrap">
          <cd-badge
            :value="item.badge"
            :is-dot="!!item.dot"
            :hidden="!item.badge && !item.dot"
            type="danger"
          >
            <slot name="icon" :item="item" :index="i" :active="isActive(item, i)">
              <cd-icon
                v-if="item.icon"
                class="cd-tabbar__icon"
                :name="item.icon"
                :size="iconSize"
                :color="isActive(item, i) ? resolvedActive : resolvedInactive"
              />
            </slot>
          </cd-badge>
        </view>

        <text
          v-if="item.text"
          class="cd-tabbar__text"
          :style="`color:${isActive(item, i) ? resolvedActive : resolvedInactive};`"
          >{{ item.text }}</text
        >
        </view>
      </view>

      <!-- 底部安全区：iPhone 全面屏那一小条，桌面端自然为 0 -->
      <view v-if="safeArea" class="cd-tabbar__safe" :style="`height:${safeBottom}px;`"></view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-tabbar —— 底部标签栏
 * ---------------------------------------------------------------
 * 与 cd-navbar 是配对的：两者都要处理「系统留白」，方向相反 ——
 * navbar 管顶部状态栏，tabbar 管底部安全区。
 *
 * 两个刻意的设计：
 * 1. **选中态按 value 匹配而不是下标**。
 *    业务路由常常按 name 跳转，写 `:model-value="'mine'"` 比记住第 3 个下标可靠；
 *    item 没给 value 时才退化成下标。
 * 2. **badge 由容器统一渲染而不是让业务自己在图标上叠**。
 *    徽标要相对图标右上角定位，放外面只会互相错位；这里是唯一知道图标位置的地方。
 *
 * 不接管路由跳转：只抛 change，跳不跳交给业务决定 ——
 * 小程序 / H5 / Electron 三者的路由 API 不一样，在组件里写死反而会锁死用法。
 */
import { computed, onMounted, ref } from 'vue'
import { getSystemInfo } from '../../composables/use-platform'

defineOptions({
  name: 'cd-tabbar',
})

const props = defineProps({
  /**
   * 标签项：{ text, icon, badge, dot, value }
   * value 缺省时用下标作为身份
   */
  items: {
    type: Array,
    default: () => [],
  },
  /** 当前选中项的 value（或下标） */
  modelValue: {
    type: [String, Number],
    default: '',
  },
  fixed: {
    type: Boolean,
    default: true,
  },
  /** fixed 时是否生成等高占位块 */
  placeholder: {
    type: Boolean,
    default: true,
  },
  /** 是否为底部安全区留白 */
  safeArea: {
    type: Boolean,
    default: true,
  },
  border: {
    type: Boolean,
    default: true,
  },
  iconSize: {
    type: Number,
    default: 22,
  },
  activeColor: {
    type: String,
    default: '',
  },
  inactiveColor: {
    type: String,
    default: '',
  },
  height: {
    type: Number,
    default: 52,
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

const emit = defineEmits(['update:modelValue', 'change'])

const safeBottom = ref(0)

onMounted(() => {
  if (!props.safeArea) return
  const info = getSystemInfo() || {}
  /* safeAreaInsets 是较新的字段；拿不到再退回 safeArea 反推，都没有就 0 */
  const insets = info.safeAreaInsets || null
  if (insets && typeof insets.bottom === 'number') {
    safeBottom.value = insets.bottom
    return
  }
  const area = info.safeArea || null
  if (area && typeof area.bottom === 'number' && typeof info.screenHeight === 'number') {
    safeBottom.value = Math.max(info.screenHeight - area.bottom, 0)
  }
})

const resolvedActive = computed(
  () => props.activeColor || 'var(--cd-tabbar-active-color, var(--cd-color-primary, #2563eb))',
)
const resolvedInactive = computed(
  () => props.inactiveColor || 'var(--cd-tabbar-inactive-color, var(--cd-text-secondary, #64748b))',
)

const rootClass = computed(
  () => [props.border ? 'cd-tabbar--border' : '', props.customClass].filter(Boolean).join(' '),
)

const rootStyle = computed(() => props.customStyle || '')

const barStyle = computed(() => {
  const parts = []
  if (props.fixed) parts.push('position:fixed;')
  parts.push(`z-index:${props.zIndex};`)
  return parts.join('')
})

const placeholderStyle = computed(() => `height:${props.height + safeBottom.value}px;`)

function keyOf(item, index) {
  return item.value === undefined || item.value === null ? index : item.value
}

function isActive(item, index) {
  const id = keyOf(item, index)
  if (props.modelValue === '' || props.modelValue === null || props.modelValue === undefined) {
    return index === 0
  }
  return props.modelValue === id
}

function onPick(item, index) {
  const id = keyOf(item, index)
  emit('update:modelValue', id)
  emit('change', { value: id, index, item })
}
</script>

<script>
export default {
  name: 'cd-tabbar',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-tabbar {
  @include cd-reset;

  position: relative;
  width: 100%;
}

/* 竖向排布：上面一行是标签，下面一块是安全区。
   不能让安全区去做 flex row 的子项 —— 它会横向占位把标签挤扁 */
.cd-tabbar__bar {
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--cd-tabbar-bg, var(--cd-bg-container, #fff));
  border-top: var(--cd-border-width, 1px) solid transparent;
}

.cd-tabbar__row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

.cd-tabbar--border .cd-tabbar__bar {
  border-top-color: var(--cd-tabbar-border-color, var(--cd-border-color, #e2e8f0));
}

.cd-tabbar__item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-width: 0;
}

.cd-tabbar__icon-wrap {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 24px;
}

.cd-tabbar__text {
  margin-top: 2px;
  font-size: var(--cd-font-size-xs, 11px);
  line-height: 1.2;
}

/* 占位块不留 border：吸顶场景下不得在占位处再画一条线 */
.cd-tabbar__placeholder {
  display: block;
  width: 100%;
}

.cd-tabbar__safe {
  display: block;
  width: 100%;
}
</style>
