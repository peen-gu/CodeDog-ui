---
title: CountTo 数字滚动
---

# CountTo 数字滚动

<div class="cd-api-tag">`count-to` · 数据展示</div>

数字从起始值缓动到目标值。内部只存裸数字，千分位在格式化阶段用 split/join 添加——避开 lookahead 正则在小程序引擎上的差异。

## 用法

<CdDemo id="count-to-0"></CdDemo>

```vue // 来自演示页 widgets
<view class="stats">
  <view class="stat">
    <text class="stat__label">累计用户</text>
    <cd-count-to ref="countToRef" :end="128456" :duration="1600" />
  </view>
  <view class="stat">
    <text class="stat__label">营收（元）</text>
    <cd-count-to :end="9834210.5" :decimals="2" prefix="¥" :duration="2000" />
  </view>
  <view class="stat">
    <text class="stat__label">满意度</text>
    <cd-count-to :end="4.87" :decimals="2" suffix=" / 5" easing="easeInOut" />
  </view>
  <view class="stat">
    <text class="stat__label">线性缓动（对照）</text>
    <cd-count-to :end="100" easing="linear" suffix="%" />
  </view>
</view>

<view class="row">
  <cd-button size="small" @click="replayCountTo">重新播放（从当前值继续）</cd-button>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `start` | Number | `0` | — | 起始值 |
| `end` | Number | `0` | — | 结束值 |
| `duration` | Number | `2000` | — | 时长（毫秒） |
| `decimals` | Number | `0` | — | 小数位数 |
| `separator` | String | `','` | — | 千分位分隔符，传空字符串即关闭 |
| `prefix` | String | `''` | — | — |
| `suffix` | String | `''` | — | — |
| `easing` | String | `'easeOut'` | — | linear / easeOut / easeIn / easeInOut |
| `autoplay` | Boolean | `true` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `start` | 开始 |
| `change` | 值变化时触发 |
| `finish` | 结束 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | `value` / `display` | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 最容易做错的两件事，这里都刻意处理了： 1. **必须用插值，不能自己累加**。
- 写成 `current += step` 然后 setInterval 的版本，丢帧就会偏 —— 和倒计时是同一个病。
- 这里的 current 永远由 「起点 + (终点 - 起点) × 缓动(已过时间 / 总时长)」算出来， 丢帧只影响中间某一帧的显示，不影响最终值。
- 2. **千分位必须在格式化阶段加，不能在插值阶段加**。
- 对带逗号的字符串做数字运算会得到 NaN， 所以内部只保存裸数字，显示时才交给 format 拼千分位与小数位。
- 缓动函数提供三种，默认 easeOut：数字滚动天生适合「先快后慢」—— 它对应的心理感受是「很快就上去了，然后稳稳停住」。
- 线性缓动在数字很大时会显得像计数器在匀速空转。

## 关联

[cd-count-down](/components/count-down)
