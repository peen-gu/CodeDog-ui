---
title: Tag 标签
---

# Tag 标签

<div class="cd-api-tag">`tag` · 数据展示</div>

type 只声明颜色、形态决定用法，因此新增语义色只需两行 CSS。尺寸类名统一带 size- 前缀——type 与 size 都有 default，不带前缀会撞名。

## 用法

```vue // 来自演示页 showcase
<view class="row">
  <cd-tag label="默认" />
  <cd-tag type="primary" label="进行中" />
  <cd-tag type="success" label="已完成" />
  <cd-tag type="warning" label="待审核" />
  <cd-tag type="danger" label="已驳回" />
  <cd-tag type="info" label="已归档" />
</view>

<cd-divider position="left">浅底形态</cd-divider>

<view class="row">
  <cd-tag plain type="primary" label="浅底" />
  <cd-tag plain type="success" label="浅底" />
  <cd-tag plain type="warning" label="浅底" />
  <cd-tag plain type="danger" label="浅底" />
</view>

<cd-divider position="left">尺寸 / 图标 / 可关闭 / 胶囊</cd-divider>

<view class="row row--baseline">
  <cd-tag size="small" type="primary" label="小号" />
  <cd-tag size="default" type="primary" label="默认" />
  <cd-tag size="large" type="primary" label="大号" />
  <cd-tag type="primary" icon="tag" label="带图标" />
  <cd-tag round type="success" label="胶囊形" />
  <cd-tag
    v-for="(item, index) in closableTags"
    :key="item"
    type="info"
    label=""
    closable
    @close="removeTag(index)"
  >
    {{ item }}
  </cd-tag>
  <cd-tag type="danger" label="禁用" disabled closable />
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
| `type` | String | `'default'` | — | default / primary / success / warning / danger / info |
| `size` | String | `'default'` | — | small / default / large |
| `plain` | Boolean | `false` | — | 浅底描边形态，视觉更弱，适合大量并列 |
| `round` | Boolean | `false` | — | 圆角胶囊形态 |
| `closable` | Boolean | `false` | — | 显示关闭按钮。关闭只是「请求关闭」，是否真的移除由业务决定 |
| `disabled` | Boolean | `false` | — | — |
| `label` | String | `''` | — | 文字。也可以用默认插槽传更复杂的内容 |
| `icon` | String | `''` | — | 左侧图标名 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click` | 点击时触发 |
| `close` | 关闭时（动画结束后） |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 一个说明：为什么用 `--cd-tag-main` / `--cd-tag-soft` 两个内部变量， 而不是给每个 type 写一整套 background/color/border？
- 因为标签有两种形态：实心（filled）与浅底（plain）。
- 如果按 type 写死颜色，就得写 6 个 type × 2 种形态 = 12 组规则。
- 改成「type 只负责声明两个颜色，形态负责决定怎么用」之后， 规则数降到 6 + 2，而且以后新增 type 只需加一行。
- 这是 CSS 变量在组件内部最实用的用法 —— 把「变数」和「用法」拆开。

## 关联

[cd-badge](/components/badge)
