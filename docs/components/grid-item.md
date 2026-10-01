---
title: GridItem 宫格项
---

# GridItem 宫格项

<div class="cd-api-tag">`grid-item` · 布局与容器</div>

宫格中的一个单元格，支持图标、文字、角标（数字/红点）、showZero 与整格跳转（navigateTo 失败自动降级 switchTab）。

## 用法

```vue // 来自演示页 navigation
<view class="stack">
  <view>
    <text class="col-label">columns=4（默认，带网格线）</text>
    <cd-grid :columns="4">
      <cd-grid-item icon="home" text="首页" url="/pages/index/index" />
      <cd-grid-item icon="chart" text="报表" :badge="5" />
      <cd-grid-item icon="file" text="文档" is-dot :badge="1" />
      <cd-grid-item icon="setting" text="设置" />
      <cd-grid-item icon="users" text="成员" :badge="128" />
      <cd-grid-item icon="bell" text="通知" :badge="0" />
      <cd-grid-item icon="star" text="收藏" />
      <cd-grid-item icon="lock" text="禁用项" disabled />
    </cd-grid>
  </view>

  <view>
    <text class="col-label">columns=3 / border=false</text>
    <cd-grid :columns="3" :border="false">
      <cd-grid-item icon="cloud" text="云盘" />
      <cd-grid-item icon="image" text="相册" />
      <cd-grid-item icon="mail" text="邮件" :badge="9" />
    </cd-grid>
  </view>

  <view>
    <text class="col-label">columns=5（图标色跟随主色）</text>
    <cd-grid :columns="5">
      <cd-grid-item icon="tag" text="标签" />
      <cd-grid-item icon="award" text="勋章" />
      <cd-grid-item icon="globe" text="站点" />
      <cd-grid-item icon="shield" text="安全" />
      <cd-grid-item icon="more-horizontal" text="更多" />
    </cd-grid>
  </view>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `icon` | String | `''` | — | 图标名 |
| `iconSize` | String \| Number | `''` | — | 图标尺寸，数字按 px；不传取 --cd-grid-item-icon-size |
| `text` | String | `''` | — | 文案 |
| `badge` | String \| Number | `null` | — | 右上角角标数值，传 0 / 空则按规则决定是否显示 |
| `isDot` | Boolean | `false` | — | 角标显示为圆点 |
| `showZero` | Boolean | `false` | — | badge 为 0 时是否仍然显示 |
| `url` | String | `''` | — | 跳转地址，传了就在点击后自动 navigateTo |
| `disabled` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click` | 点击时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `icon` | — | — |
| `text` | — | — |
| `default` | — | 默认插槽 |
| `badge` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 列宽不是自己算的，而是读容器下发的 --cd-grid-item-w。
- CSS 变量天然沿 DOM 继承，因此这里不需要任何 provide/inject —— 变量既能传值又不需要父子组件通信，是这一层最省事的通道。
- 角标用绝对定位而不是插进图标行里：宫格的图标是居中的， 把角标塞进流内会把图标挤偏，而角标本来的语义就是「浮在上面」。

## 关联

[cd-grid](/components/grid) · [cd-badge](/components/badge)
