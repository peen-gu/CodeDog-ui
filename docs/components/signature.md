---
title: Signature 手写签名
---

# Signature 手写签名

<div class="cd-api-tag">`signature` · 表单与录入</div>

笔画拼成 SVG 再以内联 data URI 交给背景图渲染（与 cd-icon 同一套路），不用 canvas 因此四端一致。已完成笔画与正在画的一笔分成两组节点，移动时只重建后者。

## 用法

<CdDemo id="signature-0"></CdDemo>

```vue // 来自演示页 extended
<cd-signature
  :height="160"
  confirm-text="确认签名"
  @confirm="log('签名已确认')"
  @clear="log('已清空')"
/>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `width` | Number | `0` | — | 画布宽度，空则撑满父级（背景图模式需要确定像素宽，故内部会量一次） |
| `height` | Number | `180` | — | — |
| `color` | String | `'#1e293b'` | — | 笔迹颜色 |
| `strokeWidth` | Number | `3` | — | 笔迹粗细 |
| `backgroundColor` | String | `'#ffffff'` | — | — |
| `placeholder` | String | `'请在此签名'` | — | — |
| `showToolbar` | Boolean | `true` | — | — |
| `undoText` | String | `'撤销'` | — | — |
| `clearText` | String | `'清空'` | — | — |
| `confirmText` | String | `'确认'` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `start` | 开始 |
| `end` | — |
| `clear` | 点击清除按钮 |
| `undo` | — |
| `change` | 值变化时触发 |
| `confirm` | 确认 |

## Slots

无

## Expose

通过 `ref` 调用：

| 方法 / 属性 | 说明 |
|---|---|
| `toSvg` | — |
| `clear` | — |
| `undo` | — |
| `isEmpty` | — |
| `getStrokes` | — |
| `isDirty` | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- **不用 canvas**，理由与 cd-progress 一致（收录进 README 的那条）： canvas 在小程序里的层级表现、导出路径、高清屏处理都和 H5 不同， 一旦引入，同一个组件就要维护两套绘制逻辑。
- 替代方案：**把笔画拼成 SVG，再以内联 data URI 交给背景图渲染**。
- 这正是 cd-icon 已经在用的方式（见 icons.js 的 buildIconUri）， 所以「这份写法在四端能不能显示」这个问题，仓库里已经有答案了。
- 性能上唯一要当心的是：每次移动都要重新编码一遍 SVG 字符串。
- 所以把「已完成的笔画」与「正在画的这一笔」拆成两组节点 —— 手指移动只重建当前笔画那一层，历史笔画的原样留着不动。
- 否则每帧都要把全部笔画重新拼一遍字符串，笔画一多就是 O(n²)。

## 关联

[cd-button](/components/button) · [cd-divider](/components/divider)
