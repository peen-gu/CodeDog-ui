# CodeDogUI

[![npm](https://img.shields.io/npm/v/codedog-ui)](https://www.npmjs.com/package/codedog-ui) [![npm downloads](https://img.shields.io/npm/dm/codedog-ui)](https://www.npmjs.com/package/codedog-ui) [![license](https://img.shields.io/npm/l/codedog-ui)](./LICENSE) [![components](https://img.shields.io/badge/components-62-blue)](https://doc.ui.codedog.tech)

面向 uni-app 的跨端 UI 框架。**一套 Vue3 代码，同时覆盖 H5 移动端、H5 PC 浏览器、微信小程序与 Electron 桌面套壳。**

| 归　属 | |
|---|---|
| 长期维护 | **Codedog.tech** |
| UI 作者 | **Penn.Gu** |
| 官方站点 | https://ui.codedog.tech |
| 在线文档 | https://doc.ui.codedog.tech |
| 源码仓库 | https://github.com/peen-gu/CodeDog-ui |
| 邮箱 / 微信 | codedog.tech@icloud.com / penngu777 |
| 组件数 | 62（uni_modules + npm 双形态） |
| 许可 | MIT · Copyright (c) 2026 Codedog.tech |

不是「响应式布局」那种两端共用一套视觉的方案，而是让同一个组件在手机与 PC 上呈现**各自的交互形态**：选择器在手机上是底部动作面板、在 PC 上是下拉面板；弹窗在手机上是底部抽屉、在 PC 上是居中模态；表格在手机上自动降级成卡片列表。

## 快速开始

```bash
npm install        # 首次安装

npm run dev:h5     # 浏览器开发（推荐先用这个）
npm run build:h5   # 构建 H5

npm run dev:mp-weixin    # 微信小程序开发，产物在 dist/dev/mp-weixin
npm run build:mp-weixin  # 微信小程序构建

npm run electron:start   # Electron 套壳加载 dist/build/h5
```

## 安装 npm 包

包已发布：<https://www.npmjs.com/package/codedog-ui>

```bash
npm i codedog-ui
```

uni-app 项目在 `pages.json` 里配 easycom，即可直接使用全部组件，无需逐个 import：

```jsonc
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^cd-(.*)": "codedog-ui/components/cd-$1/cd-$1.vue"
    }
  }
}
```

再在 `App.vue` 里引入样式（或直接 `@import 'codedog-ui/styles';`）：

```scss
@import 'codedog-ui/styles';
```

> uni-app 对 `node_modules` 内的包**同样执行条件编译**，实测 H5 / 微信小程序双端产物均正确，小程序产物里不会出现 H5 分支代码。

## 技术基线

| 项 | 版本 | 说明 |
|---|---|---|
| uni-app | `3.0.0-5020620260917001` | Vue3 稳定线 |
| Vue | `^3.4.21` | 全部使用 `<script setup>` |
| Vite | `5.2.8` | |
| wot-design-uni | `1.14.0` | 底层库，版本已锁定 |

> 上游版本锁定不是保守，是路线 B（二次封装）的必要条件——我们依赖它的内部结构与 CSS 变量命名，升级需要主动核对。

## 三层架构

```
第 1 层 · 设计变量 Design Tokens   色彩 / 间距 / 字号 / 圆角 / 动效 / 层级
第 2 层 · 平台适配层 Adapter       断点判断 / 终端探测 / 主题切换 / 交互态降级
第 3 层 · 基础组件层 Components    一份 Vue3 SFC，同一组件内渲染双形态结构
```

改动只会从上往下传导，禁止下层反向引用上层。

### 第 1 层 · 设计变量

位置：`src/uni_modules/codedog-ui/styles/`

| 文件 | 作用 |
|---|---|
| `scss-tokens.scss` | 编译期令牌（断点、mixin）。被 `src/uni.scss` 注入所有 SFC，**只能放 `$` 变量与 `@mixin`，禁止产生 CSS 输出** |
| `tokens.scss` | 运行期令牌，三层结构，亮暗两套 |
| `utilities.scss` | 极小体积工具类，不做 Tailwind 式体系 |
| `index.scss` | 样式总入口，App.vue 引一次即可 |

三层令牌：

```
L1 原始令牌   --cd-brand-500 / --cd-neutral-200      只被 L2 引用
L2 语义令牌   --cd-color-primary / --cd-text-secondary   业务代码用这一层
L3 组件令牌   --cd-button-height / --cd-dialog-width     组件内部用
```

**挂载点设计**（跨端最关键的一处）：

- `page` —— 全局兜底，不包 Provider 也能用
- `html` —— 仅 H5，保证传送出 body 的弹层仍继承到变量，同时承接暗色全局切换
- `.cd-root` —— **可移植的主题作用域**。弹层被 Teleport 后自己挂这个类就能拿回全套变量

**三条铁律**：

1. **单位只用 `px`，不用 `rpx`**。uni-app H5 端 rpx 换算约在 960px 封顶，宽屏上元素会被拉爆
2. **所有组件一律写 `var(--cd-x, 兜底值)`**。即使三级挂载点全部失效，组件仍按默认值正确渲染
3. **样式只挂在自有 `cd-` 类名上**。小程序 WXSS 不支持通配符、标签选择器、属性选择器，组件库必须零全局污染

### 第 2 层 · 平台适配层

位置：`src/uni_modules/codedog-ui/composables/`

| API | 用途 |
|---|---|
| `useDevice()` | **组件最常用的入口**，合并平台 + 断点全部信号 |
| `usePlatform()` | 终端探测，编译期条件编译优先、运行时兜底 |
| `useBreakpoint()` | 断点（xs/sm/md/lg/xl），单例监听 |
| `useTheme()` | 亮暗主题，模块级单例 + storage 持久化 |
| `useWotScope()` | 为传送出 Provider 的弹层重建主题作用域 |

**`isPC` 与 `isDesktop` 的区别（最容易用错的地方）**：

- `isDesktop`：视口宽度 ≥ 1024，单纯的尺寸事实
- `isPC`：**H5 平台 + 桌面断点 + 精确指针**，是「交互形态」结论

组件的双形态切换一律用 `isPC`。宽度会把「PC 上拖窄的窗口」误判成手机，hover 会把「带触摸屏的笔记本」误判成平板，所以必须三重判定。

另外 `isPC` 里带 `isH5`：小程序即使跑在宽屏 PC 微信里也保持移动形态，因为它的交互模型仍是触摸 + 底部弹出。

**`useBreakpoint` 的单例设计**：尺寸状态提到模块级，只在第一个订阅者出现时挂监听、最后一个订阅者卸载时摘掉。100 个组件各自 `addEventListener('resize')` 会让滚动直接卡死。

### 第 3 层 · 双形态组件

| 组件 | 移动端形态 | PC 形态 | 备注 |
|---|---|---|---|
| `cd-config-provider` | — | — | 主题注入 + 密度统一 |
| `cd-button` | 单形态 | 单形态 | 简单组件自研，掌控设计语言 |
| `cd-dialog` | 底部抽屉 | 居中模态 | 复用 wd-popup，支持 Esc + beforeClose |
| `cd-select` | 底部动作面板 | 下拉面板 | 复用 wd-action-sheet，PC 支持键盘，已接入表单校验 |
| `cd-table` | 卡片列表 | 多列表格 | 首列自动升格为卡片标题 |
| `cd-pagination` | 上一页/下一页 | 完整页码 | 页码数量恒定，不跳动 |

### 第 4 层 · 通用组件（第二批）

这批组件不需要双形态，但每一条实现都对应一个具体的跨端约束。

| 组件 | 关键设计 | 跨端约束的来源 |
|---|---|---|
| `cd-icon` | 72 个 24×24 描边图标，CSS mask + data URI，颜色跟 `currentColor` | **不复用 wd-icon**：它在小程序端走 `at.alicdn.com` 外链字体，需配域名白名单且弱网闪空 |
| `cd-input` | clearable / 密码可见 / 字数统计 / 前后缀插槽 | placeholder 颜色必须走 `placeholder-class`（原生组件解析不了 `var()`）；密码态同时给 `type` 与 `password` |
| `cd-textarea 形态` | 随 `type="textarea"` 切换 | 微信 textarea 是原生组件，**永远盖在遮罩之上**，弹层里慎用 |
| `cd-card` | header / extra / footer 插槽、hoverable、密度可调 | 与工具类 `.cd-panel` 职责分离，避免类名撞车导致 padding 叠加 |
| `cd-row` / `cd-col` | 24 栅格 + 响应式 span（xs/sm/md/lg/xl） | 宽度在**编译期**算成百分比，不赌小程序的 `calc` 除法；响应式走媒体查询类而非 JS |
| `cd-tabs` | line / card 两种视觉，badge、scrollable | 等宽模式指示器用纯百分比定位（零测量）；scrollable 才用 `createSelectorQuery`，测不到就降级 |
| `cd-form` / `cd-form-item` | 必填/长度/正则/枚举/异步 validator，blur 与 change 双触发 | `validate()` 返回 boolean 而非 reject —— 校验失败是业务分支，不是异常 |

**表单接线方式**：`cd-form` 提供表单上下文，`cd-form-item` 提供字段上下文，控件通过 **`useField()`** 回报 `blur` / `change` 并读取表单级禁用。自定义控件只要注入这个 composable 就能接入同一套校验，不需要继承任何东西。

### 第 5 层 · 展示与表单控件（第三批，15 个）

| 组件 | 关键设计 | 跨端约束的来源 |
|---|---|---|
| `cd-tag` | type 只声明颜色、形态决定用法 | 尺寸类名带 `size-` 前缀 —— type 与 size 都有 'default'，会撞名 |
| `cd-badge` | 无插槽=独立标签，有插槽=角标 | — |
| `cd-avatar` | 图片→插槽→图标→文字 降级链，失败不出现破图 | 无底色时生成**稳定**哈希色；字号只在尺寸可解析为 px 时下发 |
| `cd-divider` | 水平/垂直、带文字、虚线 | 用 border 画线，dashed 只需换 border-style |
| `cd-progress` | 线形 + 环形（conic-gradient + mask） | **不用 canvas**（避开小程序 canvas-id/层级/绘制时机），mask 基线与 cd-icon 一致 |
| `cd-loading` | spinner 复用 cd-icon 的 loader + spin | — |
| `cd-empty` | 固化 5 种高频空状态预设，文案不漂移 | — |
| `cd-skeleton` | 扫光动画、最后一行默认收窄 60% | **暗色下显式重定义块色**：亮色比背景深，暗色必须反过来 |
| `cd-alert` | 4 种语义、描边、通铺 banner、操作区 | — |
| `cd-switch` | 支持任意一对值（ON/OFF、1/0），不只布尔 | 按压反馈缩放**轨道**而非滑块 —— 滑块的 transform 已被定位占用 |
| `cd-checkbox`(+group) | 独立（布尔）/ 组内（数组）双用法 | 校验由**组**触发，避免一次点击触发 N 次校验 |
| `cd-radio`(+group) | radio / button（分段控件）两形态 | 差异全在 CSS，圆点用 display:none 而非 v-if |
| `cd-stepper` | 按住连加、边界钳制 + overlimit | 同时绑 touchstart 与 mousedown；手动输入不即时提交（输 15 会先经过 1） |

所有新控件都通过 `useField()` 接入校验链，且**尊重表单级禁用** ——
`<cd-form disabled>` 现在对全部控件生效（此前对下拉框不生效，本版已修复）。

所有双形态组件都暴露 `mode` prop：`'auto' | 'mobile' | 'desktop'`。默认 `auto` 跟随视口，强制指定可用于测试或窄容器内嵌 PC 布局。

**「简单组件自研、复杂组件复用」**是路线 B 的基本取舍：按钮没有遮罩、动画、层级、滚动锁这些「难的部分」，自研成本极低却能 100% 掌控设计语言；而 dialog / select 反过来复用 wd-popup——因为难点在别处。

### 第 6 层 · 命令式反馈与浮层族（第四批，8 个 + 服务）

**命令式服务**（本批最重要的新增，从 0 到 1）：

```js
import { toast, confirm, alert, loading } from '@/uni_modules/codedog-ui'

toast.success('保存成功')
const ok = await confirm({ title: '删除确认', content: '删除后无法恢复' })
const close = loading('提交中...'); close()
```

| 端 | 挂载方式 | 说明 |
|---|---|---|
| H5 | **零配置** | 首次调用自动把宿主组件动态挂载到 body（独立 chunk，用到才加载）。可行前提已用探针实测：`view` 编译成字符串标签 `uni-view`，不依赖全局组件注册 |
| 小程序 | 页面里放一次 `<cd-toast-host />` | 没放也能用 —— 自动降级 `uni.showToast / showModal / showLoading`，API 语义一致 |

| 新增 | 关键设计 | 备注 |
|---|---|---|
| `toast / confirm / alert / loading` | 同文案去重续时；后到模态把先到的按取消结算（不留悬挂 Promise）；loading 重复调用只更新文案 | confirm/alert 复用 cd-dialog 渲染，视觉与 Esc 行为和业务弹窗一致 |
| `cd-drawer` | 四向抽屉，auto：移动底部 / PC 右侧 | 左右抽屉内层必须显式 `height:100%` —— wd-popup 只拉高定位壳 |
| `cd-tooltip` | PC hover（带延迟防轨迹闪烁）/ 移动长按 | 反色表面令牌与 toast 共用，暗色自适应 |
| `cd-popover` | 点击触发、面板内点击不关闭、Esc 收起 | v-model 支持外部受控 |
| `cd-dropdown` | 动作菜单（与 cd-select 的表单语义刻意分离） | PC 键盘导航：↑↓ / Enter / Esc |
| `cd-date-picker` | **移动端走系统原生滚轮、PC 端自研日历** | 自研滚轮要处理 scroll-top 回环与惯性判定，原生控件在移动端本来就是正确设计 |
| `cd-time-picker` | PC 双列（时/分），刻意不做秒 | — |
| `cd-upload` | 受控优先：列表真值在 modelValue，`customRequest` 可接管上传 | 小程序选文件走 `chooseMessageFile` |

**`use-floating` 定位内核**（tooltip/popover/dropdown/picker/popconfirm 五类共用）：
两段式定位（先隐藏渲染再测量），滚动与 resize 做 **rAF 节流的跟随重定位**而不是关闭——
气泡跟着触发物走，长列表滚动时也不闪烁。基于 `position: fixed`，若祖先带 transform 定位会偏，已知限制。

> ⚠️ 使用 `useFloating` 时，`uid` / `panelStyle` / `arrowStyle` 必须从返回值里**显式解构**出来。
> 模板中直接写这些标识符会落到 `_ctx`（也就是 `undefined`），面板失去 `left/top` 会掉回文档流原位。
> v0.4.0 的六个浮层组件全部踩过这个坑（0.5.0 修复），症状是「功能正常但位置不对」，肉眼极难发现。

### 第 7 层 · 导航、容器与工具类（第五批，25 个）

组件总数 **37 → 62**。双端构建 + 亮暗 × PC/移动四象限截图核验均通过。

| 组件 | 关键设计 | 跨端约束的来源 |
|---|---|---|
| `cd-cell` / `cd-cell-group` | `arrow` 三态；组内靠 `.cd-cell + .cd-cell` 相邻选择器补线 | 小程序对 `:last-child` 支持不稳定，用相邻选择器画线最稳 |
| `cd-grid` / `cd-grid-item` | 列宽 JS 预算下发 `--cd-grid-item-w`；外框画容器、内线画格子 | **零 nth-child**：小程序 WXSS 对 nth-child 支持不一致，改用「容器画外框、格子画内线」拼完整边框 |
| `cd-collapse` / `cd-collapse-item` | 容器持状态、支持手风琴；**实测高度动画** | 固定 `max-height: 999px` 会让视觉动画无效，必须 `createSelectorQuery` 量真实高度 |
| `cd-steps` / `cd-step` | 序号由容器注册表派生（子项不接受业务传 index）；连线按「左边那步」算 | 容器用**普通数组**存 uid（不上 ref，避免 Proxy 破坏 indexOf 引用比对）+ `version` ref 建立响应式依赖 |
| `cd-timeline` / `cd-timeline-item` | `reverse` 用 `flex-direction: column-reverse`，不反转数组 | 首尾引线换透明 spacer，而不是业务传 `isFirst` |
| `cd-breadcrumb` / `cd-breadcrumb-item` | 容器 `isLast(uid)` 判定末项（不可点、颜色更重） | 与 steps 同为「容器派位置」模式；`to` 跳转 navigateTo → switchTab 降级 |
| `cd-slider` | 按下缓存轨道矩形；**先量化再钳制**；双滑块取最近并允许交错 | 触屏元素级 touch + H5 专属 document mousemove/mouseup |
| `cd-rate` | 半星**像素级裁切**（上层已选中按 `value*(size+gap)` px 裁） | `size`/`gap` 声明为 Number，便于同时下发 CSS 变量 |
| `cd-search-bar` | 搜索框，已接入 `useField` 校验链 | placeholder 颜色同样必须走 `placeholder-class`（原生组件解析不了 `var()`） |
| `cd-popconfirm` | 复用 `useFloating`，带箭头 | 宽度要用独立 computed 拼到 `panelStyle`（`customStyle` 是字符串契约） |
| `cd-action-sheet` | 复用 wd-popup + `useWotScope`；disabled / danger / description | — |
| `cd-fab` | 可拖拽悬浮按钮，`offset-right` 给同角其他浮层让位 | H5 走 document 鼠标监听 |
| `cd-result` / `cd-count-down` / `cd-count-to` | 倒计时锚定结束时间戳 `endAt - Date.now()` | 「定时器只负责多久看一眼」；千分位用 split/join，避开 lookahead 正则的引擎差异 |
| `cd-notice-bar` | `padding-left:100%` + `translate3d(-100%,0,0)` 无缝循环 | 速度按字数估算 —— 异步测量会首屏闪跳 |
| `cd-image` | loading/loaded/error 三态 | `<image mode>` 与 CSS `object-fit` 需一份映射表 |
| `cd-backtop` / `cd-affix` | 共用 `usePageScroll`；affix 占位壳 + 固定内层 | 统一 H5 自动监听 / 小程序 `onPageScroll` 传入的差异 |

**新增基建**：`use-page-scroll`（滚动归一）、`utils/raf.js`（rAF 降级 16ms setTimeout）、
`FILLED_ICONS` + 自研 `star-fill` 几何图标、约 30 组 L3 设计令牌。

## 二次封装的关键：主题桥接

位置：`src/uni_modules/codedog-ui/theme/bridge.js`

二次封装最容易做错的地方是「只是换个名字包一层」，结果自己的设计语言根本没落地，页面上仍是两套视觉。

wot-design-uni 的注入点非常理想——它内部所有样式都写成 `var(--wot-color-theme, #默认值)`，SCSS 变量全部包了一层 CSS 变量兜底。于是**不需要改它一行代码、不需要重新编译 SCSS**，只要通过 `wd-config-provider` 的 `theme-vars` 传一份 camelCase 映射，它会自动转成 `--wot-*` 内联样式级联到所有 wd- 组件。

```js
import { buildWotThemeVars } from '@/uni_modules/codedog-ui'

// 直接覆盖某个品牌色，所有 wd- 组件跟着变
buildWotThemeVars('dark', { colorTheme: '#ff6b00' })
```

亮暗两套映射**互斥而不是合并**：wot 的暗色走 `$-dark-*` 变量族，如果把亮色文字变量也塞进去，会出现「深色底 + 深色字」。

## 使用方式

### 1. 引入样式（App.vue，一次）

```vue
<style lang="scss">
@import '@/uni_modules/codedog-ui/styles/index.scss';
</style>
```

### 2. 配置 easycom（pages.json）

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^cd-(.*)": "@/uni_modules/codedog-ui/components/cd-$1/cd-$1.vue",
      "^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue"
    }
  }
}
```

### 3. 包一层 Provider

```vue
<template>
  <cd-config-provider>
    <view class="cd-page cd-page--desktop">
      <!-- 你的内容 -->
    </view>
  </cd-config-provider>
