---
title: Form 表单
---

# Form 表单

<div class="cd-api-tag">`form` · 表单与录入</div>

表单容器，向下广播 rules、label 布局与整表禁用。validate() 返回 boolean 而非 reject——校验失败是业务分支，不是异常。

## 用法

<CdDemo id="form-0"></CdDemo>

```vue // 来自演示页 components
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

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `model` | Object | `() => ({})` | — | 表单数据对象 |
| `rules` | Object | `() => ({})` | — | 校验规则，按字段名索引 |
| `labelPosition` | String | `'top'` | — | top / left / right |
| `labelWidth` | String \| Number | `''` | — | 标签宽度，数字按 px 处理。仅 labelPosition 为 left / right 时生效 |
| `labelAlign` | String | `'left'` | — | left / right，标签文字对齐 |
| `size` | String | `'default'` | — | small / default / large —— 统一控制所有字段控件的密度 |
| `disabled` | Boolean | `false` | — | 一键禁用整个表单 |
| `showMessage` | Boolean | `true` | — | 是否显示错误信息 |
| `hideRequiredAsterisk` | Boolean | `false` | — | 隐藏必填星号（有些业务规范不允许出现星号） |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `validate` | 表单校验完成，返回是否通过 |
| `submit` | 表单提交 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## Expose

通过 `ref` 调用：

| 方法 / 属性 | 说明 |
|---|---|
| `validate` | — |
| `validateField` | — |
| `resetFields` | — |
| `clearValidate` | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 职责划分（这是整个表单体系最重要的一条约定）： cd-form      只做两件事：向下提供上下文、统一调度所有字段的校验。
- 它不渲染任何字段，也不知道字段长什么样。
- cd-form-item 负责单项：渲染标签、跑自己那几条规则、显示错误。
- cd-input 等  只负责交互，通过 inject 把 blur / change 事件回报给所属 form-item。
- 为什么向下传的是「函数」而不是「值」： ctx 是个普通对象，创建时若直接写 ctx.model = props.model， 业务一旦整体替换 model（这很常见，比如从接口拿到数据后 model.value = res.data）， ctx 里持有的还是旧对象，校验就会去查一个已经没人用的对象。
- 统一用 getModel() / getRules() 每次现取，这个坑就不存在了。

## 关联

[cd-form-item](/components/form-item) · [cd-input](/components/input)
