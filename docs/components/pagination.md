---
title: Pagination 分页
---

# Pagination 分页

<div class="cd-api-tag">`pagination` · 导航</div>

移动端只显示上一页/下一页，PC 显示完整页码。页码数量恒定，翻到末尾不会忽然变窄导致按钮跳动。

## 用法

<CdDemo id="pagination-0"></CdDemo>

```vue // 来自演示页 desktop
<cd-pagination
  v-model:current="current"
  v-model:page-size="pageSize"
  :total="filtered.length"
/>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `total` | Number | `0` | — | — |
| `current` | Number | `1` | — | — |
| `pageSize` | Number | `10` | — | — |
| `mode` | String | `'auto'` | — | 'auto' \| 'mobile' \| 'desktop' |
| `showTotal` | Boolean | `true` | — | — |
| `showSizeChanger` | Boolean | `true` | — | 每页条数切换器，仅桌面端渲染 |
| `pageSizeOptions` | Array | `() => [10, 20, 50, 100]` | — | — |
| `maxButtons` | Number | `5` | — | 页码盒子数量（含首尾页码与省略号），中间部分按需收缩。盒子数恒定，翻页时宽度不跳 |
| `disabled` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:current` | 当前页码变化（v-model:current） |
| `update:pageSize` | 每页条数变化（v-model:pageSize） |
| `change` | 值变化时触发 |

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 移动端不做完整页码，是基于真实约束而不是偷懒： 375px 宽的屏幕上放不下「1 2 3 … 10」，手指也点不准 32px 的方块。
- 所以移动端只保留「上一页 / 当前第几页 / 下一页」—— 这是所有头部移动产品的通行做法。
- 桌面端则是完整的：页码 + 两端省略号 + 每页条数切换 + 总条数。
- 页码数量恒定（maxButtons 控制），避免翻页时控件宽度跳动。

## 关联

[cd-table](/components/table)
