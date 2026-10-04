---
title: RadioGroup 单选组
---

# RadioGroup 单选组

<div class="cd-api-tag">`radio-group` · 表单与录入</div>

单选容器，统一触发 change 并向下广播选中态与禁用。

## 用法

<CdDemo id="radio-group-0"></CdDemo>

```vue // 来自演示页 showcase
<cd-radio-group v-model="plan">
  <cd-radio value="free" label="免费版" />
  <cd-radio value="pro" label="专业版" />
  <cd-radio value="team" label="团队版" />
</cd-radio-group>

<view class="row row--baseline">
  <text class="body-text">当前：{{ plan }}</text>
</view>

<cd-divider position="left">分段控件形态</cd-divider>

<view class="row">
  <cd-radio-group v-model="range" variant="button" size="small">
    <cd-radio value="day" label="今日" />
    <cd-radio value="week" label="本周" />
    <cd-radio value="month" label="本月" />
    <cd-radio value="year" label="本年" />
  </cd-radio-group>
</view>

<view class="row row--baseline">
  <cd-radio-group v-model="size" variant="button">
    <cd-radio value="s" label="小" />
    <cd-radio value="m" label="中" />
    <cd-radio value="l" label="大" />
  </cd-radio-group>
</view>

<cd-radio-group v-model="channel" direction="vertical">
  <cd-radio value="sms" label="短信通知" />
  <cd-radio value="mail" label="邮件通知" />
  <cd-radio value="none" label="不接收（禁用）" disabled />
</cd-radio-group>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | String \| Number \| Boolean | `''` | — | 当前选中值 |
| `disabled` | Boolean | `false` | — | — |
| `size` | String | `''` | — | small / default / large |
| `direction` | String | `'horizontal'` | — | horizontal / vertical |
| `variant` | String | `'radio'` | — | radio / button |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 结构与 cd-checkbox-group 对称，但状态是「单个值」而不是数组， 所以没有 min/max 的概念，选中新值天然就是取消旧值。
- variant 支持两种视觉： radio  —— 圆点 + 文字，适合内容型选项（一段描述较长的选项） button —— 分段控件，选项少且名字短时占位更省，PC 上尤其常见 视觉差异完全由 CSS 承担，DOM 结构只多一个类名。

## 关联

[cd-radio](/components/radio)