</template>
```

### 4. 直接用组件

```vue
<cd-button type="primary" @click="save">保存</cd-button>
<cd-select v-model="status" :options="statusOptions" clearable />
<cd-dialog v-model="visible" title="删除确认" content="删除后无法恢复" @confirm="del" />
<cd-table :columns="columns" :data="list" />
<cd-pagination v-model:current="page" :total="total" />
<cd-progress type="circle" :percentage="68" status="success" />
<cd-stepper v-model="count" :min="1" :max="9" />

<cd-input v-model="form.phone" type="number" :maxlength="11" clearable prefix-icon="phone" />
<cd-row :gutter="[16, 16]"><cd-col :span="{ xs: 24, md: 12 }">…</cd-col></cd-row>
<cd-tabs v-model="tab" :tabs="tabs" />
<cd-date-picker v-model="form.date" min="2026-01-01" max="2026-12-31" />
<cd-drawer v-model="drawer" position="right" title="详情" :size="400" />
<cd-dropdown :options="actions" @select="onAction" />
<cd-upload v-model="files" action="/api/upload" :max-count="4" />
```

### 5. 命令式反馈（可选）

H5 无需任何配置；小程序端建议在页面里放一次宿主组件获得品牌样式：

```vue
<!-- #ifndef H5 -->
<cd-toast-host />
<!-- #endif -->
```

```js
import { toast, confirm, alert, loading } from '@/uni_modules/codedog-ui'

