---
title: Breadcrumb 面包屑
---

# Breadcrumb 面包屑

<div class="cd-api-tag">`breadcrumb` · 导航</div>

层级位置导航。容器判定最后一项并让它不可点击、颜色更重。

## 用法

<CdDemo id="breadcrumb-0"></CdDemo>

```vue // 来自演示页 navigation
<cd-breadcrumb>
  <cd-breadcrumb-item to="/pages/index/index">首页</cd-breadcrumb-item>
  <cd-breadcrumb-item>组件库</cd-breadcrumb-item>
  <cd-breadcrumb-item>导航</cd-breadcrumb-item>
  <cd-breadcrumb-item>面包屑</cd-breadcrumb-item>
</cd-breadcrumb>

<cd-divider position="left">图标分隔符 / 长路径自动换行</cd-divider>

<cd-breadcrumb separator-icon="chevron-right">
  <cd-breadcrumb-item>工作台</cd-breadcrumb-item>
  <cd-breadcrumb-item>数据中心</cd-breadcrumb-item>
  <cd-breadcrumb-item>华东区</cd-breadcrumb-item>
  <cd-breadcrumb-item>订单明细</cd-breadcrumb-item>
</cd-breadcrumb>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `separator` | String | `'/'` | — | 分隔符文案 |
| `separatorIcon` | String | `''` | — | 用图标替代文案分隔符 |
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

- 分两层是为了「最后一个不可点」这件事有个明确的归属： 分隔符与可点状态都取决于「我后面还有没有兄弟」， 这个信息只有容器统计得出来。
- 和步骤条 / 时间线共用同一套注册表机制（普通数组 + 版本号）， 为什么不用 ref 数组的理由写在那两个组件里，不再重复。

## 关联

[cd-breadcrumb-item](/components/breadcrumb-item)
