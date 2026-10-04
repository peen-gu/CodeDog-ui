---
title: Picker 多列选择器
---

# Picker 多列选择器

<div class="cd-api-tag">`picker` · 表单与录入</div>

选自定义数据的通用弹层：columns 传「列数组的数组」是独立多列，加 cascade 后传树即为级联。用 scroll-view 受控定位而不是原生 picker-view——后者在 H5 与小程序上的手感与样式差异太大且几乎不可控。草稿与提交分离：点确定才落到 modelValue。

## 用法

<CdDemo id="picker-0"></CdDemo>

```vue // 来自演示页 feedback
<view class="grid2">
  <view class="grid2__item">
    <text class="field-label">独立两列（品牌 / 车系）</text>
    <cd-button size="small" @click="flatPickerVisible = true">{{ flatPickerText }}</cd-button>
  </view>
  <view class="grid2__item">
    <text class="field-label">级联三列（省 / 市 / 区）</text>
    <cd-button size="small" @click="areaPickerVisible = true">{{ areaPickerText }}</cd-button>
  </view>
</view>

<cd-picker
  v-model="flatPickerValue"
  v-model:visible="flatPickerVisible"
  :columns="brandColumns"
  title="选择车系"
/>
<cd-picker
  v-model="areaPickerValue"
  v-model:visible="areaPickerVisible"
  :columns="areaTree"
  cascade
  title="选择地区"
/>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Array | `() => []` | — | 选中值数组，每列一个；级联模式下是「从根到叶」的路径。用 v-model 绑定 |
| `visible` | Boolean | `false` | — | 是否显示（弹层开关）。用 v-model:visible 绑定 |
| `columns` | Array | `() => []` | — | 列数据。 cascade=false 时为「列数组的数组」：[[{label,value}],[{label,value}]]； cascade=true 时为树：{label,value,children:[...]} |
| `cascade` | Boolean | `false` | — | 是否按级联（树形）解释 columns。true 时后一列由前一列选中项的 children 展开 |
| `title` | String | `''` | — | 工具条标题 |
| `cancelText` | String | `'取消'` | — | 取消按钮文案 |
| `confirmButtonText` | String | `'确定'` | — | 确定按钮文案 |
| `visibleRows` | Number | `5` | — | 列视口高度（px）。行高固定 36，建议传 5 或 7 的倍数再乘行高 |
| `loading` | Boolean | `false` | — | 数据加载中：显示一个转圈并挡住列，避免用户点到还没到的数据 |
| `readonly` | Boolean | `false` | — | 只读：可以打开看，但不能改 |
| `disabled` | Boolean | `false` | — | — |
| `shape` | String | `'auto'` | — | auto / mobile / desktop。桌面端为居中面板，移动端为底部弹层 |
| `closeOnClickMask` | Boolean | `true` | — | 点击遮罩是否关闭 |
| `zIndex` | Number | `2200` | — | 层级 |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `update:visible` | — |
| `change` | 值变化时触发 |
| `confirm` | 确认 |
| `cancel` | 取消 |

## Slots

无

## Expose

通过 `ref` 调用：

| 方法 / 属性 | 说明 |
|---|---|
| `scrollTo` | — |
| `reset` | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 它是 date-picker / time-picker 之外的「第三块拼图」： 那两个只能选日期和时间，业务里真正高频的是「选自定义数据」—— 品牌 → 车系 → 车型、一级分类 → 二级分类、仓库 → 库位…… 这类需求在没有通用 picker 的库里，只能靠多层 select 硬凑， 联动逻辑全落到业务侧，每次都重写一遍。
- 四个实现决定： 1. 数据形态二选一，且必须显式声明。
- cascade=false（默认）：columns 是「列数组的数组」，每列互不相关。
- cascade=true：columns 是一棵树，后面每一列由前一列的选中项 children 展开。
- 不做「检测到 children 就算级联」的自动推断 —— 同一份数据在不同页面想要不同解释时，隐式推断会让人猜不透。
- 2. 列用 scroll-view + scroll-top 受控定位，不用原生 picker-view。
- picker-view 在 H5 与小程序上的样式与手感差异很大（H5 是滚轮、小程序是惯性滑动）， 且高度、行距、文字样式几乎不可控。
- scroll-view 两端表现一致， 代价是要自己算 scrollTop —— 算法很简单：index * 行高 - 居中偏移。
- 3. 选中态与提交态分离。
- 点选项只改「草稿」innerValues，点确定才 emit 到 modelValue。
- 否则用户滑到一半、还没点确定，外部数据就已经被改了， 而「取消」要还原成什么就成了个说不清的问题。
- 4. 级联时改动上游列要截断下游。
- 选中「浙江」后列 2/3 是浙江的下级；此时改选「江苏」， 列 2/3 必须整体重算，且之前选中的「西湖区」要丢掉 —— 留着它会出现「江苏 / 西湖区」这种不存在的组合。
- 已知限制： - 列数超过 3 列时移动端会挤，由业务自行决定是否拆成两步； - 惯性滑动结束后的「吸附到整行」依赖 scroll-with-animation， 小程序低端机在快速连续滑动时可能停不住整行（原生 picker-view 同样如此）。

## 关联

[cd-cascader](/components/cascader) · [cd-select](/components/select)
