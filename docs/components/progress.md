---
title: Progress 进度条
---

# Progress 进度条

<div class="cd-api-tag">`progress` · 数据展示</div>

线形与环形两种形态。环形用 conic-gradient + mask 实现，刻意不用 canvas——避开小程序 canvas-id、层级与绘制时机的坑。

## 用法

<CdDemo id="progress-0"></CdDemo>

```vue // 来自演示页 showcase
<view class="stack">
  <cd-progress :percentage="30" />
  <cd-progress :percentage="65" status="success" />
  <cd-progress :percentage="80" status="warning" />
  <cd-progress :percentage="45" status="danger" />
  <cd-progress :percentage="60" status="active" />
  <cd-progress :percentage="100" text="已完成" />
</view>

<cd-divider position="left">粗条 + 文字内显</cd-divider>

<view class="stack">
  <cd-progress :percentage="72" :stroke-width="22" text-inside text="72%" />
</view>

<cd-divider position="left">环形</cd-divider>

<view class="row row--baseline">
  <cd-progress type="circle" :percentage="25" :size="72" :stroke-width="6" />
  <cd-progress type="circle" :percentage="68" :size="88" :stroke-width="8" status="success" />
  <cd-progress type="circle" :percentage="92" :size="104" :stroke-width="10" status="danger" />
  <cd-progress type="circle" :percentage="100" :size="88" :stroke-width="8" status="success" text="OK" />
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `percentage` | Number | `0` | — | 进度值，超出 0~100 会被钳制 |
| `type` | String | `'line'` | — | line / circle |
| `strokeWidth` | Number | `6` | — | 线形：条的粗细。环形：圆环宽度 |
| `size` | Number \| String | `100` | — | 环形直径，数字按 px |
| `status` | String | `'normal'` | — | normal / success / warning / danger / active active 在线形上是流动的斜纹，适合用在「处理中」这类没有确定进度的场景 |
| `color` | String | `''` | — | 直接指定填充色，优先级高于 status |
| `trackColor` | String | `''` | — | 直接指定轨道色 |
| `showText` | Boolean | `true` | — | 是否显示右侧百分比文字 |
| `textInside` | Boolean | `false` | — | 文字显示在条内。条太细时会被自动忽略，见 effectiveTextInside |
| `text` | String | `''` | — | 自定义文字内容，不传则显示「xx%」 |
| `round` | Boolean | `true` | — | 圆头 |
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

- 两种形态的实现方式刻意不同： 线形 —— 两个嵌套 view，外层是轨道、内层是填充，宽度用百分比。
- 最朴素的方案，没有兼容性可言，也不需要任何测量。
- 环形 —— conic-gradient 画弧 + mask 挖圆心。
- 不用 canvas，是因为 canvas 在小程序里要处理 canvas-id、层级、 以及组件不可见时的绘制时机，为了一个进度环引入这套东西不划算。
- 也刻意不用「两个半圆旋转」那套纯 CSS 方案 —— 它的 DOM 结构要四层， 而且边界值（0% / 50% / 100%）需要额外的特判。
- mask 的支持要求本框架已经在承担了（cd-icon 全靠 mask）， 所以这里复用同一基线，没有引入新的兼容风险。
- 一个容易被忽略的细节：百分比必须钳制在 0~100。
- 接口返回 120 或者 -5 是常有的事，不钳制的话线形会溢出容器、 环形会画出一整圈外加一段多余的弧。

## 关联

[cd-loading](/components/loading)
