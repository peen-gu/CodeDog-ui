---
title: 命令式反馈服务
---

# 命令式反馈服务

一行调用，不需要在页面里挂组件。

```js
import { toast, confirm, alert, loading } from '@/uni_modules/codedog-ui'
```

为什么值得单独做一层：toast / confirm / loading 是**跨页面的瞬时状态**，把它建模成模板组件，会让每个页面都得放一份 `<ToastHost v-model="..." />`，还要处理「多个页面同时要显示」的仲裁。

## toast

```js
toast('已保存')                       // 默认
toast.success('保存成功')
toast.error('网络异常，请重试')
toast.warning('有 3 项未完成')
toast({ message: '自定义', duration: 5000, position: 'top' })
```

| 行为 | 说明 |
|---|---|
| 同文案去重续时 | 连点保存不会堆出三条「保存成功」，而是刷新这一条的计时 |
| 上限 3 条 | 超出丢最旧的一条 |
| position 默认 `auto` | PC 顶部，移动中部 |
| 文案超两行截断 | 避免极端文案把屏幕铺满 |

手动关闭某一条：`dismissToast(id)`。

## confirm / alert

Promise 化，**复用 `cd-dialog` 渲染**，所以视觉、双形态、Esc 行为与业务弹窗完全一致。

```js
const ok = await confirm({ title: '删除确认', content: '删除后无法恢复' })
if (ok) await remove()

await alert({ title: '提交完成', content: '我们会在 24 小时内审核' })
```

::: tip 后到的模态会把先到的按取消结算
如果新的 confirm 进来时旧的还开着，旧的会被按「取消」结算而不是被丢下——**悬挂的 Promise 比被顶掉更糟**。
:::

## loading

返回一个 close 句柄。重复调用只更新文案，不会叠两层遮罩。

```js
const close = loading('提交中...')
await submit()
close()
```

层级在 toast **之下**（2900 vs 3000）——临时通知要能透过 loading 遮罩被看到。

## 挂载策略

| 端 | 方式 |
|---|---|
| H5 | **零配置**。首次调用时动态 `import` 宿主并挂到 body，宿主与其依赖（如 cd-dialog）只在真正用到时才进产物 |
| 小程序 | 页面放一次 `<cd-toast-host />` 用品牌样式；**没放自动降级** `uni.showToast / showModal / showLoading`，API 语义不变 |

H5 这条路成立有个前提：`view` 在编译时变成字符串标签 `uni-view`，不依赖全局组件注册，所以脱离 uni-app 的应用实例也能 `createApp` 直接渲染。这一点已用探针在真实产物里验证过。

小程序端的降级是**刻意的兜底**而不是偷懒：任何库都绕不开「宿主必须手动挂」，与其让调用报错，不如保证语义一致的原生反馈。

## 层级

层级有两套，别弄混：

| 场景 | 用哪个 |
|---|---|
| CSS 里 | `var(--cd-z-modal)` = 2400 |
| 传给组件的 `zIndex` prop（Number） | `import { SERVICE_Z } from '...'` |

因为 CSS 变量传不进 Number 类型的 prop。
