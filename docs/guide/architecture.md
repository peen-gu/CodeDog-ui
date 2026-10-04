---
title: 三层架构
---

# 三层架构

```
第 1 层 · 设计变量     Design Tokens   319 个 CSS 变量 / 三层令牌
第 2 层 · 平台适配层   Adapter         断点 / 终端 / 主题 / 交互态降级
第 3 层 · 组件层       Components      一份 SFC，内部渲染双形态结构
```

**改动只能从上往下传导，禁止下层反向引用上层。**

这条限制听起来学术，但它决定了「改一行品牌色」的代价：只要没人在组件里硬编码颜色，改 L2 就能全局生效。

## 第 1 层 · 设计变量

位置：`src/uni_modules/codedog-ui/styles/`

原始色阶 → 语义令牌 → 组件令牌，详见[设计令牌](/guide/tokens)。

只用 CSS 变量，不用 SCSS 变量——因为前者是运行期的，切主题不需要重新编译，而小程序没有「重新编译」这件事。

## 第 2 层 · 平台适配层

位置：`src/uni_modules/codedog-ui/composables/`

| composable | 职责 |
|---|---|
| `useDevice` | 终端探测（移动 / PC） |
| `useBreakpoint` | 断点宽度订阅 |
| `usePlatform` | 平台判断（H5 / 微信小程序 / Electron） |
| `useTheme` | 亮暗主题状态与持久化 |
| `useFloating` | **浮层定位内核**：两段式测量、自动翻转、视口钳制、rAF 节流的跟随重定位 |
| `useField` | 表单字段接线：向上回报 blur / change，向下读取表单级禁用 |
| `usePageScroll` | 统一 H5 自动监听 / 小程序 `onPageScroll` 的差异 |
| `useWotScope` | wot 组件的作用域样式穿透 |

这一层的存在是为了让**组件层不需要写 `#ifdef`**。

例外至今只有一处：每种条件编译（如 CD_ELECTRON_DEV）都是编译期的，无法在运行时剔除。组件层默认走运行时 `v-if`。

## 第 3 层 · 组件层

位置：`src/uni_modules/codedog-ui/components/`，62 个组件。

分五类：[通用](/components/index)、布局与容器、表单与录入、数据展示、导航、反馈与浮层。

组件构成：

| 类型 | 数量 | 例子 |
|---|---|---|
| 可独立使用的业务组件 | 51 | 按钮、表格、抽屉、选择器 |
| 子项组件（须配父容器） | 9 | `cd-step`、`cd-grid-item`、`cd-form-item` |
| 基础设施 | 2 | `cd-config-provider`、`cd-toast-host` |

其中 8 个是对 wot-design-uni 的二次封装，其余为自研。

## 组合 vs 配置

需要父子协同的组件（`cd-form` / `cd-steps` / `cd-timeline` / `cd-collapse` / `cd-grid`…）一律用 **provide / inject + 注册表**，而不是让业务传 index：

```vue
<!-- ✅ 顺序由模板天然决定，增删不需要维护序号 -->
<cd-steps :current="1">
  <cd-step title="第一步" />
  <cd-step title="第二步" />
  <cd-step title="第三步" />
</cd-steps>
```

注册表刻意用**普通数组**而不是 `ref` 数组——Proxy 包装过的成员会让 `indexOf` 的引用比对失效。响应式交给一个独立的 `version` ref。

详见[跨端约束清单 · Proxy 会破坏引用比对](/guide/cross-platform#proxy-会破坏引用比对)。
