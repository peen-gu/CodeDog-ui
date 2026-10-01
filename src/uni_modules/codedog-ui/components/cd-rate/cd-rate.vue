<template>
  <view class="cd-rate" :class="rootClass" :style="rootStyle">
    <view class="cd-rate__stars">
      <!-- 底层：全部未选中 -->
      <view class="cd-rate__row">
        <view v-for="n in count" :key="`void-${n}`" class="cd-rate__cell">
          <view class="cd-rate__icon cd-rate__icon--void">
            <cd-icon :name="voidIcon" :size="size" />
          </view>
        </view>
      </view>

      <!-- 上层：已选中，靠「裁切宽度」实现半星 -->
      <view class="cd-rate__fill" :style="fillStyle">
        <view class="cd-rate__row">
          <view v-for="n in count" :key="`fill-${n}`" class="cd-rate__cell">
            <view class="cd-rate__icon cd-rate__icon--active">
              <cd-icon :name="icon" :size="size" />
            </view>
          </view>
        </view>
      </view>

      <!-- 点击区：每颗星再切成左右两半 -->
      <view v-if="!isReadonly" class="cd-rate__zones">
        <view v-for="n in count" :key="`zone-${n}`" class="cd-rate__cell cd-rate__cell--zone">
          <view class="cd-rate__zone" @click.stop="pick(n - 0.5)" />
          <view class="cd-rate__zone" @click.stop="pick(n)" />
        </view>
      </view>
    </view>

    <view v-if="$slots.text || displayText" class="cd-rate__text">
      <slot name="text">
        <text class="cd-rate__text-inner">{{ displayText }}</text>
      </slot>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-rate —— 评分
 * ---------------------------------------------------------------
 * 半星的实现方式值得说清楚，因为常见做法都有坑：
 *
 *   × 「用两个图标叠加 + width:50%」：百分比是按容器宽度算的，
 *     而容器里还有间隙（gap），所以 2.5 / 5 时 50% 并不会正好落在
 *     第 3 颗星的中间 —— 星越多、间距越大，偏移越明显。
 *   × 「用 clip-path」：小程序 WXSS 对 clip-path 的支持看运气。
 *
 *   本实现：底层铺一排「未选中」，上层再铺一排一模一样的「已选中」，
 *   用一个 overflow:hidden 的容器按**精确像素宽度**裁切。
 *   两排的布局参数完全相同，所以裁到哪里就是哪里，精度是像素级的。
 *   宽度能算成像素的前提是 size 与 gap 都是数字 —— 因此 size 声明为 Number，
 *   并由组件把同一组数字同时下发给 CSS 变量，确保「算的」和「画的」是同一个数。
 *
 * 点击区不参与上面的裁切，而是每颗星内部再横切两半，
 * 这样点击判定天然与视觉对齐，也不需要去猜 event 里的坐标字段
 * （小程序与 H5 的 tap 事件坐标系并不统一）。
 */
import { computed } from 'vue'
import { useField } from '../../composables/use-field'