toast.success('保存成功')
const ok = await confirm({ title: '删除确认', content: '删除后无法恢复' })
const close = loading('提交中...')
setTimeout(close, 2000)
```

### 表单校验

```js
import { PATTERNS } from '@/uni_modules/codedog-ui'

const rules = {
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: PATTERNS.mobile, message: '手机号格式不正确' },
  ],
  age: [
    { required: true },
    { validator: (v) => Number(v) >= 18 || '年龄不能小于 18 岁' },  // 也支持返回 Promise
  ],
}

// 校验失败返回 false，同时把页面滚到第一个出错项
const passed = await formRef.value.validate()
```

组件不使用时不会进入产物（easycom 按需编译）。

## 发布形态

- **uni_modules**：把 `src/uni_modules/codedog-ui` 整个目录拷给使用者，或发布到 HBuilderX 插件市场，一键导入
- **npm**：包名 `codedog-ui`（npm 上尚未占用）。`src/uni_modules/codedog-ui` 的 `package.json` 已带齐 `main` / `module` / `exports` / `types` / `files`、`publishConfig` 与 JS 导出面的类型声明（`index.d.ts`），`npm run release:publish` 即可。完整流程与注意事项见 [PUBLISHING.md](./PUBLISHING.md)
- **npm 形态已实测**：以包名方式引用（easycom 指向 `codedog-ui/components/...`、`@import 'codedog-ui/styles'`）后 H5 与微信小程序双端构建均通过，且 uni-app 对 `node_modules` 中的包同样执行条件编译
- **文档站**：VitePress，`npm run docs:dev` 本地预览、`npm run docs:build` 产出静态站（62 个组件页 + 9 篇指南，内容由 `scripts/gen-component-docs.mjs` 从源码与演示页自动抽取）

```bash
npm run docs:build          # 生成文档站
cd src/uni_modules/codedog-ui && npm pack   # 干跑验证包内容
```

## 许可与合规

本框架以 **MIT** 发布（见 `LICENSE`）。商用、闭源分发、二次修改均允许。

发布前请确认以下三项，完整声明见 **[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md)**：

| 项 | 状态 | 需要做什么 |
|---|---|---|
| `cd-icon` 的 72 个图标 | 衍生自 Feather(MIT) / Lucide(ISC) | **必须保留署名**。已写入 `icons.js` 头部注释，分发时勿删；本框架未使用任何字体文件 |
| `wot-design-uni` | 未再分发（仅 npm 依赖 + CSS 变量桥接） | 无需额外动作；但**打包后的产物内含其代码**，小程序建议在开源许可页列出其 MIT 声明 |
| uni-app 全家桶 | Apache-2.0，可商用 | 产品名与宣传中**不得使用 "uni-app" 字样**或暗示官方关联 |

发布前的许可证门禁（建议接入 CI）：

```bash
npx license-checker --failOn "GPL;AGPL;SSPL"
```

### 反馈与支持

用得不顺手、发现 Bug、想要某个组件、或者文档没写清楚——**别憋着，直接来找我们**。
反馈越具体，我们修得越快。

| 场景 | 去哪儿 |
|---|---|
| 提 Bug / 要新组件 | [GitHub Issues](https://github.com/peen-gu/CodeDog-ui/issues) |
| 使用咨询 / 意见建议 | 官网 [ui.codedog.tech](https://ui.codedog.tech) 的反馈入口 |
| 商用授权咨询 / 定制合作 | codedog.tech@icloud.com |
| 微信交流 | 加 `penngu777`，备注 CodeDogUI |

> `codedog` 这个 npm 包名已被他人占用（与本框架无关的 markdown 工具），因此正式发布名为 `codedog-ui`。

## 已知限制

| 限制 | 原因与应对 |
|---|---|
| 弹层使用 `root-portal` 传送到 body | 需自带主题作用域；若在子树内强制局部主题，该子树内的弹层不会跟随 |
| 小程序端 `hover-class` 与 H5 端 `:active` 分流 | cd-button 内部已处理，业务方无感 |
| 表格未实现虚拟滚动与列宽拖拽 | 大数据量场景需自行接入 |
| 微信小程序 textarea 是原生组件 | 永远盖在 popup / dialog 的遮罩之上，多行输入放在弹层里会穿透，无解（小程序架构限制） |
| `cd-icon` 依赖 CSS mask | H5 与微信小程序 WebView 均支持；若目标端出现不支持的内核，图标会显示为空而不是方块 |
| 微信小程序建议 WebView 渲染 | Skyline 引擎对 CSS 变量支持不完整，本框架以 WebView 为准 |
| rpx 上限压到 750 | 第三方 rpx 组件在宽屏不会被拉爆；CodeDogUI 自身不用 rpx |
| 气泡类浮层（tooltip/popover/dropdown/picker 面板）基于 `position: fixed` | 祖先带 transform 时定位参照物会变，面板会偏。弹窗类（dialog/drawer/action-sheet）不受影响（走 root-portal） |
| 小程序端命令式反馈需要页面放 `<cd-toast-host />` 才有品牌样式 | 小程序没有 body，无法像 H5 一样自动挂载；未放置时自动降级原生 API |
| `cd-date-picker` 范围选择（range）未实现 | 单选 + 范围会让面板状态机翻倍，等真实场景出现再做独立组件 |

## 目录结构

```
src/
├── App.vue                       全局样式入口
├── pages.json                    easycom 配置 + 页面注册
├── uni.scss                      编译期令牌注入点
├── pages/
│   ├── index/index.vue           组件总览 + 端能力探测
│   ├── tokens/index.vue          设计变量展示
│   ├── desktop/index.vue         PC 布局示例（侧边栏 + 表格）
│   ├── components/index.vue      通用组件演示（icon / input / grid / tabs / form）
│   ├── showcase/index.vue        展示与表单控件演示（15 个第二批组件 + 校验联动）
│   ├── service/index.vue         命令式反馈演示（toast / confirm / alert / loading）
│   ├── feedback/index.vue        浮层与录入演示（drawer / tooltip / popover / dropdown / picker / upload）
│   ├── navigation/index.vue      导航与容器演示（cell / grid / collapse / steps / timeline / breadcrumb）
│   └── widgets/index.vue         展示与工具演示（notice-bar / search / slider / rate / popconfirm / action-sheet / result / count-down / count-to / image / backtop / fab / affix）
└── uni_modules/codedog-ui/
    ├── package.json              uni_modules 规范清单（npm 发布亦以此为准）
    ├── index.js                  组合式函数与工具导出
    ├── changelog.md
    ├── styles/                   第 1 层
    ├── composables/              第 2 层（use-floating 浮层内核 / use-field 校验链接线 / use-page-scroll 滚动归一）
    ├── utils/                    raf.js / validate.js / date.js
    ├── service/                  命令式反馈服务（跨端状态 + 挂载/降级策略）
    ├── theme/bridge.js           主题桥接
    └── components/               第 3 层（62 个，含 cd-toast-host 宿主与 cd-config-provider）
```

组件构成：51 个可独立使用的业务组件 + 9 个子项组件（须配父容器）+ 2 个基础设施。
其中 8 个组件是对 `wot-design-uni` 的二次封装，其余为自研。
