---
title: 亮暗主题与桥接
---

# 亮暗主题与桥接

## 切换方式

主题由顶层 `cd-config-provider` 控制：

```vue
<cd-config-provider theme="dark">
```

三个取值：`light` / `dark` / `auto`（跟随系统偏好）。

`useTheme` 负责状态持久化（localStorage / uni storage），刷新后保持上一次的选择。

## 亮暗映射是互斥的，不是合并

这一点非常容易做错。

直觉写法是「亮色变量打底，暗色在上层覆盖」。问题在于：wot-design-uni 的暗色走的是 `$-dark-*` 这一套完全不同的变量族。如果把亮色文字变量也塞进暗色映射里，会得到**深色底 + 深色字**。

所以 `theme/bridge.js` 里两套映射是**互斥**的：

```js
import { buildWotThemeVars } from '@/uni_modules/codedog-ui'

// 第二个参数可以局部覆盖具体品牌色
buildWotThemeVars('dark', { colorTheme: '#ff6b00' })
```

## 主题桥接：为什么不需要改上游一行代码

wot-design-uni 的内部样式全部写成 `var(--wot-color-theme, #默认值)`，SCSS 变量也都包了一层 CSS 变量兜底。

这意味着它的注入点非常理想——通过 `wd-config-provider` 的 `theme-vars` 传一份 camelCase 映射，它会自动转成 `--wot-*` 内联样式，级联到所有 `wd-` 组件。

```js
buildWotThemeVars('dark')
// { colorTheme: '#3b76f6', colorBody: '#0b1120', ... }
```

`cd-config-provider` 会自动做这件事，所以你不需要手动调用——除非要覆盖某个具体值。

## 新增组件时的暗色检查清单

暗色模式最容易出问题的三处：

1. **骨架块色**：亮色下比背景**深**，暗色下必须**反过来**。见 `cd-skeleton`。
2. **默认插画/图标**：如果用了固定深色，暗色下会消失。
3. **`soft` 变体**：半透明色不要用固定的 `rgba(0,0,0,0.05)`——暗色下应该也是半透明，但通常要换成白色叠加。

对应的暗色覆盖写在 `tokens.scss` 的 `@mixin cd-theme-dark` 里：

```scss
@mixin cd-theme-dark {
  --cd-slider-tooltip-bg: ...;
  --cd-rate-void-color: ...;
  --cd-grid-divider-color: ...;
  --cd-cell-group-title-color: ...;
}
```

## 局部暗色与弹层

`:root` 之外的子树也可以单独加 `cd-theme-dark` 类做局部暗色。

但要注意：**`root-portal` 传送出去的弹层不跟随局部主题**（dialog / drawer / action-sheet 都走这条路）。如果你的局部暗色区域里需要弹层，需要让弹层自己带上主题作用域。

详见[跨端约束清单 · 弹层与主题作用域](/guide/cross-platform#弹层与主题作用域)。
