<template>
  <view class="cd-qrcode" :class="rootClass" :style="rootStyle" @click="emit('click')">
    <!-- 编码失败（内容过长）时不能画一个扫不出的图，明确报错更有用 -->
    <view v-if="error" class="cd-qrcode__error">
      <slot name="error">
        <text class="cd-qrcode__error-text">{{ errorMessage }}</text>
      </slot>
    </view>

    <view v-else class="cd-qrcode__canvas" :style="canvasStyle">
      <!-- 每段一个节点：同色连续格合并，节点数比「一格一节点」少一半以上 -->
      <view v-for="(run, i) in runs" :key="i" class="cd-qrcode__module" :style="run.style"></view>

      <view v-if="hasIcon" class="cd-qrcode__icon" :style="iconStyle">
        <slot name="icon">
          <image class="cd-qrcode__icon-img" :src="icon" mode="aspectFit" />
        </slot>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-qrcode —— 二维码
 * ---------------------------------------------------------------
 * 两个决定，都是为了「四端都别出岔子」：
 *
 * 1. **不用 canvas 画**。
 *    canvas 在小程序里的层级表现、导出路径、高清屏处理都和 H5 不同
 *    （见 cd-progress 那条结论），引入就要维护两套绘制逻辑。
 *    这里改成**纯 view 节点**：一个同色连续段一个节点，绝对定位。
 *    代价是节点数随内容长度增长（版本 10 的码约 300~600 个），
 *    好处是四端渲染结果完全一致，也不存在层级遮挡问题。
 *
 * 2. **用整数像素排版，不用小数**。
 *    每格宽度 = size / 总格数 几乎一定是小数；小数定位在部分端会出现
 *    「相邻两行之间一条 1px 的白缝」，看起来像蒙了一层网格。
 *    所以坐标一律用 `Math.round(i × 单位)` 推算，宽度 = 后一边 − 前一边 ——
 *    相邻块在整数边界上严丝合缝，既不重叠也不留缝。
 *
 * 静默区（margin）默认是规范要求的 4 格。可以调小，但小于 4 时
 * 部分扫码器会认不出来 —— 这不是渲染问题，是规范里写死的识别条件。
 */
import { computed, ref, watch } from 'vue'
import { encode } from './qr-core'

defineOptions({
  name: 'cd-qrcode',
})

const props = defineProps({
  /** 二维码内容 */
  value: {
    type: String,
    default: '',
  },
  /** 边长（px，含静默区） */
  size: {
    type: Number,
    default: 200,
  },
  /** 纠错档：L 7% / M 15% / Q 25% / H 30%。带中心图标建议 H */
  level: {
    type: String,
    default: 'M',
  },
  /** 静默区格数。规范值 4，调小可能影响识别 */
  margin: {
    type: Number,
    default: 4,
  },
  /** 码点颜色 */
  color: {
    type: String,
    default: '',
  },
  /** 背景色。扫码器依赖明暗对比，别用深色背景配深色码点 */
  backgroundColor: {
    type: String,
    default: '#ffffff',
  },
  /** 中心图标地址，留空则不显示 */
  icon: {
    type: String,
    default: '',
  },
  /** 中心图标边长（px）。留空按 size 的 20% 计算 */
  iconSize: {
    type: Number,
    default: 0,
  },
  /** 中心图标周围的留白底色，避免图标压住码点影响识别 */
  iconBackgroundColor: {
    type: String,
    default: '#ffffff',
  },
  /** 编码失败时的提示文案 */
  errorText: {
    type: String,
    default: '内容过长，无法生成二维码',
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

const emit = defineEmits(['click', 'error'])

const error = ref('')

const rootClass = computed(() => [props.customClass].filter(Boolean).join(' '))

const rootStyle = computed(() => `width:${props.size}px;${props.customStyle}`)

const canvasStyle = computed(
  () =>
    `width:${props.size}px;height:${props.size}px;` +
    `background-color:${props.backgroundColor};` +
    `color:${props.color || 'var(--cd-text-primary, #1e293b)'};`,
)

/**
 * 码点段。编码失败时置空并回传 error 事件 ——
 * 宁可什么都不画，也不画一个扫不出来的图。
 */
const runs = computed(() => {
  if (!props.value) return []
  let result
  try {
    result = encode(props.value, props.level)
  } catch (e) {
    error.value = e.message
    return []
  }
  error.value = ''
  const total = result.size + props.margin * 2
  const unit = Math.max(props.size, 1) / total
  /* 坐标取整：见文件头第 2 条 */
  const at = (i) => Math.round(i * unit)

  const out = []
  for (let y = 0; y < result.size; y += 1) {
    const row = result.modules[y]
    let start = -1
    for (let x = 0; x <= row.length; x += 1) {
      const on = x < row.length && row[x]
      if (on && start < 0) start = x
      if (!on && start >= 0) {
        const left = at(start + props.margin)
        const right = at(x + props.margin)
        const top = at(y + props.margin)
        const bottom = at(y + props.margin + 1)
        out.push({
          style: `left:${left}px;top:${top}px;width:${right - left}px;height:${bottom - top}px;`,
        })
        start = -1
      }
    }
  }
  return out
})

const hasIcon = computed(() => !!props.icon)

const iconStyle = computed(() => {
  const side = props.iconSize || Math.round(props.size * 0.2)
  /* 图标底盘比图标本身大一圈：那圈白边就是「被压住的码点」的替代，
     否则中心图标会破坏定位与数据区，纠错档不够高就扫不出来 */
  return (
    `width:${side}px;height:${side}px;` +
    `background-color:${props.iconBackgroundColor};` +
    `margin-left:-${side / 2}px;margin-top:-${side / 2}px;`
  )
})

watch(
  () => [props.value, props.level],
  () => {
    if (error.value) emit('error', error.value)
  },
)

const errorMessage = computed(() => error.value || props.errorText)
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-qrcode {
  @include cd-reset;

  display: inline-block;
  font-size: 0;
  line-height: 0;
}

.cd-qrcode__canvas {
  position: relative;
  overflow: hidden;
}

/* 码点。颜色走 currentColor，由画布的 color 统一控制 —— 少一个 props 传递 */
.cd-qrcode__module {
  position: absolute;
  background-color: currentColor;
}

/* 中心图标：绝对居中是靠「负 margin = 自身一半」，
   比 top:50% + transform 更稳 —— 部分小程序端对 transform 的支持不一致 */
.cd-qrcode__icon {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--cd-radius-sm, 4px);
}

.cd-qrcode__icon-img {
  width: 100%;
  height: 100%;
}

.cd-qrcode__error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  padding: var(--cd-space-3, 12px);
  background-color: var(--cd-bg-sunken, #f8fafc);
  border-radius: var(--cd-radius-md, 8px);
}

.cd-qrcode__error-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  text-align: center;
}
</style>