defineOptions({
  name: 'cd-rate',
})

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
  /** 星星总数 */
  count: {
    type: Number,
    default: 5,
  },
  /** 允许半星 */
  allowHalf: {
    type: Boolean,
    default: false,
  },
  /** 只读：不可点击 */
  readonly: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 单颗星尺寸（px）。用 Number 是为了让上层裁切能算成精确像素 */
  size: {
    type: Number,
    default: 22,
  },
  /** 星星间距（px） */
  gap: {
    type: Number,
    default: 4,
  },
  /** 选中图标 */
  icon: {
    type: String,
    default: 'star-fill',
  },
  /** 未选中图标。默认用描边星而不是灰色实心星 ——
      灰色实心星看起来像「已选但坏了」，描边才有「待点亮」的意思 */
  voidIcon: {
    type: String,
    default: 'star',
  },
  /** 再次点击同一个值是否清零 */
  allowClear: {
    type: Boolean,
    default: true,
  },
  /** 显示右侧文案 */
  showText: {
    type: Boolean,
    default: false,
  },
  /** 文案表，按分数取；例如 ['很差', '较差', '一般', '较好', '很好'] */
  texts: {
    type: Array,
    default: () => [],
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

const { formDisabled, notifyChange, notifyBlur } = useField()

const isReadonly = computed(() => props.readonly || props.disabled || formDisabled.value)

const value = computed(() => {
  const v = Number(props.modelValue) || 0
  if (v < 0) return 0
  if (v > props.count) return props.count
  return v
})

/** 一行的总宽度 = 所有星星 + 所有间隙。上层裁切必须知道这个数 */
const totalWidth = computed(() => props.count * props.size + Math.max(0, props.count - 1) * props.gap)

const rootStyle = computed(() => {
  const parts = [
    `--cd-rate-size:${props.size}px;`,
    `--cd-rate-gap:${props.gap}px;`,
    `--cd-rate-total-w:${totalWidth.value}px;`,
  ]
  if (props.customStyle) parts.push(props.customStyle)
  return parts.join('')
})

const fillStyle = computed(() => `width:${value.value * (props.size + props.gap)}px;`)

const displayText = computed(() => {
  if (!props.showText) return ''
  const index = Math.ceil(value.value) - 1
  return props.texts[index] !== undefined ? props.texts[index] : ''
})

const rootClass = computed(() =>
  [
    props.allowHalf ? 'cd-rate--half' : 'cd-rate--whole',
    isReadonly.value ? 'cd-rate--readonly' : 'cd-rate--interactive',
    props.disabled || formDisabled.value ? 'cd-rate--disabled' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

function pick(next) {
  if (isReadonly.value) return
  const target = props.allowHalf ? next : Math.round(next)
  /* allowClear：点同一颗星视为撤销，这是评分控件里很自然的一个手势 */
  const finalValue = props.allowClear && target === value.value ? 0 : target

  emit('update:modelValue', finalValue)
  emit('change', finalValue)
  notifyChange(finalValue)
  notifyBlur()
}
</script>

<script>
export default {
  name: 'cd-rate',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-rate {
  @include cd-reset;

  display: flex;
  align-items: center;
  width: 100%;
}

.cd-rate__stars {
  position: relative;
  flex-shrink: 0;
}

.cd-rate__row {
  display: flex;
  /* 上层裁切容器会变窄，若行宽跟着收缩，星星会被压扁 ——
     所以这里锁死总宽，让裁切只发生在「看得见多少」而不是「挤成多窄」 */
  width: var(--cd-rate-total-w, auto);
}

.cd-rate__cell {
  position: relative;
  flex-shrink: 0;
  width: var(--cd-rate-size, 22px);
  height: var(--cd-rate-size, 22px);
}

.cd-rate__cell + .cd-rate__cell {
  margin-left: var(--cd-rate-gap, 4px);
}

.cd-rate__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.cd-rate__icon--void {
  color: var(--cd-rate-void-color, #cbd5e1);
}

.cd-rate__icon--active {
  color: var(--cd-rate-color, #f59e0b);
}

/* ==================================================================
 * 裁切层
 * ================================================================== */
.cd-rate__fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  overflow: hidden;
}

/* ==================================================================
 * 点击区
 * ================================================================== */
.cd-rate__zones {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  width: var(--cd-rate-total-w, auto);
  height: 100%;
}

.cd-rate__cell--zone {
  height: 100%;
}

.cd-rate__zone {
  position: absolute;
  left: 0;
  top: 0;
  width: 50%;
  height: 100%;
}

.cd-rate__zone + .cd-rate__zone {
  left: 50%;
}

/* 不允许半星时，整颗星都是热区，右半区直接不渲染 */
.cd-rate--whole .cd-rate__zone {
  width: 100%;
}

.cd-rate--whole .cd-rate__zone + .cd-rate__zone {
  display: none;
}

.cd-rate--interactive .cd-rate__zone {
  cursor: pointer;
}

.cd-rate--disabled .cd-rate__icon--active {
  color: var(--cd-text-disabled, #cbd5e1);
}

/* ==================================================================
 * 右侧文案
 * ================================================================== */
.cd-rate__text {
  margin-left: var(--cd-space-3, 12px);
  font-size: var(--cd-font-size-sm, 12px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-rate-text-color, #64748b);
}
</style>
