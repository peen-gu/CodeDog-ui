---
title: Checkbox 复选框
---

# Checkbox 复选框

<div class="cd-api-tag">`checkbox` · 表单与录入</div>

独立使用时绑定布尔值，放进 cd-checkbox-group 后绑定数组的成员。校验由组统一触发，避免一次点击触发 N 次校验。

## 用法

<CdDemo id="checkbox-0"></CdDemo>

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
| `modelValue` | Boolean | `false` | — | 独立用法下的选中态（布尔）。组内用法请忽略它 |
| `value` | String \| Number \| Boolean | `''` | — | 组内用法下本项的标识值 |
| `label` | String | `''` | — | 文字，也可以用默认插槽 |
| `disabled` | Boolean | `false` | — | — |
| `indeterminate` | Boolean | `false` | — | 不确定态（一般用于「全选」）：显示横杠而不是勾 |
| `size` | String | `''` | — | small / default / large，不传则跟随所在组 |
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

- 一个组件承担两种用法，靠「有没有被 cd-checkbox-group 包住」区分： 独立用法：v-model="agree"            modelValue 是布尔 组内用法：&lt;cd-checkbox-group v-model="list">&lt;cd-checkbox value="a" /> 此时 modelValue 不参与，选中态由组的数组决定 为什么不在组内也用 modelValue？
- 因为组内每一项的「值」和「选中态」是两件事， 如果复用 modelValue，业务就得为每个选项准备一个 ref，写完 5 个选项就有 5 个 ref 加一个数组要同步 —— 这是 Element/Ant 都踩过并最终放弃的写法。
- Vue3 的 v-model 是单向的（props.modelValue + emit），所以独立用法下 必须自己 emit，不能直接改 props —— 这在组内由 group.toggle 统一处理。

## 关联

[cd-checkbox-group](/components/checkbox-group)
