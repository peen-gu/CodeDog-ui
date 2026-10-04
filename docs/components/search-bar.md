---
title: SearchBar 搜索框
---

# SearchBar 搜索框

<div class="cd-api-tag">`search-bar` · 表单与录入</div>

无边框药丸形搜索容器，右侧可挂动作位（取消/搜索）。已接入 useField 校验链。

## 用法

<CdDemo id="search-bar-0"></CdDemo>

```vue // 来自演示页 widgets
<view class="stack">
  <cd-search-bar v-model="keyword" placeholder="搜索组件 / 文档" @search="log(`搜索：${keyword}`)" />

  <cd-search-bar
    v-model="keyword2"
    shape="square"
    align="center"
    show-action
    action-text="取消"
    placeholder="输入后右侧出现清空按钮"
    @action="handleSearchAction"
  />

  <cd-search-bar v-model="keyword3" disabled placeholder="禁用状态" />
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | String | `''` | — | — |
| `placeholder` | String | `'搜索'` | — | — |
| `shape` | String | `'round'` | — | square / round |
| `disabled` | Boolean | `false` | — | — |
| `readonly` | Boolean | `false` | — | — |
| `clearable` | Boolean | `true` | — | 有值时显示一键清空 |
| `showAction` | Boolean | `false` | — | 右侧动作按钮 |
| `actionText` | String | `'取消'` | — | — |
| `align` | String | `'left'` | — | 空值且未聚焦时文字居中 |
| `maxlength` | Number \| String | `-1` | — | — |
| `confirmType` | String | `'search'` | — | — |
| `searchIcon` | String | `'search'` | — | — |
| `focus` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `input` | 输入过程中实时触发 |
| `search` | 提交搜索 |
| `clear` | 点击清除按钮 |
| `action` | 点击右侧动作位 |
| `focus` | 获得焦点 |
| `blur` | 失去焦点 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `prefix` | — | — |
| `action` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 和 cd-input 的分工：input 是「通用输入」，search-bar 是「一个带图标的 药丸形容器 + 右侧动作位」，视觉约定完全不同（无边框、有底色、圆角大）。
- 把它做成一个独立组件而不是「input 的又一个 type」， 是因为它的默认形态本身就是产品语义的一部分。
- 一个刻意保留的细节：placeholder 的颜色同样走 placeholder-class 而不是 placeholder-style —— 小程序的原生 input 解析不了带 CSS 变量的内联样式， 这个坑在 cd-input 那里已经踩过一次。
- align="center"（空且未聚焦时文字居中）在部分小程序基础库上对原生 input 的 text-align 支持不完全，会退化成左对齐。
- 这是可接受的降级： 居中是「更好看」，左对齐是「还能用」，不值得为它引入测量与手动定位。

## 关联

[cd-input](/components/input)
