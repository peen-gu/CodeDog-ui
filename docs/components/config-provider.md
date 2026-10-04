---
title: ConfigProvider 全局配置
---

# ConfigProvider 全局配置

<div class="cd-api-tag">`config-provider` · 基础设施</div>

所有页面的根节点。向下广播主题（亮/暗）、尺寸密度与圆角形态，并把 wot-design-uni 的 CSS 变量一并桥接过去。页面里必须包它，否则组件拿不到令牌，暗色模式下会呈现一套未经设计的颜色。

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `theme` | String | `''` | — | 'light' \| 'dark' \| 'auto' \| ''（空 = 跟随全局状态） |
| `size` | String | `'default'` | — | 'small' \| 'default' \| 'large' |
| `wotThemeVars` | Object | `() => ({})` | — | 追加 / 覆盖传给 wot-design-uni 的主题变量 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:theme` | 主题切换（v-model:theme） |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 一次挂载，同时解决三件事： 1. 让 CodeDogUI 自己的组件拿到 --cd-* 变量 （.cd-root 类名在 tokens.scss 里挂了全套亮色变量） 2. 让 wot-design-uni 的组件跟随同一套设计语言 通过 theme-vars 把 --wot-* 变量灌进去 —— 这是二次封装的关键一步。
- 不做这一步，页面上会是「我们的按钮」和「它的弹窗」两套视觉。
- 3. 统一尺寸密度 size 档位挂在根节点上，一条 --cd-control-height 改动全局生效， 这是 PC（紧凑）与移动（宽松）最实用的差异控制点。
- theme 传空字符串表示「跟随全局主题状态」，适合作为应用根容器； 传入具体值则锁定该子树，适合局部固定主题的场景（如强制亮色的打印区）。

## 关联

[cd-toast-host](/components/toast-host)
