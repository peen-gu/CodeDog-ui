---
title: 表单校验
---

# 表单校验

## 基本结构

`cd-form` 提供表单上下文，`cd-form-item` 提供字段上下文。**校验由 form-item 触发，控件只负责回报时机。**

```vue
<cd-form ref="formRef" :model="form" :rules="rules">
  <cd-form-item prop="phone" label="手机号">
    <cd-input v-model="form.phone" :maxlength="11" clearable />
  </cd-form-item>
</cd-form>
```

```js
import { PATTERNS } from '@/uni_modules/codedog-ui'

const rules = {
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: PATTERNS.mobile, message: '手机号格式不正确' },
  ],
  age: [
    { required: true },
    { validator: (v) => Number(v) >= 18 || '年龄不能小于 18 岁' },
  ],
}

const passed = await formRef.value.validate()
```

::: warning validate 返回 boolean 而不是 reject
校验失败是**业务分支**，不是异常。返回 `false` 让你能自然写 `if (passed)`，而不是被迫 try/catch。
:::

`validate()` 失败时还会把页面滚到第一个出错的字段。

## 规则成员

| 字段 | 说明 |
|---|---|
| `required` | 必填，空值的判定见 `isValueEmpty`（支持空数组） |
| `pattern` | 正则 |
| `min` / `max` | 字符串长度或数字大小，按值类型自动判定 |
| `enum` | 枚举白名单 |
| `validator` | 自定义函数，返回 `true` / 错误文案字符串 / Promise |
| `trigger` | `'blur'` / `'change'`，默认两者都触发 |
| `message` | 失败文案 |

内置 `PATTERNS`：`mobile`、`email`、`idCard`、`url`、`number`、`tel`、`password`、`postCode`、`ip`。

## 自定义控件怎么接进来

不需要继承任何东西。控件里调用 `useField()`，回报变化并读取表单级禁用：

```js
import { useField } from '@/uni_modules/codedog-ui'

const { field, formDisabled, notifyChange, notifyBlur } = useField()

function onInput(e) {
  const v = e.detail.value
  emit('update:modelValue', v)
  notifyChange(v)          // ← 上报，触发 change 时机的校验
}

function onBlur() {
  notifyBlur(props.modelValue)
}
```

`formDisabled` 必须一并尊重——`<cd-form disabled>` 要对所有控件生效，包括第三方封装的。

框架内的 `cd-input` / `cd-select` / `cd-switch` / `cd-slider` / `cd-rate` / `cd-stepper` / `cd-search-bar` / `cd-checkbox` / `cd-radio` 都走这一条接线。

## 组的校验只触发一次

`cd-checkbox-group` / `cd-radio-group` 的 change 事件在**组上**触发，而不是每个子项各触发一次。

否则勾选一次会同时跑 N 次校验，错误提示会被反复覆盖，动画也会抖。

## Expose

| 组件 | 方法 |
|---|---|
| `cd-form` | `validate()` / `resetFields()` / `clearValidate()` |
| `cd-form-item` | `validate()` / `resetField()` / `clearValidate()` |

## 已知边界

`prop` 使用路径写法（如 `'user.phone'`）时，`validate()` 的自动滚动依赖 `cd-form-item` 的节点位置，
若表单项被折叠面板隐藏，`createSelectorQuery` 量不到位置，滚动会被跳过（校验本身照常生效）。
