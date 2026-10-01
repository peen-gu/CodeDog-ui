---
title: Timeline 时间线
---

# Timeline 时间线

<div class="cd-api-tag">`timeline` · 数据展示</div>

按时间顺序展示事件流。reverse 通过 flex-direction: column-reverse 实现而不是反转数组——保持数据顺序可读。

## 用法

```vue // 来自演示页 navigation
<view class="row">
  <cd-button size="small" @click="timelineReverse = !timelineReverse">
    reverse: {{ timelineReverse ? 'true' : 'false' }}
  </cd-button>
</view>

<view class="split">
  <view class="split__col">
    <text class="col-label">默认（实心点 + 语义色）</text>
    <cd-timeline :reverse="timelineReverse">
      <cd-timeline-item timestamp="2026-10-01 16:52" type="success" icon="check">
        <text class="tl-title">构建通过</text>
        <text class="tl-text">h5 与 mp-weixin 双端产物均生成成功。</text>
      </cd-timeline-item>
      <cd-timeline-item timestamp="2026-10-01 15:40" type="primary" icon="edit">
        <text class="tl-title">第五批组件提交</text>
        <text class="tl-text">新增 25 个组件，组件总数达到 62。</text>
      </cd-timeline-item>
      <cd-timeline-item timestamp="2026-10-01 11:02" type="warning" icon="warning">
        <text class="tl-title">发现一个真 bug</text>
        <text class="tl-text">折叠面板展开态读到了旧值，已修复。</text>
      </cd-timeline-item>
      <cd-timeline-item timestamp="2026-10-01 09:00" type="info">
        <text class="tl-title">开始工作</text>
      </cd-timeline-item>
    </cd-timeline>
  </view>

  <view class="split__col">
    <text class="col-label">空心 / 大号 / 无时间戳</text>
    <cd-timeline>
      <cd-timeline-item timestamp="待处理" hollow>等待人工确认</cd-timeline-item>
      <cd-timeline-item timestamp="处理中" hollow size="large" type="warning">
        正在同步数据
      </cd-timeline-item>
      <cd-timeline-item timestamp="已完成" type="success" size="large" icon="check">
        全部同步完成
      </cd-timeline-item>
      <cd-timeline-item hide-timestamp type="danger" icon="close">
        这一项隐藏了时间戳，只有内容
      </cd-timeline-item>
    </cd-timeline>
  </view>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `reverse` | Boolean | `false` | — | 倒序排列（最新的在最上面） |
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

- 首尾项的处理和步骤条是同一类问题：某一项是否「有上文 / 有下文」 只能由容器统计出来，所以这里复用「注册表 + 版本号」的做法。
- reverse 的实现不是反转数组（那会破坏插槽里业务的书写顺序， 也会让 v-for 的 key 语义变得别扭），而是把容器改成 column-reverse。
- 由此引出一个必须处理好的连带效果： DOM 顺序没变、视觉顺序反了，于是「谁在上面」也反了 —— 项的上下引线要跟着对调，否则最先写的那一项会在视觉上拖着一条断头线。

## 关联

[cd-timeline-item](/components/timeline-item)
