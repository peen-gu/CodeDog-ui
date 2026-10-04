---
title: CheckboxGroup 复选框组
---

# CheckboxGroup 复选框组

<div class="cd-api-tag">`checkbox-group` · 表单与录入</div>

多选容器，支持 button 分段控件形态。差异全在 CSS，圆点用 display:none 切换而非 v-if。

## 用法

<CdDemo id="checkbox-group-0"></CdDemo>

```vue // 来自演示页 showcase
<view class="row row--baseline">
  <cd-checkbox v-model="singleCheck" label="独立勾选" />
  <cd-checkbox :model-value="false" indeterminate label="不确定态" />
  <cd-checkbox :model-value="true" disabled label="选中且禁用" />
  <cd-checkbox :model-value="false" disabled label="未选且禁用" />
</view>

<cd-divider position="left">多选组（横向 / 纵向）</cd-divider>

<view class="row">
  <cd-checkbox-group v-model="hobbies">
    <cd-checkbox value="read" label="阅读" />
    <cd-checkbox value="code" label="编码" />
    <cd-checkbox value="run" label="跑步" />
    <cd-checkbox value="music" label="音乐" />
  </cd-checkbox-group>
</view>

<view class="row row--baseline">
  <text class="body-text">选中：{{ hobbies.join('、') || '（无）' }}</text>
</view>

<cd-checkbox-group v-model="cities" direction="vertical">
  <cd-checkbox value="bj" label="北京" />
  <cd-checkbox value="sh" label="上海" />
  <cd-checkbox value="gz" label="广州（禁用）" disabled />
</cd-checkbox-group>

<cd-divider position="left">上限 2 项 —— 选第 3 个时会触发 overlimit</cd-divider>

<cd-checkbox-group v-model="limited" :max="2" @overlimit="handleOverlimit">
  <cd-checkbox value="a" label="选项 A" />
  <cd-checkbox value="b" label="选项 B" />
  <cd-checkbox value="c" label="选项 C" />
  <cd-checkbox value="d" label="选项 D" />
</cd-checkbox-group>
<text class="body-text">{{ limitTip }}</text>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Array | `() => []` | — | 选中值数组 |
| `disabled` | Boolean | `false` | — | — |
| `size` | String | `''` | — | small / default / large |
| `direction` | String | `'horizontal'` | — | horizontal / vertical |
| `min` | Number | `0` | — | 最少选中几项，达到下限后不允许再取消 |
| `max` | Number | `Infinity` | — | 最多选中几项，达到上限后不允许再选中 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |
| `overlimit` | 步进器到达边界 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 组的职责只有三件事：持有选中数组、下发选中态、统一触发校验。
- 为什么校验由「组」触发而不是每个 checkbox 各触发一次？
- 因为表单里的一个 prop 通常对应整组（比如 prop="hobbies"）， 如果每个子项都回调一次 onFieldChange，一次点击会触发 N 次校验， 而 N-1 次读到的都是同一个数组。
- 让组独占触发权，语义才清晰。
- 子项通过 provide/inject 拿上下文，所以 cd-checkbox 不需要知道 自己在不在组里以外的事 —— 它只判断「有没有组」，然后决定 是回调组还是自己 emit。

## 关联

[cd-checkbox](/components/checkbox)
