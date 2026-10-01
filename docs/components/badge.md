---
title: Badge 徽标
---

# Badge 徽标

<div class="cd-api-tag">`badge` · 数据展示</div>

无插槽时是独立标签，有插槽时自动变成角标。支持数字封顶（99+）与小红点形态。

## 用法

```vue // 来自演示页 showcase
<view class="row row--baseline">
  <cd-badge :value="5">
    <cd-button size="small">
      <template #icon><cd-icon name="bell" :size="16" /></template>
      通知
    </cd-button>
  </cd-badge>

  <cd-badge :value="128">
    <cd-avatar text="张三" :size="36" />
  </cd-badge>

  <cd-badge is-dot outlined>
    <cd-avatar icon="user" :size="36" />
  </cd-badge>

  <cd-badge value="NEW" type="success">
    <cd-button size="small">新功能</cd-button>
  </cd-badge>

  <cd-badge :value="0">
    <cd-button size="small">值为 0 不显示</cd-button>
  </cd-badge>

  <cd-badge :value="0" show-zero>
    <cd-button size="small">show-zero</cd-button>
  </cd-badge>

  <cd-badge :value="7" is-dot />
  <cd-badge :value="7" />
  <cd-badge :value="7" type="success" />
  <cd-badge :value="7" type="warning" />
  <cd-badge :value="7" type="info" />
</view>
```

```vue // 来自演示页 site
<template #extra>
  <cd-badge value="62" />
</template>

<view class="preview">
  <view class="preview__row">
    <cd-button type="primary" size="small">主操作</cd-button>
    <cd-button size="small" plain>次级</cd-button>
    <cd-button type="danger" size="small" round>危险</cd-button>
  </view>

  <view class="preview__row">
    <cd-tag type="primary" size="small" round>primary</cd-tag>
    <cd-tag type="success" size="small" round>success</cd-tag>
    <cd-tag type="warning" size="small" round>warning</cd-tag>
    <cd-tag type="info" size="small" plain round>info</cd-tag>
  </view>

  <view class="preview__row preview__row--between">
    <cd-switch v-model="demoSwitch" />
    <cd-progress :percentage="72" />
  </view>

  <view class="preview__row">
    <cd-input v-model="demoText" placeholder="cd-input 输入中…" />
  </view>
</view>

<template #footer>
  <text class="preview__foot">切换右上角「亮色 / 暗色」，所有元素随令牌即时变化</text>
</template>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `value` | String \| Number | `''` | — | 展示内容。数字会自动按 max 裁剪，字符串原样展示 |
| `max` | Number | `99` | — | 数字上限，超过显示 max+ |
| `isDot` | Boolean | `false` | — | 小圆点模式，不展示内容 |
| `hidden` | Boolean | `false` | — | 强制隐藏（不需要用 v-if 销毁组件时用） |
| `showZero` | Boolean | `false` | — | 值为 0 时是否展示。默认不展示 —— 0 条未读通常不值得打扰用户 |
| `type` | String | `'danger'` | — | danger / primary / success / warning / info |
| `outlined` | Boolean | `false` | — | 描边形态，用于徽标压在彩色底上时保证可辨识 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click` | 点击时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 两种用法共用一套 DOM，靠「有没有默认插槽」区分： - 有插槽 → 角标模式：包裹子元素，徽标绝对定位到右上角 - 无插槽 → 独立模式：徽标就是一个普通的内联标签 为什么不拆成两个组件？
- 因为二者的数字裁剪、隐藏逻辑、颜色取用完全一致， 拆开会产生两份需要同步维护的判断逻辑。
- 用一个 wrapper 类切换定位方式更省事。
- 一个细节：数字超过 max 时显示 `max+`，这个判断必须放在 computed 里而不是模板里， 因为 value 可能是字符串（如 'new'），`>` 比较前需要先确认它确实是数字。

## 关联

[cd-tag](/components/tag) · [cd-grid-item](/components/grid-item)
