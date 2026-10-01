---
title: Table 表格
---

# Table 表格

<div class="cd-api-tag">`table` · 数据展示</div>

PC 端多列数据表，移动端自动降级为卡片列表（首列升格为卡片标题）。未实现虚拟滚动与列宽拖拽，大数据量场景需自行接入。

## 用法

```vue // 来自演示页 desktop
<cd-table
  :columns="columns"
  :data="pagedData"
  row-key="id"
  @row-click="handleRowClick"
/>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `columns` | Array | `() => []` | — | 列定义 |
| `data` | Array | `() => []` | — | — |
| `mode` | String | `'auto'` | — | 'auto' \| 'mobile' \| 'desktop' |
| `rowKey` | String \| Function | `'id'` | — | 行唯一键：字符串字段名或返回键的函数 |
| `stripe` | Boolean | `true` | — | — |
| `border` | Boolean | `true` | — | — |
| `loading` | Boolean | `false` | — | — |
| `emptyText` | String | `'暂无数据'` | — | — |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `row-click` | — |

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 这是双形态改造收益最大的组件，因为两端的信息密度需求天然相反： 桌面端 → 真表格。
- 列对齐、表头固定、斑马纹、横向信息可比对， 用户可以一眼扫完 20 行 × 6 列 移动端 → 卡片列表。
- 没人会在 375px 宽的屏幕上左右拖着看表格， 所以必须把「一行」重构成「一张卡」，首列升格为卡片标题 这里没有复用 wd-table，原因是它的定位是「移动端简单表格」， 列宽、对齐、斑马纹这些 PC 必备能力都没有。
- 而表格的难点（虚拟滚动、列宽拖拽）不在骨架范围内，所以自研更合适。
- 实现约束：小程序没有 &lt;table> 标签，所以两端都用 flex 模拟列结构， 这也正好让「列宽」可以完全走 flex 值而不是 table-layout 算法。

## 关联

[cd-pagination](/components/pagination)
