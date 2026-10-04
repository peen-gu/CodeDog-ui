---
title: Divider 分割线
---

# Divider 分割线

<div class="cd-api-tag">`divider` · 通用</div>

水平/垂直双向、支持中间标题与虚线。用 border 画线，因此切换 dashed 只是换一个 border-style。

## 用法

<CdDemo id="divider-0"></CdDemo>

```vue // 来自演示页 showcase
<cd-divider />

<cd-divider>居中文字</cd-divider>

<cd-divider position="left">左对齐</cd-divider>

<cd-divider position="right" dashed>右对齐虚线</cd-divider>

<view class="row row--baseline">
  <text class="body-text">文本</text>
  <cd-divider direction="vertical" />
  <text class="body-text">链接</text>
  <cd-divider direction="vertical" />
  <text class="body-text">更多</text>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `direction` | String | `'horizontal'` | — | horizontal / vertical |
| `position` | String | `'center'` | — | 文字位置：left / center / right |
| `dashed` | Boolean | `false` | — | 虚线 |
| `spacing` | String \| Number | `''` | — | 上下（水平线）或左右（垂直线）留白，数字按 px |
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

- 结构上只有一个小技巧：无内容时只渲染「后置线」。
- 因为后置线是 flex:1，单独存在时自然铺满整行 —— 不需要为「纯线条」再写一套分支。
- 用 border 而不是 background 画线：这样 dashed / solid 只需要换 border-style，不用引入 repeating-linear-gradient（小程序 WebView 对 渐变的支持虽好，但虚线渐变在缩放时会糊）。
