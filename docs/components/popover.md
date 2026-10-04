---
title: Popover 气泡卡片
---

# Popover 气泡卡片

<div class="cd-api-tag">`popover` · 反馈与浮层</div>

可承载任意内容的气泡。面板内点击不自动关闭，支持 Esc 与 v-model 外部受控。

## 用法

<CdDemo id="popover-0"></CdDemo>

```vue // 来自演示页 feedback
<view class="row">
  <cd-tooltip content="这是一段提示文字，PC 悬停 / 移动长按都能唤出">
    <cd-button size="small">悬停或长按我（top）</cd-button>
  </cd-tooltip>
  <cd-tooltip content="右侧方位" placement="right">
    <cd-button size="small">placement: right</cd-button>
  </cd-tooltip>
  <cd-tooltip content="底部方位" placement="bottom">
    <cd-button size="small">placement: bottom</cd-button>
  </cd-tooltip>
</view>
<view class="row">
  <cd-popover v-model="popoverVisible" title="确认发布" placement="bottom">
    <template #reference>
      <cd-button size="small" type="primary">点击弹出 popover</cd-button>
    </template>
    <view class="popover-demo">
      <text class="popover-demo__text">发布后所有人可见，确定继续吗？</text>
      <view class="popover-demo__actions">
        <cd-button size="small" @click="popoverVisible = false">取消</cd-button>
        <cd-button size="small" type="primary" @click="onPopoverOk">发布</cd-button>
      </view>
    </view>
  </cd-popover>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Boolean | `false` | — | — |
| `title` | String | `''` | — | — |
| `placement` | String | `'bottom'` | — | — |
| `width` | String \| Number | `''` | — | 面板宽度；不传由内容决定，但会钳制在 90vw 内 |
| `arrowSize` | Number | `6` | — | — |
| `disabled` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `open` | 打开时 |
| `close` | 关闭时（动画结束后） |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `reference` | — | — |
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 与 cd-tooltip 的分工：tooltip 只承载一句话；popover 承载一块 可交互的内容（筛选面板、确认气泡、快捷操作）。
- 所以 popover： - 点击触发（hover 触发的可交互浮层是可用性灾难） - 面板内点击不会关闭（

## 关联

[cd-tooltip](/components/tooltip) · [cd-popconfirm](/components/popconfirm)
