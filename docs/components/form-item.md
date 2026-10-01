---
title: FormItem 表单项
---

# FormItem 表单项

<div class="cd-api-tag">`form-item` · 表单与录入</div>

单个字段的上下文提供者：向下给控件传 value/disabled，向上回报 blur/change 触发校验。自定义控件只要 useField() 就能接入同一套校验链。

## 用法

```vue // 来自演示页 components
<template #extra>
  <cd-button size="small" @click="toggleLabelPosition">
    {{ labelPosition === 'top' ? '改成左标签' : '改成上标签' }}
  </cd-button>
</template>

<cd-form
  ref="formRef"
  :model="form"
  :rules="rules"
  :label-position="labelPosition"
  :label-width="96"
  :disabled="formDisabled"
>
  <cd-form-item label="用户名" prop="username">
    <cd-input v-model="form.username" placeholder="4-16 位字母或数字" clearable />
  </cd-form-item>

  <cd-form-item label="手机号" prop="phone">
    <cd-input v-model="form.phone" type="number" :maxlength="11" placeholder="11 位手机号" clearable />
  </cd-form-item>

  <cd-form-item label="邮箱" prop="email" help="选填。留空则不校验格式。">
    <cd-input v-model="form.email" placeholder="name@example.com" clearable />
  </cd-form-item>

  <cd-form-item label="年龄" prop="age">
    <cd-input v-model="form.age" type="number" align="right" placeholder="18 - 120" />
  </cd-form-item>

  <cd-form-item label="交付方式" prop="delivery">
    <cd-select v-model="form.delivery" placeholder="请选择" clearable :options="deliveryOptions" />
  </cd-form-item>

  <cd-form-item label="备注" prop="remark">
    <cd-input v-model="form.remark" type="textarea" :rows="2" :maxlength="50" show-word-limit placeholder="最多 50 字" />
  </cd-form-item>
</cd-form>

<view class="row form-actions">
  <cd-button type="primary" :loading="submitting" @click="handleSubmit">提交校验</cd-button>
  <cd-button @click="handleReset">重置</cd-button>
  <cd-button :type="formDisabled ? 'warning' : 'info'" plain @click="formDisabled = !formDisabled">
    {{ formDisabled ? '解除禁用' : '整体禁用' }}
  </cd-button>
</view>

<view class="result-block">
  <text class="result-block__label">表单数据</text>
  <text class="cd-code">{{ formSnapshot }}</text>
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
| `prop` | String | `''` | — | 对应 form.model 中的字段名，支持 'user.name' 嵌套写法 |
| `label` | String | `''` | — | — |
| `labelPosition` | String | `''` | — | 覆盖表单级的标签位置 top / left / right |
| `labelWidth` | String \| Number | `''` | — | 覆盖表单级的标签宽度 |
| `rules` | Object \| Array | `() => []` | — | 本项独有的规则，会与 form.rules[prop] 合并（表单级在前，本项在后） |
| `required` | Boolean | `false` | — | 强制标记必填（即使规则里没写 required），用于「必填但无规则」的场景 |
| `showMessage` | Boolean | `true` | — | 覆盖表单级的错误提示开关 |
| `help` | String | `''` | — | 常驻帮助文案，出错时让位给错误提示 |
| `error` | String | `''` | — | 外部直接指定错误文案（例如接口返回的字段级错误），非空时优先展示 |
| `disabled` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |

## Events

无

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## Expose

通过 `ref` 调用：

| 方法 / 属性 | 说明 |
|---|---|
| `validate` | — |
| `resetField` | — |
| `clearValidate` | — |
| `validateState` | — |
| `validateMessage` | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 它是「校验」这个动作真正发生的地方：cd-form 只是调度者。
- 三个值得说明的实现决定： 1. 谁触发校验。
- cd-input 通过 inject 拿到本组件提供的字段上下文， 在 blur / change 时回调。
- 这条链路让「控件」与「校验」解耦 —— cd-form-item 完全不知道 slot 里塞的是 input 还是 select 还是自定义组件， 任何自定义控件只要回调 onFieldBlur/onFieldChange 就能接入表单。
- 2. change 触发的策略。
- 规则里显式声明了 trigger:'change' 才逐字校验； 没声明的，只在**当前已处于错误态**时重新校验。
- 这样既满足「填错后边改边消错」，又不会在用户第一次输入时就跳红。
- 3. 并发防护。
- 改一个字就发一次校验，异步规则可能后发先至。
- 用自增序号丢弃过期结果，避免「错误提示显示的是上一个值的校验结果」。

## 关联

[cd-form](/components/form)
