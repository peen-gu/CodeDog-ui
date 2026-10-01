---
title: Drawer 抽屉
---

# Drawer 抽屉

<div class="cd-api-tag">`drawer` · 反馈与浮层</div>

四向抽屉，auto 模式下移动端从底部、PC 从右侧。左右方向时内层必须显式给 height:100%——wd-popup 只拉高定位壳。

## 用法

```vue // 来自演示页 feedback
<view class="row">
  <cd-button size="small" @click="drawer = 'auto'">auto（默认）</cd-button>
  <cd-button size="small" @click="drawer = 'left'">左侧</cd-button>
  <cd-button size="small" @click="drawer = 'top'">顶部</cd-button>
  <cd-button size="small" @click="drawer = 'right'">右侧（宽 400）</cd-button>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Boolean | `false` | — | — |
| `position` | String | `'auto'` | — | 'auto' \| 'left' \| 'right' \| 'top' \| 'bottom' |
| `size` | String \| Number | `''` | — | 抽屉尺寸：left/right 是宽度，top/bottom 是高度。 数字按 px；字符串原样透传，所以 '80%' / '320px' / 'min(90vw, 400px)' 都可以。 |
| `title` | String | `''` | — | — |
| `mode` | String | `'auto'` | — | 'auto' \| 'mobile' \| 'desktop' |
| `showClose` | Boolean | `true` | — | — |
| `maskClosable` | Boolean | `true` | — | — |
| `zIndex` | Number | `2200` | — | — |
| `beforeClose` | Function | `null` | — | — |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `open` | 打开时 |
| `close` | 关闭时（动画结束后） |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `title` | — | — |
| `default` | — | 默认插槽 |
| `footer` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 与 cd-dialog 的分工要分清： dialog 是「浮在内容上的一小块」，强调当下决策（确认 / 表单）； drawer 是「从边上滑进来的面板」，强调承载一块完整工作区 （筛选栏、详情侧栏、移动端导航菜单）。
- 所以 drawer 默认无 footer、 body 独立滚动、支持四向 —— 这些都不是给 dialog 加参数能替代的。
- 双形态策略： position="auto" 时移动端从底部滑入（拇指可达），PC 从右侧滑入 （后台侧栏的肌肉记忆）。
- 显式传 left/right/top/bottom 则两端一致。
- 复用 wd-popup 的遮罩 / 动画 / 滚动锁 / root-portal， 主题作用域由 useWotScope 补齐 —— 与 cd-dialog 同一套约定。

## 关联

[cd-dialog](/components/dialog)
