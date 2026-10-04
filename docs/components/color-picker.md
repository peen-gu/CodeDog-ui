---
title: ColorPicker 颜色选择器
---

# ColorPicker 颜色选择器

<div class="cd-api-tag">`color-picker` · 表单与录入</div>

HSV 面板 + 色相条 + 透明度，纯 view 实现不用 canvas。输入与面板双向驱动，粘贴任意合法色值都能解析。

## 用法

<CdDemo id="color-picker-0"></CdDemo>

```vue // 来自演示页 extended
<view class="row row--baseline">
  <cd-color-picker v-model="pickedColor" :presets="colorPresets" />
  <view class="swatch" :style="`background-color:${pickedColor};`">
    <text class="swatch__text">{{ pickedColor }}</text>
  </view>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | String | `'#2563eb'` | — | 当前色，#RRGGBB |
| `presets` | Array | `() => [ '#2563eb', '#3b82f6', '#06b6d4', '#10b981', '#22c55e', '#eab308', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b', '#0f172a', ]` | — | 预设色板 |
| `panelHeight` | Number | `160` | — | 面板高度 |
| `showValue` | Boolean | `true` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `value` | `hex` | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- **不用 canvas**（与 cd-progress「不用 canvas」同一条原则）：canvas 在 小程序侧的层级与导出路径和 H5 差异太大，能避开就避开。
- 面板是用两层 CSS 渐变叠出来的，这也是业界通行做法： 底层 = 纯色相 中层 = 白 → 透明（横向）：把饱和度 s 的变化画出来 上层 = 透明 → 黑（纵向）：把明度 v 的变化画出来 于是「点哪儿是哪种颜色」由 CSS 自己算，组件只负责把坐标换算成 hsv。
- 拖动坐标怎么拿： 先在 mounted 里 createSelectorQuery() 量一次面板矩形缓存起来。
- 刻意**不去**每帧量 —— boundingClientRect 是异步的，拖动时每帧都量会 读到上一帧的回调，手指和色块之间会有一帧的错位感。
- 缓存的代价是窗口尺寸变化后要重量，所以改为**每次 touchstart 重新量一次** （拖动过程中仍用缓存值），既准又不会掉帧。

## 关联

[cd-input](/components/input) · [cd-slider](/components/slider)
