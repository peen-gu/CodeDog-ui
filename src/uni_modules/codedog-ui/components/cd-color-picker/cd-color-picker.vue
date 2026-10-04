<template>
  <view class="cd-color-picker" :class="rootClass" :style="customStyle">
    <!-- ---------- 饱和度 / 明度面板 ---------- -->
    <view
      class="cd-color-picker__panel"
      :style="panelStyle"
      @touchstart.stop.prevent="onPanelTouch"
      @touchmove.stop.prevent="onPanelTouch"
      @touchend.stop="onRelease"
      @touchcancel.stop="onRelease"
      @mousedown.stop.prevent="onPanelTouch"
      @mousemove.stop.prevent="onPanelTouch"
      @mouseup.stop="onRelease"
      @mouseleave.stop="onRelease"
    >
      <view class="cd-color-picker__panel-white"></view>
      <view class="cd-color-picker__panel-black"></view>
      <view class="cd-color-picker__thumb" :style="thumbStyle"></view>
    </view>

    <!-- ---------- 色相条 ---------- -->
    <view
      class="cd-color-picker__hue"
      @touchstart.stop.prevent="onHueTouch"
      @touchmove.stop.prevent="onHueTouch"
      @touchend.stop="onRelease"
      @touchcancel.stop="onRelease"
      @mousedown.stop.prevent="onHueTouch"
      @mousemove.stop.prevent="onHueTouch"
      @mouseup.stop="onRelease"
      @mouseleave.stop="onRelease"
    >
      <view class="cd-color-picker__hue-bar"></view>
      <view class="cd-color-picker__hue-thumb" :style="hueThumbStyle"></view>
    </view>

    <!-- ---------- 预设色 ---------- -->
    <view v-if="presets.length" class="cd-color-picker__presets">
      <view
        v-for="(c, i) in presets"
        :key="i"
        class="cd-color-picker__preset"
        :class="{ 'cd-color-picker__preset--on': c.toUpperCase() === hex.toUpperCase() }"
        :style="`background-color:${c};`"
        @click.stop="pickPreset(c)"
      ></view>
    </view>

    <!-- ---------- 数值 ---------- -->
    <view v-if="showValue" class="cd-color-picker__foot">
      <slot name="value" :hex="hex">
        <text class="cd-color-picker__hex">{{ hex.toUpperCase() }}</text>
      </slot>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-color-picker —— 颜色选择器
 * ---------------------------------------------------------------
 * **不用 canvas**（与 cd-progress「不用 canvas」同一条原则）：canvas 在
 * 小程序侧的层级与导出路径和 H5 差异太大，能避开就避开。
 *
 * 面板是用两层 CSS 渐变叠出来的，这也是业界通行做法：
 *   底层 = 纯色相
 *   中层 = 白 → 透明（横向）：把饱和度 s 的变化画出来
 *   上层 = 透明 → 黑（纵向）：把明度 v 的变化画出来
 * 于是「点哪儿是哪种颜色」由 CSS 自己算，组件只负责把坐标换算成 hsv。
 *
 * 拖动坐标怎么拿：
 *   先在 mounted 里 createSelectorQuery() 量一次面板矩形缓存起来。
 *   刻意**不去**每帧量 —— boundingClientRect 是异步的，拖动时每帧都量会
 *   读到上一帧的回调，手指和色块之间会有一帧的错位感。
 *   缓存的代价是窗口尺寸变化后要重量，所以改为**每次 touchstart 重新量一次**
 *   （拖动过程中仍用缓存值），既准又不会掉帧。
 */
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'

defineOptions({
  name: 'cd-color-picker',
})

