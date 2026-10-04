---
title: 设计令牌
---

# 设计令牌

位置：`src/uni_modules/codedog-ui/styles/tokens.scss`，当前共 **319** 个唯一 CSS 变量（口径：该文件中  的唯一定义名；暗色段覆盖其中 64 个，暗色无独有令牌）。

## 为什么是 CSS 变量而不是 SCSS 变量

SCSS 变量是**编译期**的，切主题必须重新编译；CSS 变量是**运行期**的，一次编译即可在亮暗之间切换。

这对 uni-app 尤为重要——小程序端没有「重新编译样式」这件事，运行期变量是唯一可行方案。

代价是每个组件内部都要写成 `var(--cd-x, 兜底值)` 的形式。这是刻意的：**即使三级挂载点全部失效，组件仍然按内置默认值正确渲染。**

## 三层结构

```
L1 原始令牌 primitive   --cd-brand-500 / --cd-neutral-200
      ↓ 只被 L2 引用，业务代码不要直接用它
L2 语义令牌 semantic    --cd-color-primary / --cd-text-secondary
      ↓ 只被 L3 引用，业务代码用这一层
L3 组件令牌 component   --cd-button-height / --cd-dialog-width
      ↓ 只在具体组件内部使用
```

**改动只能从上往下传导，禁止下层反向引用上层。**

### L1 原始色阶

纯色值，没有语义。品牌蓝色阶 9 档 + 中性色阶 8 档。

```css
--cd-brand-50:  #eff5ff;
--cd-brand-500: #3b76f6;   /* 主色 */
--cd-brand-900: #1e3a8a;
```

### L2 语义令牌

业务代码**应该用这一层**。每个语义组都提供了 hover / soft / soft-border 变体，省去自己算深浅。

| 家族 | 成员 | 用途 |
|---|---|---|
| `--cd-color-*` | primary / success / warning / danger / info | 状态色，各有 `hover`、`soft` 变体 |
| `--cd-text-*` | primary / regular / secondary / placeholder / disabled / inverse / link | 文字层级 |
| `--cd-bg-*` | page / container / elevated / sunken / hover / active | 背景层级（页面 → 容器 → 浮起 → 下沉） |
| `--cd-border-*` | base / light / strong / dashed | 描边 |
| `--cd-radius-*` | xs / sm / md / lg / pill | 圆角 |
| `--cd-space-*` | xs ~ 3xl | 间距 |
| `--cd-font-*` | size / weight / line-height | 字号家族 |
| `--cd-shadow-*` | sm / md / lg | 阴影 |
| `--cd-duration-*` | fast / base / slow | 动效时长 |
| `--cd-z-*` | modal(2400) / loading(2900) / toast(3000) | 层级 |

::: tip 用语义令牌而不是原始色
写 `color: var(--cd-brand-500)` 在重构品牌色时会漏改；写 `var(--cd-color-primary)` 一处跟着变。
:::

### L3 组件令牌

每个组件自己的可调项，如 `--cd-button-height`、`--cd-dialog-width`、`--cd-grid-item-w`。

组件令牌有两种下发方式：

- **静态**：写在组件 SCSS 里，从 L2 派生
- **动态**：由 JS 预算后内联下发。比如 `cd-grid` 的列宽，`100 / 4 = 25%` 必须在 JS 里算好写成 `--cd-grid-item-w` —— 因为[不让 CSS 变量参与 calc 除法](/guide/cross-platform#calc)

## 挂载点

这是跨端最关键的一处设计：

| 挂载点 | 作用 |
|---|---|
| `page` | 全局兜底，让**不套 Provider 的页面**也能拿到全部变量 |
| `html` / `html.cd-theme-dark` | H5 端的全局主题（H5 有 document 根节点） |
| `.cd-root` / `.cd-root.cd-theme-dark` | `cd-config-provider` 的根节点，用于运行期切换亮暗 |
| `.cd-root.cd-size-small` / `.cd-size-large` | 尺寸密度 |
| `.cd-root.cd-theme-auto` | 跟随系统偏好（媒体查询） |

## 尺寸密度

`cd-config-provider` 的 `size` 属性会切到 `.cd-size-small` / `.cd-size-large`，本质是**覆盖一组 L3 组件令牌**（高度、padding、字号），而不是给每个组件加 `size-` 类。

```vue
<cd-config-provider size="small">
```

## 业务自定义

推荐做法是覆盖 L2，而不是改 L1：

```css
.cd-root {
  --cd-color-primary: #ff6b00;
  --cd-color-primary-hover: #ff8533;
  --cd-color-primary-soft: rgba(255, 107, 0, 0.12);
}
```

改一个 `--cd-color-primary` 会让按钮、标签、进度条、链接、选中态同步跟随。
