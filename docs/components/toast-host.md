---
title: ToastHost 反馈宿主
---

# ToastHost 反馈宿主

<div class="cd-api-tag">`toast-host` · 基础设施</div>

命令式反馈服务在小程序端的渲染宿主。H5 端服务会自动挂载、无需手写；小程序必须在页面里放一次，没放会自动降级到 uni.showToast 等原生 API。

## 用法

<CdDemo id="toast-host-0"></CdDemo>

```vue
<view class="stack">
  <text class="body-text">下列反馈全部由 service 触发。H5 端宿主会在首次调用时自动挂载；小程序端需要自己在页面里放一个 cd-toast-host。</text>
  <view class="row">
    <cd-button size="small" @click="toast.success('保存成功')">成功提示</cd-button>
    <cd-button size="small" @click="toast.error('保存失败')">失败提示</cd-button>
    <cd-button size="small" @click="runLoading">加载 1.2s</cd-button>
    <cd-button size="small" @click="runConfirm">确认框</cd-button>
  </view>
  <view class="row"><cd-tag type="info">confirm 结果：{{ result || "（未触发）" }}</cd-tag></view>
  <cd-toast-host />
</view>
```

## Props

无

## Events

无

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- service/ 里的全局状态（toast 队列 / 模态 / loading）在这里变成真实节点。
- 挂载方式： H5    —— 不需要手动挂。
- service 首次调用时自动 createApp 到 body。
- 小程序 —— 需要在页面里放一次 &lt;cd-toast-host />；没放也能用， service 会降级到 uni.showToast / showModal / showLoading。
- 小程序多页面都挂了宿主怎么办：不做唯一宿主仲裁。
- 所有宿主渲染同一份 全局状态，内容与坐标完全一致，重叠视觉上就是一份。
- 在小程序里拿不到「哪个页面在最上面」的可靠信号，仲裁是伪需求。

## 关联

[cd-config-provider](/components/config-provider)
