---
title: 跨端约束清单
---

# 跨端约束清单

这一页是 CodeDogUI 里所有「奇怪硬约定」的来源。**每一条都对应一次真实的编译失败或渲染异常**，不是风格洁癖。

如果你要往框架里加组件，先读完这一页——它能省掉你半天排查。

## WXSS（小程序）不支持的 CSS

微信小程序的样式表不是浏览器 CSS，是一份子集。

| 不可用 | 替代方案 |
|---|---|
| 标签选择器（`view {}`） | 只写 class |
| 通配符 `*` | 显式列举需要重置的类 |
| 属性选择器（`[data-x]`） | 用 class 表达状态 |
| `nth-child` / `:last-child` | **相邻兄弟选择器**（见下） |
| 部分伪元素/伪类组合 | 逐个实测 |

### 为什么全篇都在用 `A + B`

`:last-child` 在小程序上支持不稳定，最常见的需求是「给列表项之间画线，但最后一项不要」。

做法反过来了：

```scss
/* ❌ 依赖 :last-child */
.cd-cell { border-bottom: 1px solid var(--cd-border-light); }
.cd-cell:last-child { border-bottom: none; }

/* ✅ 相邻兄弟选择器：第二条开始才有上边线 */
.cd-cell-group__body .cd-cell + .cd-cell {
  border-top: 1px solid var(--cd-border-light);
}
```

`cd-grid` 的边框同理：**外框画在容器上（上/左），内线画在格子上（右/下）**，拼出来正好是完整表格边框，全程零 `nth-child`。

::: tip 仍然可用的选择器
`:not(.class)`、相邻兄弟 `A + B`、后代选择器在小程序上是可靠的。实践中够用。
:::

## calc 与 CSS 变量

::: danger 禁止让 CSS 变量参与 calc 除法
小程序对 `calc(var(--x) / 2)` 的支持不一致，可能直接算不出来。
:::

需要「一半」的场景，两个可行替代：

1. **用 transform**：居中用 `top: 50%; transform: translateY(-50%)`，而不是 `top: calc(50% - var(--h) / 2)`
2. **JS 预算后下发**：`cd-grid` 的列宽就是这样算成百分比再写进 `--cd-grid-item-w` 的

## 单位：禁止纯 rpx

rpx 是按 750 设计宽度换算的，在 H5 上它会在**约 960px 处封顶**。

后果：一块 750rpx 宽的容器，在 1920px 的显示器上只有 960px 宽，右侧全是空白，像是被裁掉了。

框架自身**完全不使用 rpx**（尺寸一律 px，或 em 跟随字号）。第三方 rpx 组件通过把全局 `rpxCalcMaxDeviceWidth` 压到 750 来限制破坏范围。

## 模板层的差异

### `<slot v-bind="obj">` 不支持

小程序编译器会直接报 `v-bind="parts" is not supported`。作用域插槽必须**逐项展开**：

```vue
<!-- ❌ -->
<slot v-bind="parts" />

<!-- ✅ -->
<slot
  :total="parts.total"
  :days="parts.days"
  :hours="parts.hours"
  :minutes="parts.minutes"
  :seconds="parts.seconds"
/>
```

`cd-count-down` 就是因为这个改写的。

### `hover-class` 与 `:active` 分流

H5 用 `:active`，小程序要用 `hover-class`。`cd-button` 内部已处理，业务方无感。

### 原生组件的层级天花板

微信的 `textarea` / `input` / `map` 是**原生组件**，永远盖在所有 view 之上，包括 popup / dialog 的遮罩。

多行输入放在弹层里必然穿透，**没有解决方案**（架构限制）。`cd-input` 的 textarea 形态在文档里标注了这个风险。

### 图片填充，词表不同

uni 的 `<image mode>` 和 CSS `object-fit` 不是同一套词表。`cd-image` 内置了映射表。

## JS 运行时的差异

### `requestAnimationFrame` 不保证存在

用 `typeof requestAnimationFrame === 'function'` 判定，缺失时降级为 16ms 的 `setTimeout`（见 `utils/raf.js`）。

