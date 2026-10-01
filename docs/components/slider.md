---
title: Slider 滑块
---

# Slider 滑块

<div class="cd-api-tag">`slider` · 表单与录入</div>

支持单选与范围双滑块。按下时缓存轨道矩形避免每次取反算时读取；量化顺序是「先量化再钳制」；双滑块取最近的一个并允许交错。

## 用法

```vue // 来自演示页 widgets
<view class="stack">
  <view>
    <text class="col-label">单值：{{ sliderValue }}（show-tooltip）</text>
    <cd-slider v-model="sliderValue" :step="1" show-tooltip />
  </view>

  <view>
    <text class="col-label">区间：{{ sliderRange[0] }} ~ {{ sliderRange[1] }}（step=10）</text>
    <cd-slider v-model="sliderRange" range :step="10" show-tooltip />
  </view>

  <view>
    <text class="col-label">禁用：{{ sliderDisabled }}</text>
    <cd-slider v-model="sliderDisabled" disabled />
  </view>

  <view class="log">
    <text class="log__text">change 事件只在松手时触发，拖动中只发 input。当前值：{{ sliderValue }}</text>
  </view>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Number \| Array | `0` | — | 单值 Number；开启 range 时是 [low, high] |
| `min` | Number | `0` | — | — |
| `max` | Number | `100` | — | — |
| `step` | Number | `1` | — | — |
| `range` | Boolean | `false` | — | 双滑块区间模式 |
| `disabled` | Boolean | `false` | — | — |
| `showTooltip` | Boolean | `false` | — | 拖动时显示数值气泡 |
| `tooltipAlways` | Boolean | `false` | — | 气泡常显 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `input` | 输入过程中实时触发 |
| `change` | 值变化时触发 |

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 为什么不用 wd-slider 之类的现成实现，而要自己处理指针： 滑块是「拖拽」而不是「点击」，它必须在按下时就锁定一根轨道， 并在拖动过程中持续计算位置。
- 这件事在两端的事件模型不同： - 触屏（小程序 + 移动 H5）：只有元素级的 touchstart/touchmove； - 桌面 H5：mousedown 之后指针很可能移出元素， 必须把 move / up 挂到 document 上，否则鼠标一滑出轨道就「掉」了。
- 所以这里是两套并存的：元素级 touch 事件 + H5 专属的 document 鼠标监听。
- 关键实现细节： 1. 轨道的矩形在**按下那一刻量一次**并缓存。
- 拖动途中不再重量 —— 滑块的轨道在拖动过程中不会移动， 每帧去 createSelectorQuery 是纯浪费（而且是异步的，会引入抖动）。
- 2. 取整顺序是「先量化再钳制」而不是反过来。
- step=10、max=100 时，先把 103 钳到 100 没问题； 但如果先量化成 110 再钳，就会得到一个越界的值。
- 3. 双滑块选「离手指更近的那个」来动，且允许交错。
- 不允许交错会带来一个恼人现象：想拖左滑块往右推，推到右滑块位置就卡住不动了， 用户只能先去挪右滑块。
- 允许交错后两个滑块会在相遇瞬间交换身份， 连续感才对。
