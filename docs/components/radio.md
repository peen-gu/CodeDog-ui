---
title: Radio 单选框
---

# Radio 单选框

<div class="cd-api-tag">`radio` · 表单与录入</div>

配合 cd-radio-group 使用，支持 radio 与 button（分段控件）两种形态。

## 用法

<CdDemo id="radio-0"></CdDemo>

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
| `modelValue` | String \| Number \| Boolean | `''` | — | 独立用法下的选中态。组内用法请忽略它 |
| `value` | String \| Number \| Boolean | `''` | — | 组内用法下本项代表的值 |
| `label` | String | `''` | — | — |
| `disabled` | Boolean | `false` | — | — |
| `size` | String | `''` | — | small / default / large，不传则跟随所在组 |
| `variant` | String | `''` | — | radio / button，不传则跟随所在组 |
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

- 与 cd-checkbox 一样支持「独立 / 组内」两种用法，区别只在值语义： checkbox 组内是「集合是否包含我」，radio 组内是「当前值是否等于我」。
- button 形态的要点：圆点必须由 CSS 隐藏（display:none）， 而不是用 v-if 不渲染。
- 因为如果靠 v-if，组件在切换 variant 时 DOM 会重建，focus 和过渡都会丢；而且业务如果自己在外面套了 依赖子元素数量的逻辑也会受影响。
- 视觉状态变化就交给 CSS。

## 关联

[cd-radio-group](/components/radio-group)
