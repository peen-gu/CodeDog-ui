---
title: Calendar 日历
---

# Calendar 日历

<div class="cd-api-tag">`calendar` · 表单与录入</div>

常驻日历面板（不是弹层），single / multiple / range 三种模式。与 date-picker 的分工：date-picker 是「点一下选完就走」的录入控件，calendar 是「要一直看着月份做安排」的展示面板。marks 支持打点与底部小字，formatter 可拦截单个格子的文案与可选性。

## 用法

<CdDemo id="calendar-0"></CdDemo>

```vue // 来自演示页 feedback
<view class="grid2">
  <view class="grid2__item">
    <text class="field-label">单选（带打点）</text>
    <cd-calendar v-model="calendarDate" :marks="calendarMarks" :show-confirm="false" />
  </view>
  <view class="grid2__item">
    <text class="field-label">区间选择（最长 7 天）</text>
    <cd-calendar v-model="calendarRange" mode="range" :max-range="7" />
  </view>
</view>
<view class="result">
  <text class="result__label">当前值</text>
  <text class="result__value">{{ calendarDate || '—' }}　｜　{{ calendarRange.join(' ~ ') || '—' }}</text>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | String \| Number \| Date \| Array | `''` | — | 选中值。single 模式为 'YYYY-MM-DD'；multiple 模式为字符串数组； range 模式为 [start, end] 二元组（未选完时可以是长度 0/1 的数组）。 也接受 Date 与时间戳，内部统一格式化成 'YYYY-MM-DD'。 |
| `mode` | String | `'single'` | — | 选择模式：single（单选）/ multiple（多选）/ range（区间） |
| `minDate` | String | `''` | — | 可选最小日期 'YYYY-MM-DD' |
| `maxDate` | String | `''` | — | 可选最大日期 'YYYY-MM-DD' |
| `weekStart` | Number | `1` | — | 一周从周几开始：0 = 周日，1 = 周一。 默认与 cd-date-picker 对齐取 1（国内习惯）—— 早先是 0，同页同时放日历和日期选择器时两个星期表头顺序不一致。 |
| `allowSameDay` | Boolean | `false` | — | range 模式下是否允许起止为同一天 |
| `maxRange` | Number | `0` | — | range 模式起止相隔天数的上限，0 表示不限制 |
| `marks` | Array | `() => []` | — | 打点标记。每项形如 { date: 'YYYY-MM-DD', text?: string, type?: 'dot'\|'text'\|'custom' }； dot 默认渲染一个小圆点，text 渲染底部小字，custom 不渲染、交给 cell 插槽 |
| `formatter` | Function | `null` | — | 单元格格式化函数 (cell) => cell。 cell 形如 { date, text, type: 'normal'\|'disabled'\|'selected'\|'start'\|'end'\|'middle', isWeekend, isToday }， 可改文案、把某天改成 disabled，或返回全新的 cell 对象 |
| `showConfirm` | Boolean | `true` | — | 是否显示确认按钮。为 false 时点击日期即提交（range 需选满两端才提交） |
| `showTitle` | Boolean | `true` | — | 显示年月标题 |
| `showSubtitle` | Boolean | `true` | — | 显示星期表头 |
| `confirmText` | String | `'确定'` | — | 确认按钮文案 |
| `readonly` | Boolean | `false` | — | 只读：可浏览不可选择 |
| `shape` | String | `'auto'` | — | 形态：auto（跟随视口）/ mobile / desktop。仅影响格子密度，本组件默认是常驻面板 |
| `customClass` | String | `''` | — | 追加到根节点的类名，便于业务做局部覆盖 |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |
| `confirm` | 确认 |
| `select` | 选中某一项 |
| `panel-change` | — |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `title` | `year` / `month` / `text` | — |
| `cell` | `cell` | — |
| `footer` | `value` | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 关键实现决策： 1) 常驻面板优先，不做「下拉触发器」。
- 本组件只负责日历本体：标题、星期、网格、确认按钮。
- 需要下拉形态时由外层（popup / popover）包裹它即可 —— 日历自己再包一层浮层定位、滚动收起、遮挡层，会让同一个组件 背上两套生命周期。
- shape 只用来切换触摸密度（格子高度 / 字号）， 沿用库内的 resolveDesktopShape，PC 上更紧凑、移动端手指更好点。
- 2) 日期计算全部走 utils/date.js。
- firstWeekday / daysInMonth 算网格，compareDay 判先后， inRange 判 min/max，clampDay 定位初始月份。
- 一行日期算法都不自己写 —— 月初是周几、跨月进位、1/31→2/28 这类 off-by-one 全在纯函数里被单独验证过了。
- 3) 三种模式共用一套「草稿 → 提交」状态机。
- 点击只改草稿；showConfirm 为 false 时立刻提交（区间要选满两端）， 为 true 时等点「确定」再 emit。
- 这样 modelValue 永远是「已经确定的值」，父级不会收到残缺的区间。
- 代价是 showConfirm=true 时单次点击不会更新 v-model —— 这是刻意的， 与「确认按钮存在即代表需要确认」的语义一致。
- 4) 草稿数组用「普通数组 + version ref」。
- draftList / draftRange 是可变数组，如果放进 ref()， push / splice 之后引用没变，按引用比对的计算属性不会重算。
- 所以数组保持普通变量，另用一个 draftVersion 手动 bump， 计算属性通过 readDraft() 读到版本号才接上响应式链。
- 5) 网格用占位格而不是补上/下月日期。
- 前置空位与末排空位都是 type:'placeholder' 的空格子（不可点）， 视觉上当月边界干净；想要「前后月日期可点」的场景等有需求再开开关。
- 6) cell.type 的优先级：选中态 → min/max 越界 → formatter。
- formatter 最后执行，因此它可以改文案、把任意一天改成 disabled， 也可以把越界的日期重新放开（最终判定以它返回的 type 为准）。
- 已知限制： - 只做「月」视图，没有年/月快速选择器，也没有滑动切换手势； - 外部改 modelValue 不会把面板翻到对应月份（仅初始化时定位一次）， 否则用户正在翻月时被外部值拽走会很突兀； - maxRange 判定的是「起止相隔天数」，不是「包含的自然日数」； - marks 的 type:'custom' 默认不渲染任何东西，交给 cell 插槽。

## 关联

[cd-date-picker](/components/date-picker)
