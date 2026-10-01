---
title: ConfigProvider 全局配置
---

# ConfigProvider 全局配置

<div class="cd-api-tag">`config-provider` · 基础设施</div>

所有页面的根节点。向下广播主题（亮/暗）、尺寸密度与圆角形态，并把 wot-design-uni 的 CSS 变量一并桥接过去。页面里必须包它，否则组件拿不到令牌，暗色模式下会呈现一套未经设计的颜色。

## 用法

```vue // 来自演示页 components
<cd-config-provider :size="density">
  <view class="cd-page cd-page--desktop">
    <view class="cd-container">
      <!-- ================= 页头 ================= -->
      <view class="hero">
        <view class="hero__main">
          <text class="hero__title">组件库</text>
          <text class="hero__desc">
            icon · input · card · row/col · tabs · form —— 全部零外部依赖，两端（H5 / 小程序）行为一致
          </text>
        </view>
        <view class="hero__actions">
          <cd-button size="small" @click="toggleDensity">
            {{ density === 'small' ? '默认密度' : '紧凑密度' }}
          </cd-button>
        </view>
      </view>

      <!-- ================= cd-icon ================= -->
      <cd-card class="section" title="cd-icon" desc="自研矢量图标。零字体、零外链 CDN，颜色跟随父级文字色。">
        <template #extra>
          <text class="muted">{{ iconNames.length }} 个</text>
        </template>

        <view class="icon-grid">
          <view v-for="name in iconNames" :key="name" class="icon-cell">
            <cd-icon :name="name" :size="20" />
            <text class="icon-cell__name">{{ name }}</text>
          </view>
        </view>
      </cd-card>

      <!-- ================= 图标在上下文中的用法 ================= -->
      <cd-card class="section" title="图标的实际用法" desc="图标默认 1em，自动跟随所在文字的字号；也可以显式给颜色。">
        <view class="row">
          <cd-button type="primary">
            <template #icon><cd-icon name="plus" :size="16" /></template>
            新建
          </cd-button>
          <cd-button>
```

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
