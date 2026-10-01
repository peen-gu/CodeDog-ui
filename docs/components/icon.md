---
title: Icon 图标
---

# Icon 图标

<div class="cd-api-tag">`icon` · 通用</div>

内置 72 个 24×24 描边图标，CSS mask + data URI 实现，颜色跟随 currentColor。刻意不复用 wd-icon——它在小程序走阿里图库外链字体，需配域名白名单且弱网闪空。

## 用法

```vue // 来自演示页 components
<template #extra>
  <text class="muted">{{ iconNames.length }} 个</text>
</template>

<view class="icon-grid">
  <view v-for="name in iconNames" :key="name" class="icon-cell">
    <cd-icon :name="name" :size="20" />
    <text class="icon-cell__name">{{ name }}</text>
  </view>
</view>
```

```vue // 来自演示页 components
<view class="row">
  <cd-button type="primary">
    <template #icon><cd-icon name="plus" :size="16" /></template>
    新建
  </cd-button>
  <cd-button>
    <template #icon><cd-icon name="download" :size="16" /></template>
    导出
  </cd-button>
  <cd-button type="danger" plain>
    <template #icon><cd-icon name="trash" :size="16" /></template>
    删除
  </cd-button>
  <cd-button type="text">
    <template #icon><cd-icon name="refresh" :size="16" /></template>
    刷新
  </cd-button>
</view>

<view class="row row--baseline">
  <text class="inline-text">
    <cd-icon name="check-circle" color="var(--cd-color-success, #10b981)" /> 校验通过
  </text>
  <text class="inline-text">
    <cd-icon name="warning" color="var(--cd-color-warning, #f59e0b)" /> 存在风险
  </text>
  <text class="inline-text">
    <cd-icon name="close-circle" color="var(--cd-color-danger, #ef4444)" /> 已失败
  </text>
  <text class="inline-text">
    <cd-icon name="loader" spin /> 加载中
  </text>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `name` | String | `''` | — | 图标名，见 icons.js 的 ICONS 表 |
| `size` | String \| Number | `''` | — | 尺寸：数字按 px 处理，字符串原样输出（如 '1.2em' / '20px'） |
| `color` | String | `''` | — | 颜色，默认跟随父级 color |
| `spin` | Boolean | `false` | — | 持续旋转，用于 loading 场景 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click` | 点击时触发 |

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 实现原理（跨端关键）： 形状来自 -webkit-mask-image 内联的 SVG data URI， 颜色来自 background-color，默认 currentColor 从而自动跟随父级文字色。
- 为什么把 mask 相关样式写成「内联样式字符串」而不是 :style 对象： 小程序端 uni-app 会把对象形式的 :style 序列化成字符串， 期间对连字符属性名（-webkit-mask-image）的处理不如字符串形式可靠。
- 直接给字符串，两端都是原样透传，行为完全一致。
- 尺寸约定： 不传 size 时高度取 var(--cd-icon-size, 1em)，因此图标会跟随所在文字的字号， 「文字 14px + 图标 1em」这种写法在两端都能对齐。

## 关联

[cd-button](/components/button) · [cd-loading](/components/loading)
