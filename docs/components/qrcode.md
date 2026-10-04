---
title: Qrcode 二维码
---

# Qrcode 二维码

<div class="cd-api-tag">`qrcode` · 数据展示</div>

编码核心自研零依赖（版本 1~10 / L M Q H / 字节模式），与 npm qrcode 包逐位比对通过。渲染是纯 view 节点且坐标全部取整，不会出现 1px 白缝。

## 用法

<CdDemo id="qrcode-0"></CdDemo>

```vue // 来自演示页 extended
<view class="row row--gap">
  <view class="qr-box">
    <cd-qrcode value="https://ui.codedog.tech" :size="140" />
    <text class="qr-box__text">默认 M 档</text>
  </view>
  <view class="qr-box">
    <cd-qrcode value="CodeDogUI 跨四端组件库" :size="140" level="H" />
    <text class="qr-box__text">H 档带中文</text>
  </view>
  <view class="qr-box">
    <cd-qrcode value="https://doc.codedog.tech" :size="140" level="Q" :margin="2" />
    <text class="qr-box__text">静默区 2 格</text>
  </view>
</view>

<view class="row">
  <cd-qrcode
    :value="qrText"
    :size="120"
    level="H"
    @click="log('点击了二维码')"
  />
  <cd-input v-model="qrText" class="qr-input" placeholder="改内容试试" />
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `value` | String | `''` | — | 二维码内容 |
| `size` | Number | `200` | — | 边长（px，含静默区） |
| `level` | String | `'M'` | — | 纠错档：L 7% / M 15% / Q 25% / H 30%。带中心图标建议 H |
| `margin` | Number | `4` | — | 静默区格数。规范值 4，调小可能影响识别 |
| `color` | String | `''` | — | 码点颜色 |
| `backgroundColor` | String | `'#ffffff'` | — | 背景色。扫码器依赖明暗对比，别用深色背景配深色码点 |
| `icon` | String | `''` | — | 中心图标地址，留空则不显示 |
| `iconSize` | Number | `0` | — | 中心图标边长（px）。留空按 size 的 20% 计算 |
| `iconBackgroundColor` | String | `'#ffffff'` | — | 中心图标周围的留白底色，避免图标压住码点影响识别 |
| `errorText` | String | `'内容过长，无法生成二维码'` | — | 编码失败时的提示文案 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click` | 点击时触发 |
| `error` | — |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `error` | — | — |
| `icon` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 两个决定，都是为了「四端都别出岔子」： 1. **不用 canvas 画**。
- canvas 在小程序里的层级表现、导出路径、高清屏处理都和 H5 不同 （见 cd-progress 那条结论），引入就要维护两套绘制逻辑。
- 这里改成**纯 view 节点**：一个同色连续段一个节点，绝对定位。
- 代价是节点数随内容长度增长（版本 10 的码约 300~600 个）， 好处是四端渲染结果完全一致，也不存在层级遮挡问题。
- 2. **用整数像素排版，不用小数**。
- 每格宽度 = size / 总格数 几乎一定是小数；小数定位在部分端会出现 「相邻两行之间一条 1px 的白缝」，看起来像蒙了一层网格。
- 所以坐标一律用 `Math.round(i × 单位)` 推算，宽度 = 后一边 − 前一边 —— 相邻块在整数边界上严丝合缝，既不重叠也不留缝。
- 静默区（margin）默认是规范要求的 4 格。
- 可以调小，但小于 4 时 部分扫码器会认不出来 —— 这不是渲染问题，是规范里写死的识别条件。

## 关联

[cd-input](/components/input) · [cd-icon](/components/icon)
