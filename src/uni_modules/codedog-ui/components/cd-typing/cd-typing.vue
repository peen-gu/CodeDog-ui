<template>
  <text class="cd-typing" :class="rootClass" :style="customStyle"><text class="cd-typing__text">{{ shown }}</text><text v-if="cursor" class="cd-typing__cursor">|</text></text>
</template>

<script setup>
/**
 * cd-typing —— 打字机 / 流式文本
 * ---------------------------------------------------------------
 * 给「AI 逐字回复」「引导文案逐句出现」这类场景用的一段文字占位器。
 *
 * 三个刻意的设计选择：
 * 1. **用 setTimeout 链而不是 setInterval**。
 *    setInterval 在标签页切到后台时会被节流，恢复后会一次性补帧、连续吐出
 *    一大段；链式 setTimeout 每次只排下一个 tick，最坏情况是「慢一点」，
 *    不会出现「补一大串」的观感断层。
 * 2. **推进用索引而不是字符串拼接**。
 *    索引方案天然支持重置，也避免了中途换文案时「已输出部分」与「新文案」
 *    拼成一串非驴非马的东西。
 * 3. **根节点是 inline 的 text**。
 *    打字机几乎总是嵌在一句话里（「正在加载…」），做成 block 会把整句撑开换行。
 *
 * 文案本身由 props 提供，组件不接管「什么时候该换下一句」这类业务逻辑；
 * 需要手动控制时取实例调 start / stop / reset（见 defineExpose）。
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

defineOptions({
  name: 'cd-typing',
})

const props = defineProps({
  /** 要打出的完整文案 */
  text: {
    type: String,
    default: '',
  },
  /** 每个 tick 的间隔（毫秒） */
  speed: {
    type: Number,
    default: 60,
  },
  /** 每个 tick 推进的字符数。> 1 时更像「流式推送」 */
  chunk: {
    type: Number,
    default: 1,
  },
  /** 是否显示光标 */
  cursor: {
    type: Boolean,
    default: true,
  },
  /** 打完是否回到开头重来 */
  loop: {
    type: Boolean,
    default: false,
  },
  /** 循环时的停顿（毫秒） */
  loopDelay: {
    type: Number,
    default: 1600,
  },
  /** 是否开始打字。置 false 会**停在当前进度**，不是清零 */
  enabled: {
    type: Boolean,
    default: true,
  },
  /** 起步前先空一会儿（毫秒） */
  delay: {
    type: Number,
    default: 0,
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

const emit = defineEmits(['start', 'update', 'finish', 'cycle'])

const index = ref(0)
const running = ref(false)
/** 业务主动 stop 过后，文案变化不应该偷偷自动重启 */
const stoppedByUser = ref(false)
let timer = null

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

/** 单个 tick：推进索引，然后排下一个 */
function tick() {
  clearTimer()
  timer = setTimeout(() => {
    timer = null
    if (!running.value) return

    const next = Math.min(index.value + props.chunk, props.text.length)
    index.value = next
    emit('update', { text: props.text.slice(0, next), index: next, total: props.text.length })

    if (next >= props.text.length) {
      emit('finish', props.text)
      if (props.loop) {
        timer = setTimeout(() => {
          timer = null
          if (!running.value) return
          index.value = 0
          emit('cycle')
          tick()
        }, Math.max(props.loopDelay, 0))
        return
      }
      running.value = false
      return
    }
    tick()
  }, Math.max(props.speed, 0))
}

function start() {
  clearTimer()
  stoppedByUser.value = false
  running.value = true
  emit('start')
  timer = setTimeout(() => {
    timer = null
    if (!running.value) return
    tick()
  }, Math.max(props.delay, 0))
}

function stop() {
  clearTimer()
  stoppedByUser.value = true
  running.value = false
}

function reset() {
  clearTimer()
  index.value = 0
  running.value = false
  emit('update', { text: '', index: 0, total: props.text.length })
}

defineExpose({ start, stop, reset })

/**
 * 文案整体变化必须重置索引：否则新文案比旧文案短时，
 * 已打印长度会超过新文案长度，显示出一串不属于这一句的字。
 */
watch(
  () => props.text,
  () => {
    reset()
    if (props.enabled && !stoppedByUser.value) start()
  },
)

/** enabled 是业务的开关键：置 false 要立刻停在当前进度而不是清零 */
watch(
  () => props.enabled,
  (on) => {
    stoppedByUser.value = false
    if (on) {
      start()
      return
    }
    clearTimer()
    running.value = false
  },
)

/* speed / chunk 只影响节奏，改了要在「正在打」的时候立刻生效 */
watch([() => props.speed, () => props.chunk], () => {
  if (props.enabled && running.value) tick()
})

/* 首个 tick 必须挂在 mounted：
   setup 里 emit 时父组件的监听还没绑上，业务会漏掉第一次事件 */
onMounted(() => {
  if (props.enabled && props.text) start()
})

onUnmounted(clearTimer)

const shown = computed(() => String(props.text || '').slice(0, index.value))
const rootClass = computed(() =>
  [running.value ? 'cd-typing--typing' : '', props.customClass].filter(Boolean).join(' '),
)
</script>

<script>
export default {
  name: 'cd-typing',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-typing {
  @include cd-reset;

  display: inline;
  color: var(--cd-typing-color, inherit);
  font-size: var(--cd-typing-font-size, inherit);
  line-height: var(--cd-line-height-base, 1.6);
}

.cd-typing__text {
  white-space: pre-wrap;
  word-break: break-word;
}

/* 光标用 opacity 动画而不是 visibility / display 切换：
   display 切换会让行高在「有光标 / 无光标」之间抖动，整行文字跟着跳 */
.cd-typing__cursor {
  display: inline-block;
  margin-left: 1px;
  color: var(--cd-typing-cursor-color, var(--cd-color-primary, #2563eb));
  animation: cd-typing-blink 1s steps(1) infinite;
}

@keyframes cd-typing-blink {
  0%,
  50% {
    opacity: 1;
  }
  50.01%,
  100% {
    opacity: 0;
  }
}
</style>
