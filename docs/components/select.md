---
title: Select 选择器
---

# Select 选择器

<div class="cd-api-tag">`select` · 表单与录入</div>

移动端呈现底部动作面板、PC 呈现下拉面板。复用 wd-action-sheet 内核并做主题桥接，PC 端支持键盘导航。

## 用法

<CdDemo id="select-0"></CdDemo>

```vue
<cd-select v-model="picked" :options="pickOptions" placeholder="请选择" />
<view class="row">
  <cd-tag type="info">当前值：{{ picked || "（未选）" }}</cd-tag>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | String \| Number \| Boolean | `''` | — | — |
| `options` | Array | `() => []` | — | 选项列表 |
| `placeholder` | String | `'请选择'` | — | — |
| `title` | String | `''` | — | 移动端面板标题，不传则用 placeholder |
| `disabled` | Boolean | `false` | — | — |
| `clearable` | Boolean | `false` | — | 有值时是否显示一键清空 |
| `mode` | String | `'auto'` | — | 'auto' \| 'mobile' \| 'desktop' |
| `placement` | String | `'bottom'` | — | 桌面端下拉展开方向 |
| `size` | String | `'medium'` | — | 控件尺寸档位，透传给根节点类名，由 CSS 变量控制实际高度 |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |
| `clear` | 点击清除按钮 |
| `open` | 打开时 |
| `close` | 关闭时（动画结束后） |

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 这是「同一组件、两种交互模型」最典型的例子： 移动端 → 底部动作面板（wd-action-sheet） 手指够得到、选项高度 52px、有取消按钮、贴合安全区 桌面端 → 下拉面板（自研） 鼠标悬停高亮、方向键移动、回车选中、点击外部关闭 为什么桌面端不复用 wd-popup： 下拉面板需要「无遮罩 + 锚定在触发器下方 + 不阻塞页面其他交互」， 而 wd-popup 是模态语义（遮罩 + 滚动锁 + 全屏定位），套用反而更麻烦。
- 一个重要的架构简化：PC 形态只可能出现在 H5（isPC 的判定里带了 isH5）， 所以桌面端分支可以放心使用 document 级别的键盘监听， 不必为小程序写一套等价实现。

## 关联

[cd-dropdown](/components/dropdown) · [cd-action-sheet](/components/action-sheet)
