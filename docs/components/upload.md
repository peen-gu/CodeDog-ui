---
title: Upload 上传
---

# Upload 上传

<div class="cd-api-tag">`upload` · 表单与录入</div>

受控优先——列表真值在 modelValue，可用 customRequest 完全接管上传接口。图片卡片与文件列表双形态，含进度、重试、超量与超大回调。刻意不做拖拽：小程序没有 drag 事件体系。

## 用法

```vue // 来自演示页 feedback
<view class="grid2">
  <view class="grid2__item">
    <text class="field-label">图片卡片（最多 4 张）</text>
    <cd-upload v-model="images" accept="image" :max-count="4" multiple />
  </view>
  <view class="grid2__item">
    <text class="field-label">文件列表（单文件 ≤ 5MB）</text>
    <cd-upload v-model="docs" accept="file" list-type="list" :max-size="5" />
  </view>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Array | `() => []` | — | 文件列表。支持三种元素：url 字符串 / { url } / 完整记录 { url, name?, status?: 'success'\|'uploading'\|'error', percent? } |
| `accept` | String | `'image'` | — | 'image' \| 'file' |
| `action` | String | `''` | — | 上传接口地址（与 customRequest 二选一） |
| `name` | String | `'file'` | — | uni.uploadFile 的文件字段名 |
| `formData` | Object | `() => ({})` | — | — |
| `header` | Object | `() => ({})` | — | — |
| `customRequest` | Function | `null` | — | 自定义上传。签名：({ file, onProgress, onSuccess, onError }) |
| `multiple` | Boolean | `false` | — | — |
| `maxCount` | Number | `0` | — | 最多几个文件，0 表示不限制 |
| `maxSize` | Number | `0` | — | 单文件大小上限（MB），0 表示不限制 |
| `listType` | String | `'picture-card'` | — | 'picture-card' \| 'list' |
| `disabled` | Boolean | `false` | — | — |
| `error` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `change` | 值变化时触发 |
| `success` | — |
| `fail` | — |
| `progress` | — |
| `remove` | — |
| `exceed` | — |
| `oversize` | — |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `trigger` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 受控与非受控之间选了「受控优先」：文件列表的真值在 modelValue 里， 组件内部只负责「选文件 → 上传 → 回报状态」。
- 这样已上传列表可以直接 从服务端数据回填，也方便业务在做自己的接口（带 token、带签名）时 用 customRequest 接管上传动作本身。
- 两种上传通道： 默认    → uni.uploadFile 直传 action 自定义  → 传 customRequest，业务拿到文件与三个回调自己处理 刻意不做拖拽：小程序端没有 drag 事件体系，为 H5 单独维护一套 拖拽命中与高亮逻辑，投入产出比不划算，等真实场景出现再加。

## 关联

[cd-progress](/components/progress) · [cd-image](/components/image)
