---
title: Input 输入框
---

# Input 输入框

<div class="cd-api-tag">`input` · 表单与录入</div>

支持清除按钮、密码可见切换、字数统计与前后缀插槽；type="textarea" 时切换为多行形态。placeholder 颜色必须走 placeholder-class——原生组件解析不了 CSS var()。

## 用法

<CdDemo id="input-0"></CdDemo>

```vue // 来自演示页 components
<cd-row :gutter="[16, 16]">
  <cd-col :span="{ xs: 24, md: 12 }">
    <view class="field">
      <text class="field__label">基础</text>
      <cd-input v-model="inputDemo.basic" placeholder="请输入内容" clearable />
    </view>
  </cd-col>

  <cd-col :span="{ xs: 24, md: 12 }">
    <view class="field">
      <text class="field__label">前置图标 + 后缀</text>
      <cd-input v-model="inputDemo.search" placeholder="搜索关键字" prefix-icon="search">
        <template #suffix>
          <text class="field__suffix">条</text>
        </template>
      </cd-input>
    </view>
  </cd-col>

  <cd-col :span="{ xs: 24, md: 12 }">
    <view class="field">
      <text class="field__label">密码（可切换可见）</text>
      <cd-input v-model="inputDemo.password" type="password" placeholder="请输入密码" clearable />
    </view>
  </cd-col>

  <cd-col :span="{ xs: 24, md: 12 }">
    <view class="field">
      <text class="field__label">金额（右对齐）</text>
      <cd-input v-model="inputDemo.amount" align="right" prefix-icon="chart" placeholder="0.00" />
    </view>
  </cd-col>

  <cd-col :span="24">
    <view class="field">
      <text class="field__label">多行文本（带字数统计）</text>
      <cd-input
        v-model="inputDemo.remark"
        type="textarea"
        :rows="3"
        :maxlength="120"
        show-word-limit
        placeholder="最多 120 字"
      />
    </view>
  </cd-col>

  <cd-col :span="{ xs: 24, md: 12 }">
    <view class="field">
      <text class="field__label">禁用 / 只读</text>
      <cd-input :model-value="'已锁定的内容'" disabled />
    </view>
  </cd-col>

  <cd-col :span="{ xs: 24, md: 12 }">
    <view class="field">
      <text class="field__label">尺寸档位</text>
      <view class="stack">
        <cd-input v-model="inputDemo.s1" size="small" placeholder="small" />
        <cd-input v-model="inputDemo.s2" size="medium" placeholder="medium" />
        <cd-input v-model="inputDemo.s3" size="large" placeholder="large" />
      </view>
    </view>
  </cd-col>
</cd-row>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | String \| Number | `''` | — | — |
| `type` | String | `'text'` | — | text / number / digit / idcard / password / textarea |
| `placeholder` | String | `''` | — | — |
| `disabled` | Boolean | `false` | — | — |
| `readonly` | Boolean | `false` | — | 只读：可看不可改。 必须同时透传给原生 input / textarea —— 只加一个「看起来只读」的类名， 用户照样能往里打字。 |
| `clearable` | Boolean | `false` | — | 有值且聚焦以外时显示清空按钮 |
| `maxlength` | Number \| String | `-1` | — | 最大长度。-1 表示不限制。 刻意不采用小程序默认的 140 —— 一个 UI 框架不该在用户没要求时截断输入。 |
| `showWordLimit` | Boolean | `false` | — | 显示 x/y 字数统计，仅在 maxlength > 0 时生效 |
| `prefixIcon` | String | `''` | — | — |
| `suffixIcon` | String | `''` | — | — |
| `size` | String | `'medium'` | — | small / medium / large |
| `align` | String | `'left'` | — | 输入内容对齐方式，金额类输入常用 right |
| `error` | Boolean | `false` | — | 外部传入的错误态（与表单校验态取或） |
| `rows` | Number | `3` | — | textarea 初始行数 |
| `autoHeight` | Boolean | `false` | — | textarea 随内容自动增高 |
| `showPasswordToggle` | Boolean | `true` | — | 密码类型是否显示「小眼睛」 |
| `focus` | Boolean | `false` | — | — |
| `confirmType` | String | `'done'` | — | 键盘右下角按钮文案：done / send / search / next / go |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `input` | 输入过程中实时触发 |
| `change` | 值变化时触发 |
| `focus` | 获得焦点 |
| `blur` | 失去焦点 |
| `confirm` | 确认 |
| `clear` | 点击清除按钮 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `prefix` | — | — |
| `suffix` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 跨端要点（每一条都是踩过的坑，不是理论）： 1. placeholder 颜色必须用 placeholder-class，不能用 placeholder-style。
- 小程序的原生 input 是原生组件，它解析样式时拿不到页面作用域的 CSS 变量， `placeholder-style="color: var(--cd-text-placeholder)"` 会直接失效； 而 placeholder-class 是一个真实类名，走正常样式层叠，变量能正确解析。
- 2. 密码态要同时给 type 和 password 两个属性。
- 小程序 input 没有 type="password"，它靠布尔属性 password； H5 靠 type="password"。
- 两个都给，两端各取所需。
- 3. textarea 在微信小程序里是原生组件，永远盖在最上层 —— 它无法被 popup / dialog 的遮罩遮挡，这是小程序架构限制，无解（除非用 cover-view）。
- 框架的处理方式是：弹层里尽量用 input，确需多行时接受这个限制，并在文档中写明。
- 4. 表单联动通过 inject 实现，且是「可选依赖」： inject(CD_FORM_ITEM_KEY, null) 的默认值必须是 null， 这样 cd-input 单独使用（不套 cd-form-item）时完全不报错。

## 关联

[cd-form-item](/components/form-item) · [cd-search-bar](/components/search-bar)
