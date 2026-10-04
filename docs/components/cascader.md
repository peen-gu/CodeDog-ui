---
title: Cascader 级联选择
---

# Cascader 级联选择

<div class="cd-api-tag">`cascader` · 表单与录入</div>

省市区、品类树这类「选一条从根到叶路径」的控件。与 picker 的分工：picker 是弹层、要点确定；cascader 是表单字段、点选即提交。面板多列并排而不是一级一屏，一眼能看到完整路径。check-strictly 控制父级是否可选，emit-path 决定回传整条路径还是末级值。

## 用法

<CdDemo id="cascader-0"></CdDemo>

```vue // 来自演示页 feedback
<view class="grid2">
  <view class="grid2__item">
    <text class="field-label">只能选到叶子</text>
    <cd-cascader v-model="cascaderValue" :options="areaTree" placeholder="请选择地区" clearable />
  </view>
  <view class="grid2__item">
    <text class="field-label">任意层级可选（check-strictly）</text>
    <cd-cascader v-model="cascaderStrictValue" :options="areaTree" check-strictly placeholder="省 / 市 / 区 都能停" />
  </view>
</view>
<view class="result">
  <text class="result__label">当前值</text>
  <text class="result__value">{{ cascaderValue.join(' / ') || '—' }}　｜　{{ cascaderStrictValue.join(' / ') || '—' }}</text>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Array \| String \| Number | `() => []` | — | 选中值。emitPath=true 时为「从根到叶」的值数组；false 时为末级单个值 |
| `options` | Array | `() => []` | — | 树形数据 |
| `fieldNames` | Object | `() => ({ label: 'label', value: 'value', children: 'children', disabled: 'disabled' })` | — | 字段映射：后端字段名对不上时改这里，不必先转换数据 |
| `placeholder` | String | `'请选择'` | — | 未选中时的提示文案 |
| `title` | String | `''` | — | 移动端弹层标题，缺省用 placeholder |
| `separator` | String | `' / '` | — | 展示已选路径时的分隔符 |
| `clearable` | Boolean | `false` | — | 是否可清空 |
| `checkStrictly` | Boolean | `false` | — | 是否允许选中任意层级（true 时父级也能选） |
| `changeOnSelect` | Boolean | `false` | — | 选中中间层是否立即提交（false 时点父级只展开下一列） |
| `emitPath` | Boolean | `true` | — | modelValue 是整条路径还是末级值 |
| `readonly` | Boolean | `false` | — | — |
| `disabled` | Boolean | `false` | — | — |
| `shape` | String | `'auto'` | — | auto / mobile / desktop |
| `zIndex` | Number | `2100` | — | 层级 |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |
| `clear` | 点击清除按钮 |
| `visible-change` | 显示状态变化 |

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 省市区、品类树、组织架构这类「选一个从根到叶的路径」的需求， 用多级 select 硬凑的话，联动逻辑要业务侧自己写、每次都重写一遍； 用单列 picker 又装不下树形结构。
- 这个组件把两者之间的空档补上。
- 五个实现决定： 1. 面板是「多列并排」，不是「一级一屏」。
- 移动端常见的另一种做法是顶部 Tab 切层级、一屏只显示一层 —— 那样要来回切才能看全路径。
- 多列并排一眼能看到「浙江 / 杭州 / 西湖区」， 代价是列数多时每列会变窄，所以文档里写清楚建议不超过 3 列。
- 2. 点选即提交，没有「确定」按钮。
- 级联选择是「点到底就选完了」的操作，中间不需要确认态； 加了确定按钮反而多一次点击。
- 取消/关闭只丢弃「点了一半的中间态」， 已经提交的值不受影响。
- 3. 「能不能选中间层」由 checkStrictly 显式控制。
- 默认 false —— 只有叶子可选，点父级只展开下一列； true 时任意层都能选。
- 不做「数据里有没有 children」的自动推断， 因为同一棵树在不同页面可能有不同诉求。
- 4. emitPath 决定 modelValue 是路径数组还是单个值。
- 表单里通常要整条路径（省市区三个字段一起存）， 但有时业务表只存最末级的 id —— 两种都要支持，且默认给路径（信息更全）。
- 5. 字段映射走 fieldNames，不写死 label / value / children。
- 后端返回的树很少正好叫这三个名字（常见 areaName / areaCode / subList）， 写死了业务就得先做一次遍历转换，那是纯粹的额外开销。
- 已知限制： - 不做异步加载子节点（lazy）。
- 需要懒加载的场景请用 cd-picker 自行组织列数据； - 桌面面板用 position:absolute 锚定，若触发器祖先带 overflow:hidden 会被裁切。

## 关联

[cd-picker](/components/picker) · [cd-select](/components/select)
