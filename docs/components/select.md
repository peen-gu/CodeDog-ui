---
title: Select 选择器
---

# Select 选择器

<div class="cd-api-tag">`select` · 表单与录入</div>

移动端呈现底部动作面板、PC 呈现下拉面板。复用 wd-action-sheet 内核并做主题桥接，PC 端支持键盘导航。

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
<view class="row">
  <cd-button size="small" @click="formDisabled = !formDisabled">
    {{ formDisabled ? '解除禁用' : '禁用下方表单' }}
  </cd-button>
</view>

<cd-form :model="disabledModel" :disabled="formDisabled" label-position="top">
  <cd-form-item prop="name" label="名称">
    <cd-input v-model="disabledModel.name" placeholder="输入框" />
  </cd-form-item>

  <cd-form-item prop="type" label="类型（下拉框）">
    <cd-select
      v-model="disabledModel.type"
      :options="typeOptions"
      placeholder="下拉框"
    />
  </cd-form-item>

  <cd-form-item prop="enabled" label="启用">
    <cd-switch v-model="disabledModel.enabled" />
  </cd-form-item>

  <cd-form-item prop="count" label="数量">
    <cd-stepper v-model="disabledModel.count" :min="0" />
  </cd-form-item>
</cd-form>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | String \| Number \| Boolean | `''` | — | — |
| `options` | Array | `() => []` | — | 选项列表 |
| `placeholder` | String | `'请选择'` | — | — |
| `title` | String | `''` | — | 移动端面板标题，不传则用 placeholder |
| `disabled` | Boolean | `false` | — | — |
| `clearable` | Boolean | `false` | — | 有值时是否显示一键清空 |
| `mode` | String | `'auto'` | — | 'auto' \| 'mobile' \| 'desktop' |
| `placement` | String | `'bottom'` | — | 桌面端下拉展开方向 |
| `size` | String | `'medium'` | — | 控件尺寸档位，透传给根节点类名，由 CSS 变量控制实际高度 |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |
| `clear` | 点击清除按钮 |
| `open` | 打开时 |
| `close` | 关闭时（动画结束后） |

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 这是「同一组件、两种交互模型」最典型的例子： 移动端 → 底部动作面板（wd-action-sheet） 手指够得到、选项高度 52px、有取消按钮、贴合安全区 桌面端 → 下拉面板（自研） 鼠标悬停高亮、方向键移动、回车选中、点击外部关闭 为什么桌面端不复用 wd-popup： 下拉面板需要「无遮罩 + 锚定在触发器下方 + 不阻塞页面其他交互」， 而 wd-popup 是模态语义（遮罩 + 滚动锁 + 全屏定位），套用反而更麻烦。
- 一个重要的架构简化：PC 形态只可能出现在 H5（isPC 的判定里带了 isH5）， 所以桌面端分支可以放心使用 document 级别的键盘监听， 不必为小程序写一套等价实现。

## 关联

[cd-dropdown](/components/dropdown) · [cd-action-sheet](/components/action-sheet)
