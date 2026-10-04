---
title: CellGroup 单元格组
---

# CellGroup 单元格组

<div class="cd-api-tag">`cell-group` · 布局与容器</div>

单元格容器，用相邻选择器统一补分隔线，支持 inset 卡片形态与分组标题。

## 用法

<CdDemo id="cell-group-0"></CdDemo>

```vue // 来自演示页 navigation
<view class="split">
  <view class="split__col">
    <text class="col-label">inset=false（通铺）</text>
    <cd-cell-group title="账号设置">
      <cd-cell title="头像" value="已上传" clickable @click="log('头像')" />
      <cd-cell title="昵称" value="CodeDog" clickable />
      <cd-cell icon="bell" title="消息通知" arrow label="接收订单与系统通知" />
      <cd-cell title="账号 ID" value="cd_8f3a21" :arrow="false" />
    </cd-cell-group>
  </view>

  <view class="split__col">
    <text class="col-label">inset=true（卡片）</text>
    <cd-cell-group inset title="订单">
      <cd-cell title="待付款" value="2" clickable />
      <cd-cell title="待发货" value="1" clickable />
      <cd-cell title="售后中" value="0" :arrow="false" />
    </cd-cell-group>
  </view>
</view>

<cd-divider position="left">独立使用 / 必填 / 禁用 / 长值</cd-divider>

<cd-cell-group inset>
  <cd-cell title="手机号" required value="138****8888" clickable />
  <cd-cell title="这是很长的标题文案用来验证右侧值区不会被挤没" value="右侧值" />
  <cd-cell
    icon="lock"
    title="登录密码"
    label="建议 8 位以上，包含字母与数字"
    required
    clickable
  />
  <cd-cell title="已停用的项" value="不可点" disabled clickable />
</cd-cell-group>

<cd-divider position="left">右侧自由内容（默认插槽）</cd-divider>

<cd-cell-group inset>
  <cd-cell title="默认插槽塞任意内容">
    <cd-tag type="success" size="small" label="已通过" />
    <cd-tag type="info" size="small" label="V2" />
  </cd-cell>
  <cd-cell title="带操作按钮" :arrow="false">
    <cd-button size="small" type="primary" plain>去处理</cd-button>
  </cd-cell>
</cd-cell-group>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `title` | String | `''` | — | 分组标题 |
| `inset` | Boolean | `false` | — | 卡片形态：两侧留白 + 圆角 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

无

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `title` | — | — |
| `default` | — | 默认插槽 |
| `footer` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 这一层不做任何布局计算，只解决两件事： 1. 分组分隔线的归属。
- 组内相邻两格之间的线由这里统一画（`.cd-cell + .cd-cell { border-top }`）， 所以最后一格下面永远干净。
- 单元格通过 inject 感知「我在组里」， 相应关掉自己的底边线。
- 用相邻兄弟选择器而不是 `:last-child`， 是因为后者在小程序 WXSS 的支持不稳（这一点 cd-checkbox-group 已经踩过）。
- 2. 形态切换。
- inset=false（默认）：通铺，左右贴边，适合移动端设置页； inset=true：两侧留白 + 圆角卡片，适合 PC 后台与卡片式页面。
- 这两种形态在真实产品里都会出现，做成一个布尔量比让业务写覆盖样式省事。

## 关联

[cd-cell](/components/cell)
