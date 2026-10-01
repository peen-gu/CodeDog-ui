---
title: CountDown 倒计时
---

# CountDown 倒计时

<div class="cd-api-tag">`count-down` · 数据展示</div>

锚定结束时间戳而非递减计数：每次都重算 endAt - Date.now()，定时器只负责「多久看一眼」。这样切后台、改系统时间、GC 停顿都不会漂移。

## 用法

```vue // 来自演示页 widgets
<view class="row">
  <cd-button size="small" @click="startCountdown">开始</cd-button>
  <cd-button size="small" @click="pauseCountdown">暂停</cd-button>
  <cd-button size="small" @click="resetCountdown">重置（再给我 1 小时）</cd-button>
</view>

<view class="row">
  <cd-count-down ref="countdownRef" :time="3600 * 1000" :auto-start="false" format="HH:mm:ss" />
</view>
<view class="row">
  <cd-count-down :time="90061000" :auto-start="false" format="DD 天 HH:mm:ss" />
</view>
<view class="row">
  <cd-count-down :time="5000" format="ss.SSS" millisecond />
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `time` | Number | `0` | — | 倒计时时长（毫秒） |
| `autoStart` | Boolean | `true` | — | 是否自动开始 |
| `format` | String | `'HH:mm:ss'` | — | 输出格式。支持 D / DD / H / HH / m / mm / s / ss / S / SS / SSS。 注意 m 是分钟、S 是毫秒 —— 大小写在这里是有语义的。 |
| `millisecond` | Boolean | `false` | — | 毫秒级刷新（默认只按秒刷新，省电且不闪） |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `change` | 值变化时触发 |
| `finish` | 结束 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | `total` / `days` / `hours` / `minutes` / `seconds` / `milliseconds` / `formatted` | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 这里最容易被写错的不是显示，而是**计时方式**。
- 直觉写法是「每来一次定时器就 remain -= 1000」。
- 这个写法在真正使用时会累积误差：setInterval 的执行时刻会被主线程 排队、被后台标签页节流（H5 后台只给 1 次/秒甚至更低）、 被小程序的生命周期打断。
- 跑五分钟能偏好几秒， 跑一场直播的秒杀能偏到用户投诉。
- 正确做法是**锚定一个结束时间戳**，每次 tick 都用 `endAt - Date.now()` 重算 —— 定时器只负责「多久看一眼」， 不负责「累加时间」。
- 这样即使丢了几次回调，显示也永远是准的。
- 小程序端另有一个必须处理的现实：切后台后定时器会被挂起。
- 因此这里额外提供了 onShow 的同步入口（sync）， 由组件的 onShow 钩子里调用，回到前台立刻纠正显示。

## 关联

[cd-count-to](/components/count-to)
