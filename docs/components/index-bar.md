---
title: IndexBar 字母索引栏
---

# IndexBar 字母索引栏

<div class="cd-api-tag">`index-bar` · 导航</div>

只做「手指落在第几个字母」，结果 emit 出去由业务用 scroll-into-view 自己跳 —— 锚点滚动要遍历业务列表的 offsetTop，组件既量不准也管不动。整条 pointer-events:none，只有字母本身可点。

## 用法

<CdDemo id="index-bar-0"></CdDemo>

```vue // 来自演示页 extended
<view class="indexbar-box">
  <scroll-view class="indexbar-box__scroll" scroll-y :scroll-into-view="cityAnchor">
    <view v-for="group in cityGroups" :key="group.letter" :id="'city-' + group.letter">
      <text class="indexbar-box__letter">{{ group.letter }}</text>
      <view v-for="city in group.cities" :key="city" class="indexbar-box__city">
        <text>{{ city }}</text>
      </view>
    </view>
  </scroll-view>

  <cd-index-bar
    :index-list="cityLetters"
    :fixed="false"
    @select="onIndexSelect"
  />
</view>

<view class="result">
  <text class="result__label">当前字母</text>
  <text class="result__value">{{ currentLetter || '（未选择）' }}</text>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `indexList` | Array | `() => []` | — | 索引列表。留空用 A~Z |
| `itemSize` | Number | `18` | — | 单格高度（px） |
| `showTip` | Boolean | `true` | — | 拖动时是否显示大号气泡 |
| `activeColor` | String | `''` | — | 激活态颜色 |
| `fixed` | Boolean | `true` | — | 固定定位（贴视口右侧）。关掉则贴父级右侧，父级需有定位 |
| `zIndex` | Number | `900` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `select` | 选中某一项 |

## Slots

无

## Expose

通过 `ref` 调用：

| 方法 / 属性 | 说明 |
|---|---|
| `setActive` | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 刻意**不接管滚动**。
- 理由： 锚点滚动要遍历业务列表里每个分组的 offsetTop，而业务列表几乎一定是 scroll-view / 长页面 / 虚拟列表三种形态之一，组件既量不准也管不动。
- 所以这里只做「手指落在第几个字母」这一件事，把结果 emit 出去， 由业务用 `scroll-into-view` 自己跳 —— 这本来就是 uni 的标准能力。
- 组件与其猜业务的结构，不如把边界划清楚。
- 触摸定位：量一次列表的 rect，再用 (y − top) / 单格高 取整。
- 不用给每个格子单独绑 touchmove —— 那样手指滑出格子就断， 而滑动正是索引栏最主要的操作方式。
- 鼠标端（H5 / Electron）没有 touch 事件，所以列表同时绑了一套 mouse*， 每个格子另绑 click 兜底 —— 桌面用户拖动索引、单击字母都能用。

## 关联

[cd-cell](/components/cell) · [cd-cell-group](/components/cell-group)
