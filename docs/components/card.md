---
title: Card 卡片
---

# Card 卡片

<div class="cd-api-tag">`card` · 数据展示</div>

通用容器，提供 header / extra / footer 插槽与 hoverable。刻意与工具类 .cd-panel 职责分离，避免类名撞车导致 padding 叠加。

## 用法

<CdDemo id="card-0"></CdDemo>

```vue // 来自演示页 components
<cd-row :gutter="[16, 16]">
  <cd-col :span="{ xs: 24, md: 12, lg: 8 }">
    <cd-card title="基础卡片" desc="带标题与副标题">
      <text class="body-text">主体内容区。点击下方按钮可以看到交互反馈。</text>
      <template #footer>
        <cd-button size="small" type="primary" block>查看详情</cd-button>
      </template>
    </cd-card>
  </cd-col>

  <cd-col :span="{ xs: 24, md: 12, lg: 8 }">
    <cd-card title="可点击卡片" desc="有悬停浮起与按压反馈" hoverable shadow="hover" @click="handleCardClick">
      <text class="body-text">PC 上悬停会微微上浮，手机上按压会轻微收缩。</text>
    </cd-card>
  </cd-col>

  <cd-col :span="{ xs: 24, md: 12, lg: 8 }">
    <cd-card compact>
      <template #header>
        <text class="body-text">自定义 header 插槽</text>
      </template>
      <template #extra>
        <cd-icon name="setting" :size="16" />
      </template>
      <text class="body-text">紧凑模式，间距更小，适合列表型信息。</text>
    </cd-card>
  </cd-col>
</cd-row>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `title` | String | `''` | — | — |
| `desc` | String | `''` | — | 副标题，跟随 title 显示 |
| `bordered` | Boolean | `true` | — | 是否显示描边 |
| `shadow` | String | `'never'` | — | never / hover / always |
| `hoverable` | Boolean | `false` | — | 整个卡片可点击（会有悬停浮起与按压反馈） |
| `noPadding` | Boolean | `false` | — | 关闭主体内边距，用于表格、图片等需要通铺的内容 |
| `compact` | Boolean | `false` | — | 收紧内边距（列表型卡片，信息密度更高） |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click` | 点击时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `header` | — | — |
| `extra` | — | — |
| `default` | — | 默认插槽 |
| `footer` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 这不是「双形态」组件：卡片在手机上和在 PC 上是同一个东西。
- 它需要的是密度可调 —— 也就是 padding 由 CSS 变量控制， 于是同一个 cd-card 在 Provider 切换 density 时会自动收紧或放宽， 不需要业务写第二套样式。
- 一个设计决策：body 默认是「无内边距」还是「有内边距」？
- 这里的答案是「有，且与头部共用同一个 padding」， 因为这符合 95% 的使用场景（标题 + 内容一起排）。
- 需要表格、图片这类通铺内容时用 no-padding 关掉它。

## 关联

[cd-divider](/components/divider)
