<template>
  <view class="cd-count-down" :class="rootClass" :style="customStyle">
    <!-- 作用域插槽逐项列出，不能用 v-bind="parts"：
         小程序编译器不支持在 slot 上做对象展开（会直接报 v-bind="" is not supported） -->
    <slot
      :total="parts.total"
      :days="parts.days"
      :hours="parts.hours"
      :minutes="parts.minutes"
      :seconds="parts.seconds"
      :milliseconds="parts.milliseconds"
      :formatted="formatted"
    >
      <text class="cd-count-down__text">{{ formatted }}</text>
    </slot>
  </view>
</template>

<script setup>
/**
 * cd-count-down —— 倒计时
 * ---------------------------------------------------------------
 * 这里最容易被写错的不是显示，而是**计时方式**。
 *
 * 直觉写法是「每来一次定时器就 remain -= 1000」。
 * 这个写法在真正使用时会累积误差：setInterval 的执行时刻会被主线程
 * 排队、被后台标签页节流（H5 后台只给 1 次/秒甚至更低）、
 * 被小程序的生命周期打断。跑五分钟能偏好几秒，
 * 跑一场直播的秒杀能偏到用户投诉。
 *
 * 正确做法是**锚定一个结束时间戳**，每次 tick 都用
 * `endAt - Date.now()` 重算 —— 定时器只负责「多久看一眼」，
 * 不负责「累加时间」。这样即使丢了几次回调，显示也永远是准的。
 *
 * 小程序端另有一个必须处理的现实：切后台后定时器会被挂起。
 * 因此这里额外提供了 onShow 的同步入口（sync），
 * 由组件的 onShow 钩子里调用，回到前台立刻纠正显示。
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

defineOptions({
  name: 'cd-count-down',
})

const props = defineProps({
  /** 倒计时时长（毫秒） */
  time: {
    type: Number,
    default: 0,
  },
  /** 是否自动开始 */
  autoStart: {
    type: Boolean,
    default: true,
  },
  /**
   * 输出格式。支持 D / DD / H / HH / m / mm / s / ss / S / SS / SSS。
   * 注意 m 是分钟、S 是毫秒 —— 大小写在这里是有语义的。
   */
  format: {
    type: String,
    default: 'HH:mm:ss',
  },
  /** 毫秒级刷新（默认只按秒刷新，省电且不闪） */
  millisecond: {
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

const emit = defineEmits(['change', 'finish'])

const remain = ref(Math.max(0, props.time))
const running = ref(false)

/** 锚定的结束时间戳，是精度的唯一来源 */
let endAt = 0
let timer = null

const pad = (n, len) => String(n).padStart(len, '0')

const parts = computed(() => {
  const total = Math.max(0, remain.value)
  const ms = total % 1000
  const totalSec = Math.floor(total / 1000)

  return {
    total,
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    milliseconds: ms,
  }
})

const formatted = computed(() => {
  const p = parts.value
  const map = {
    D: String(p.days),
    DD: pad(p.days, 2),
    H: String(p.hours),
    HH: pad(p.hours, 2),
    m: String(p.minutes),
    mm: pad(p.minutes, 2),
    s: String(p.seconds),
    ss: pad(p.seconds, 2),
    SSS: pad(p.milliseconds, 3),
    SS: pad(Math.floor(p.milliseconds / 10), 2),
    S: String(Math.floor(p.milliseconds / 100)),
  }
  /* 长 token 必须排在短 token 前面，否则 'HH' 会先被 'H' 吃掉一个字符 */
  return props.format.replace(/DD|D|HH|H|mm|m|ss|s|SSS|SS|S/g, (token) => map[token])
})

function tick() {
  const next = Math.max(0, endAt - Date.now())
  remain.value = next
  emit('change', parts.value)

  if (next <= 0) {
    stopTimer()
    running.value = false
    emit('finish')
  }
}

function startTimer() {
  stopTimer()
  timer = setInterval(tick, props.millisecond ? 30 : 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function start() {
  if (running.value) return
  /* 以「当前显示值」为新的一段时长，这样 pause → start 能接着走完 */
  endAt = Date.now() + Math.max(0, remain.value)
  running.value = true
  startTimer()
  tick()
}

function pause() {
  if (!running.value) return
  stopTimer()
  running.value = false
  remain.value = Math.max(0, endAt - Date.now())
}

function reset(nextTime = props.time) {
  stopTimer()
  running.value = false
  remain.value = Math.max(0, nextTime)
  emit('change', parts.value)
  if (props.autoStart) start()
}

/** 外部唤起时同步一次（小程序 onShow 用） */function sync() {
  if (running.value) tick()
}

watch(
  () => props.time,
  (value) => {
    remain.value = Math.max(0, value)
    if (running.value) {
      endAt = Date.now() + remain.value
      tick()
    }
  }
)

if (props.autoStart) onMounted(start)

onUnmounted(stopTimer)

const rootClass = computed(() => [running.value ? 'cd-count-down--running' : '', props.customClass].filter(Boolean).join(' '))

defineExpose({ start, pause, reset, sync, remain, parts })
</script>

<script>
export default {
  name: 'cd-count-down',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-count-down {
  @include cd-reset;

  display: inline-flex;
  align-items: center;
}

.cd-count-down__text {
  font-size: var(--cd-countdown-font-size, 14px);
  /* 等宽数字 + 表格数字对齐值：不加这个，秒数在 1 和 8 之间跳动时
     整段文字会左右抖一下，看久了非常烦 */
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  line-height: var(--cd-line-height-tight, 1.25);
  color: var(--cd-text-primary, #0f172a);
}
</style>
