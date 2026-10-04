---
title: Row 行
---

# Row 行

<div class="cd-api-tag">`row` · 布局与容器</div>

24 栅格的行容器，与 cd-col 配合使用。栅格宽度在编译期算成百分比，不赌小程序的 calc 除法；响应式走媒体查询类而非 JS。

## 用法

<CdDemo id="row-0"></CdDemo>

```vue // 来自演示页 components
<cd-row :gutter="[16, 16]">
  <cd-col v-for="n in 4" :key="`a-${n}`" :span="{ xs: 24, sm: 12, md: 6 }">
    <view class="grid-box"><text class="grid-box__text">xs24 / sm12 / md6</text></view>
  </cd-col>
</cd-row>

<cd-row :gutter="[16, 16]" class="grid-gap-top">
  <cd-col :span="8"><view class="grid-box grid-box--brand"><text class="grid-box__text">span 8</text></view></cd-col>
  <cd-col :span="8"><view class="grid-box"><text class="grid-box__text">span 8</text></view></cd-col>
  <cd-col :span="8"><view class="grid-box grid-box--brand"><text class="grid-box__text">span 8</text></view></cd-col>
</cd-row>

<cd-row :gutter="[16, 16]" class="grid-gap-top">
  <cd-col :span="6" :offset="6">
    <view class="grid-box grid-box--soft"><text class="grid-box__text">span 6 + offset 6</text></view>
  </cd-col>
  <cd-col :span="6"><view class="grid-box"><text class="grid-box__text">span 6</text></view></cd-col>
</cd-row>

<cd-row :gutter="[16, 16]" justify="between" class="grid-gap-top">
  <cd-col :span="6"><view class="grid-box"><text class="grid-box__text">between</text></view></cd-col>
  <cd-col :span="6"><view class="grid-box"><text class="grid-box__text">between</text></view></cd-col>
  <cd-col :span="6"><view class="grid-box"><text class="grid-box__text">between</text></view></cd-col>
</cd-row>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `gutter` | Number \| String \| Array | `0` | — | 列间距。数字表示水平间距； 数组 [水平, 垂直] 可分别控制两个方向（垂直间距在换行时生效） 负数是非法的：它会让「行的负外扩」变成正外扩、列的 padding 变成负值 （负 padding 浏览器直接忽略），整个栅格往一边歪且看不出原因。 这里在 prop 校验期告警、在计算期钳到 0，两层都不放过。 |
| `justify` | String | `'start'` | — | start / center / end / between / around |
| `align` | String | `'top'` | — | top / middle / bottom / stretch |
| `wrap` | Boolean | `true` | — | 是否允许换行 |
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

- 为什么用「行负边距 + 列内边距」这种经典方案，而不是 flex 的 gap： 1. gap 的百分比语义在两端不一致，且老版本小程序 WebView 对 flex gap 支持不全； 2. 行负边距方案能让最左、最右两列的边缘与容器对齐 —— 这是栅格必须满足的硬要求， 用 gap 的话内容会比容器窄 一个 gutter，视觉上缩进不齐。
- gutter 通过 CSS 变量下发到列，因此「列」不需要知道 gutter 是多少， 也就避免了父传子的 props 透传。

## 关联

[cd-col](/components/col)
