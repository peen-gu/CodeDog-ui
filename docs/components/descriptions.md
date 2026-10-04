---
title: Descriptions 描述列表
---

# Descriptions 描述列表

<div class="cd-api-tag">`descriptions` · 数据展示</div>

一份 items 渲染整张详情表，支持列数、跨列与横竖两种排布。比手写一堆 cell 少 80% 的模板代码。

## 用法

<CdDemo id="descriptions-0"></CdDemo>

```vue // 来自演示页 extended
<cd-descriptions title="订单信息" :items="descItems" :column="2" border>
  <template #extra>
    <cd-tag type="success" label="已完成" />
  </template>
</cd-descriptions>

<cd-divider position="left">纵向排布</cd-divider>

<cd-descriptions :items="descItems2" :column="3" direction="vertical" border />
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `items` | Array | `() => []` | — | 描述项：{ label, value, span }，span 缺省为 1 |
| `column` | Number | `3` | — | 每行几项 |
| `direction` | String | `'horizontal'` | — | horizontal 标签在左 / vertical 标签在上 |
| `border` | Boolean | `false` | — | 显示边框 |
| `labelWidth` | String \| Number | `''` | — | 标签固定宽度，数字按 px；空则不限制 |
| `title` | String | `''` | — | — |
| `emptyText` | String | `'-'` | — | 内容为空时的占位 |
| `size` | String | `'default'` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

无

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `extra` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 看着是表格，实际**不能用原生 table**（template 里禁 HTML 标签）， 也不能用 `&lt;component :is>` 做列渲染（mp-weixin 编译期报错）。
- 所以用「先切行、再按 span 分宽度」的两步法： 1. 预处理阶段把 items 按累计 span 切成 rows，累计超过 column 就换行； 2. 渲染时每个格子写死百分比宽度 `width: (span/column)*100%`。
- 百分比而不是 flex-basis 的原因：小程序 flex 在嵌套深时对 `flex-basis: 25%` 的解释与 H5 不一致，写 width 是最笨也最稳的一条路。
- 边框 crossover 由「每个格子自己画左上两边 + 容器画右下两边」完成， 避开 `:last-child` 这类结构伪类（WXSS 支持不可靠）。

## 关联

[cd-cell](/components/cell) · [cd-card](/components/card)
