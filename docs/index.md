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
  <CdBadge value="62" />
  <CdProgress :percentage="72" />
</div>

### 版本进展

<CdTimeline class="cd-host">
  <CdTimelineItem timestamp="2026-10-01" type="success" icon="check">
    <div><strong>v0.5.0 · 发布到 npm</strong></div>
    <div>62 个组件、9 组组合组件，MIT 许可。</div>
  </CdTimelineItem>
  <CdTimelineItem timestamp="2026-10-01" type="primary" icon="grid">
    <div><strong>第五批 25 个组件</strong></div>
    <div>导航、容器与工具类全部补齐。</div>
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
