---
title: NoticeBar 通知栏
---

# NoticeBar 通知栏

<div class="cd-api-tag">`notice-bar` · 反馈与浮层</div>

滚动通告。跑马灯用 padding-left:100% + translate3d(-100%) 实现无缝循环，速度按字数估算而不是等测量完成——换来首屏一次成型、不闪跳。

## 用法

```vue // 来自演示页 widgets
<view class="stack">
  <cd-notice-bar text="这是一条静态通知，超长内容会自动省略号截断，不会把布局撑破。" />

  <cd-notice-bar
    type="info"
    icon="bell"
    scrollable
    :speed="70"
    text="这是一条跑马灯通知：滚动速度按字数估算而不是等测量完成，代价是中英文混排时略快略慢，换来的是首屏一次成型、不闪跳。"
  />

  <cd-notice-bar type="warning" closable text="可关闭的通知，只抛事件，是否真的隐藏由业务决定。" @close="log('通知被关闭')" />

  <cd-notice-bar
    type="success"
    :text="['第一条公告：双端构建已通过。', '第二条公告：组件总数达到 62。', '第三条公告：许可声明已补齐。']"
    @change="onNoticeChange"
  />

  <cd-notice-bar
    type="danger"
    text="这一条允许换行，所以关掉了省略号，多行内容会完整显示出来。"
    wrapable
  />
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `text` | String \| Array | `''` | — | 单条传字符串；多条传数组（自动纵向轮播） |
| `type` | String | `'default'` | — | default / info / success / warning / danger |
| `scrollable` | Boolean | `false` | — | 单条时开启横向跑马灯 |
| `speed` | Number | `60` | — | 跑马灯速度，约等于每秒多少像素 |
| `wrapable` | Boolean | `false` | — | 单条时允许换行（关闭省略号） |
| `showIcon` | Boolean | `true` | — | — |
| `icon` | String | `''` | — | 自定义图标 |
| `closable` | Boolean | `false` | — | — |
| `interval` | Number | `3000` | — | 多条轮播的切换间隔（毫秒） |
| `url` | String | `''` | — | 自定义跳转地址 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click` | 点击时触发 |
| `close` | 关闭时（动画结束后） |
| `change` | 值变化时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `icon` | — | — |
| `default` | `text` / `index` | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 三种形态共用一个组件，而不是拆成三个： 单条静态 / 单条跑马灯 / 多条纵向轮播 —— 它们在真实产品里 就是同一块位置的不同数据量，业务不该因为「今天有两条公告」 就换一个组件标签。
- 跑马灯的速度处理有个必须交代的取舍： 正确的做法是量出文字宽度，再按「像素/秒」反算动画时长。
- 这里用的是按字数估算 —— 因为量宽度必须等渲染完成（异步）， 而异步测量会让首屏出现「先静止、再突然开始跑」的闪跳。
- 按字数估算的代价是：中英文混排时速度略有偏差， 换来的是首屏一次成型、任何时刻都在匀速走。

## 关联

[cd-alert](/components/alert)