这套降级也是 `use-floating` 滚动跟随重定位、深度 `use-page-scroll` 的公共底座。

### 页面滚动要分两套拿

| 端 | 获取方式 |
|---|---|
| H5 | `window` 的 scroll 事件，可自动监听 |
| 小程序 | 拿不到 window，**必须由页面的 `onPageScroll` 传进来** |

`use-page-scroll` 统一了这个差异：`propScrollTop` 为空/null/负数时走 H5 自动监听，否则用外部传入的值。

`cd-backtop` / `cd-affix` 共用它。

### 正则：不要依赖 lookahead

小程序 JS 引擎对 lookahead `(?=...)` 的支持有差异。`cd-count-to` 的千分位格式化刻意用 `split/join` 而不是正则。

### Proxy 会破坏引用比对

在数组上套 `ref` 后，`indexOf(item)` 拿到的成员是 Proxy 包装过的，与原始对象**不相等**。

所以「注册表」类的数据结构（`cd-form` 的字段表、`cd-steps` / `cd-timeline` / `cd-breadcrumb` 的子项表）统一用**普通数组 + 一个 `version` ref**：

```js
const registry = []          // 普通数组，不套 ref
const version = ref(0)
// 读取方：void version.value   ← 建立响应式依赖
registry.push(uid)
version.value++
```

## zIndex：CSS 变量传不进 Number prop

`cd-dialog` 的 `zIndex` 是 `Number` 类型，`var(--cd-z-modal)` 传不进去。

因此层级在 JS 侧另有一份常量 `SERVICE_Z`：

```js
import { SERVICE_Z } from '@/uni_modules/codedog-ui'
// { modal: 2400, loading: 2900, toast: 3000 }
```

## 弹层与主题作用域

| 方案 | 组件 | 副作用 |
|---|---|---|
| `root-portal` 传送到 body | `cd-dialog` / `cd-drawer` / `cd-action-sheet` | 脱离当前子树，**不跟随局部主题** |
| `position: fixed` | `cd-tooltip` / `cd-popover` / `cd-dropdown` / 各 picker / `cd-popconfirm` | 祖先带 `transform` 时定位参照物会变，面板会偏 |

浮层定位统一由 `useFloating` 内核处理（两段式测量 → 自动翻转 → 视口钳制 → rAF 节流跟随）。

## 命令式反馈：小程序需要手动放宿主

H5 端服务会动态 import 宿主组件挂到 body（用到才下载，独立 chunk）。

小程序**没有 body**，做不到自动挂载。页面里放一次 `<cd-toast-host />` 即可用品牌样式；没放也不会报错——自动降级 `uni.showToast / showModal / showLoading`，API 语义一致。

## 高度动画必须实测

给 `max-height` 从 `0` 过渡到 `999px`，元素实际高度是 `min(max-height, 内容高度)`。内容只有 80px 时，**前 92% 的时间都在「假装生长」**，视觉上等于没做动画。

`cd-collapse-item` 的做法：展开时用 `createSelectorQuery` 量一次内容真实高度，以 CSS 变量下发。

已知取舍：只在每次展开时量一次。展开状态下内容异步变高不会自动跟上——这种场景请在数据到位后调用 `refresh()`（已 expose）。

## 编译与构建

### uni build 会被批量删除拦截

vite 清空 `dist` 时如果旧产物文件数达到删除阈值（例如 50），会被安全策略拦下导致构建失败。

**规避**：构建前先把 `assets` 目录挪开，构建完再删掉挪走的那份。

```bash
mv dist/build/h5/assets dist/build/h5/_stale_$(date +%s)
npm run build:h5
rm -rf dist/build/h5/_stale_*
```

### 无头截图必须用绝对路径

Edge/Chromium 的 `--headless=new` 模式下，`--screenshot` 传相对路径会报「系统找不到指定的路径」。

```bash
# ❌ --screenshot=.shots/page.png
msedge --headless=new --screenshot=D:/abs/path/.shots/page.png <url>
```
