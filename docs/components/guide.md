---
title: Guide 用户指引
---

# Guide 用户指引

<div class="cd-api-tag">`guide` · 反馈与浮层</div>

分步遮罩引导。遮罩用 box-shadow 挖洞而不是四块挡板拼，圆角与位置动画都只需改一个节点；placement 支持 auto，目标下方空间不足自动翻到上方。

## 用法

<CdDemo id="guide-0"></CdDemo>

```vue // 来自演示页 extended
<view class="row">
  <cd-button class="guide-target" size="small" type="primary" @click="startGuide">
    开始引导（第一步指向我）
  </cd-button>
  <cd-button class="guide-target-2" size="small" @click="log('第二个目标被点击')">
    第二步目标
  </cd-button>
  <cd-button class="guide-target-3" size="small" plain @click="guideVisible = true">
    直接打开
  </cd-button>
</view>

<cd-guide
  v-model:visible="guideVisible"
  :steps="guideSteps"
  placement="auto"
  @finish="log('引导完成')"
  @skip="log('引导被跳过')"
/>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `visible` | Boolean | `false` | — | 是否显示 |
| `steps` | Array | `() => []` | — | 步骤列表。每项： { target, title, content, placement, shape } target 为空串时不高亮任何元素，卡片居中展示 |
| `startIndex` | Number | `0` | — | 起始步骤下标 |
| `placement` | String | `'auto'` | — | 'auto' 由可用空间自动决定；bottom / top / center 强制 |
| `shape` | String | `'rect'` | — | 高亮形状：rect 圆角矩形 / circle 正圆 |
| `padding` | Number | `6` | — | 高亮框相对目标的外扩 |
| `nextText` | String | `'下一步'` | — | — |
| `prevText` | String | `'上一步'` | — | — |
| `finishText` | String | `'知道了'` | — | — |
| `skipText` | String | `'跳过'` | — | — |
| `showIndicator` | Boolean | `true` | — | 是否显示 n / m 计数 |
| `maskClosable` | Boolean | `false` | — | 点遮罩是否跳过 |
| `zIndex` | Number | `2300` | — | — |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:visible` | — |
| `change` | 值变化时触发 |
| `finish` | 结束 |
| `skip` | — |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `highlight` | `step` / `index` | — |
| `default` | `step` / `index` | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 跨端最难的不是「画高亮」，是**怎么量目标位置**。
- 这里全部走 `uni.createSelectorQuery()` 的**回调式**用法（`.boundingClientRect(cb)`）， 与 cd-collapse-item / cd-tabs / cd-affix 一致：回调式在小程序基础库各版本上 比 `.exec()` 取数组稳定，不会因为返回顺序变动读错。
- 但**不加 `.in(instance)`** —— 那一句是给「量自己节点树里的子元素」用的， 而指引的目标都在组件外面。
- 加了之后 H5 端坐标会整体偏移一个页面头的高度。
- 三个关键决策： 1. **遮罩用 box-shadow 而不是四块挡板拼**。
- `0 0 0 9999px 遮罩色` 一个值就能挖出任意矩形洞，不必在上/下/左/右贴四条 挡板再按目标位置分别算高度；圆角（circle 模式只需改 border-radius）也免费 得到，且目标位置变化时只改一个节点的 top/left，动画好写。
- 2. **目标不在视口内先滚过去再量**。
- `boundingClientRect` 给的是视口坐标，目标在屏幕外时量出来的 top 是负的 或超界，卡片会飞出屏幕。
- 所以先 `selectViewport().scrollOffset()` 拿到 滚动量，算目标绝对位置，`uni.pageScrollTo` 滚过去，等 350ms 再测第二次。
- 3. **placement 写 'auto' 时由空间决定，不是固定往下**。
- 目标贴着屏幕底部时往下放卡片会被截掉一半，此时自动翻到上面。
- 每一步支持 `target`（选择器，建议用 `#id`）为空 —— 空则退化成居中显示， 用来做「第一步欢迎 / 最后一步总结」这种没有明确落点的步骤。

## 关联

[cd-button](/components/button) · [cd-dialog](/components/dialog)
