---
title: Tabs 标签页
---

# Tabs 标签页

<div class="cd-api-tag">`tabs` · 导航</div>

line / card 两种视觉，支持 badge 与横向滚动。等宽模式的指示器用纯百分比定位（零测量），仅 scrollable 模式才用 createSelectorQuery 且测不到自动降级。

## 用法

<CdDemo id="tabs-0"></CdDemo>

```vue // 来自演示页 components
<cd-tabs v-model="tabLine" :tabs="tabsLine">
  <template #default="{ active }">
    <view class="tab-pane">
      <text class="body-text">当前选中：{{ active }}</text>
      <text class="body-text">内容区由业务自己渲染 —— 组件只回传 active，不托管 pane，因而不会被强制套上懒加载与缓存策略。</text>
    </view>
  </template>
</cd-tabs>

<view class="tabs-gap">
  <cd-tabs v-model="tabCard" type="card" :tabs="tabsCard" />
</view>

<view class="tabs-gap">
  <text class="field__label">可滚动（标签较多时）</text>
  <cd-tabs v-model="tabScroll" scrollable :tabs="tabsScroll" />
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | String \| Number | `''` | — | — |
| `tabs` | Array | `() => []` | — | 标签数据 |
| `type` | String | `'line'` | — | line（下划线）/ card（分段控件） |
| `scrollable` | Boolean | `false` | — | 标签数较多时开启横向滚动 |
| `sticky` | Boolean | `false` | — | 标签条吸顶（PC 长页面阅读时很实用） |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |
| `click` | 点击时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | `active` / `index` | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 指示器（那条会滑动的小横线）是本组件唯一有技术含量的地方，策略分两档： 等宽模式（默认）：left = (index + 0.5) / 总数 * 100%，纯 CSS 百分比。
- 零测量、零时机问题，任何端、任何时刻都必然正确。
- 滚动模式：标签宽度不一致，百分比算不出来，只能用 createSelectorQuery 测量。
- 测量是异步的且依赖布局完成，所以带兜底 —— 测不到就退回百分比， 视觉上仍是「在激活项附近」，不会出现横线跑到屏幕外的情况。
- 这个分层是刻意的：把「必然正确」和「依赖测量」分开， 让框架 90% 的用法（等宽标签）完全不承担测量的风险。

## 关联

[cd-badge](/components/badge)
