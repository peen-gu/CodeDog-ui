---
title: Typing 打字机
---

# Typing 打字机

<div class="cd-api-tag">`typing` · 通用</div>

逐字输出的流式文本，给 AI 回复与引导文案用。调度用 setTimeout 链而非 setInterval（切后台回来不会一次性补一大段），推进用索引而非字符串拼接（中途换文案不会新旧串味）。

## 用法

<CdDemo id="typing-0"></CdDemo>

```vue // 来自演示页 extended
<view class="chat">
  <view class="chat__row">
    <cd-avatar text="AI" size="small" />
    <view class="chat__bubble">
      <cd-typing :text="typingText" :speed="40" @finish="log('打字结束')" />
    </view>
  </view>

  <view class="chat__row">
    <cd-avatar text="AI" size="small" />
    <view class="chat__bubble">
      <cd-typing
        :text="streamText"
        :speed="30"
        :chunk="3"
        :cursor="false"
        loop
        :loop-delay="1200"
      />
    </view>
  </view>
</view>

<view class="row">
  <cd-button size="small" @click="restartTyping">重打第一句</cd-button>
  <cd-button size="small" @click="typingText = '换一句也能干净地从头打，不会和上一句串在一起。'">
    换文案
  </cd-button>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `text` | String | `''` | — | 要打出的完整文案 |
| `speed` | Number | `60` | — | 每个 tick 的间隔（毫秒） |
| `chunk` | Number | `1` | — | 每个 tick 推进的字符数。> 1 时更像「流式推送」 |
| `cursor` | Boolean | `true` | — | 是否显示光标 |
| `loop` | Boolean | `false` | — | 打完是否回到开头重来 |
| `loopDelay` | Number | `1600` | — | 循环时的停顿（毫秒） |
| `enabled` | Boolean | `true` | — | 是否开始打字。置 false 会**停在当前进度**，不是清零 |
| `delay` | Number | `0` | — | 起步前先空一会儿（毫秒） |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `start` | 开始 |
| `update` | — |
| `finish` | 结束 |
| `cycle` | — |

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 给「AI 逐字回复」「引导文案逐句出现」这类场景用的一段文字占位器。
- 三个刻意的设计选择： 1. **用 setTimeout 链而不是 setInterval**。
- setInterval 在标签页切到后台时会被节流，恢复后会一次性补帧、连续吐出 一大段；链式 setTimeout 每次只排下一个 tick，最坏情况是「慢一点」， 不会出现「补一大串」的观感断层。
- 2. **推进用索引而不是字符串拼接**。
- 索引方案天然支持重置，也避免了中途换文案时「已输出部分」与「新文案」 拼成一串非驴非马的东西。
- 3. **根节点是 inline 的 text**。
- 打字机几乎总是嵌在一句话里（「正在加载…」），做成 block 会把整句撑开换行。
- 文案本身由 props 提供，组件不接管「什么时候该换下一句」这类业务逻辑； 需要手动控制时取实例调 start / stop / reset（见 defineExpose）。

## 关联

[cd-avatar](/components/avatar) · [cd-tag](/components/tag)
