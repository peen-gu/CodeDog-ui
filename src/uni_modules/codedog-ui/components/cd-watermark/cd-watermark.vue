<template>
  <view class="cd-watermark" :class="rootClass" :style="rootStyle">
    <view class="cd-watermark__layer" :style="layerStyle">
      <view v-for="(row, ri) in tiles" :key="ri" class="cd-watermark__row" :style="rowStyle">
        <view v-for="(cell, ci) in row" :key="ci" class="cd-watermark__cell" :style="cellStyle">
          <text class="cd-watermark__text" :style="textStyle">{{ cell }}</text>
        </view>
      </view>
    </view>
    <slot />
  </view>
</template>

<script setup>
/**
 * cd-watermark —— 水印
 * ---------------------------------------------------------------
 * **不用 canvas 生成背景图**，理由与 qrcode / signature 一致：canvas 在四端的
 * 导出与层级行为不一致。这里是纯 text 节点平铺：
 *
 *   1. 外层容器负责定位（absolute 铺满父级 或 fixed 铺满视口）与 `pointer-events:none`；
 *   2. 内层「画布」按旋转角放大到刚好盖住容器，再整体 rotate；
 *   3. 画布里按固定尺寸格子平铺文案，格子数与容器尺寸成正比。
 *
 * 放大倍数不是拍脑袋写的 1.5，而是按旋转角的几何条件算出来的 ——
 * 一个 w×h 的矩形转 θ 之后要盖住 W×H 的轴对齐矩形，需要
 *   w ≥ W·|cosθ| + H·|sinθ|，h ≥ W·|sinθ| + H·|cosθ|
 * 乘 1.05 留一点余量。硬写 1.5 在宽屏上会多铺近一倍的格子，白费节点。
 *
 * 容器尺寸优先用 props，其次实测（createSelectorQuery），
 * 实测拿到之前先按 320×480 铺一版，避免首帧空白。
 */
import { computed, getCurrentInstance, onMounted, ref } from 'vue'
import { getSystemInfo } from '../../composables/use-platform'

defineOptions({
  name: 'cd-watermark',
})

const props = defineProps({
  /** 水印文案，传数组会逐格轮换 */
  content: {
    type: [String, Array],
    default: '',
  },
  /** 单格宽度（px），也是水平方向的水印间距 */
  gapX: {
    type: Number,
    default: 120,
  },
  /** 单格高度（px），也是垂直方向的水印间距 */
  gapY: {
    type: Number,
    default: 90,
  },
  /** 旋转角度（度） */
  rotate: {
    type: Number,
    default: -22,
  },
  fontSize: {
    type: Number,
    default: 13,
  },
  fontColor: {
    type: String,
    default: 'rgba(15, 23, 42, 0.12)',
  },
  /** 整层透明度，想更淡就调它而不是改颜色 */
  opacity: {
    type: Number,
    default: 1,
  },
  /** 铺满视口（fixed）。默认铺满父级（absolute，父级需有定位） */
  fixed: {
    type: Boolean,
    default: false,
  },
  zIndex: {
    type: Number,
    default: 1000,
  },
  /** 容器宽。留空则实测 */
  width: {
    type: Number,
    default: 0,
  },
  /** 容器高。留空则实测 */
  height: {
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

const instance = getCurrentInstance()

/** 实测前的兜底尺寸：先铺一版，别让首帧空着 */
const measured = ref({ width: 0, height: 0 })

const list = computed(() => {
  const c = props.content
  if (!c) return []
  return Array.isArray(c) ? c.filter(Boolean) : [c]
})

const boxW = computed(() => props.width || measured.value.width || 320)
const boxH = computed(() => props.height || measured.value.height || 480)

const rootClass = computed(() => [props.customClass].filter(Boolean).join(' '))

const rootStyle = computed(
  () =>
    `z-index:${props.zIndex};opacity:${props.opacity};` +
    (props.fixed ? 'position:fixed;' : '') +
    props.customStyle,
)

/** 旋转后仍要盖住容器所需的最小画布尺寸（见文件头几何说明） */
const layer = computed(() => {
  const rad = (props.rotate * Math.PI) / 180
  const c = Math.abs(Math.cos(rad))
  const s = Math.abs(Math.sin(rad))
  const pad = 1.05
  return {
    width: Math.ceil((boxW.value * c + boxH.value * s) * pad),
    height: Math.ceil((boxW.value * s + boxH.value * c) * pad),
  }
})

const layerStyle = computed(() => {
  const { width, height } = layer.value
  return (
    `width:${width}px;height:${height}px;` +
    /* 居中偏移 = 自身一半，配合 left/top 50% 与负 margin；
       不用 transform 做居中 —— 那会和 rotate 抢同一个 transform 属性 */
    `margin-left:-${Math.round(width / 2)}px;margin-top:-${Math.round(height / 2)}px;` +
    `transform:rotate(${props.rotate}deg);`
  )
})

const rowStyle = computed(() => `height:${props.gapY}px;`)
const cellStyle = computed(() => `width:${props.gapX}px;height:${props.gapY}px;`)
const textStyle = computed(() => `font-size:${props.fontSize}px;color:${props.fontColor};`)

/** 平铺格子。行列数按画布尺寸算，宁可多一列也不要露出空白角 */
const tiles = computed(() => {
  const items = list.value
  if (!items.length) return []
  const cols = Math.ceil(layer.value.width / Math.max(props.gapX, 1)) + 1
  const rows = Math.ceil(layer.value.height / Math.max(props.gapY, 1)) + 1
  const out = []
  for (let r = 0; r < rows; r += 1) {
    const row = []
    for (let c = 0; c < cols; c += 1) {
      row.push(items[(r * cols + c) % items.length])
    }
    out.push(row)
  }
  return out
})

function measure() {
  return new Promise((resolve) => {
    if (typeof uni === 'undefined' || !uni.createSelectorQuery) return resolve(null)
    /* .in(instance) 是必须的：页面里有多个水印时，不带 in 会全选到第一个 */
    uni
      .createSelectorQuery()
      .in(instance)
      .select('.cd-watermark')
      .boundingClientRect((rect) => resolve(rect || null))
      .exec()
  })
}

onMounted(async () => {
  if (props.width && props.height) return
  if (props.fixed) {
    const info = getSystemInfo()
    measured.value = {
      width: info.windowWidth || 0,
      height: info.windowHeight || 0,
    }
    return
  }
  const rect = await measure()
  if (rect && rect.width) {
    measured.value = { width: Math.round(rect.width), height: Math.round(rect.height) }
  }
})
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-watermark {
  @include cd-reset;

  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  /* 水印绝不能挡住底下的操作，这条比什么都重要 */
  pointer-events: none;
}

.cd-watermark__layer {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
}

.cd-watermark__row {
  display: flex;
  flex-direction: row;
  /* 用负 margin 抵消首尾格子的外边距不是好办法（WXSS 不支持 :last-child），
     所以格子不加 margin，间距完全由格子尺寸提供 —— 见 gapX / gapY */
  flex-wrap: nowrap;
}

.cd-watermark__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.cd-watermark__text {
  /* 不换行：水印换行会把节奏打乱，宁可让它溢出格子 */
  white-space: nowrap;
  user-select: none;
}
</style>
