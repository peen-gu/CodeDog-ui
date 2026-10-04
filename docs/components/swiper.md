---
title: Swiper 轮播
---

# Swiper 轮播

<div class="cd-api-tag">`swiper` · 数据展示</div>

底层是 uni 原生 swiper（手感与惯性由端上保证），上层补一层统一的设计语言：指示点样式、桌面形态的左右翻页箭头、list 既接受 { image, text } 也接受纯图片地址。autoplay 由组件内部按 visible 状态自行启停，避免页面切走后定时器还在跑。

## 用法

<CdDemo id="swiper-0"></CdDemo>

```vue // 来自演示页 showcase
<cd-swiper :list="swiperList" :height="220" autoplay circular @change="onSwiperChange" />
<view class="result">
  <text class="result__label">当前第</text>
  <text class="result__value">{{ swiperIndex + 1 }} / {{ swiperList.length }} 张</text>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `list` | Array | `() => []` | — | 轮播数据。每项形如 { image, text, ...任意字段 }；传字符串时按图片地址处理。不给默认插槽时用 image / text 做默认渲染 |
| `current` | Number | `0` | — | 当前下标，支持 v-model:current |
| `height` | String \| Number | `''` | — | 轮播高度，数字按 px 处理；不传时取 var(--cd-swiper-height) |
| `autoplay` | Boolean | `false` | — | 是否自动播放 |
| `interval` | Number | `3000` | — | 自动播放间隔（毫秒），小于等于 0 时不播放 |
| `duration` | Number | `500` | — | 切换动画时长（毫秒） |
| `circular` | Boolean | `false` | — | 是否首尾衔接循环 |
| `vertical` | Boolean | `false` | — | 是否纵向滑动 |
| `indicator` | Boolean | `true` | — | 是否显示指示点 |
| `indicatorPosition` | String | `'bottom'` | — | 指示点位置：bottom / top / bottom-left / bottom-right |
| `indicatorColor` | String | `''` | — | 未选中指示点颜色，不传时取 var(--cd-swiper-dot-color) |
| `indicatorActiveColor` | String | `''` | — | 选中指示点颜色，不传时取 var(--cd-swiper-dot-active-color) |
| `mode` | String | `'auto'` | — | 双形态：auto / mobile / desktop。desktop 时显示左右翻页箭头，mobile 时不显示（触屏不该出现鼠标箭头） |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:current` | 当前页码变化（v-model:current） |
| `change` | 值变化时触发 |
| `click` | 点击时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | `item` / `index` | 默认插槽 |
| `indicator` | `items` / `current` | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 直接封装 uni 的 &lt;swiper> / &lt;swiper-item>，把三件事收拢成一套 API： 1) 数据驱动优先。
- 原生 swiper 的用法是把 &lt;swiper-item> 写在插槽里，于是「有几项」 这件事散落在模板里，业务很难把它和「数据是异步回来的」对齐。
- 这里改成 list 数组驱动，每一项既可以由默认渲染（image / text）， 也可以由默认插槽完全接管。
- 2) 自动播放自己管，不用原生 autoplay。
- 原生 autoplay 由 swiper 组件内部控制，页面切走、列表变短、 需要手动翻页后重置计时这些场景都插不上手。
- 这里用一个 setInterval 推进 innerIndex —— 手能停（onUnmounted 必清）、 能随时重启（手动翻页后重新计时，避免刚点完马上又自动跳）。
- 代价是少了「触摸暂停」这类原生内建行为，见下方已知限制。
- 3) current 是受控值。
- props.current → innerIndex → &lt;swiper :current> →

## 关联

[cd-image](/components/image) · [cd-grid](/components/grid)
