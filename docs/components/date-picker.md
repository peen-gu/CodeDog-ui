---
title: DatePicker 日期选择
---

# DatePicker 日期选择

<div class="cd-api-tag">`date-picker` · 表单与录入</div>

移动端走系统原生滚轮、PC 端自研日历面板——自研滚轮要处理 scroll-top 回环与惯性判定，而原生控件在移动端本来就是正确设计。range 范围选择暂未实现。

## 用法

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
| `modelValue` | String | `''` | — | 'YYYY-MM-DD'；空串表示未选择 |
| `placeholder` | String | `'请选择日期'` | — | — |
| `min` | String | `''` | — | 最早可选日期 'YYYY-MM-DD' |
| `max` | String | `''` | — | 最晚可选日期 'YYYY-MM-DD' |
| `weekStart` | Number | `1` | — | 0 = 周日开头，1 = 周一开头（默认，国内习惯） |
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

- 双形态的策略性取舍： 移动端直接用 uni 内置 &lt;picker mode="date">。
- 原生滚轮的手感、 惯性、无障碍都是系统级的，自研滚轮要处理 scroll-top 回环、 惯性结束判定、逐平台差异，投入产出比极差 —— 而且「原生控件」 在移动端本来就是正确的设计语言。
- PC 端自研日历面板：宽屏上滚轮选择日期是倒退，日历才是正解。
- 范围选择（range）刻意没做：一个组件同时做单选 + 范围会让 面板状态机翻倍，等有真实场景再加 cd-date-range。

## 关联

[cd-time-picker](/components/time-picker) · [cd-popover](/components/popover)
