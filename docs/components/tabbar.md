---
title: Tabbar 底部标签栏
---

# Tabbar 底部标签栏

<div class="cd-api-tag">`tabbar` · 导航</div>

支持徽标与小红点，fixed 时自动等高占位，safeArea 走小程序安全区。选中值可以是 value 也可以是下标。

## 用法

<CdDemo id="tabbar-0"></CdDemo>

```vue // 来自演示页 extended
<view class="row">
  <text class="result__label">当前</text>
  <text class="result__value">{{ tabbarActive }}</text>
</view>

<view class="tabbar-preview">
  <cd-tabbar
    v-model="tabbarActive"
    :items="tabbarItems"
    :fixed="false"
    :safe-area="false"
    @change="onTabbarChange"
  />
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `items` | Array | `() => []` | — | 标签项：{ text, icon, badge, dot, value } value 缺省时用下标作为身份 |
| `modelValue` | String \| Number | `''` | — | 当前选中项的 value（或下标） |
| `fixed` | Boolean | `true` | — | — |
| `placeholder` | Boolean | `true` | — | fixed 时是否生成等高占位块 |
| `safeArea` | Boolean | `true` | — | 是否为底部安全区留白 |
| `border` | Boolean | `true` | — | — |
| `iconSize` | Number | `22` | — | — |
| `activeColor` | String | `''` | — | — |
| `inactiveColor` | String | `''` | — | — |
| `height` | Number | `52` | — | — |
| `zIndex` | Number | `1000` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `icon` | `item` / `index` / `active` | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 与 cd-navbar 是配对的：两者都要处理「系统留白」，方向相反 —— navbar 管顶部状态栏，tabbar 管底部安全区。
- 两个刻意的设计： 1. **选中态按 value 匹配而不是下标**。
- 业务路由常常按 name 跳转，写 `:model-value="'mine'"` 比记住第 3 个下标可靠； item 没给 value 时才退化成下标。
- 2. **badge 由容器统一渲染而不是让业务自己在图标上叠**。
- 徽标要相对图标右上角定位，放外面只会互相错位；这里是唯一知道图标位置的地方。
- 不接管路由跳转：只抛 change，跳不跳交给业务决定 —— 小程序 / H5 / Electron 三者的路由 API 不一样，在组件里写死反而会锁死用法。

## 关联

[cd-navbar](/components/navbar) · [cd-badge](/components/badge)
