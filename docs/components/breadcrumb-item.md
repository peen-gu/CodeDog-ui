---
title: BreadcrumbItem 面包屑项
---

# BreadcrumbItem 面包屑项

<div class="cd-api-tag">`breadcrumb-item` · 导航</div>

面包屑中的一环，to 属性跳转走 navigateTo，失败自动降级 switchTab。

## 用法

<CdDemo id="breadcrumb-item-0"></CdDemo>

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
| `title` | String | `''` | — | 无默认插槽时的文字 |
| `to` | String | `''` | — | 跳转地址（可选）。最后一项的 to 会被忽略 |
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
| `separator` | — | — |

## Expose

通过 `ref` 调用：

| 方法 / 属性 | 说明 |
|---|---|
| `__cdOrderUid` | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 最后一项被刻意做成「不可点、颜色更深」： 面包屑的最后一项就是「你现在在这里」，让它可点会诱导用户点回当前页 （常见于把导航写成一整排链接的设计，结果最后一个点了没反应）。
- 因此这里不是靠业务传 `disabled`，而是由位置自动决定。
- to 的跳转做了 navigateTo → switchTab 的降级， 和 cd-grid-item 用同一套约定：目标是 tabBar 页时 navigateTo 必然失败。

## 关联

[cd-breadcrumb](/components/breadcrumb)
