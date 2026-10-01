---
title: Result 结果页
---

# Result 结果页

<div class="cd-api-tag">`result` · 数据展示</div>

操作结果反馈页，内置成功/失败预设，提供 icon、title、desc、extra、actions 五个插槽。

## 用法

```vue // 来自演示页 widgets
<view class="split">
  <view class="split__col">
    <cd-result
      type="success"
      title="提交成功"
      description="我们会在 1 个工作日内完成审核，结果将以站内信通知你。"
    >
      <template #extra>
        <cd-button size="small" type="primary">返回首页</cd-button>
        <cd-button size="small" plain>查看详情</cd-button>
      </template>
    </cd-result>
  </view>

  <view class="split__col">
    <cd-result
      type="error"
      title="支付失败"
      description="订单已关闭，请重新下单。如已扣款将于 1-3 个工作日原路退回。"
    >
      <template #extra>
        <cd-button size="small" type="primary">重新支付</cd-button>
      </template>
    </cd-result>
  </view>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `type` | String | `'info'` | — | success / warning / error / info |
| `title` | String | `''` | — | — |
| `description` | String | `''` | — | — |
| `icon` | String | `''` | — | 自定义图标，覆盖 type 的默认图标 |
| `showIcon` | Boolean | `true` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

无

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `icon` | — | — |
| `title` | — | — |
| `description` | — | — |
| `extra` | — | — |
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 它存在的理由是「让结论先于数据出现」。
- 提交成功、支付失败、无权限、系统异常 —— 这类页面如果让业务自己拼， 十有八九拼成「一行加粗标题 + 一段灰字」，然后每个页面各不相同。
- 一个刻意的取舍：图标外面套一个 72px 的浅色圆底，而不是直接放一个大图标。
- 原因是纯图标在大屏上会显得「飘」—— 没有形状边界，视觉重心不稳； 浅色圆底给它一个明确的落点，也让语义色（红 / 黄 / 绿）有地方铺开， 不用把颜色糊到图标线条上（那会让描边图标显得脏）。
- 槽位按「信息层级」拆成四段而不是给一堆属性： 默认槽放详细数据（明细、单号），extra 槽放操作按钮。
- 顺序刻意为「结论 → 说明 → 操作 → 明细」—— 用户最需要点的东西不该被一张明细表推到底部。

## 关联

[cd-empty](/components/empty) · [cd-button](/components/button)
