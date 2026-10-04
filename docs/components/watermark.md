---
title: Watermark 水印
---

# Watermark 水印

<div class="cd-api-tag">`watermark` · 通用</div>

纯 text 节点平铺，不用 canvas 生成背景图。画布放大倍数由旋转角算出来，而不是硬写 1.5 —— 宽屏上能少铺近一半节点。整层 pointer-events:none，绝不会挡住底下的操作。

## 用法

<CdDemo id="watermark-0"></CdDemo>

```vue // 来自演示页 extended
<view class="watermark-box">
  <cd-watermark
    :content="['CodeDogUI', '内部资料']"
    :gap-x="110"
    :gap-y="70"
    :rotate="-22"
    :fixed="false"
  >
    <view class="watermark-box__inner">
      <text class="watermark-box__text">这块区域被水印覆盖，但下面的按钮照样能点。</text>
      <cd-button size="small" @click="log('水印没挡住点击')">点我试试</cd-button>
    </view>
  </cd-watermark>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `content` | String \| Array | `''` | — | 水印文案，传数组会逐格轮换 |
| `gapX` | Number | `120` | — | 单格宽度（px），也是水平方向的水印间距 |
| `gapY` | Number | `90` | — | 单格高度（px），也是垂直方向的水印间距 |
| `rotate` | Number | `-22` | — | 旋转角度（度） |
| `fontSize` | Number | `13` | — | — |
| `fontColor` | String | `'rgba(15, 23, 42, 0.12)'` | — | — |
| `opacity` | Number | `1` | — | 整层透明度，想更淡就调它而不是改颜色 |
| `fixed` | Boolean | `false` | — | 铺满视口（fixed）。默认铺满父级（absolute，父级需有定位） |
| `zIndex` | Number | `1000` | — | — |
| `width` | Number | `0` | — | 容器宽。留空则实测 |
| `height` | Number | `0` | — | 容器高。留空则实测 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

无

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- **不用 canvas 生成背景图**，理由与 qrcode / signature 一致：canvas 在四端的 导出与层级行为不一致。
- 这里是纯 text 节点平铺： 1. 外层容器负责定位（absolute 铺满父级 或 fixed 铺满视口）与 `pointer-events:none`； 2. 内层「画布」按旋转角放大到刚好盖住容器，再整体 rotate； 3. 画布里按固定尺寸格子平铺文案，格子数与容器尺寸成正比。
- 放大倍数不是拍脑袋写的 1.5，而是按旋转角的几何条件算出来的 —— 一个 w×h 的矩形转 θ 之后要盖住 W×H 的轴对齐矩形，需要 w ≥ W·|cosθ| + H·|sinθ|，h ≥ W·|sinθ| + H·|cosθ| 乘 1.05 留一点余量。
- 硬写 1.5 在宽屏上会多铺近一倍的格子，白费节点。
- 容器尺寸优先用 props，其次实测（createSelectorQuery）， 实测拿到之前先按 320×480 铺一版，避免首帧空白。

## 关联

[cd-card](/components/card)
