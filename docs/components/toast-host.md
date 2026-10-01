---
title: ToastHost 反馈宿主
---

# ToastHost 反馈宿主

<div class="cd-api-tag">`toast-host` · 基础设施</div>

命令式反馈服务在小程序端的渲染宿主。H5 端服务会自动挂载、无需手写；小程序必须在页面里放一次，没放会自动降级到 uni.showToast 等原生 API。

## 用法

```vue // 来自演示页 service
<cd-toast-host />
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
