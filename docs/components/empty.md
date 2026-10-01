---
title: Empty 空状态
---

# Empty 空状态

<div class="cd-api-tag">`empty` · 数据展示</div>

固化了 5 种高频空状态预设（无数据/无搜索结果/加载失败/无网络/无权限），避免每次业务方各写一套文案导致漂移。

## 用法

```vue // 来自演示页 showcase
<view class="empty-grid">
  <view class="empty-grid__cell">
    <cd-empty size="small" />
  </view>
  <view class="empty-grid__cell">
    <cd-empty size="small" mode="search" />
  </view>
  <view class="empty-grid__cell">
    <cd-empty size="small" mode="network" />
  </view>
  <view class="empty-grid__cell">
    <cd-empty size="small" mode="permission" />
  </view>
</view>

<cd-empty
  mode="search"
  description="换个关键词试试，或者清空筛选条件重新查找"
>
  <template #action>
    <cd-button type="primary" size="small">清空筛选</cd-button>
  </template>
</cd-empty>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `mode` | String | `'default'` | — | default / search / network / error / permission |
| `icon` | String | `''` | — | 覆盖预设图标 |
| `text` | String | — | — | 覆盖预设主文案。显式传空字符串则完全不显示主文案 |
| `description` | String | `''` | — | 副文案，说明「为什么空」以及「该怎么办」 |
| `size` | String | `'default'` | — | small / default / large |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

无

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `image` | — | — |
| `default` | — | 默认插槽 |
| `action` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 为什么提供 mode（preset）而不是只让业务传图标和文案？
- 因为「暂无数据 / 未找到结果 / 网络异常」这三种状态在每个项目里都会被写几十遍， 而且每次文案都不一样（"暂无数据" vs "还没有内容" vs "空空如也"）， 同一款产品里出现三种说法是很常见的一致性事故。
- 把高频场景固化成预设，业务想改文案仍然可以传 text 覆盖。

## 关联

[cd-result](/components/result)
