---
title: TimelineItem 时间线项
---

# TimelineItem 时间线项

<div class="cd-api-tag">`timeline-item` · 数据展示</div>

单个时间节点，支持实心/空心/大号圆点与自定义 dot 插槽。首尾的引线会被替换为透明占位。

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
| `timestamp` | String | `''` | — | 时间文案 |
| `type` | String | `'primary'` | — | primary / success / warning / danger / info |
| `hollow` | Boolean | `false` | — | 空心圆点 |
| `icon` | String | `''` | — | 圆点内图标，传了就是实心圆 + 图标 |
| `size` | String | `'normal'` | — | normal / large |
| `placement` | String | `'top'` | — | 时间戳在内容的上面还是下面 |
| `hideTimestamp` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

无

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `dot` | — | — |
| `timestamp` | — | — |
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 导轨用「引线 + 圆点 + 引线」三件套，且首尾两端各换成一个透明占位。
- 为什么不直接把首尾的引线删掉：删掉之后圆点的垂直位置会变 （上方少了 flex:1 的伸展），整条时间线的圆点就不在一条直线上了。
- 占位块保留同样的高度分配，只把颜色去掉，圆点才始终压在轴的中间。
- 圆点形态三选一，由属性组合决定，而不是开一个 variant 枚举： 有 icon  → 实心圆 + 白色图标（适合「提交」「审核」这类事件） hollow   → 空心圈（适合「次要节点」） 都没有   → 实心小圆点（默认） 这三种覆盖了真实产品里 95% 的时间线画法，加枚举反而要求业务记住取值。

## 关联

[cd-timeline](/components/timeline)
