---
title: Transfer 穿梭框
---

# Transfer 穿梭框

<div class="cd-api-tag">`transfer` · 表单与录入</div>

左右两栏 + 搜索过滤 + 全选。禁用项不可移，direction 可调（窄屏自动竖排）。

## 用法

<CdDemo id="transfer-0"></CdDemo>

```vue // 来自演示页 extended
<cd-transfer
  v-model="transferValue"
  :data="transferData"
  :titles="['待选角色', '已选角色']"
  :height="240"
  filterable
  @change="onTransferChange"
/>

<view class="result">
  <text class="result__label">已选</text>
  <text class="result__value">{{ transferValue.join('、') || '（空）' }}</text>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | Array | `() => []` | — | 全部可选项。每项 { [keyField], [labelField], [disabledField] } |
| `modelValue` | Array | `() => []` | — | 右侧已选项的 key 数组 |
| `titles` | Array | `() => ['待选', '已选']` | — | 两侧标题 |
| `keyField` | String | `'key'` | — | — |
| `labelField` | String | `'label'` | — | — |
| `disabledField` | String | `'disabled'` | — | — |
| `filterable` | Boolean | `false` | — | 是否显示搜索框 |
| `placeholder` | String | `'搜索'` | — | — |
| `direction` | String | `'horizontal'` | — | horizontal 左右并排 / vertical 上下堆叠（窄屏推荐） |
| `height` | Number | `220` | — | — |
| `emptyText` | String | `'暂无数据'` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 状态模型刻意做成「**只存右侧的 key 数组**」而不是两边各存一份： 左边永远是「全集 - 右边」，所以任何时刻都不会出现两边不一致 —— 不存在同步问题，也就不需要 reconcile 逻辑。
- 穿梭（move）时不删除右边原项的位置记忆：多数业务希望「移过去再移回来」 保持插入顺序，而不是被推到末尾。
- 所以右侧顺序按**初始 data 顺序**过滤得到， 而不是按移入先后 push 出来的。
- 这是本组件唯一一处为了手感多做的一点事。
- 筛选框用原生 input（uni 内建组件），不是 cd-input： 穿梭框往往是密集列表里的小输入框，套一整层表单组件会让行高失控， 而且这里的输入不需要校验 / 清空 / 前后缀那些能力。

## 关联

[cd-checkbox](/components/checkbox) · [cd-search-bar](/components/search-bar)
