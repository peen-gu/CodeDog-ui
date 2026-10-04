---
title: Button 按钮
---

# Button 按钮

<div class="cd-api-tag">`button` · 通用</div>

自研而非二次封装：按钮没有遮罩、滚动锁、层级这些难点，自研能 100% 掌控设计语言。支持 5 种语义、3 档尺寸、加载态、描边与双形态圆角。

## 用法

<CdDemo id="button-0"></CdDemo>

```vue // 来自演示页 components
<view class="row">
  <cd-button type="primary">
    <template #icon><cd-icon name="plus" :size="16" /></template>
    新建
  </cd-button>
  <cd-button>
    <template #icon><cd-icon name="download" :size="16" /></template>
    导出
  </cd-button>
  <cd-button type="danger" plain>
    <template #icon><cd-icon name="trash" :size="16" /></template>
    删除
  </cd-button>
  <cd-button type="text">
    <template #icon><cd-icon name="refresh" :size="16" /></template>
    刷新
  </cd-button>
</view>

<view class="row row--baseline">
  <text class="inline-text">
    <cd-icon name="check-circle" color="var(--cd-color-success, #10b981)" /> 校验通过
  </text>
  <text class="inline-text">
    <cd-icon name="warning" color="var(--cd-color-warning, #f59e0b)" /> 存在风险
  </text>
  <text class="inline-text">
    <cd-icon name="close-circle" color="var(--cd-color-danger, #ef4444)" /> 已失败
  </text>
  <text class="inline-text">
    <cd-icon name="loader" spin /> 加载中
  </text>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `type` | String | `'default'` | — | primary / success / warning / danger / info / default / text |
| `size` | String | `'medium'` | — | small / medium / large |
| `plain` | Boolean | `false` | — | 幽灵按钮：透明底 + 同色文字与描边 |
| `round` | Boolean | `false` | — | 胶囊圆角 |
| `block` | Boolean | `false` | — | 撑满父容器宽度 |
| `disabled` | Boolean | `false` | — | — |
| `loading` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click` | 点击时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `icon` | — | — |
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 为什么按钮不包 wd-button，而是自己实现： 按钮没有遮罩、动画、层级、滚动锁这类「难的部分」， 自研成本极低，却能 100% 掌控设计语言（圆角、密度、hover 反馈）。
- 而 dialog / select 这类组件我们反过来复用 wot 的 popup —— 因为难点在别处。
- 「简单组件自研、复杂组件复用」是这条路线的基本取舍。
- 跨端要点： - 所有尺寸取自 --cd-* 令牌，单位是 px。
- 绝不使用 rpx， 否则在 1440px 宽的 PC 屏上按钮会被拉到 40px 以上高度。
- - 按压反馈分两路：H5 用 :active（鼠标与触摸都准）， 小程序用 hover-class（WXSS 的 :active 支持不稳定）。
- - hover 态包在 (hover:hover) 媒体查询里，避免触屏设备「点完颜色不恢复」。

## 关联

[cd-icon](/components/icon)
