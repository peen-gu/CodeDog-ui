---
title: Dropdown 下拉菜单
---

# Dropdown 下拉菜单

<div class="cd-api-tag">`dropdown` · 导航</div>

命令型动作菜单，与 cd-select 的表单语义刻意分离。PC 端支持 hover/click 触发切换与键盘导航（↑↓/Enter/Esc）。

## 用法

```vue // 来自演示页 feedback
<view class="row">
  <cd-dropdown
    :options="menuOptions"
    trigger="click"
    placeholder="操作"
    @select="onMenuSelect"
  />
  <cd-dropdown
    :options="menuOptions"
    trigger="hover"
    placement="bottom-end"
    placeholder="hover 触发"
    @select="onMenuSelect"
  />
  <text v-if="menuResult" class="muted">最近选择：{{ menuResult }}</text>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `options` | Array | `() => []` | — | 菜单项。结构：{ label, value?, icon?, disabled?, danger?, divided?, group? } group 项只做分组标题渲染，不可点、不占高亮序号。 |
| `trigger` | String | `'auto'` | — | — |
| `placement` | String | `'bottom-start'` | — | — |
| `placeholder` | String | `'更多操作'` | — | 未提供 reference 插槽时渲染的默认按钮文案 |
| `disabled` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `select` | 选中某一项 |
| `visible-change` | 显示状态变化 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `reference` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 与 cd-select 的语义分工要分清： select 是「表单控件」——选完要往表单里写值，有 v-model 与校验； dropdown 是「动作入口」——每一项是一个命令（编辑 / 删除 / 导出）， 没有 v-model，没有校验，选中即执行。
- 长得像不代表是同一类东西，混在一起会让表单层和命令层互相污染。
- PC 交互：hover 或 click 触发（可配），↑↓ 移动高亮、Enter 选中、Esc 关闭。
- 移动端：点击触发，无 hover。

## 关联

[cd-popover](/components/popover) · [cd-select](/components/select)
