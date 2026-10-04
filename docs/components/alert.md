---
title: Alert 提示条
---

# Alert 提示条

<div class="cd-api-tag">`alert` · 反馈与浮层</div>

静态区域里的常驻提示。四种语义色、支持描边、通铺 banner 与右侧操作区。

## 用法

<CdDemo id="alert-0"></CdDemo>

```vue // 来自演示页 showcase
<view class="stack">
  <cd-alert type="info" title="提示" description="这是一条普通的说明信息。" />
  <cd-alert type="success" title="已保存" description="改动已同步到云端。" />
  <cd-alert type="warning" title="额度将满" description="本月剩余额度不足 10%，请留意。" />
  <cd-alert type="danger" title="保存失败" description="网络请求超时，请重试。" closable @close="handleAlertClose" />
  <cd-alert type="info" description="只有描述、没有标题的紧凑形态。" />
  <cd-alert type="warning" outlined title="描边形态" description="白底 + 语义色描边，视觉更轻。" />
</view>

<cd-divider position="left">通铺 + 操作区</cd-divider>

<cd-alert type="info" banner title="版本更新" description="v0.3.0 新增 15 个组件。">
  <template #action>
    <cd-button size="small" type="text">查看</cd-button>
  </template>
</cd-alert>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `type` | String | `'info'` | — | info / success / warning / danger |
| `title` | String | `''` | — | — |
| `description` | String | `''` | — | 描述文案。也可以用默认插槽传更复杂的内容 |
| `showIcon` | Boolean | `true` | — | 显示左侧语义图标 |
| `closable` | Boolean | `false` | — | 显示关闭按钮 |
| `banner` | Boolean | `false` | — | 通铺形态：去掉圆角和左右留白，适合贴在页面或卡片顶部 |
| `outlined` | Boolean | `false` | — | 描边形态：白底 + 语义色描边，视觉更轻 |
| `center` | Boolean | `false` | — | 内容居中（一般用于通铺的公告条） |
| `icon` | String | `''` | — | 自定义图标，覆盖 type 的默认图标 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `close` | 关闭时（动画结束后） |
| `click` | 点击时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `icon` | — | — |
| `title` | — | — |
| `default` | — | 默认插槽 |
| `action` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 与 cd-empty 的分工：empty 是「整块区域没有内容」， alert 是「针对当前上下文的一条说明」。
- 前者占满容器，后者通铺一行。
- 颜色策略和 cd-tag 一样：type 只声明两个颜色（主色 + 浅底）， 由形态决定怎么用。
- 所以想加一种语义色只需要加两行。
- banner 形态（无圆角、无左右留白）存在的意义是能贴在页面顶部通铺， 这是后台系统里很常见的一种用法，用一个布尔量比让业务写覆盖样式更省事。

## 关联

[cd-notice-bar](/components/notice-bar)
