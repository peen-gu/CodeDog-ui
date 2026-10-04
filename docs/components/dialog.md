---
title: Dialog 对话框
---

# Dialog 对话框

<div class="cd-api-tag">`dialog` · 反馈与浮层</div>

双形态弹窗：移动端从底部升起成抽屉、PC 居中模态。复用 wd-popup 内核，支持 Esc 关闭与 beforeClose 异步拦截。

## 用法

<CdDemo id="dialog-0"></CdDemo>

```vue
<cd-button size="small" @click="visible = true">打开对话框</cd-button>
<cd-dialog
  v-model="visible"
  title="删除确认"
  content="删除后不可恢复，确定继续吗？"
  @confirm="visible = false"
  @cancel="visible = false"
/>
```

<CdDemo id="dialog-1"></CdDemo>

```vue
<cd-button size="small" type="danger" @click="delVisible = true">删除这个项目</cd-button>
<cd-dialog
  v-model="delVisible"
  title="危险操作"
  content="删除后无法恢复，确认要继续吗？"
  confirm-text="确认删除"
  :confirm-loading="submitting"
  @confirm="runDelete"
  @cancel="delVisible = false"
/>
<cd-tag v-if="done" type="success">已模拟删除完成</cd-tag>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Boolean | `false` | — | — |
| `title` | String | `''` | — | — |
| `content` | String | `''` | — | 不使用默认插槽时的纯文本内容 |
| `mode` | String | `'auto'` | — | 'auto' \| 'mobile' \| 'desktop' —— 强制形态，用于测试或窄容器内嵌 |
| `position` | String | `'auto'` | — | 'auto' \| 'center' \| 'bottom' —— 覆盖由形态推导出的位置 |
| `width` | String \| Number | `480` | — | 桌面端宽度，数字会被当作 px |
| `showClose` | Boolean | `true` | — | — |
| `maskClosable` | Boolean | `true` | — | — |
| `showCancel` | Boolean | `true` | — | — |
| `cancelText` | String | `'取消'` | — | — |
| `confirmText` | String | `'确定'` | — | — |
| `confirmLoading` | Boolean | `false` | — | — |
| `hideFooter` | Boolean | `false` | — | — |
| `zIndex` | Number | `2200` | — | — |
| `beforeClose` | Function | `null` | — | 关闭前拦截。返回 false 可阻止关闭，适合「表单有未保存改动」的场景。 |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `open` | 打开时 |
| `confirm` | 确认 |
| `cancel` | 取消 |
| `close` | 关闭时（动画结束后） |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `title` | — | — |
| `default` | — | 默认插槽 |
| `footer` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 一个组件，两种形态，由「交互能力」而不是单纯的屏幕宽度决定： 移动端  → 底部抽屉（slide-up，顶部圆角，贴安全区，按钮纵向堆叠） 桌面端  → 居中模态（zoom-in，固定宽度 480px，按钮右对齐，支持 Esc 关闭） 复用 wd-popup 的「难的部分」：遮罩、进出场动画生命周期、滚动锁、 z-index 管理、root-portal 传送。
- 我们自己只负责三件事： 1. 依据 isPC 决定 position 与视觉规格 2. 补齐被传送出去后丢失的主题作用域（见 useWotScope） 3. 桌面端的键盘交互（Esc） 为什么遮罩不自己写：它要在小程序端处理 touchmove 穿透、在 H5 端处理 滚动锁与 iOS 橡皮筋、还要管多层弹窗的层级，这些坑不值得重踩一遍。

## 关联

[cd-drawer](/components/drawer) · [cd-action-sheet](/components/action-sheet)
