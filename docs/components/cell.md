---
title: Cell 单元格
---

# Cell 单元格

<div class="cd-api-tag">`cell` · 布局与容器</div>

一行一项的列表单元。arrow 是三态属性：不传时跟随 clickable——能点的格子才该有箭头。放进 cd-cell-group 后由容器负责分隔线，自身的 border 不再生效。

## 用法

<CdDemo id="cell-0"></CdDemo>

```vue // 来自演示页 navigation
<view class="split">
  <view class="split__col">
    <text class="col-label">inset=false（通铺）</text>
    <cd-cell-group title="账号设置">
      <cd-cell title="头像" value="已上传" clickable @click="log('头像')" />
      <cd-cell title="昵称" value="CodeDog" clickable />
      <cd-cell icon="bell" title="消息通知" arrow label="接收订单与系统通知" />
      <cd-cell title="账号 ID" value="cd_8f3a21" :arrow="false" />
    </cd-cell-group>
  </view>

  <view class="split__col">
    <text class="col-label">inset=true（卡片）</text>
    <cd-cell-group inset title="订单">
      <cd-cell title="待付款" value="2" clickable />
      <cd-cell title="待发货" value="1" clickable />
      <cd-cell title="售后中" value="0" :arrow="false" />
    </cd-cell-group>
  </view>
</view>

<cd-divider position="left">独立使用 / 必填 / 禁用 / 长值</cd-divider>

<cd-cell-group inset>
  <cd-cell title="手机号" required value="138****8888" clickable />
  <cd-cell title="这是很长的标题文案用来验证右侧值区不会被挤没" value="右侧值" />
  <cd-cell
    icon="lock"
    title="登录密码"
    label="建议 8 位以上，包含字母与数字"
    required
    clickable
  />
  <cd-cell title="已停用的项" value="不可点" disabled clickable />
</cd-cell-group>

<cd-divider position="left">右侧自由内容（默认插槽）</cd-divider>

<cd-cell-group inset>
  <cd-cell title="默认插槽塞任意内容">
    <cd-tag type="success" size="small" label="已通过" />
    <cd-tag type="info" size="small" label="V2" />
  </cd-cell>
  <cd-cell title="带操作按钮" :arrow="false">
    <cd-button size="small" type="primary" plain>去处理</cd-button>
  </cd-cell>
</cd-cell-group>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `title` | String | `''` | — | 左侧主文案 |
| `label` | String | `''` | — | 主文案下方的小字说明 |
| `value` | String \| Number | `''` | — | 右侧值 |
| `icon` | String | `''` | — | 左侧图标名 |
| `required` | Boolean | `false` | — | 标题前显示必填星号 |
| `arrow` | Boolean | `null` | — | 是否显示右箭头。不传（null）时跟随 clickable： 能点击的格子才应该有箭头，这是默认语义。 |
| `clickable` | Boolean | `false` | — | 可点击：加光标与按压反馈 |
| `border` | Boolean | `true` | — | 底部分隔线。在 cd-cell-group 内部由容器负责，本属性不再生效 |
| `center` | Boolean | `true` | — | 垂直居中。关闭后内容顶部对齐，适合右侧是多行文本的场景 |
| `disabled` | Boolean | `false` | — | — |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `click` | 点击时触发 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `icon` | — | — |
| `title` | — | — |
| `label` | — | — |
| `value` | — | — |
| `default` | — | 默认插槽 |
| `arrow` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 这是移动端信息架构里最高频的一块积木：左边标题、右边值、末尾一个箭头。
- 它本身不做任何业务，价值全在「一套对齐规则」—— 不同页面里手写十几行样式拼出来的「标题 + 值 + 箭头」， 十有八九在图标宽度、文字基线、右边距上互相对不齐。
- 三个刻意的设计取舍： 1. 底边线归属容器，不归属自己。
- 单元格单独使用时（props.border）自带一条底边线； 一旦被 cd-cell-group 包住，底边线交给容器统一画在两格交界处。
- 这样天然不会在最后一格下面多出一条悬空的线 —— 因为 `:last-child` 在小程序 WXSS 的支持并不可靠， 而「相邻兄弟选择器」是稳的（cd-checkbox-group 已经在用同一招）。
- 2. arrow 是三态而不是布尔。
- arrow 未显式传入时跟随 clickable —— 能点的格子才该有箭头， 这在绝大多数场景下就是用户想要的，不必两处都写。
- 3. 值区是一个 flex 行而不是一个 text。
- 真实业务里右边经常不止一个值（数字 + 标签 + 按钮）， 所以除了 value 属性还留了默认插槽，且默认插槽永远排在箭头左边。

## 关联

[cd-cell-group](/components/cell-group)
