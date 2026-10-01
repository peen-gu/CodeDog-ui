---
title: Affix 图钉
---

# Affix 图钉

<div class="cd-api-tag">`affix` · 布局与容器</div>

页面滚动到指定位置后把内容钉住。实现是占位壳 + 固定内层：外层越过阈值后内层切 position:fixed 并抄录 width/left，外层用 height 顶住，避免布局跳动。

## 用法

```vue // 来自演示页 widgets
<cd-affix :offset-top="12">
  <view class="affix-bar">
    <text class="affix-bar__text">cd-affix：向下滚动，我会钉在顶部（offset-top=12）</text>
    <cd-button size="small" type="primary" plain @click="log('固钉上的按钮')">操作</cd-button>
  </view>
</cd-affix>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `offsetTop` | Number | `0` | — | 距离顶部多少像素时开始固定 |
| `scrollTop` | Number | `null` | — | 页面滚动距离。不传（null）时 H5 自动监听； 小程序端必须由页面的 onPageScroll 传进来。 |
| `zIndex` | Number | `1100` | — | — |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `change` | 值变化时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 为什么不用 position: sticky 一把梭： sticky 的支持面太不整齐了 —— 微信小程序在 webview 渲染下能用， 但在部分内嵌容器、以及在祖先元素带 overflow:hidden 时会静默失效， 而且它**没法告诉你「我现在钉住了没有」**。
- 而业务经常需要这个信息（钉住时加投影、换个底色、把标题压缩）。
- 所以这里用「占位壳 + 固定内层」的经典方案： 外层 .cd-affix 始终待在文档流里，负责报告「我滚到哪了」； 内层 .cd-affix__inner 平时是静态的，一旦外层顶边越过 offsetTop 就切成 position:fixed，并把外层的宽高与左边距原样抄过来。
- 这样布局不塌、宽度不跳，且 fixed 状态是一个可读的响应式变量。
- 滚动信号与 cd-backtop 共用 usePageScroll（H5 自动监听 / 小程序由页面传入）。
- 测量用 rAF 节流，一帧最多量一次 —— 滚动事件一秒能来上百次。
- 已知限制：固定期间如果页面发生横向布局变化（比如侧栏展开）， 抄下来的 left / width 会失准。
- 真遇到这种场景请调用组件的 refresh()。

## 关联

[cd-backtop](/components/backtop)
