---
title: Collapse 折叠面板
---

# Collapse 折叠面板

<div class="cd-api-tag">`collapse` · 数据展示</div>

容器持有展开状态，accordion 模式下 v-model 为单值、否则为数组。

## 用法

<CdDemo id="collapse-0"></CdDemo>

```vue // 来自演示页 navigation
<view class="split">
  <view class="split__col">
    <text class="col-label">普通模式（可多开）</text>
    <cd-collapse v-model="collapseNormal">
      <cd-collapse-item name="a" title="什么是二次封装" icon="help" value="推荐阅读">
        不改上游源码，只覆盖它的设计变量与关键结构，
        把「平台差异」和「设计语言」两件事收敛到框架内部。
      </cd-collapse-item>
      <cd-collapse-item name="b" title="为什么不直接用 rpx">
        小程序用它没问题，但 H5 大屏上 rpx 会在约 960px 处封顶，
        于是 PC 端只能看到一块被裁掉的窄屏。
      </cd-collapse-item>
      <cd-collapse-item name="c" title="这一项是禁用的" disabled>
        禁用项依然会渲染，只是头部不响应点击。
      </cd-collapse-item>
    </cd-collapse>
  </view>

  <view class="split__col">
    <text class="col-label">手风琴（accordion，单值 v-model）</text>
    <cd-collapse v-model="collapseAccordion" accordion>
      <cd-collapse-item name="1" title="第一步：选择路线" value="已完成">
        路线 B：基于成熟的 uni-app 组件库做二次封装，
        把精力放在双形态与主题系统上，而不是重造轮子。
      </cd-collapse-item>
      <cd-collapse-item name="2" title="第二步：补全组件" value="进行中">
        从 6 个骨架组件补到 60+，覆盖容器、导航、表单、反馈、展示五类。
      </cd-collapse-item>
      <cd-collapse-item name="3" title="第三步：发布">
        以 uni_modules 为主、npm 为辅双发布，附上完整的许可声明。
      </cd-collapse-item>
    </cd-collapse>

    <view class="log">
      <text class="log__text">当前展开：{{ collapseAccordion || '（全部收起）' }}</text>
    </view>
  </view>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Array \| String \| Number | `() => []` | — | 展开项：手风琴模式是单值，否则是数组 |
| `accordion` | Boolean | `false` | — | 手风琴模式：同时只能展开一项 |
| `border` | Boolean | `true` | — | 外框与面板间的分隔线 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 状态放在容器而不是每个面板里，原因有两个： 1. 手风琴（accordion）本质是一个「单选组」，状态必须由容器统一裁决 —— 面板各自持有 open 的话，展开第二个时无法可靠地关掉第一个； 2. 业务常常需要在外部读 / 写「当前展开了哪些」， 收敛成一个 v-model 比让业务去挨个操作面板干净得多。
- 与表单一样，面板不通过 props 拿状态 —— 插槽内容由业务书写， 没办法自动注入属性，所以走 provide/inject。
- v-model 的形态会跟随 accordion 自动变化： accordion=true  → 单值（'' / 'panel-1'） 否则            → 数组（['panel-1', 'panel-2']） 这是有意的：让「手风琴」在类型层面就是单选，业务不用自己维持数组长度为 1。

## 关联

[cd-collapse-item](/components/collapse-item)
