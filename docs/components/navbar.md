---
title: Navbar 导航栏
---

# Navbar 导航栏

<div class="cd-api-tag">`navbar` · 导航</div>

顶部导航栏。状态栏留白由 statusBar 开关 × 实测高度决定，拿不到就退回 0；标题绝对居中，左右内容不等长也不偏心。

## 用法

<CdDemo id="navbar-0"></CdDemo>

```vue // 来自演示页 extended
<view class="stack">
  <view class="navbar-preview">
    <cd-navbar
      title="订单详情"
      subtitle="共 3 件商品"
      left-arrow
      left-text="返回"
      :fixed="false"
      :status-bar="false"
      @click-left="log('点了返回')"
    >
      <template #right>
        <cd-icon name="more-horizontal" :size="20" />
      </template>
    </cd-navbar>
  </view>

  <view class="navbar-preview">
    <cd-navbar
      title="沉浸式导航栏：自己接管状态栏空间"
      left-arrow
      background="#2563eb"
      :fixed="false"
      :status-bar="true"
      :border="false"
      @click-left="log('点了返回')"
    />
  </view>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `title` | String | `''` | — | 标题文案 |
| `subtitle` | String | `''` | — | 副标题（标题下方小字） |
| `leftArrow` | Boolean | `false` | — | 左侧返回箭头 |
| `leftText` | String | `''` | — | 左侧文字，常配合 leftArrow 显示「返回」 |
| `ellipsis` | Boolean | `true` | — | 标题过长省略 |
| `fixed` | Boolean | `true` | — | 吸顶固定 |
| `placeholder` | Boolean | `true` | — | fixed 时是否生成等高占位块 |
| `statusBar` | Boolean | `false` | — | 是否为状态栏留出空间（自定义导航栏场景必须开） |
| `border` | Boolean | `true` | — | 底部分割线 |
| `height` | Number | `44` | — | 内容区高度（不含状态栏） |
| `background` | String | `''` | — | 背景色，默认走令牌 |
| `zIndex` | Number | `1000` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click-left` | — |
| `click-right` | — |
| `click-title` | — |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `left` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 三端差异全部集中在「顶部到底该留多少」这一件事上： - 微信小程序：自定义导航栏要自己扣掉状态栏高度，否则标题会被胶囊压住； uni 里靠 `navigationStyle: custom` 接管，状态栏高度来自 getSystemInfo()。
- - H5：浏览器没有状态栏，留白必须是 0，否则顶部凭空多一条。
- - Electron：同 H5，但如果业务做的是桌面窗，往往需要更矮的标题行。
- 所以这里**不写死任何高度**，状态栏留白由 statusBar 开关 × 实测高度决定， 拿不到就退回 0 —— 宁可贴顶也不要留一条莫名的空白。
- 布局刻意用「左中右三段 + 中间绝对居中」而不是 flex 均分： 左右两侧内容长度不一样（左边可能只有箭头，右边有两个按钮）， 均分会让标题偏心。
- 中间绝对定位后，标题永远在正中。

## 关联

[cd-icon](/components/icon) · [cd-tabbar](/components/tabbar)
