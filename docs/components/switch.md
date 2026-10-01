---
title: Switch 开关
---

# Switch 开关

<div class="cd-api-tag">`switch` · 表单与录入</div>

两种状态之间的即时切换，支持加载态与自定义选中/未选中文案。已接入表单校验。

## 用法

```vue // 来自演示页 showcase
<view class="stack">
  <view class="row row--baseline">
    <cd-switch v-model="switchBasic" />
    <text class="body-text">基础：{{ switchBasic }}</text>
  </view>

  <view class="row row--baseline">
    <cd-switch v-model="switchValue" active-value="ON" inactive-value="OFF" />
    <text class="body-text">一对字符串值：{{ switchValue }}</text>
  </view>

  <view class="row row--baseline">
    <cd-switch v-model="switchText" active-text="开启" inactive-text="关闭" />
    <text class="body-text">带文字</text>
  </view>

  <view class="row row--baseline">
    <cd-switch v-model="s1" size="small" />
    <cd-switch v-model="s2" size="default" />
    <cd-switch v-model="s3" size="large" />
    <text class="body-text">三档尺寸</text>
  </view>

  <view class="row row--baseline">
    <cd-switch :model-value="true" disabled />
    <cd-switch :model-value="true" loading />
    <cd-switch v-model="switchGuard" :before-change="confirmSwitch" />
    <text class="body-text">禁用 / 加载中 / beforeChange 拦截</text>
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
| `modelValue` | Boolean \| String \| Number | `false` | — | — |
| `activeValue` | Boolean \| String \| Number | `true` | — | 打开时的值 |
| `inactiveValue` | Boolean \| String \| Number | `false` | — | 关闭时的值 |
| `disabled` | Boolean | `false` | — | — |
| `loading` | Boolean | `false` | — | 切换中，点击无效并显示转圈 |
| `size` | String | `'default'` | — | small / default / large |
| `activeColor` | String | `''` | — | 打开时的轨道色，不传用主色 |
| `inactiveColor` | String | `''` | — | 关闭时的轨道色 |
| `activeText` | String | `''` | — | 打开时的文字（需要在文字与轨道同排时传） |
| `inactiveText` | String | `''` | — | 关闭时的文字 |
| `beforeChange` | Function | `null` | — | 切换前的钩子，返回 false / reject 则取消切换。可以是 async 函数 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |
| `click` | 点击时触发 |

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 支持任意「一对值」而不是只支持布尔： v-model="enabled"                              → true / false v-model="status" active-value="on" inactive-value="off" 为什么不只做布尔？
- 因为后端接口里「启用状态」常常就是 '1'/'0' 或 'ON'/'OFF'， 只支持布尔会逼业务在 v-model 后面挂一层 computed 做转换， 每个用到开关的地方都要写一遍。
- 让组件吸收这个映射更合理。
- beforeChange 支持返回 Promise：确认弹窗这类「点了开关但要先问一句」的场景 需要能异步拦截。
- 返回 false 或 reject 就回弹，开关不会先动再弹回去 —— 开关「先动一下再弹回来」是很明显的体验瑕疵。

## 关联

[cd-checkbox](/components/checkbox)
