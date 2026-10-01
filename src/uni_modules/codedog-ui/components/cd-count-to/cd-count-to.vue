<template>
  <view class="cd-count-to" :class="customClass" :style="customStyle">
    <slot :value="current" :display="display">
      <text class="cd-count-to__text">
        <text v-if="prefix" class="cd-count-to__affix">{{ prefix }}</text>
        <text class="cd-count-to__number">{{ display }}</text>
        <text v-if="suffix" class="cd-count-to__affix">{{ suffix }}</text>
      </text>
    </slot>
  </view>
</template>

<script setup>
/**
 * cd-count-to —— 数字滚动
 * ---------------------------------------------------------------
 * 最容易做错的两件事，这里都刻意处理了：
 *
 * 1. **必须用插值，不能自己累加**。
 *    写成 `current += step` 然后 setInterval 的版本，丢帧就会偏 ——
 *    和倒计时是同一个病。这里的 current 永远由
 *    「起点 + (终点 - 起点) × 缓动(已过时间 / 总时长)」算出来，
 *    丢帧只影响中间某一帧的显示，不影响最终值。
 *
 * 2. **千分位必须在格式化阶段加，不能在插值阶段加**。
 *    对带逗号的字符串做数字运算会得到 NaN，
 *    所以内部只保存裸数字，显示时才交给 format 拼千分位与小数位。
 *
 * 缓动函数提供三种，默认 easeOut：数字滚动天生适合「先快后慢」——
 * 它对应的心理感受是「很快就上去了，然后稳稳停住」。
 * 线性缓动在数字很大时会显得像计数器在匀速空转。
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { raf, cancelRaf } from '../../utils/raf'

defineOptions({
  name: 'cd-count-to',
})

const EASINGS = {
  linear: (t) => t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeIn: (t) => t * t * t,
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
}

const props = defineProps({
  /** 起始值 */
  start: {
    type: Number,
    default: 0,
  },
  /** 结束值 */
  end: {
    type: Number,
    default: 0,
  },
  /** 时长（毫秒） */
  duration: {
    type: Number,
    default: 2000,
  },
  /** 小数位数 */
  decimals: {
    type: Number,
    default: 0,
  },
  /** 千分位分隔符，传空字符串即关闭 */
  separator: {
    type: String,
    default: ',',
  },
  prefix: {
    type: String,
    default: '',
  },
  suffix: {
    type: String,
    default: '',
  },
  /** linear / easeOut / easeIn / easeInOut */
  easing: {
    type: String,
    default: 'easeOut',
  },
  autoplay: {
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

const emit = defineEmits(['start', 'change', 'finish'])

const current = ref(props.start)

let startAt = 0
let frameId = null
let from = props.start

function stop() {
  cancelRaf(frameId)
  frameId = null
}

function format(value) {
  const fixed = Number(value).toFixed(Math.max(0, props.decimals))
  if (!props.separator) return fixed

  const [int, dec] = fixed.split('.')
  /* 从右往左每三位插一个分隔符，用 split/join 而不是正则 ——
     正则的 lookahead 写法在某些小程序 JS 引擎上行为不一致 */
  const chars = int.split('')
  const out = []
  for (let i = 0; i < chars.length; i += 1) {
    out.push(chars[i])
    const left = chars.length - i - 1
    if (left > 0 && left % 3 === 0) out.push(props.separator)
  }
  return dec ? `${out.join('')}.${dec}` : out.join('')
}

const display = computed(() => format(current.value))

function tick() {
  const easing = EASINGS[props.easing] || EASINGS.easeOut
  const elapsed = Date.now() - startAt
  const progress = props.duration > 0 ? Math.min(1, elapsed / props.duration) : 1

  current.value = from + (props.end - from) * easing(progress)
  emit('change', current.value)

  if (progress >= 1) {
    /* 收尾时把值精确落回终值：
       缓动函数在 t=1 处理论上是 1，但浮点误差会留下 0.9999999 这种尾巴 */
    current.value = props.end
    stop()
    emit('finish')
    return
  }
  frameId = raf(tick)
}

function startCount() {
  stop()
  from = props.start
  current.value = from
  startAt = Date.now()
  emit('start')

  if (props.duration <= 0) {
    current.value = props.end
    emit('change', current.value)
    emit('finish')
    return
  }
  frameId = raf(tick)
}

/** 从当前显示值继续滚到 end（适合「刷新数据」时不要从 0 重来） */
function restart() {
  from = current.value
  startAt = Date.now()
  stop()
  emit('start')
  frameId = raf(tick)
}

function pause() {
  stop()
}

watch(
  () => props.end,
  () => {
    if (props.autoplay) startCount()
  }
)

onMounted(() => {
  if (props.autoplay) startCount()
})

onUnmounted(stop)

defineExpose({ restart, pause, start: startCount, current })
</script>

<script>
export default {
  name: 'cd-count-to',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-count-to {
  @include cd-reset;

  display: inline-flex;
  align-items: baseline;
}

.cd-count-to__text {
  display: inline-flex;
  align-items: baseline;
}

.cd-count-to__number {
  font-size: var(--cd-font-size-2xl, 24px);
  font-weight: var(--cd-font-weight-semibold, 600);
  line-height: var(--cd-line-height-tight, 1.25);
  color: var(--cd-text-primary, #0f172a);
  /* 等宽数字：不写的话滚动结束的那一瞬间数字整体宽度会变，
     整行会左右抖一下（和倒计时是同一个问题） */
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

.cd-count-to__affix {
  font-size: var(--cd-font-size-base, 14px);
  line-height: 1;
  color: var(--cd-text-secondary, #64748b);
}
</style>
