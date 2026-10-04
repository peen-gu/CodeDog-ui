---
title: Grid 宫格
---

# Grid 宫格

<div class="cd-api-tag">`grid` · 布局与容器</div>

等分宫格容器。列宽由 JS 预算成 `--cd-grid-item-w` 下发，边框采用「容器画外框、格子画内线」的方案，全程零 nth-child——小程序 WXSS 对该选择器支持不一致。

## 用法

<CdDemo id="grid-0"></CdDemo>

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
| `columns` | Number | `4` | — | 列数 |
| `border` | Boolean | `true` | — | 显示网格线 |
| `itemMinHeight` | String \| Number | `''` | — | 单元格最小高度，数字按 px |
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

- 实现上最值得说的一点：**列宽不走 calc 除法**。
- 常见的写法是 `.cd-grid-item { width: calc(100% / var(--cd-grid-cols)) }`， 但小程序 WebView 对「CSS 变量参与 calc 除法」的支持并不一致 —— 这是本框架里已经记录在案的坑（栅格那一批改用编译期百分比绕开了）。
- 这里改用「JS 先算好百分比、以纯值变量下发」： grid 根节点内联 --cd-grid-item-w: 25% 子项 width: var(--cd-grid-item-w, 25%) 变量只做值传递、不参与运算，两端行为完全一致。
- 第二个取舍是边框的归属：外框画在容器上（上 + 左）， 内线画在每一格上（右 + 下），这样每一格的四条边都能被画到， 且不需要任何 nth-child 选择器 —— 后者在小程序 WXSS 里不可靠。
- 代价是最后一格不满行时右下角会缺一小段边线， 这是所有用「格自画边」方案的通病，换来的是零 JS 测量与两端一致。

## 关联

[cd-grid-item](/components/grid-item)
