# CodeDogUI

面向 [uni-app](https://uniapp.dcloud.net.cn/) 的跨端 UI 框架。**一套 Vue3 代码，同时覆盖 H5 移动端、H5 PC 浏览器、微信小程序与 Electron 桌面套壳。**

| 归　属 | |
|---|---|
| 长期维护 | **Codedog.tech** |
| UI 作者 | **Penn.Gu** |
| 官方站点 | https://ui.codedog.tech |
| 在线文档 | https://doc.ui.codedog.tech |
| 许可 | MIT · Copyright (c) 2026 Codedog.tech |

不是「响应式布局」那种两端共用一套视觉的方案，而是让同一个组件在手机与 PC 上呈现**各自的交互形态**：

| 组件 | 移动端形态 | PC 形态 |
|---|---|---|
| `cd-dialog` | 底部抽屉 | 居中模态 |
| `cd-select` | 底部动作面板 | 下拉面板 |
| `cd-table` | 卡片列表 | 多列表格 |
| `cd-date-picker` | 系统原生滚轮 | 自研日历面板 |

**80 个组件** · 320 个设计令牌 · 亮暗主题 · 命令式反馈服务 · MIT 许可。

## 安装

```bash
npm i codedog-ui
# 或把整个目录拷进 src/uni_modules/（uni_modules 形态，推荐）
```

## 四步接入

```vue
<!-- 1. App.vue 引入样式（一次） -->
<style lang="scss">
@import 'codedog-ui/styles';
</style>
```

```jsonc
// 2. pages.json 配置 easycom
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^cd-(.*)": "codedog-ui/components/cd-$1/cd-$1.vue",
      "^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue"
    }
  }
}
```

```vue
<!-- 3. 包一层 Provider（必填，主题/密度由它向下广播） -->
<template>
  <cd-config-provider>
    <view class="cd-page cd-page--desktop">…</view>
  </cd-config-provider>
</template>
```

```vue
<!-- 4. 直接用组件 -->
<cd-button type="primary" @click="save">保存</cd-button>
<cd-select v-model="status" :options="options" clearable />
<cd-table :columns="columns" :data="list" />
```

## 命令式反馈

```js
import { toast, confirm, alert, loading } from 'codedog-ui'

toast.success('保存成功')

const ok = await confirm({ title: '删除确认', content: '删除后无法恢复' })
if (ok) await remove()

const close = loading('提交中...')
close()
```

H5 零配置自动挂载宿主；小程序端在页面放一次 `<cd-toast-host />` 获得品牌样式，未放自动降级原生 API。

## 文档

完整文档（每个组件的 Props / Events / Slots / Exposes / 设计说明）：

- 在线文档站：**https://doc.ui.codedog.tech**
- 本地文档源码：`docs/` 目录，`npm run docs:dev` 启动
- 跨端约束清单：为什么不用 rpx、不让 CSS 变量参与 `calc` 除法、不用 `nth-child`……

## 版本

| 版本 | 说明 |
|---|---|
| 0.5.3 | 新增 13 个组件（67 → 80）：`cd-form-render` Schema 表单引擎，以及打字机 / 水印 / 颜色选择器 / 手写签名 / 穿梭框 / 二维码 / 树形控件 / 描述列表 / 导航栏 / 标签栏 / 字母索引栏 / 用户指引；门禁补 3 条小程序端编译期禁用规则；补齐 4 个组件的桌面端鼠标支持；文档产物行尾统一为 LF |
| 0.5.2 | 新增日历 / 选择器 / 级联选择 / 轮播 / 图片预览 5 个组件（62 → 67）；修复 6 项致命与 13 项严重问题 |
| 0.5.1 | 文档修订：补全「反馈与支持」入口，联系方式统一为官网 / Issues / 邮箱 / 微信 |
| 0.5.0 | 新增 25 个组件（导航/容器/展示工具类），总数 37 → 62；修复浮层族定位 bug |
| 0.4.0 | 命令式反馈服务 + 浮层族 |
| 0.3.0 | 展示与表单控件 15 个 |
| 0.2.0 | 通用组件 8 个 |
| 0.1.0 | 骨架：令牌 + 6 个基础组件 |

完整记录见 [changelog](./changelog.md)。

## 许可

[MIT](./LICENSE)。

- `cd-icon` 的 73 个图标衍生自 Feather(MIT) 与 Lucide(ISC)，**分发时必须保留署名**（已写入 `components/cd-icon/icons.js` 头部注释）
- 依赖 [wot-design-uni](https://github.com/Moonofweisheng/wot-design-uni)（MIT），仅 npm 依赖 + CSS 变量桥接，未再分发其源码

## 关于

CodeDogUI 由 **Codedog.tech** 长期维护，UI 由 **Penn.Gu** 设计开发。

| 渠　道 | |
|---|---|
| 官方站点 | https://ui.codedog.tech |
| 在线文档 | https://doc.ui.codedog.tech |
| 源码仓库 | https://github.com/peen-gu/CodeDog-ui |
| 邮箱 | codedog.tech@icloud.com |
| 微信 | penngu777 |

遇到问题？别客气，直接来找我们。

用得不顺手、发现 Bug、想要某个组件、或者文档没写清楚——**随时反馈**，我们看到就会处理。
商业合作与定制需求也可以直接邮件联系。觉得好用的话，欢迎到 GitHub 给个 Star 支持一下。
