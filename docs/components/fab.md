---
title: Fab 悬浮按钮
---

# Fab 悬浮按钮

<div class="cd-api-tag">`fab` · 导航</div>

可拖拽的悬浮操作按钮。H5 通过 document 监听鼠标实现拖拽，小程序用 touch 事件。提供 offset-right 让位给同角落的其他浮层。

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
| `icon` | String | `'plus'` | — | 图标名 |
| `iconSize` | String \| Number | `'1.4em'` | — | 图标尺寸 |
| `text` | String | `''` | — | 图标旁的文字 |
| `position` | String | `'right-bottom'` | — | right-bottom / right-center / left-bottom / left-center |
| `size` | String | `'normal'` | — | normal / large |
| `color` | String | `''` | — | 自定义背景色（覆盖主色） |
| `offsetBottom` | String \| Number | `''` | — | 距底部距离（px）；PC 上会自动加一档，避免和浏览器边缘贴太近 |
| `offsetRight` | String \| Number | `''` | — | — |
| `draggable` | Boolean | `false` | — | 可拖拽 |
| `visible` | Boolean | `true` | — | — |
| `zIndex` | Number | `1100` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click` | 点击时触发 |
| `drag-start` | — |
| `drag-end` | — |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 定位用 position:fixed + 边距变量，而不是靠父级布局： 悬浮按钮的语义就是「脱离文档流，一直能点到」， 一旦参与父级布局，滚动时就留不住它。
- 拖拽是为了解决一个真实的移动端痛点：悬浮按钮固定的那个角落 恰好压住了页面上的关键内容（尤其是列表最后一行）， 用户此时除了把内容再滚一点之外毫无办法。
- 允许拖走它， 比让业务去换角落实用得多。
- 拖拽实现要点： 1. 位移是「相对按下时的那一点」的累加，不是鼠标绝对坐标 —— 后者在页面滚动或容器定位变化时会突然跳一下； 2. 拖动超过阈值后要吞掉随后的 click： 手指一抖就会同时触发拖拽与点击，用户只是想挪开它却触发了操作； 3. 鼠标拖拽复用同一套逻辑（H5 上 mousedown → document 的 move/up）， 与 cd-slider 采用同一套指针约定。

## 关联

[cd-backtop](/components/backtop)
