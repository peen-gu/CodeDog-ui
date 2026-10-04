<template>
  <view class="cd-signature" :class="rootClass" :style="customStyle">
    <view
      class="cd-signature__stage"
      :style="stageStyle"
      @touchstart.stop.prevent="onStart"
      @touchmove.stop.prevent="onMove"
      @touchend.stop="onEnd"
      @touchcancel.stop="onEnd"
      @mousedown.stop.prevent="onStart"
      @mousemove.stop.prevent="onMove"
      @mouseup.stop="onEnd"
      @mouseleave.stop="onEnd"
    >
      <!-- 已完成的笔画：每笔一个节点，互不重建 -->
      <view
        v-for="(s, i) in committed"
        :key="i"
        class="cd-signature__layer"
        :style="layerStyle(s)"
      ></view>

      <!-- 正在画的这一笔：唯一频繁重建的节点 -->
      <view v-if="drawing.length" class="cd-signature__layer" :style="layerStyle(drawing)"></view>

      <view v-if="isEmpty" class="cd-signature__hint">
        <text class="cd-signature__hint-text">{{ placeholder }}</text>
      </view>
    </view>

    <view v-if="showToolbar" class="cd-signature__bar">
      <cd-button size="small" plain @click.stop="undo">{{ undoText }}</cd-button>
      <cd-button class="cd-signature__bar-btn" size="small" plain @click.stop="clear">{{
        clearText
      }}</cd-button>
      <cd-button class="cd-signature__bar-btn" size="small" type="primary" @click.stop="confirm">{{
        confirmText
      }}</cd-button>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-signature —— 手写签名
 * ---------------------------------------------------------------
 * **不用 canvas**，理由与 cd-progress 一致（收录进 README 的那条）：
 * canvas 在小程序里的层级表现、导出路径、高清屏处理都和 H5 不同，
 * 一旦引入，同一个组件就要维护两套绘制逻辑。
 *
 * 替代方案：**把笔画拼成 SVG，再以内联 data URI 交给背景图渲染**。
 * 这正是 cd-icon 已经在用的方式（见 icons.js 的 buildIconUri），
 * 所以「这份写法在四端能不能显示」这个问题，仓库里已经有答案了。
 *
 * 性能上唯一要当心的是：每次移动都要重新编码一遍 SVG 字符串。
 * 所以把「已完成的笔画」与「正在画的这一笔」拆成两组节点 ——
 * 手指移动只重建当前笔画那一层，历史笔画的原样留着不动。
 * 否则每帧都要把全部笔画重新拼一遍字符串，笔画一多就是 O(n²)。
 */
import { computed, getCurrentInstance, onMounted, ref } from 'vue'

defineOptions({
  name: 'cd-signature',
})

