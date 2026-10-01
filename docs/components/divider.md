---
title: Divider 分割线
---

# Divider 分割线

<div class="cd-api-tag">`divider` · 通用</div>

水平/垂直双向、支持中间标题与虚线。用 border 画线，因此切换 dashed 只是换一个 border-style。

## 用法

```vue // 来自演示页 showcase
<cd-divider />

<cd-divider>居中文字</cd-divider>

<cd-divider position="left">左对齐</cd-divider>

<cd-divider position="right" dashed>右对齐虚线</cd-divider>

<view class="row row--baseline">
  <text class="body-text">文本</text>
  <cd-divider direction="vertical" />
  <text class="body-text">链接</text>
  <cd-divider direction="vertical" />
  <text class="body-text">更多</text>
</view>
```

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
| `direction` | String | `'horizontal'` | — | horizontal / vertical |
| `position` | String | `'center'` | — | 文字位置：left / center / right |
| `dashed` | Boolean | `false` | — | 虚线 |
| `spacing` | String \| Number | `''` | — | 上下（水平线）或左右（垂直线）留白，数字按 px |
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

- 结构上只有一个小技巧：无内容时只渲染「后置线」。
- 因为后置线是 flex:1，单独存在时自然铺满整行 —— 不需要为「纯线条」再写一套分支。
- 用 border 而不是 background 画线：这样 dashed / solid 只需要换 border-style，不用引入 repeating-linear-gradient（小程序 WebView 对 渐变的支持虽好，但虚线渐变在缩放时会糊）。
