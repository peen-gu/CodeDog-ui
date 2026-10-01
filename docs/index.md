---
layout: home

hero:
  name: CodeDogUI
  text: 一套代码，两端各自的形态
  tagline: 面向 uni-app 的跨端 UI 框架 —— H5 移动 · H5 PC · 微信小程序 · Electron 桌面
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: 组件总览
      link: /components/
    - theme: alt
      text: 跨端约束清单
      link: /guide/cross-platform

features:
  - icon: 🔀
    title: 双形态，而不是响应式
    details: 同一个组件在手机上是底部抽屉、在 PC 上是居中模态；表格在手机上降级为卡片列表。不是把一套视觉缩放，而是各自呈现该平台该有的交互形态。
  - icon: 🎨
    title: 三层设计令牌
    details: 原始色阶 → 语义色 → 组件令牌，改一次品牌色所有组件跟随。亮暗主题两套映射互斥合并，避免「深色底 + 深色字」。
  - icon: 🧩
    title: 自研与复用分工明确
    details: 简单组件全自研（按钮、图标）以 100% 掌控设计语言；复杂组件（弹窗、选择器）复用 wot-design-uni 并做主题桥接，难点不重复投入。
  - icon: 📦
    title: 62 个组件，零全局污染
    details: 不使用标签选择器、通配符与不稳定的伪类，SCSS 全部落在组件作用域内；uni_modules 与 npm 双发布形态。
  - icon: ⚡
    title: 命令式反馈服务
    details: toast / confirm / alert / loading 一行调用。H5 零配置自动挂载宿主，小程序放一次宿主页即可获得品牌样式，未放自动降级原生 API。
  - icon: 🛡️
    title: 跨端约束写进了实现
    details: 禁用 rpx、禁止 CSS 变量参与 calc 除法、不用 nth-child……每一条禁例都对应一次真实的编译或渲染失败，详见「跨端约束清单」。
---

## 关于本项目

::: info 维护者
CodeDogUI 由 **Codedog.tech** 长期维护，UI 由 **Penn.Gu** 设计开发。

- 官方站点：<https://ui.codedog.tech>
- 在线文档：<https://doc.ui.codedog.tech>
- 源码仓库：<https://github.com/peen-gu/CodeDog-ui>（问题反馈走 Issues）
- 邮箱：codedog.tech@icloud.com · 微信：penngu777
- 许可：MIT · Copyright (c) 2026 Codedog.tech
:::

本项目同时以两种形态分发：

| 形态 | 获取方式 | 适用 |
|---|---|---|
| **uni_modules**（推荐） | 拷贝 `src/uni_modules/codedog-ui` 整个目录，或从 HBuilderX 插件市场导入 | HBuilderX 工程 |
| **npm 包** | `npm i codedog-ui` | 走 CLI 的 uni-app 工程 |