const props = defineProps({
  /** 画布宽度，空则撑满父级（背景图模式需要确定像素宽，故内部会量一次） */
  width: {
    type: Number,
    default: 0,
  },
  height: {
    type: Number,
    default: 180,
  },
  /** 笔迹颜色 */
  color: {
    type: String,
    default: '#1e293b',
  },
  /** 笔迹粗细 */
  strokeWidth: {
    type: Number,
    default: 3,
  },
  backgroundColor: {
    type: String,
    default: '#ffffff',
  },
  placeholder: {
    type: String,
    default: '请在此签名',
  },
  showToolbar: {
    type: Boolean,
    default: true,
  },
  undoText: {
    type: String,
    default: '撤销',
  },
  clearText: {
    type: String,
    default: '清空',
  },
  confirmText: {
    type: String,
    default: '确认',
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

const emit = defineEmits(['start', 'end', 'clear', 'undo', 'change', 'confirm'])

const instance = getCurrentInstance()

/** 已完成的笔画（每笔一组点） */
const committed = ref([])
/** 正在画的一笔 */
const drawing = ref([])
const boxWidth = ref(props.width || 0)
let rect = null
let dirty = false
/** 是否处于「按住」状态：触摸端由 touchstart 置位，桌面端由 mousedown 置位 */
let pressing = false

const isEmpty = computed(() => !committed.value.length && !drawing.value.length)

const rootClass = computed(() => [props.customClass].filter(Boolean).join(' '))

const stageStyle = computed(
  () => `height:${props.height}px;background-color:${props.backgroundColor};`,
)

/**
 * 一层背景 = 一组点。
 * 单点时用 circle 而不是只有一段的路径：否则「点一下」什么也画不出来，
 * 而签名里点个点表示句号 / 顿号是很常见的。
 */
function layerStyle(points) {
  return `background-image:url("${buildUri(points)}");`
}

function buildUri(points) {
  const w = Math.max(boxWidth.value, 1)
  const h = Math.max(props.height, 1)
  const body = pointsToSvgBody(points)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    body +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function pointsToSvgBody(points) {
  if (!points.length) return ''
  if (points.length === 1) {
    const p = points[0]
    return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(props.strokeWidth / 2).toFixed(1)}" fill="${props.color}"/>`
  }
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  return (
    `<path d="${d}" fill="none" stroke="${props.color}" stroke-width="${props.strokeWidth}"` +
    ` stroke-linecap="round" stroke-linejoin="round"/>`
  )
}

/** 整幅签名的 SVG：给业务拿去存文件或生成图片，免去再画一遍 */
function toSvg() {
  const w = Math.max(boxWidth.value, 1)
  const h = Math.max(props.height, 1)
  let body = ''
  for (const s of committed.value) body += pointsToSvgBody(s)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="${props.backgroundColor}"/>` +
    body +
    `</svg>`
  )
}

function measure() {
  if (props.width) return
  if (typeof uni === 'undefined' || !uni.createSelectorQuery) return
  uni
    .createSelectorQuery()
    .in(instance && instance.proxy ? instance.proxy : null)
    .select('.cd-signature__stage')
    .boundingClientRect((res) => {
      if (res && res.width) boxWidth.value = res.width
    })
    .exec()
}

/**
 * 取触点坐标。**必须兼容鼠标事件**：
 * 模板同时绑了 touch* 与 mouse*，原因是桌面端（H5 浏览器 / Electron / 桌面小程序）
 * 根本没有 touch 事件 —— 只绑 touch 的话，桌面用户会发现签名板点了没反应，
 * 而这恰恰是「跨四端」里的一端。两边字段名一样（clientX/clientY），
 * 所以只需要在拿不到 touches 时回退到事件本身。
 */
function pointOf(e) {
  const t = (e && e.touches && e.touches[0]) || e
  if (!t || !rect || typeof t.clientX !== 'number') return null
  /* 先算绝对坐标再减 rect —— 不依赖事件里的 offsetX/offsetY，
     这两个字段在小程序端不可靠 */
  return { x: t.clientX - rect.left, y: t.clientY - rect.top }
}

function onStart(e) {
  pressing = true
  /* 每一笔开始都重新量一次：旋屏 / 布局变化后坐标才不会整体偏移 */
  if (typeof uni !== 'undefined' && uni.createSelectorQuery) {
    uni
      .createSelectorQuery()
      .in(instance && instance.proxy ? instance.proxy : null)
      .select('.cd-signature__stage')
      .boundingClientRect((res) => {
        if (res && res.width) boxWidth.value = res.width
        rect = res
      })
      .exec()
  }
  const p = pointOf(e)
  /* 第一帧量不到 rect（首次触摸时 rect 还没回来）就先落下空的一笔：
     后续 onMove 会补上第一个点，不能让整笔丢掉。
     这个分支在真机首触时很常见，早期实现直接 return 掉了第一次签名。 */
  drawing.value = p ? [p] : []
  emit('start')
}

function onMove(e) {
  /* 桌面端的 mousemove 在没按下时也会触发，必须用 pressing 挡住，
     否则鼠标划过签名板就会留下墨迹 */
  if (!pressing) return
  const p = pointOf(e)
  if (!p) return
  if (!drawing.value.length) {
    drawing.value = [p]
    return
  }
  const last = drawing.value[drawing.value.length - 1]
  /* 采样节流：小于 1.5px 的位移肉眼无差别，但会白长一串节点
     并让 SVG 字符串线性膨胀 */
  if (Math.abs(p.x - last.x) < 1.5 && Math.abs(p.y - last.y) < 1.5) return
  drawing.value = [...drawing.value, p]
}

function onEnd() {
  pressing = false
  if (!drawing.value.length) return
  committed.value = [...committed.value, drawing.value]
  drawing.value = []
  dirty = true
  emit('end', { strokes: committed.value.length })
  emit('change', { strokes: committed.value.length })
}

function undo() {
  if (drawing.value.length) {
    drawing.value = []
    return
  }
  if (!committed.value.length) return
  committed.value = committed.value.slice(0, -1)
  emit('undo', { strokes: committed.value.length })
  emit('change', { strokes: committed.value.length })
}

function clear() {
  committed.value = []
  drawing.value = []
  dirty = true
  emit('clear')
  emit('change', { strokes: 0 })
}

function confirm() {
  if (isEmpty.value) return
  emit('confirm', { svg: toSvg(), strokes: committed.value.length })
}

defineExpose({
  toSvg,
  clear,
  undo,
  isEmpty: () => isEmpty.value,
  getStrokes: () => [...committed.value],
  /** 业务有时只想知道「画过没有」再决定能不能提交 */
  isDirty: () => dirty,
})

onMounted(measure)
</script>

<script>
export default {
  name: 'cd-signature',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-signature {
  @include cd-reset;

  width: 100%;
}

.cd-signature__stage {
  position: relative;
  width: 100%;
  overflow: hidden;
  border: var(--cd-border-width, 1px) dashed var(--cd-border-color-strong, #cbd5e1);
  border-radius: var(--cd-radius-md, 8px);
}

.cd-signature__layer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.cd-signature__hint {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cd-signature__hint-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-tertiary, #94a3b8);
}

.cd-signature__bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  margin-top: var(--cd-space-3, 12px);
}

.cd-signature__bar-btn {
  margin-left: var(--cd-space-2, 8px);
}
</style>
