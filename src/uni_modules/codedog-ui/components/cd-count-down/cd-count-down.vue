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
 *
 * 时长常常是异步来的（:time="remainMs"，接口 100ms 后才返回真实值）。
 * 因此「time 从 0 变成正数」必须能把定时器补起来，
 * 而「time 一直是 0」不能误报 finish —— 这两件事见 watch 与 onMounted 处的注释。
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
   *
   * 需要写字面英文时把它放进方括号：`[Ends in] HH:mm:ss`，
   * 否则 Ends 里的 s 会被当成「秒」的 token。
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

/**
 * token → 取值。键的顺序无关，匹配顺序在下面的扫描里显式控制。
 *
 * 注意 m 是分钟、S 是毫秒 —— 大小写在这里是有语义的，
 * 所以这张表不能按「忽略大小写」的方式去匹配。
 */
const TOKENS = {
  D: (p) => String(p.days),
  DD: (p) => pad(p.days, 2),
  H: (p) => String(p.hours),
  HH: (p) => pad(p.hours, 2),
  m: (p) => String(p.minutes),
  mm: (p) => pad(p.minutes, 2),
  s: (p) => String(p.seconds),
  ss: (p) => pad(p.seconds, 2),
  S: (p) => String(Math.floor(p.milliseconds / 100)),
  SS: (p) => pad(Math.floor(p.milliseconds / 10), 2),
  SSS: (p) => pad(p.milliseconds, 3),
}

/**
 * 逐字符扫描而不是一条 replace(/D|H|m|s|S/g)。
 *
 * 用 replace 的写法会把**字面字母一起吃掉**：
 * format="Days: D" 里的 "Days" 中 D 和 s 都会被替换，输出成 "5ay12:"。
 * 只要格式串里出现英文单词（Days / Hours / left / Ends in）就必然踩到。
 *
 * 因此这里改成扫描器，并给出转义约定（与 dayjs 一致）：
 *   - `[...]` 内的内容原样输出，用来写英文等字面文字
 *   - 方括号外的 D/H/m/s/S 才是 token
 * 例：format="[Ends in] HH:mm:ss"
 */
const formatted = computed(() => {
  const p = parts.value
  const src = props.format
  let out = ''
  let i = 0

  while (i < src.length) {
    const ch = src[i]

    /* 字面段：[...] 原样输出；没有配对 ] 时就当普通字符处理，不让半截括号吞掉后面 */
    if (ch === '[') {
      const end = src.indexOf(']', i + 1)
      if (end === -1) {
        out += ch
        i += 1
        continue
      }
      out += src.slice(i + 1, end)
      i = end + 1
      continue
    }

    /* 长 token 必须先匹配，否则 'HH' 会被 'H' 吃掉一个字符 */
    const three = src.slice(i, i + 3)
    if (three === 'SSS') {
      out += TOKENS.SSS(p)
      i += 3
      continue
    }

    const two = src.slice(i, i + 2)
    if (Object.prototype.hasOwnProperty.call(TOKENS, two)) {
      out += TOKENS[two](p)
      i += 2
      continue
    }

    if (Object.prototype.hasOwnProperty.call(TOKENS, ch)) {
      out += TOKENS[ch](p)
      i += 1
      continue
    }

    /* 其余字符（含中文、标点、空格）原样保留 */
    out += ch
    i += 1
  }

  return out
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
  /* 时长为 0 时开始没有意义，只会让 tick() 立刻命中 next<=0 从而误发一次 finish */
  if (Math.max(0, remain.value) <= 0) return
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

/** 外部唤起时同步一次（小程序 onShow 用） */
function sync() {
  if (running.value) tick()
}

watch(
  () => props.time,
  (value) => {
    remain.value = Math.max(0, value)

    if (running.value) {
      endAt = Date.now() + remain.value
      tick()
      return
    }

    /*
     * 时长异步到位是最常见的用法：挂载时 time 还是 0（接口没回来），
     * 定时器压根没起来；100ms 后数据到了，这里必须自己补一次 start。
     * 否则界面会停在 02:00 不再倒数 —— 显示是对的，但计时是死的，
     * 这种「看起来正常其实坏了」的 bug 比直接报错更难发现。
     */
    if (props.autoStart && remain.value > 0) start()
  }
)

/* time=0 时不能在挂载阶段 start：tick() 会立刻判定 next<=0，
   于是倒计时还没开始就先误发一次 finish（业务通常会在这里弹「活动已结束」） */
if (props.autoStart) {
  onMounted(() => {
    if (remain.value > 0) start()
  })
}

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
