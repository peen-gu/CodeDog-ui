---
title: Col 列
---

# Col 列

<div class="cd-api-tag">`col` · 布局与容器</div>

24 栅格的列，支持 xs/sm/md/lg/xl 五档响应式 span 与 gutter 间距。必须作为 cd-row 的子项使用。

## 用法

<CdDemo id="col-0"></CdDemo>

```vue // 来自演示页 components
<cd-row :gutter="[16, 16]">
  <cd-col v-for="n in 4" :key="`a-${n}`" :span="{ xs: 24, sm: 12, md: 6 }">
    <view class="grid-box"><text class="grid-box__text">xs24 / sm12 / md6</text></view>
  </cd-col>
</cd-row>

<cd-row :gutter="[16, 16]" class="grid-gap-top">
  <cd-col :span="8"><view class="grid-box grid-box--brand"><text class="grid-box__text">span 8</text></view></cd-col>
  <cd-col :span="8"><view class="grid-box"><text class="grid-box__text">span 8</text></view></cd-col>
  <cd-col :span="8"><view class="grid-box grid-box--brand"><text class="grid-box__text">span 8</text></view></cd-col>
</cd-row>

<cd-row :gutter="[16, 16]" class="grid-gap-top">
  <cd-col :span="6" :offset="6">
    <view class="grid-box grid-box--soft"><text class="grid-box__text">span 6 + offset 6</text></view>
  </cd-col>
  <cd-col :span="6"><view class="grid-box"><text class="grid-box__text">span 6</text></view></cd-col>
</cd-row>

<cd-row :gutter="[16, 16]" justify="between" class="grid-gap-top">
  <cd-col :span="6"><view class="grid-box"><text class="grid-box__text">between</text></view></cd-col>
  <cd-col :span="6"><view class="grid-box"><text class="grid-box__text">between</text></view></cd-col>
  <cd-col :span="6"><view class="grid-box"><text class="grid-box__text">between</text></view></cd-col>
</cd-row>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `span` | Number \| String \| Object | `24` | — | 列宽，1-24；0 表示隐藏。也支持响应式对象 |
| `offset` | Number \| String \| Object | `0` | — | 左侧偏移列数，同样支持响应式对象 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

无

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 两个关键决定： 1. 宽度全部在**编译期**算好，不用运行期 calc。
- `calc(8 / 24 * 100%)` 这种写法在小程序 WXSS 里并不总是被正确求值， 而栅格宽度是布局根基，不能赌。
- 代价是产出 250 条静态规则， gzip 后约 1KB，换来确定性，非常划算。
- 2. 响应式用媒体查询类名，而不是 JS 监听断点改内联样式。
- 前者是纯 CSS，首屏就没有布局跳动；后者要等 JS 执行完才正确， 在 PC 上会看到明显的「先竖排后横排」闪动。
- 也就是：能用 CSS 表达的响应式，绝不交给 JS。
- span 两种写法： :span="12"                        固定 12/24 :span="{ xs: 24, md: 12, lg: 8 }" 移动端满宽、平板一半、桌面三分之一

## 关联

[cd-row](/components/row)
