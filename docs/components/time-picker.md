---
title: TimePicker 时间选择
---

# TimePicker 时间选择

<div class="cd-api-tag">`time-picker` · 表单与录入</div>

移动端原生、PC 双列（时/分）。刻意不做秒。

## 用法

<CdDemo id="time-picker-0"></CdDemo>

```vue // 来自演示页 feedback
<view class="grid2">
  <view class="grid2__item">
    <text class="field-label">日期（限 2026 年）</text>
    <cd-date-picker
      v-model="form.date"
      min="2026-01-01"
      max="2026-12-31"
      placeholder="请选择日期"
    />
  </view>
  <view class="grid2__item">
    <text class="field-label">时间</text>
    <cd-time-picker v-model="form.time" placeholder="请选择时间" />
  </view>
</view>
<view class="result">
  <text class="result__label">当前值</text>
  <text class="result__value">{{ form.date || '—' }} {{ form.time || '' }}</text>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | String | `''` | — | 'HH:mm'；空串表示未选择 |
| `placeholder` | String | `'请选择时间'` | — | — |
| `min` | String | `''` | — | 最小时间 'HH:mm'（仅 PC 面板禁用越界项；原生 picker 不支持时间范围） |
| `max` | String | `''` | — | — |
| `clearable` | Boolean | `true` | — | — |
| `disabled` | Boolean | `false` | — | — |
| `mode` | String | `'auto'` | — | — |
| `error` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |
| `clear` | 点击清除按钮 |

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 与 cd-date-picker 同一套双形态策略： 移动端走系统原生 &lt;picker mode="time">，PC 端自研双列面板。
- 刻意不支持秒：时间选择的真实场景里「秒」几乎只出现在日志类需求， 而它会让面板多一列、交互多一层。
- 真需要时用两个 time-picker 拼比 塞一个三列面板更清晰。
- PC 双列用 scroll-view + scroll-top 受控定位：点选时把列滚到 「选中项 - 偏移」的位置，让选中项大致停在列中间。

## 关联

[cd-date-picker](/components/date-picker)
