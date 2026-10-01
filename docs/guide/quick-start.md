---
title: 快速开始
---

# 快速开始

## 安装

CodeDogUI 有两种分发形态，按你的工程类型二选一。

::: code-group

```bash [uni_modules（推荐）]
# 把 src/uni_modules/codedog-ui 整个目录拷进你的 src/uni_modules/
# 或从 HBuilderX 插件市场导入「CodeDogUI 跨端组件库」
```

```bash [npm]
npm i codedog-ui
```

:::

uni_modules 是优先推荐的形态——uni-app 对它有一等公民级别的支持（自动发现、easycom 免配置、HBuilderX 一键更新）。

## 依赖

| 依赖 | 版本 | 说明 |
|---|---|---|
| uni-app | `>=3.0.0-5020620260917001` | Vue3 稳定线，Vue2 不支持 |
| vue | `^3.4.21` | 全部组件使用 `<script setup>` |
| wot-design-uni | `1.14.0` | **版本已锁定**，升级需主动核对 |

::: warning 为什么锁定 wot 的版本
框架依赖 wot-design-uni 的内部结构与 CSS 变量命名来做主题桥接。它的次版本更新可能调整 `--wot-*` 变量名，直接升版本会导致二次封装的组件视觉脱表演。
:::

## 四步接入

### 1. 引入样式（App.vue，全局一次）

```vue
<style lang="scss">
@import '@/uni_modules/codedog-ui/styles/index.scss';
</style>
```

### 2. 配置 easycom（pages.json）

组件通过 easycom 按需自动引入，**不需要在 `usingComponents` 里逐个注册**，未使用的组件不会进入产物。

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

第二条规则是给底层的 wot 组件用的，二次封装的 8 个组件依赖它。

### 3. 包一层 Provider

`cd-config-provider` 是**必填的根节点**，主题令牌、尺寸密度、圆角形态都由它向下广播。

```vue
<template>
  <cd-config-provider>
    <view class="cd-page cd-page--desktop">
      <!-- 你的内容 -->
    </view>
  </cd-config-provider>
</template>
```

不包会怎样：组件仍然能渲染（所有 CSS 变量都有兜底值），但拿不到主题切换与密度配置，暗色模式下会呈现一套未经设计的颜色。

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

## 命令式反馈（可选）

H5 端无需任何配置；小程序端建议在页面里放一次宿主组件以获得品牌样式。

```vue
<!-- #ifndef H5 -->
<cd-toast-host />
<!-- #endif -->
```

```js
import { toast, confirm, alert, loading } from '@/uni_modules/codedog-ui'

toast.success('保存成功')

const ok = await confirm({ title: '删除确认', content: '删除后无法恢复' })
if (ok) await remove()

const close = loading('提交中...')
setTimeout(close, 2000)
```

详见[命令式反馈服务](/guide/service)。

## 表单校验

```js
import { PATTERNS } from '@/uni_modules/codedog-ui'
```

完整的 rules 写法见[表单校验](/guide/form)。

## 常见疑问

**能否只用其中几个组件？**
可以。easycom 扫描到什么就打包什么，未使用的组件不进产物。唯一必须引入的是 `cd-config-provider` 和全局样式。

**能否在 App（非 H5 / 微信小程序）端使用？**
未在 App-vue / App-nvue 上验证，`uni_modules` 清单里这两项标记为不支持。Skyline 引擎对 CSS 变量支持不完整，微信小程序请使用 WebView 渲染。

**组件能通过 npm 单独安装吗？**

可以，`npm i codedog-ui`。但组件依赖 uni-app 的编译管线，因此**只适用于 CLI 工程**，不适用于 HBuilderX 工程（后者请走 uni_modules 形态）。

npm 形态下有两处路径与本文不同：

| 位置 | uni_modules 形态 | npm 形态 |
|---|---|---|
| easycom 规则 | `@/uni_modules/codedog-ui/components/cd-$1/cd-$1.vue` | `codedog-ui/components/cd-$1/cd-$1.vue` |
| 全局样式引入 | `@import '@/uni_modules/codedog-ui/styles/index.scss';` | `@import 'codedog-ui/styles';` |
| JS 运行时引入 | `@/uni_modules/codedog-ui` | `codedog-ui` |

::: tip npm 形态已实测（0.5.0）
曾有一个悬而未决的疑问：`service/index.js` 里靠 `/* #ifdef H5 */` 切分了同名的 `ensureHost()`（两个分支各写一个），
如果 npm 包**不被条件编译处理**，两个同名函数就会同时保留，消费端必然报错。

实际验证结果：**uni-app 对 `node_modules` 中的包同样执行条件编译** —— 以 npm 包名方式引用后，
H5 与 mp-weixin 双端构建均通过，且小程序产物中检索不到任何 H5 分支的特征代码（`cd-feedback-host`、`createElement('div')`），
证明分块已被正确裁剪。
:::
