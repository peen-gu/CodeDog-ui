---
title: Loading 加载
---

# Loading 加载

<div class="cd-api-tag">`loading` · 反馈与浮层</div>

加载指示器，spinner 形态复用 cd-icon 的 loader 图标加旋转动画。

## 用法

```vue // 来自演示页 showcase
<view class="row row--baseline">
  <cd-loading :size="20" />
  <cd-loading :size="28" text="加载中" />
  <cd-loading type="dots" :size="28" text="dots" />
  <cd-loading type="ring" :size="28" text="ring" />
  <cd-loading :size="20" color="#ef4444" />
</view>

<view class="row">
  <cd-button size="small" @click="fullscreenLoading = true">全屏加载</cd-button>
</view>

<cd-loading v-if="fullscreenLoading" fullscreen text="正在保存…" />
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `type` | String | `'spinner'` | — | spinner / dots / ring |
| `size` | Number \| String | `24` | — | 尺寸，数字按 px |
| `color` | String | `''` | — | 颜色，不传则用主色 |
| `text` | String | `''` | — | 加载文案 |
| `vertical` | Boolean | `false` | — | 文字放在下方（否则在右侧） |
| `fullscreen` | Boolean | `false` | — | 全屏居中 |
| `mask` | Boolean | `true` | — | 全屏时是否加半透明遮罩 |
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

- 三种形态的取舍： spinner —— 复用 cd-icon 的 `loader` 图标 + spin 属性。
- 图标是 mask + data URI 的矢量，任何尺寸都清晰， 而且没有额外 CSS 动画需要维护。
- dots    —— 三个圆点依次缩放。
- 适合按钮内联场景， 因为它是横向展开的，不会把行高顶起来。
- ring    —— 纯 border 圆环。
- 适合全屏加载， 在深色遮罩上比图标更「有存在感」。
- 全屏模式的实现：position:fixed 挂在最上层（z-index 用 --cd-z-toast）。
- 注意这里不做「滚动锁定」—— 锁滚动在 H5 上要操作 document， 在小程序上没有对应能力，强行做会变成两套分支。
- 遮罩已经能阻断点击了。

## 关联

[cd-skeleton](/components/skeleton) · [cd-icon](/components/icon)
