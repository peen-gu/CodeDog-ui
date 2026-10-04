# CodeDogUI 组件总览预览应用（真实用户视角）

以**真实用户**身份搭建：通过 npm 安装 `codedog-ui`，不再引用仓库内的源码目录，
用来实测「npm 包形态」在 H5 / 微信小程序下到底能不能用、好不好用、有没有 bug。

## 与仓库主工程的区别

| | 本预览应用 | 仓库主工程（CodeDogUI） |
|---|---|---|
| 组件来源 | `node_modules/codedog-ui`（npm 包形态） | `src/uni_modules/codedog-ui`（源码） |
| easycom | `"^cd-(.*)": "codedog-ui/components/cd-$1/cd-$1.vue"` | `"^cd-(.*)": "@/uni_modules/codedog-ui/components/cd-$1/cd-$1.vue"` |
| 样式引入 | `@import 'codedog-ui/styles'` | `@import '@/uni_modules/codedog-ui/styles/index.scss'` |
| 目的 | 验收「用户拿到的东西」 | 开发组件库本身 |

## 页面

| 路径 | 内容 |
|---|---|
| `pages/index/index` | 总览首页（本页自身也全部由 cd-* 组件渲染） |
| `pages/components/index` | 基础组件 |
| `pages/feedback/index` | 反馈与浮层 |
| `pages/navigation/index` | 导航 |
| `pages/widgets/index` | 功能组件 |

分类页内容由仓库演示页（`src/pages/<name>/index.vue`）复制而来，并把
`@/uni_modules/codedog-ui/*` 的导入改写为 `codedog-ui/*`，以此验证 npm 包形态下
深路径导入（`codedog-ui/components/cd-icon/icons`、`codedog-ui/utils/validate`）是否可用。

## 命令

```bash
cd playground/mp-preview
export PATH="/Users/gupeng/.workbuddy/binaries/node/versions/22.22.2-5/bin:$PATH"

node node_modules/@dcloudio/vite-plugin-uni/bin/uni.js build                  # H5
node node_modules/@dcloudio/vite-plugin-uni/bin/uni.js build -p mp-weixin     # 微信小程序
```

> `.bin/uni` 在本机会 Permission denied，直接调 bin 的 js 入口。
> 构建前若输出目录已存在，先 `mv` 走（uni 会 emptyDir，触发沙箱批量删除拦截）。

## 验收口径

- H5：起本地服务 + Chromium 巡检，逐页断言渲染节点数、console error/warning 为 0
- 小程序：构建产物静态检查（0 rpx、0 结构伪类），并用微信开发者工具（/Applications/wechatwebdevtools.app）打开 `dist/build/mp-weixin` 实测交互
