---
title: Avatar 头像
---

# Avatar 头像

<div class="cd-api-tag">`avatar` · 数据展示</div>

图片 → 插槽 → 图标 → 文字的降级链，任何一级失败都不会出现破图。无底色时用稳定哈希生成背景色，避免每次刷新变色。

## 用法

```vue // 来自演示页 showcase
<view class="row row--baseline">
  <cd-avatar icon="user" :size="28" />
  <cd-avatar icon="user" :size="40" />
  <cd-avatar icon="user" :size="56" />
  <cd-avatar text="张三" :size="40" />
  <cd-avatar text="欧阳修" :size="40" />
  <cd-avatar text="Michael" :size="40" />
  <cd-avatar text="李四" :size="40" shape="square" />
  <cd-avatar
    src="https://this-host-does-not-exist.invalid/x.png"
    text="降级"
    :size="40"
  />
</view>
<text class="body-text">
  左起第 8 个刻意给了一个不存在的图片地址，可以看到它自动降级成文字头像而不是显示破图。
</text>
```

```vue // 来自演示页 showcase
<view class="row row--baseline">
  <cd-badge :value="5">
    <cd-button size="small">
      <template #icon><cd-icon name="bell" :size="16" /></template>
      通知
    </cd-button>
  </cd-badge>

  <cd-badge :value="128">
    <cd-avatar text="张三" :size="36" />
  </cd-badge>

  <cd-badge is-dot outlined>
    <cd-avatar icon="user" :size="36" />
  </cd-badge>

  <cd-badge value="NEW" type="success">
    <cd-button size="small">新功能</cd-button>
  </cd-badge>

  <cd-badge :value="0">
    <cd-button size="small">值为 0 不显示</cd-button>
  </cd-badge>

  <cd-badge :value="0" show-zero>
    <cd-button size="small">show-zero</cd-button>
  </cd-badge>

  <cd-badge :value="7" is-dot />
  <cd-badge :value="7" />
  <cd-badge :value="7" type="success" />
  <cd-badge :value="7" type="warning" />
  <cd-badge :value="7" type="info" />
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `src` | String | `''` | — | 图片地址 |
| `size` | String \| Number | `40` | — | 尺寸：数字按 px，字符串原样输出（如 '3em' / '25%'） |
| `shape` | String | `'circle'` | — | circle / square |
| `icon` | String | `''` | — | 图片加载失败或未提供图片时展示的图标 |
| `text` | String | `''` | — | 图片加载失败或未提供图片时展示的文字（一般传姓名） |
| `bgColor` | String | `''` | — | 自定义底色，不传则按文字内容生成一个稳定的颜色 |
| `color` | String | `''` | — | 文字颜色 |
| `fit` | String | `'cover'` | — | cover / contain / fill |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click` | 点击时触发 |
| `error` | — |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 核心是「降级链」：src 图片 → 默认插槽 → icon → text → 空。
- 任何一级缺失就落到下一级，所以头像组件永远不会出现破图或者空洞。
- 图片加载失败的处理放在组件内部（

## 关联

[cd-image](/components/image) · [cd-icon](/components/icon)
