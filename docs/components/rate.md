---
title: Rate 评分
---

# Rate 评分

<div class="cd-api-tag">`rate` · 表单与录入</div>

支持半星，实现方式是双层叠加 + 像素级裁切：上层已选中层按 value*(size+gap) px 宽度裁切。size 与 gap 声明为 Number 以便同时下发 CSS 变量。

## 用法

```vue // 来自演示页 widgets
<view class="stack">
  <view>
    <text class="col-label">整星 + 文案：{{ rate1 }} 分</text>
    <cd-rate v-model="rate1" show-text :texts="['很差', '较差', '一般', '较好', '很好']" />
  </view>

  <view>
    <text class="col-label">半星（allow-half）：{{ rate2 }} 分</text>
    <cd-rate v-model="rate2" allow-half show-text :texts="['很差', '较差', '一般', '较好', '很好']" />
  </view>

  <view>
    <text class="col-label">只读 / 大尺寸 / 10 颗</text>
    <cd-rate :model-value="7.5" allow-half readonly :size="26" :count="10" />
  </view>

  <view>
    <text class="col-label">禁用</text>
    <cd-rate :model-value="3" disabled />
  </view>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Number | `0` | — | — |
| `count` | Number | `5` | — | 星星总数 |
| `allowHalf` | Boolean | `false` | — | 允许半星 |
| `readonly` | Boolean | `false` | — | 只读：不可点击 |
| `disabled` | Boolean | `false` | — | — |
| `size` | Number | `22` | — | 单颗星尺寸（px）。用 Number 是为了让上层裁切能算成精确像素 |
| `gap` | Number | `4` | — | 星星间距（px） |
| `icon` | String | `'star-fill'` | — | 选中图标 |
| `voidIcon` | String | `'star'` | — | 未选中图标。默认用描边星而不是灰色实心星 —— 灰色实心星看起来像「已选但坏了」，描边才有「待点亮」的意思 |
| `allowClear` | Boolean | `true` | — | 再次点击同一个值是否清零 |
| `showText` | Boolean | `false` | — | 显示右侧文案 |
| `texts` | Array | `() => []` | — | 文案表，按分数取；例如 ['很差', '较差', '一般', '较好', '很好'] |
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
| `text` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 半星的实现方式值得说清楚，因为常见做法都有坑： × 「用两个图标叠加 + width:50%」：百分比是按容器宽度算的， 而容器里还有间隙（gap），所以 2.5 / 5 时 50% 并不会正好落在 第 3 颗星的中间 —— 星越多、间距越大，偏移越明显。
- × 「用 clip-path」：小程序 WXSS 对 clip-path 的支持看运气。
- 本实现：底层铺一排「未选中」，上层再铺一排一模一样的「已选中」， 用一个 overflow:hidden 的容器按**精确像素宽度**裁切。
- 两排的布局参数完全相同，所以裁到哪里就是哪里，精度是像素级的。
- 宽度能算成像素的前提是 size 与 gap 都是数字 —— 因此 size 声明为 Number， 并由组件把同一组数字同时下发给 CSS 变量，确保「算的」和「画的」是同一个数。
- 点击区不参与上面的裁切，而是每颗星内部再横切两半， 这样点击判定天然与视觉对齐，也不需要去猜 event 里的坐标字段 （小程序与 H5 的 tap 事件坐标系并不统一）。

## 关联

[cd-icon](/components/icon)
