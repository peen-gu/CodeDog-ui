---
title: Stepper 步进器
---

# Stepper 步进器

<div class="cd-api-tag">`stepper` · 表单与录入</div>

按住连加、边界钳制并抛出 overlimit。同时绑 touchstart 与 mousedown；手动输入不即时提交，避免输 15 时先经过 1。

## 用法

```vue // 来自演示页 showcase
<view class="stack">
  <view class="row row--baseline">
    <cd-stepper v-model="count" />
    <text class="body-text">基础：{{ count }}（长按试连加）</text>
  </view>

  <view class="row row--baseline">
    <cd-stepper v-model="price" :step="0.5" :min="0" :max="10" />
    <text class="body-text">步长 0.5，自动推断小数位：{{ price }}</text>
  </view>

  <view class="row row--baseline">
    <cd-stepper v-model="qty" :min="1" :max="5" :editable="false" size="small" />
    <text class="body-text">小号 + 禁止手输 + 1~5</text>
  </view>

  <view class="row row--baseline">
    <cd-stepper v-model="big" size="large" :field-width="64" />
    <text class="body-text">大号</text>
  </view>

  <view class="row row--baseline">
    <cd-stepper :model-value="3" disabled />
    <text class="body-text">禁用（边界外按钮变灰）</text>
  </view>
</view>
```

```vue // 来自演示页 showcase
<cd-form ref="formRef" :model="form" :rules="rules" label-position="top">
  <cd-form-item prop="plan" label="套餐">
    <cd-radio-group v-model="form.plan" variant="button">
      <cd-radio value="free" label="免费版" />
      <cd-radio value="pro" label="专业版" />
    </cd-radio-group>
  </cd-form-item>

  <cd-form-item prop="hobbies" label="兴趣（至少选 2 项）">
    <cd-checkbox-group v-model="form.hobbies">
      <cd-checkbox value="read" label="阅读" />
      <cd-checkbox value="code" label="编码" />
      <cd-checkbox value="run" label="跑步" />
    </cd-checkbox-group>
  </cd-form-item>

  <cd-form-item prop="seat" label="席位数量（1~10）" help="超过 5 个席位需要联系销售">
    <cd-stepper v-model="form.seat" :min="1" :max="10" />
  </cd-form-item>

  <cd-form-item prop="notify" label="接收通知" help="关闭后将不再收到任何提醒">
    <cd-switch v-model="form.notify" />
  </cd-form-item>

  <cd-form-item prop="channel" label="通知渠道">
    <cd-radio-group v-model="form.channel">
      <cd-radio value="sms" label="短信" />
      <cd-radio value="mail" label="邮件" />
    </cd-radio-group>
  </cd-form-item>

  <view class="row">
    <cd-button type="primary" @click="handleSubmit">提交</cd-button>
    <cd-button @click="handleReset">重置</cd-button>
    <cd-button type="text" @click="handleClear">清除校验</cd-button>
  </view>
</cd-form>

<cd-alert
  v-if="submitResult"
  class="submit-result"
  :type="submitResult.type"
  :title="submitResult.title"
  :description="submitResult.desc"
/>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Number | `0` | — | — |
| `min` | Number | `-Infinity` | — | — |
| `max` | Number | `Infinity` | — | — |
| `step` | Number | `1` | — | — |
| `precision` | Number | `-1` | — | 小数位数。默认 -1 表示「按 step 自动推断」： step=0.1 得到 1 位小数，step=1 得到 0 位。 |
| `integer` | Boolean | `false` | — | 强制整数（优先级高于 precision） |
| `disabled` | Boolean | `false` | — | — |
| `size` | String | `'default'` | — | small / default / large |
| `editable` | Boolean | `true` | — | 允许手动输入 |
| `fieldWidth` | String \| Number | `48` | — | 数值区的宽度 |
| `beforeChange` | Function | `null` | — | 加减前的钩子，返回 false / reject 则取消。可以是 async 函数 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |
| `overlimit` | 步进器到达边界 |
| `focus` | 获得焦点 |
| `blur` | 失去焦点 |

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 三个不那么显然的决定： 1. 用「按下」而不是「点击」触发加减。
- 因为要支持长按连加：如果同时绑

## 关联

[cd-input](/components/input)
