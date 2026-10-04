---
title: FormRender Schema 表单引擎
---

# FormRender Schema 表单引擎

<div class="cd-api-tag">`form-render` · 表单与录入</div>

给一份字段描述数组（schema）和一个对象，自动渲染整张表单：内建 12 种控件、显隐与禁用联动、栅格布局、默认值注入，校验直接复用 cd-form 那套规则。适合中后台里大量「结构相似、字段不同」的表单页。

## 用法

<CdDemo id="form-render-0"></CdDemo>

```vue // 来自演示页 showcase
<view class="row">
  <cd-button size="small" type="primary" @click="submitSchema">提交校验</cd-button>
  <cd-button size="small" @click="resetSchema">重置</cd-button>
</view>

<!-- 模型用 ref({}) 声明。若写成 const reactive({}) 再 v-model 绑定，
     Vue 会编译出对 const 的赋值，运行时抛 Assignment to constant variable -->
<cd-form-render
  ref="schemaRef"
  :model-value="schemaModel"
  :schema="schemaFields"
  :cols="2"
  :gutter="12"
  label-position="top"
/>

<text class="hint">{{ schemaResult }}</text>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Object | `() => ({})` | — | 表单数据。必须是响应式对象（reactive({}) 或 ref({}) 的 .value）。 |
| `schema` | Array | `() => []` | — | 字段描述数组。 |
| `rules` | Object | `() => ({})` | — | 表单级规则（按字段名索引），会与 schema 内各字段的 rules 合并。 合并顺序：本处在前，字段自带在后。 |
| `cols` | Number | `1` | — | 每行几列。窄屏（移动端）强制降为 1 列 |
| `gutter` | Number | `12` | — | 列间距与行间距（px） |
| `labelPosition` | String | `'top'` | — | top / left / right |
| `labelWidth` | String \| Number | `''` | — | — |
| `labelAlign` | String | `'left'` | — | — |
| `size` | String | `'default'` | — | small / default / large —— 主要影响间距与内建控件的默认尺寸档位 |
| `disabled` | Boolean | `false` | — | 一键禁用整张表单 |
| `showMessage` | Boolean | `true` | — | — |
| `hideRequiredAsterisk` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |
| `validate` | 表单校验完成，返回是否通过 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `header` | `model` / `schema` | — |
| `widget` | `field` / `value` / `disabled` / `set-value` | — |
| `footer` | `model` / `validate` / `reset-fields` | — |

## Expose

通过 `ref` 调用：

| 方法 / 属性 | 说明 |
|---|---|
| `validate` | — |
| `validateField` | — |
| `resetFields` | — |
| `clearValidate` | — |
| `submit` | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 一句话：给它一份 schema（字段描述数组）和一个对象，它把整张表单渲染出来， 并复用 cd-form / cd-form-item 已有的校验与错误展示能力。
- 为什么不用 &lt;component :is>： uni-app 的 mp-weixin 编译器在**编译期**就拒绝动态组件，报 X_DYNAMIC_COMPONENT_NOT_SUPPORTED（2026-10-03 在本仓库 playground 实测； 同一份代码 build:h5 是通过的，所以这是 mp 端专属限制，不是全平台限制）。
- 同理 v-is、v-on="{...}" 也都被禁。
- → 本组件四端统一走「v-for 遍历 + 每条字段内 v-if 枚举控件」， 不在 H5 端单独用动态组件，避免两端行为分叉。
- 为什么值不走 v-model： 字段值落在 model[path] 上（支持 'user.name' 这类嵌套路径）， v-model 无法直接绑到动态路径。
- 统一走「读 getValue(field) 、 写 setValue(field, value)」这一对方法，读写都经过路径解析。
- schema 里每个字段支持这些键： prop          字段名（必填，支持 'user.name' 嵌套路径） label         标签文案 widget        控件类型，见下方枚举 props         透传给该控件的属性（v-bind 展开，modelValue / disabled 除外） defaultValue  默认值，只在该字段当前为空时写入，不覆盖已有输入 required      强制标记必填 rules         本字段校验规则，与表单级 rules 合并（表单级在前） help          常驻帮助文案 span          栅格占几列，默认 1，上限是 cols visible       是否渲染，布尔或 (model) => boolean，缺省为 true disabled      是否禁用，布尔或 (model) => boolean，缺省为 false labelPosition / labelWidth  覆盖表单级标签布局 emptyText     widget 为 text 且值为空时显示的占位，默认 '-' widget 枚举：input（props.type=textarea 时为多行）/ select / switch / checkbox / radio / date / time / slider / rate / stepper / upload / text（纯展示）/ custom（走 widget 插槽） 为什么改 model 是「原地写」而不是「换新对象」： cd-form-item 的 resetFields 走的是 setValueByPath(getModel(), prop, initialValue)， 它依赖 form.getModel() 每次现取同一引用。
- 若这里每次都 emit 一个新对象， 表单项的「初始值快照」会和当前 model 脱钩，reset 就还原不回去。
- 模型对象怎么声明（这是个会炸的坑，实测踩过）： 用 `const model = ref({})` + `v-model="model"`    ✅ 用 `const model = reactive({})` + `v-model="model"` ❌ 后者 Vue 会编译成 `model = $event`，而 const 不可赋值，运行时抛 TypeError: Assignment to constant variable。
- 若坚持用 reactive，就把绑定写成 `:model-value="model"`（不要 v-model）。

## 关联

[cd-form](/components/form) · [cd-form-item](/components/form-item)