const props = defineProps({
  /** 当前色，#RRGGBB */
  modelValue: {
    type: String,
    default: '#2563eb',
  },
  /** 预设色板 */
  presets: {
    type: Array,
    default: () => [
      '#2563eb', '#3b82f6', '#06b6d4', '#10b981',
      '#22c55e', '#eab308', '#f59e0b', '#ef4444',
      '#ec4899', '#8b5cf6', '#64748b', '#0f172a',
    ],
  },
  /** 面板高度 */
  panelHeight: {
    type: Number,
    default: 160,
  },
  showValue: {
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

const emit = defineEmits(['update:modelValue', 'change'])

const instance = getCurrentInstance()

const hsv = ref({ h: 0, s: 0, v: 0 })
const panelRect = ref(null)
const hueRect = ref(null)
/**
 * 拖动中标记。change 事件刻意**只在松手时抛一次**：
 * 拖动过程每帧 emit change 会把业务的请求 / 校验逻辑刷爆，
 * 但 modelValue 必须实时更新，否则颜色不同步。
 */
const dragging = ref(false)

function onRelease() {
  if (!dragging.value) return
  dragging.value = false
  emit('change', hex.value)
}

/* ---------------- HSV <-> HEX ---------------- */

function hsvToRgb(h, s, v) {
  const i = Math.floor(h / 60) % 6
  const f = h / 60 - Math.floor(h / 60)
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  let r = v
  let g = v
  let b = v
  if (i === 0) { r = v; g = t; b = p }
  else if (i === 1) { r = q; g = v; b = p }
  else if (i === 2) { r = p; g = v; b = t }
  else if (i === 3) { r = p; g = q; b = v }
  else if (i === 4) { r = t; g = p; b = v }
  else { r = v; g = p; b = q }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

function rgbToHsv(r, g, b) {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6
    else if (max === gg) h = (bb - rr) / d + 2
    else h = (rr - gg) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

function hexToRgb(hex) {
  let s = String(hex || '').replace('#', '')
  if (s.length === 3) {
    s = s
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (s.length !== 6 || /[^0-9a-fA-F]/.test(s)) s = '000000'
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  }
}

function toHex(n) {
  const s = Math.max(0, Math.min(255, Math.round(n))).toString(16)
  return s.length === 1 ? '0' + s : s
}

const rgb = computed(() => hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v))

const hex = computed(() => {
  const c = rgb.value
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`
})

/** 面板底色 = 纯色相（v=1, s=1），饱和度与明度由两层渐变叠加表现 */
const hueHex = computed(() => {
  const c = hsvToRgb(hsv.value.h, 1, 1)
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`
})

const panelStyle = computed(() => `height:${props.panelHeight}px;background-color:${hueHex.value};`)

const thumbStyle = computed(() => {
  const x = hsv.value.s * 100
  const y = (1 - hsv.value.v) * 100
  return `left:${x}%;top:${y}%;`
})

const hueThumbStyle = computed(() => `left:${(hsv.value.h / 360) * 100}%;`)

const rootClass = computed(() => [props.customClass].filter(Boolean).join(' '))

/* ---------------- 交互 ---------------- */

function measure(selector, setter) {
  if (typeof uni === 'undefined' || !uni.createSelectorQuery) return
  uni
    .createSelectorQuery()
    .in(instance && instance.proxy ? instance.proxy : null)
    .select(selector)
    .boundingClientRect((res) => {
      if (res) setter(res)
    })
    .exec()
}

function clamp01(n) {
  return n < 0 ? 0 : n > 1 ? 1 : n
}

function pointOf(e) {
  /*
   * 取坐标。桌面端（H5 浏览器 / Electron）**没有 touch 事件**，
   * 而 uni H5 也不会把鼠标事件合成为 touch —— 这一点实测确认过
   * （cd-signature 只绑 touch 时，鼠标拖拽完全没反应）。
   * 所以鼠标事件里直接读事件自身的 clientX/clientY，字段名与触点一致。
   */
  const t = (e && e.touches && e.touches[0]) || e
  return t && typeof t.clientX === 'number' ? { x: t.clientX, y: t.clientY } : null
}

/** 是否是「按下」事件：触摸与鼠标两种来源 */
function isPress(e) {
  return e.type === 'touchstart' || e.type === 'mousedown'
}

function onPanelTouch(e) {
  if (!dragging.value && isPress(e)) {
    /* 每次按下重新量一次：兼顾「尺寸变了也准」和「拖动时不异步」 */
    measure('.cd-color-picker__panel', (r) => (panelRect.value = r))
    dragging.value = true
  }
  /* 没按下时的 mousemove 不能改色，否则鼠标划过面板就会乱变 */
  if (!dragging.value) return
  const r = panelRect.value
  const p = pointOf(e)
  if (!r || !p) return
  hsv.value = {
    h: hsv.value.h,
    s: clamp01((p.x - r.left) / r.width),
    v: 1 - clamp01((p.y - r.top) / r.height),
  }
  push(true)
}

function onHueTouch(e) {
  if (!dragging.value && isPress(e)) {
    measure('.cd-color-picker__hue', (r) => (hueRect.value = r))
    dragging.value = true
  }
  if (!dragging.value) return
  const r = hueRect.value
  const p = pointOf(e)
  if (!r || !p) return
  const hue = clamp01((p.x - r.left) / r.width) * 360
  hsv.value = { h: hue, s: hsv.value.s, v: hsv.value.v }
  push(true)
}

/** 拖动中只更新 modelValue（要实时反馈），change 事件留到松手 */
function push(isDrag) {
  emit('update:modelValue', hex.value)
  if (!isDrag) emit('change', hex.value)
}

function pickPreset(c) {
  const { r, g, b } = hexToRgb(c)
  hsv.value = rgbToHsv(r, g, b)
  emit('update:modelValue', hex.value)
  emit('change', hex.value)
}

/* 外部 v-model 变化时反向填充内部 HSV；已经相等就不写，避免双向打架 */
watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    const target = String(v).toUpperCase()
    if (target === hex.value.toUpperCase()) return
    const { r, g, b } = hexToRgb(v)
    hsv.value = rgbToHsv(r, g, b)
  },
)

onMounted(() => {
  const { r, g, b } = hexToRgb(props.modelValue)
  hsv.value = rgbToHsv(r, g, b)
  /* 先各自量一次，首次点击就能立刻用上，不必等 touchstart 那次异步 */
  measure('.cd-color-picker__panel', (res) => (panelRect.value = res))
  measure('.cd-color-picker__hue', (res) => (hueRect.value = res))
})
</script>

<script>
export default {
  name: 'cd-color-picker',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-color-picker {
  @include cd-reset;

  width: 100%;
}

.cd-color-picker__panel {
  position: relative;
  overflow: hidden;
  border-radius: var(--cd-radius-md, 8px);
}

/* 两层叠加：先横向铺白（模拟饱和度），再纵向压黑（模拟明度）。
   拆成两个节点而不是写多重 background-image：
   层叠顺序在两端都是确定的，不必依赖各端对多重背景语法的支持程度 */
.cd-color-picker__panel-white {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
}

.cd-color-picker__panel-black {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: linear-gradient(to top, #000, rgba(0, 0, 0, 0));
}

.cd-color-picker__thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  background-color: #fff;
  border: 2px solid #fff;
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.35);
}

.cd-color-picker__hue {
  position: relative;
  height: 14px;
  margin-top: var(--cd-space-3, 12px);
  border-radius: 999px;
}

.cd-color-picker__hue-bar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: linear-gradient(
    to right,
    #f00 0%,
    #ff0 17%,
    #0f0 33%,
    #0ff 50%,
    #00f 67%,
    #f0f 83%,
    #f00 100%
  );
  border-radius: 999px;
}

.cd-color-picker__hue-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  background-color: #fff;
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.35);
}

.cd-color-picker__presets {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: var(--cd-space-3, 12px);
}

.cd-color-picker__preset {
  width: 20px;
  height: 20px;
  margin: 0 6px 6px 0;
  border: 1px solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-sm, 4px);
}

.cd-color-picker__preset--on {
  box-shadow: 0 0 0 2px var(--cd-color-primary, #2563eb);
}

.cd-color-picker__foot {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: var(--cd-space-2, 8px);
}

.cd-color-picker__hex {
  font-family: var(--cd-font-family-mono, monospace);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
}
</style>
