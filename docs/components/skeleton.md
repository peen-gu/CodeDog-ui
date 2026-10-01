---
title: Skeleton 骨架屏
---

# Skeleton 骨架屏

<div class="cd-api-tag">`skeleton` · 数据展示</div>

加载占位，最后一行默认收窄 60% 让轮廓更像真实文本。暗色下必须显式重定义块色——亮色比背景深，暗色要反过来。

## 用法

```vue // 来自演示页 showcase
<view class="row row--baseline">
  <cd-button size="small" @click="skeletonLoading = !skeletonLoading">
    {{ skeletonLoading ? '显示内容' : '显示骨架' }}
  </cd-button>
</view>

<cd-skeleton :loading="skeletonLoading" avatar :rows="3" :row-width="['100%', '92%', '64%']">
  <view class="loaded-block">
    <view class="row row--baseline">
      <cd-avatar text="王五" :size="40" />
      <text class="body-text">真实内容已经渲染出来了</text>
    </view>
  </view>
</cd-skeleton>

<cd-divider position="left">带图片块</cd-divider>

<cd-skeleton image :image-height="120" :rows="2" />

<cd-divider position="left">自定义模板</cd-divider>

<cd-skeleton :loading="true">
  <template #template>
    <view class="row">
      <view class="custom-skeleton custom-skeleton--square" />
      <view class="custom-skeleton custom-skeleton--short" />
    </view>
  </template>
</cd-skeleton>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `loading` | Boolean | `true` | — | 加载中。false 时渲染默认插槽 |
| `animated` | Boolean | `true` | — | 扫光动画。尊重 prefers-reduced-motion，系统开启减弱动效时自动关闭 |
| `rows` | Number | `3` | — | 正文行数（不含标题行） |
| `title` | Boolean | `true` | — | 是否显示标题行（更粗更高的一行） |
| `avatar` | Boolean | `false` | — | 是否显示圆形头像块 |
| `avatarSize` | Number \| String | `40` | — | 头像块尺寸，数字按 px |
| `image` | Boolean | `false` | — | 是否显示顶部图片块 |
| `imageHeight` | Number \| String | `120` | — | 图片块高度，数字按 px |
| `rowWidth` | Array \| String | `() => []` | — | 自定义每行宽度，数组会按 rows 循环取用。 注意：**数字按百分比解释**（写 60 就是 60%）， 因为行宽的意义就是相对宽度；需要绝对宽度请直接写 '120px'。 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

无

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `template` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 两个设计决定值得说明： 1. 动画用「渐变扫光」而不是「透明度呼吸」。
- 呼吸动画的问题是全屏几十个骨架块同时明暗闪动，视觉噪音很大； 扫光是 background-position 位移，感知上更接近「正在加载」。
- 同时用 background-size:400% + 位移动画，实现成本比 SVG 或 canvas 低得多。
- 2. 最后一行默认宽度收窄到 60%。
- 因为真实段落最后一行几乎不会是满行，全部 100% 会让骨架看起来像条形码。
- 这个细节是骨架屏「像不像真实内容」的关键。
- 另外：`loading` 为 false 时直接渲染默认插槽，这样业务可以 `&lt;cd-skeleton :loading="!data">&lt;RealContent />&lt;/cd-skeleton>` 一句话接管两态。

## 关联

[cd-loading](/components/loading)
