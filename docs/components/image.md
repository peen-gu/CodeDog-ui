---
title: Image 图片
---

# Image 图片

<div class="cd-api-tag">`image` · 数据展示</div>

统一封装 loading / loaded / error 三态，并内置 uni 的 image mode 与 CSS object-fit 的映射表，让同一套写法在两个端表现一致。

## 用法

```vue // 来自演示页 widgets
<view class="img-row">
  <view v-for="(item, index) in imageCases" :key="index" class="img-case">
    <cd-image
      :src="item.src"
      :size="96"
      :fit="item.fit"
      :round="item.round"
      :preview="index === 0"
      :error-text="item.text"
      @load="setImageState(index, 'loaded')"
      @error="setImageState(index, 'error')"
    />
    <text class="img-case__label">{{ item.label }}</text>
    <text class="img-case__state" :class="`img-case__state--${imgStates[index] || 'loading'}`">
      {{ imgStates[index] || 'loading' }}
    </text>
  </view>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `src` | String | `''` | — | — |
| `fit` | String | `'cover'` | — | fill / contain / cover / none / scale-down |
| `width` | String \| Number | `''` | — | — |
| `height` | String \| Number | `''` | — | — |
| `radius` | String \| Number | `''` | — | 圆角，数字按 px |
| `round` | Boolean | `false` | — | 圆形 |
| `size` | String \| Number | `''` | — | 通用图片尺寸（同时给宽高） |
| `lazyLoad` | Boolean | `true` | — | — |
| `showLoading` | Boolean | `true` | — | — |
| `preview` | Boolean | `false` | — | 点击自动预览大图 |
| `previewList` | Array | `() => []` | — | 预览图列表，默认只预览自己 |
| `errorText` | String | `''` | — | 失败时的提示文案，不想显示就留空 |
| `iconSize` | String \| Number | `'1.8em'` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `load` | — |
| `error` | — |
| `click` | 点击时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `loading` | — | — |
| `error` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 原生 &lt;image> 缺的不是「显示」，而是**状态**： 加载中长什么样、失败长什么样、失败要不要兜底占位。
- 业务里最常见的翻车现场就是「接口挂了，页面上出现一排碎图图标」。
- 所以这一层的价值全在三态管理上： loading → 一层占位（可带呼吸图标） loaded  → 占位撤掉，图片淡入 error   → 换成语义化的失败占位（不是浏览器的碎图） mode 的映射刻意做成一张显式表而不是行内三元： uni 的 &lt;image mode> 取值（scaleToFill / aspectFit / aspectFill） 和 CSS 的 object-fit（fill / contain / cover）不是同一套词， 业务写 CSS 习惯的 contain/cover 才是正确的 API 设计，转换在这里做掉。
- 已知限制：H5 的 &lt;image> 是真实 img，加载失败的判定依赖 onerror； 跨域图片若服务端不返回 CORS 头，onerror 也可能不触发。
- 这是浏览器的安全模型，不是能绕过去的东西。

## 关联

[cd-avatar](/components/avatar) · [cd-icon](/components/icon)
