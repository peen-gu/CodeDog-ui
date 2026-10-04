---
title: ActionSheet 动作面板
---

# ActionSheet 动作面板

<div class="cd-api-tag">`action-sheet` · 反馈与浮层</div>

移动端底部动作面板，支持 disabled / danger / description 三种行态。复用 wd-popup + useWotScope 保证主题作用域。

## 用法

<CdDemo id="action-sheet-0"></CdDemo>

```vue // 来自演示页 widgets
<view class="row">
  <cd-button size="small" @click="sheetVisible = true">打开动作面板</cd-button>
  <cd-button size="small" type="danger" plain @click="sheetDangerVisible = true">含危险项</cd-button>
</view>

<cd-action-sheet
  v-model="sheetVisible"
  title="选择操作"
  description="选择一个动作，或者取消"
  :actions="sheetActions"
  @select="onSheetSelect"
/>

<cd-action-sheet
  v-model="sheetDangerVisible"
  title="确认要执行吗"
  :actions="sheetDangerActions"
  @select="onSheetSelect"
>
  <template #header>
    <text class="sheet-header">这一份头部是自定义插槽，标题与描述都由业务书写</text>
  </template>
</cd-action-sheet>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Boolean | `false` | — | — |
| `title` | String | `''` | — | — |
| `description` | String | `''` | — | — |
| `actions` | Array | `() => []` | — | [{ name, label, icon, description, color, disabled, danger }] |
| `cancelText` | String | `'取消'` | — | — |
| `showCancel` | Boolean | `true` | — | — |
| `maskClosable` | Boolean | `true` | — | — |
| `safeArea` | Boolean | `true` | — | 底部安全区适配 |
| `zIndex` | Number | `2200` | — | — |
| `beforeClose` | Function | `null` | — | — |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `select` | 选中某一项 |
| `cancel` | 取消 |
| `close` | 关闭时（动画结束后） |
| `open` | 打开时 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `header` | — | — |
| `default` | — | 默认插槽 |
| `cancel` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 复用 wd-popup 的遮罩 / 上滑动画 / 滚动锁 / root-portal， 主题作用域由 useWotScope 补齐 —— 与 cd-dialog / cd-drawer 同一套约定 （弹层被传送到 body 后会脱离页面主题作用域，必须自己带上）。
- 两个移动端专属的设计细节： 1. 取消按钮与动作列表之间有一条「视觉间隙」而不是一条分隔线。
- 这是 iOS 动作面板的经典做法，语义是「这一块和上面不是一类」， 比一根线更能表达「取消不属于任何动作」。
- 2. 危险动作不是靠传一个颜色值，而是提供了一个 danger 布尔。
- 因为「销毁」这类动作要同时处理：文字变红、按压反馈变红、 且永远排在用户预期的位置。
- 让业务每处都写 style 迟早会漏。
- 面板固定在底部，不做 PC 形态适配 —— 动作面板本身就是移动端的交互范式， 在 PC 上应当改用 cd-dropdown 或 cd-popover（文档里有写）。

## 关联

[cd-dialog](/components/dialog) · [cd-select](/components/select)
