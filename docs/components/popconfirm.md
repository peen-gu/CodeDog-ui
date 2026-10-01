---
title: PopConfirm 气泡确认
---

# PopConfirm 气泡确认

<div class="cd-api-tag">`popconfirm` · 反馈与浮层</div>

轻量二次确认气泡，复用 useFloating 定位内核。宽度要用独立的 computed 拼到 panelStyle 上——customStyle 是字符串契约，直接传 computed 会被拼成 [object Object]。

## 用法

```vue // 来自演示页 widgets
<view class="row">
  <cd-popconfirm title="确认提交？" message="提交后不可修改，请确认信息无误。" @confirm="log('已提交')">
    <template #reference>
      <cd-button size="small">普通确认（top）</cd-button>
    </template>
  </cd-popconfirm>

  <cd-popconfirm
    title="删除这条记录？"
    message="删除后无法恢复。"
    confirm-type="danger"
    icon="warning"
    @confirm="log('已删除')"
    @cancel="log('已取消')"
  >
    <template #reference>
      <cd-button size="small" type="danger" plain>危险操作</cd-button>
    </template>
  </cd-popconfirm>

  <cd-popconfirm
    title="右侧方位"
    message="placement=right，空间不足时也会自动翻转。"
    placement="right"
    :show-cancel="false"
    confirm-text="知道了"
  >
    <template #reference>
      <cd-button size="small">单按钮（right）</cd-button>
    </template>
  </cd-popconfirm>

  <cd-popconfirm
    v-model="popconfirmOpen"
    title="受控打开"
    message="这个气泡由外部的 v-model 驱动，用来验证受控模式。"
    confirm-type="warning"
    placement="bottom"
  >
    <template #reference>
      <cd-button size="small">v-model 受控</cd-button>
    </template>
  </cd-popconfirm>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `modelValue` | Boolean | `false` | — | — |
| `title` | String | `''` | — | — |
| `message` | String | `''` | — | 提问文案。也可以用默认插槽写更复杂的内容 |
| `confirmText` | String | `'确定'` | — | — |
| `cancelText` | String | `'取消'` | — | — |
| `confirmType` | String | `'primary'` | — | primary / danger / warning |
| `icon` | String | `'help'` | — | 左侧图标，传空则不显示 |
| `placement` | String | `'top'` | — | — |
| `width` | String \| Number | `240` | — | — |
| `arrowSize` | Number | `6` | — | — |
| `showCancel` | Boolean | `true` | — | — |
| `disabled` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:modelValue` | v-model 绑定值变化 |
| `confirm` | 确认 |
| `cancel` | 取消 |
| `open` | 打开时 |
| `close` | 关闭时（动画结束后） |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `reference` | — | — |
| `title` | — | — |
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 和 cd-dialog 的分工：dialog 是「打断式」确认，用户必须先处理它； popconfirm 是「贴着触发物」的轻确认，回答完之后视线不用搬家。
- 删除单行、撤销一步这类动作用它比弹一个居中的 dialog 舒服得多 —— 尤其在 PC 上，鼠标不用横跨半个屏幕去点确定。
- 技术形态上它属于「气泡族」，因此和 cd-popover 共用 useFloating： 不遮罩、不锁滚动、不传送（传送出去会丢主题作用域，测量也麻烦）。
- 与 popover 的差别只在内容结构：这里固定是「图标 + 文案 + 两个按钮」。
- 危险操作（confirmType="danger"）刻意把确认按钮做成实心红， 取消按钮做成白底描边 —— 让「误点」永远落在视觉上更弱的那一侧。

## 关联

[cd-dialog](/components/dialog) · [cd-popover](/components/popover)
