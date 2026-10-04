---
title: Tooltip 文字提示
---

# Tooltip 文字提示

<div class="cd-api-tag">`tooltip` · 反馈与浮层</div>

纯文字气泡。PC 端 hover 触发且进出都带延迟（防鼠标轨迹穿越时闪烁），移动端长按或点击触发。

## 用法

<CdDemo id="tooltip-0"></CdDemo>

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
| `content` | String | `''` | — | 提示内容（也可用 content 插槽承载富文本） |
| `placement` | String | `'top'` | — | 12 个方位：top / top-start / top-end / bottom / ... / right-end |
| `maxWidth` | String \| Number | `240` | — | 最大宽度，超出折行 |
| `arrowSize` | Number | `6` | — | — |
| `disabled` | Boolean | `false` | — | — |
| `shield` | Boolean | `true` | — | 移动端是否渲染「点击空白处收起」的透明盾 |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `visible-change` | 显示状态变化 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |
| `content` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 交互随「有没有鼠标」分流，而不是随屏幕宽度： 有鼠标（PC） → hover 进出，带延迟避免划过路径上的误闪 无鼠标（移动）→ 长按唤出，点击空白处收起 定位交给 useFloating（两段式测量），面板用 position:fixed 直接渲染 在组件内 —— 不传送、不遮罩、不锁滚动，这是气泡与弹窗的本质区别。

## 关联

[cd-popover](/components/popover)
