# 第三方组件与许可声明（Third-Party Notices）

CodeDogUI 本体以 MIT 许可发布（见 `LICENSE`），版权归 **Codedog.tech** 所有
（UI 作者：**Penn.Gu**）。本文件汇总 CodeDogUI 中
**包含、衍生或依赖**的第三方作品及其许可，用于履行各许可证的署名义务。

发布、分发或商用 CodeDogUI 时，**请连同本文件一起保留**。

---

## 一、图标集（本项目内含衍生作品，署名义务最直接的来源）

`src/uni_modules/codedog-ui/components/cd-icon/icons.js` 中的图标路径，
其几何数据衍生自 **Feather Icons** 及其分支 **Lucide**。

涉及图标（本框架内置 72 个，其中属于 Feather 衍生范围的包括）：
`arrow-*`、`chevron-*`、`chevrons-*`、`corner-down-left`、`external-link`、
`check`、`check-circle`、`check-square`、`close`、`close-circle`、
`plus-circle`、`minus-circle`、`info`、`warning`、`help`、`search`、
`user`、`calendar`、`mail`、`trash`、`edit`、`settings`、`login`、`logout`、
`maximize`、`minimize`、`tag`、`shield`、`cloud`、`globe`、`award`、`chart` 等。

### 1. Feather Icons

```
The MIT License (MIT)

Copyright (c) 2013-2023 Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

来源：<https://github.com/feathericons/feather>

### 2. Lucide

```
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project
（下列 Lucide 图标衍生自 Feather 项目，其版权归 Cole Bemis，按 MIT 许可）：

airplay, alert-circle, alert-octagon, alert-triangle, aperture,
arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down,
arrow-left-circle, arrow-left, arrow-right-circle, arrow-right,
arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar,
cast, check, chevron-down, chevron-left, chevron-right, chevron-up,
chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard,
clock, code, columns, command, compass, corner-down-left, corner-down-right,
corner-left-down, corner-left-up, corner-right-down, corner-right-up,
corner-up-left, corner-up-right, crosshair, database, divide-circle,
divide-square, dollar-sign, download, external-link, feather, frown, hash,
headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link,
loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2,
minus-circle, minus-square, minus, monitor, moon, more-horizontal,
more-vertical, move, music, navigation-2, navigation, octagon, pause-circle,
percent, plus-circle, plus-square, plus, power, radio, rss, search, server,
share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet,
target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle,
x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis
```

来源：<https://github.com/lucide-icons/lucide>

---

## 二、运行时依赖（不在本仓库内，随依赖安装）

| 包 | 版本基线 | 许可 | 著作权人 |
|---|---|---|---|
| `wot-design-uni` | 1.14.0 | MIT | Copyright (c) 2023 weisheng |
| `vue` | 3.4.x | MIT | Vue.js 作者 |
| `@dcloudio/*`（uni-app 全家桶） | 3.0.0-5020620260917001 | Apache-2.0 | DCloud |
| `vite` | 5.2.8 | MIT | Vite 团队 |
| `sass` | 1.77.x | MIT | Sass 团队 |
| `electron` | 31.x | MIT | Electron 贡献者 |

### 关于 wot-design-uni —— 最重要的一条

`cd-dialog` / `cd-select` 等组件**在运行时使用了 wot-design-uni 的 `wd-popup`、
`wd-action-sheet`、`wd-config-provider`**。CodeDogUI 未复制其源码，
只通过 CSS 变量（`--wot-*`）做主题桥接，因此**不构成对 wot-design-uni 的再分发**；
使用者通过 npm 自行安装该依赖，上游 MIT 许可证随包传递。

⚠️ **但请注意**：执行 `npm run build:mp-weixin` 后，产物目录
`dist/build/mp-weixin/node-modules/wot-design-uni/` 中**确实包含 wot-design-uni 的
编译产物**。当你把这个产物作为小程序/App 发布出去时，就等于在分发 MIT 代码。
MIT 要求"上述版权声明与许可声明应包含在软件的所有副本或实质性部分中"，
所以**建议在小程序的关于页 / 开源许可页中列出 wot-design-uni 的 MIT 声明**。
这是被绝大多数项目忽略、但在合规审查中确实会被追问的一条。

### 关于 uni-app（Apache-2.0）

Apache-2.0 允许商用、修改、闭源分发，附带专利授权。需注意两点：

1. 若上游包内存在 `NOTICE` 文件，分发时需保留其内容
2. **"uni-app" 是 DCloud 的商标**，产品名、包名、宣传语中不得使用，也不得暗示
   与 DCloud 存在官方关联（本框架名 `codedog-ui` 未使用该词，合规）

---

## 三、字体

**无。** CodeDogUI 不打包任何字体文件：图标走 CSS mask + data URI SVG，
不使用 iconfont 字体。这既避免了字体授权问题，也省掉了一次跨域网络请求。

---

## 四、自查方式

改动依赖后可用以下命令复核许可证清单（需 `license-checker`）：

```bash
npx license-checker --summary --production
npx license-checker --failOn "GPL;AGPL;SSPL"   # 阻断强传染性许可
```

建议在 CI 中加入第二条命令，作为发布前的硬门禁。
