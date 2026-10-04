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
  - icon: >-
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>
    title: 双形态，而不是响应式
    details: 同一个组件在手机上是底部抽屉、在 PC 上是居中模态；表格在手机上降级为卡片列表。不是把一套视觉缩放，而是各自呈现该平台该有的交互形态。
  - icon: >-
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
    title: 三层设计令牌
    details: 原始色阶 → 语义色 → 组件令牌，改一次品牌色所有组件跟随。亮暗主题两套映射互斥合并，避免「深色底 + 深色字」。
  - icon: >-
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z"/><path d="m12 2 3.5 3.5L12 9 8.5 5.5 12 2Z"/><path d="M18.5 8.5 22 12l-3.5 3.5L15 12l3.5-3.5Z"/><path d="m12 15 3.5 3.5L12 22l-3.5-3.5L12 15Z"/></svg>
    title: 自研与复用分工明确
    details: 简单组件全自研（按钮、图标）以 100% 掌控设计语言；复杂组件（弹窗、选择器）复用 wot-design-uni 并做主题桥接，难点不重复投入。
  - icon: >-
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="m7.5 4.27 9 5.15"/></svg>
    title: 80 个组件，零全局污染
    details: 不使用标签选择器、通配符与不稳定的伪类，SCSS 全部落在组件作用域内；uni_modules 与 npm 双发布形态。
  - icon: >-
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
    title: 命令式反馈服务
    details: toast / confirm / alert / loading 一行调用。H5 零配置自动挂载宿主，小程序放一次宿主页即可获得品牌样式，未放自动降级原生 API。
  - icon: >-
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
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

## 在线预览

下面这些**不是截图**，是文档站里真实运行的 CodeDogUI 组件——与 npm 包里的同一份源码、同一套运行期令牌。
切换右上角的暗色模式，它们会跟着一起变，因为颜色全部来自 `var(--cd-*)`。

<div class="cd-demo cd-host">
  <CdButton type="primary" size="small">主操作</CdButton>
  <CdButton size="small" plain>次级</CdButton>
  <CdButton type="danger" size="small" round>危险</CdButton>
  <CdButton type="primary" size="small" round><template #icon><CdIcon name="download" :size="14" /></template>安装</CdButton>
</div>

<div class="cd-demo cd-host">
  <CdTag type="primary" size="small" round>primary</CdTag>
  <CdTag type="success" size="small" round>success</CdTag>
  <CdTag type="warning" size="small" round>warning</CdTag>
  <CdTag type="info" size="small" plain round>info</CdTag>
  <CdBadge value="68" />
  <CdProgress :percentage="72" />
</div>

### 版本进展

<CdTimeline class="cd-host">
  <CdTimelineItem timestamp="2026-10-01" type="success" icon="check">
    <div><strong>v0.5.0 · 发布到 npm</strong></div>
    <div>62 个组件、9 组组合组件，MIT 许可。（当时）</div>
  </CdTimelineItem>
  <CdTimelineItem timestamp="2026-10-01" type="primary" icon="grid">
    <div><strong>第五批 25 个组件</strong></div>
    <div>导航、容器与工具类全部补齐。</div>
  </CdTimelineItem>
  <CdTimelineItem timestamp="2026-10-04" type="primary" icon="grid">
    <div><strong>第七批 · 80 个组件</strong></div>
    <div>Schema 表单渲染等 13 个组件；同时补齐桌面浏览器的鼠标交互。</div>
  </CdTimelineItem>
  <CdTimelineItem timestamp="规划中" type="info" icon="cloud">
    <div><strong>Trusted Publishing 自动发版</strong></div>
    <div>走 GitHub Actions OIDC，仓库不再保存任何 token。</div>
  </CdTimelineItem>
</CdTimeline>

### 三步接入

<CdSteps :current="3" status="success" class="cd-host">
  <CdStep title="安装" description="npm i codedog-ui" icon="download" />
  <CdStep title="配置 easycom" description="^cd-(.*) → codedog-ui/components/cd-$1/cd-$1.vue" icon="setting" />
  <CdStep title="直接使用" description="模板里写 cd-button 即可" icon="check" />
</CdSteps>

```bash
npm i codedog-ui
```

> 组件 API 表格由脚本从 SFC 源码自动抽取（`npm run docs:gen`），
> 出现在 `/components/*` 的每个页面里，与本页预览用的是同一份源码。
