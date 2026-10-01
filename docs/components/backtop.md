---
title: BackTop 回到顶部
---

# BackTop 回到顶部

<div class="cd-api-tag">`backtop` · 导航</div>

滚动超过 visibility-height 后出现的回顶按钮，与 cd-affix 共用 usePageScroll 处理「H5 自动监听 / 小程序页面传入」的差异。

## 用法

```vue // 来自演示页 widgets
<view class="stack">
  <text class="body-text">
    向下滚动超过 360px，右下角会出现回到顶部按钮。悬浮按钮（cd-fab）可以按住拖动，
    用来解决「它刚好压住了列表最后一行」这种无解的场景。
  </text>

  <view class="filler" />

  <text class="col-label">下面是为了把页面撑长、方便验证滚动相关组件的占位内容</text>
  <view class="filler filler--sm" />
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `scrollTop` | Number | `null` | — | 页面滚动距离。不传（null）时 H5 自动监听； 小程序端必须由页面的 onPageScroll 传进来。 |
| `visibilityHeight` | Number | `360` | — | 超过这个距离才显示 |
| `duration` | Number | `300` | — | 返回顶部的动画时长（毫秒） |
| `icon` | String | `'arrow-up'` | — | — |
| `iconSize` | String \| Number | `'1.25em'` | — | — |
| `text` | String | `''` | — | — |
| `shape` | String | `'circle'` | — | circle / square |
| `bottom` | String \| Number | `''` | — | 距底部（px） |
| `right` | String \| Number | `''` | — | 距右侧（px） |
| `zIndex` | Number | `1200` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click` | 点击时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 显示与否只取决于一个数：页面滚了多远。
- 所以它本身没有任何状态， 真正的难点是**怎么拿到那个数**——这件事在两端的能力不对等： H5：监听 window 的 scroll 即可，组件自给自足； 小程序：页面滚动只在 Page 的 onPageScroll 里回调，组件拿不到。
- 因此这里的约定是：**scroll-top 属性可选**。
- - 传了 → 用它（小程序必须这么用）； - 不传 → H5 自动监听，小程序下则永远不显示。
- 与其假装两端都能自动工作，不如把这个差异写成明确的 API。
- 滚动定位用 uni.pageScrollTo 而不是 window.scrollTo： 前者在 H5 与小程序都是同一套语义（认 #id 或像素值）， 后者在小程序里根本不存在。

## 关联

[cd-affix](/components/affix) · [cd-fab](/components/fab)
