---
title: CollapseItem 折叠项
---

# CollapseItem 折叠项

<div class="cd-api-tag">`collapse-item` · 数据展示</div>

高度动画走实测道路：用 createSelectorQuery 量取内容真实高度后以 CSS 变量下发。固定 max-height: 999px 的做法会让动画在视觉上失效。

## 用法

<CdDemo id="collapse-item-0"></CdDemo>

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
| `name` | String \| Number | `''` | — | 面板标识，v-model 里存的就是它。 不传时自动回退到实例唯一值，因此「不传 name 的多个面板」互不干扰。 |
| `title` | String | `''` | — | — |
| `value` | String | `''` | — | 标题右侧的值 |
| `icon` | String | `''` | — | — |
| `lazy` | Boolean | `false` | — | 首次展开后才渲染内容 |
| `disabled` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `change` | 值变化时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `icon` | — | — |
| `title` | — | — |
| `value` | — | — |
| `arrow` | — | — |
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 动画必须用「实测高度」而不是一个大数字（比如 max-height: 999px）。
- 原因值得记一下：max-height 从 0 过渡到 999px 时， 元素的实际渲染高度是 min(max-height, 内容高度) —— 内容只有 80px 的话，前 92% 的时间都在「假装生长」， 视觉上内容几乎瞬间出现，等于没做动画。
- 所以这里在展开时用 createSelectorQuery 量一次内容真实高度， 以纯值变量下发，过渡就是精确的。
- 已知取舍：高度只在「每次展开」时重量一次。
- 展开状态下内容异步变高（比如加载完列表）不会自动跟上 —— 真有这种场景请在数据到位后调用组件的 refresh()（已 expose）。

## 关联

[cd-collapse](/components/collapse)
