# 发布到 npm

::: tip ✅ codedog-ui@0.5.3 已上线（当前 latest）
发布时间 **2026-10-05**（`dist-tags: latest → 0.5.3`），详见 <https://www.npmjs.com/package/codedog-ui>。
首发 0.5.0 于 2026-10-01，已通过真实安装核验：`npm i codedog-ui` → 组件目录 + LICENSE + README + index.d.ts 齐全。
下文是完整操作记录与下次发版流程。
:::

## 版本时间线

| 版本 | 日期 | 内容 |
|---|---|---|
| 0.5.0 | 2026-10-01 | 首版上线，当时 62 个组件 |
| 0.5.1 | 2026-10-01 | 官网与文档中心改用 CodeDogUI 自绘视觉，补站点打包与部署脚本 |
| 0.5.2 | 2026-10-02 | 组件 62 → 67（日历 / 选择器 / 级联 / 轮播 / 图片预览），修 6 项致命 + 第二轮全库复查 59 项 |
| 0.5.3 | 2026-10-05 | 组件 67 → 80（水印 / 表单渲染 / 二维码 / 图片预览等），补齐桌面端交互与破版门禁；发布需改用带 **Bypass 2FA** 的 granular token（否则 `EOTP`） |

这个包在发布前控制权归我们（`registry.npmjs.org/codedog-ui` 曾返回 404），包名未被占用，已顺利注册为公开包。

## 零、已经做完的准备（无需重复）

| 项 | 状态 |
|---|---|
| `name` / `version` / `description` / `keywords` | ✅ |
| `author` / `contributors` / `license` / `homepage` / `repository` / `bugs` | ✅ 已指向真实仓库与邮箱 |
| `main` / `module` / `types` / `exports` / `files` | ✅ |
| `sideEffects`（标记 `.scss` 防止被 tree-shaking 误删） | ✅ |
| `publishConfig`（关键，见下） | ✅ |
| 包内 `README.md` / `LICENSE` / `changelog.md` | ✅ 三者均随包分发 |
| 自包含性 | ✅ 包内无任何 `@/` 别名引用，全部相对路径，最深两级不越界 |
| npm 形态可用性 | ✅ 实测通过（两 easycom 路径 + `@import 'codedog-ui/styles'` + 条件编译） |

## 一、最容易踩的坑：本机 registry 是镜像

项目 `.npmrc` 与用户级 `~/.npmrc` 都写着：

```
registry=https://registry.npmmirror.com
```

用于安装加速没问题，但 **npmmirror 是只读镜像**，向它 publish 会失败或发不出去。

**已内置的对策** —— 包里的 `publishConfig`：

```jsonc
"publishConfig": {
  "registry": "https://registry.npmjs.org/",
  "access": "public"
}
```

`publishConfig.registry` 覆盖 `.npmrc` 的设置，`access: public` 保证非付费账号也能公开发布。因此**不需要**临时改本机 registry。

::: warning
若发布时使用 `--registry <其他地址>` 显式传参，命令行参数优先级最高，会绕开上面的保护。
:::

## 二、发布前检查清单

```bash
# 1. 确认登录的是 npm 官方账号（不是镜像）
npm whoami --registry=https://registry.npmjs.org/

# 2. 干跑，确认入包文件与体积
npm run release:check

# 3. 确认版本号（每次发布必须递增，同一版本号不可重复发布）
node -e "console.log(require('./src/uni_modules/codedog-ui/package.json').version)"
```

检查点：

- [ ] changelog 已补本次改动
- [ ] 版本号已递增（遵循 semver）
- [ ] **站点文案自检已跑**（`npm run check:site`）—— 拦截「官网还挂着旧版本号 / 组件数停在 68」这类肉眼难发现的过期文案
- [ ] 双端构建通过（`npm run build:h5` + `npm run build:mp-weixin`）
- [ ] 干跑产物中 80 个组件目录齐全、`LICENSE` 与 `README.md` 在列

## 三、执行发布

```bash
# 登录（一次性，session token 会写进 ~/.npmrc）
npm login --registry=https://registry.npmjs.org/

# 发布（publishConfig 已锁定 registry 与 access）
npm run release:publish
```

### ⚠️ 必须先创建带 Bypass 2FA 的 Granular Token，否则必定 403 / EOTP（已实测多次）

历次失败的完整记录：

| # | 命令 | 结果 |
|---|---|---|
| 1 | `npm publish` | **E403** `Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages.` |
| 2 | `npm publish --otp=00242346` | **同样的 E403**，一字未变 |
| 3 | 新粘贴的 granular token `whoami` 自检 | **401** `{}` —— token 串本身无效（同一调用方式下 session token 能正常 whoami 返回 `penngu`） |
| 4 | `npm run release:interactive` + 新 granular token | ✅ **成功**，见顶部提示 |
| 5 | 发 0.5.3 时用**未勾 Bypass 2FA** 的 granular token `npm publish` | **EOTP** `This operation requires a one-time password from your authenticator.` —— `whoami` 正常返回 `penngu`，说明 token 有效，只是没有 bypass 权限 |
| 6 | 换成**勾了 Bypass 2FA** 的 granular token 重发 | ✅ **成功**，`+ codedog-ui@0.5.3` |

::: tip 一句话结论
403 = 用了 session token（npm 已移除 legacy token，session token 不能发任何包，加 `--otp` 也没用）；
**EOTP = token 本身有效但没勾 Bypass 2FA**，换个勾了的 token 即可，不必去翻动态码。
:::

**最后成功的 token 配置**（对照检查）：

| 字段 | 取值 |
|---|---|
| Bypass two-factor authentication | ✅ 勾选（选了 read and write 权限后该复选框才出现） |
| Permissions | Read and write (publish and stage) |
| Select packages | All packages |
| Allowed IP ranges | **留空**（填了 CIDR 会让非白名单出口 401） |
| Expiration | 30 天（到期前需重新签发，或改走 Trusted Publishing） |

那次 401 的 40 字符串后来确认是 **Recovery Codes**（启用 2FA 时页面给的那组）——它既不是 token 也不能拿来登录，
一旦用恢复码登录会触发 **72 小时安全冻结**，期间禁止 publish / 创建 token。

**根因不是验证码。** `npm profile get` 显示账号 `two-factor auth: disabled`，同时 `npm login`
浏览器流程拿到的是 **session token**。自 2025 年 11 月起 npm 已移除 legacy token，
**session token 不允许发布任何包**，加 `--otp` 也不会改变结果（若真是验证码错，报的会是 `EOTP` / `401 Incorrect one-time password`）。

失败是干净的：重试只停在 403，`https://registry.npmjs.org/codedog-ui` 仍返回 404，无半成品包。

### 正确做法：创建带 Bypass 2FA 的 Granular Token

在 npm 网页操作（**CLI 无法创建 granular token**）：

1. 右上角头像 → **Access Tokens** → **Generate New Token**
2. Token name：随便起，例如 `codedog-ui-publish`
3. **勾选 Bypass two-factor authentication** ← 关键，默认是关的
4. **Packages and scopes**
   - Permissions 选 **Read and write (publish and stage)**
     ⚠️ 不要选 `Read and write (stage only)`——它只能 `npm stage publish`，正式发布会被拒
   - Select Packages 选 **All Packages**
     ⚠️ 包还不存在时无法在列表里指定 `codedog-ui`，所以必须选全部
5. Expiration：选一个到期时间（至少 1 天后）
6. **Generate Token** → 立刻复制（此后再也看不到完整值）

发布前先自检 token，避免再吃一次 403/401：

```bash
# 环境变量方式，不落盘、不进 shell 历史
TOK=<你的token>
curl -s -w "\nHTTP:%{http_code}\n" -H "Authorization: Bearer $TOK" https://registry.npmjs.org/-/whoami
```

| 返回 | 含义 |
|---|---|
| `200 {"username":"penngu"}` | token 有效，可以发 |
| `401 {}` | token **无效**：复制不全 / 已被 revoke / 生成器里填了 Allowed IP Ranges 而本机公网 IP 不在段内 |
| `200` 但 publish `403` | token 有效但没勾 Bypass 2FA，或权限选成了 `stage only` / `Read-only` |

::: danger 不要把 token 明文贴进聊天窗口
贴出去的 token 等同泄露，**必须回 npm → Access Tokens 立刻 Delete 再新建**。
需要让脚本/助手代发布时，用下面任一种方式，token 都不落盘、不进 shell 历史。

| 方式 | 命令 | token 是否留痕 |
|---|---|---|
| ① 发布脚本（推荐） | `npm run release:interactive` | 仅存在于本次进程 |
| ② PowerShell 临时变量 | 见下 | 关掉窗口即消失 |
| ③ 临时文件 | `node scripts/publish.mjs --token-file=~/.npm-token`；用完 `rm` | 明文落 disk，用完必须删 |

```powershell
# ② PowerShell：从 SecureString 解出明文，只放进当前进程的环境变量
$t = Read-Host "npm token" -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
           [Runtime.InteropServices.Marshal]::SecureStringToBSTR($t))
${env:npm_config_//registry.npmjs.org/:_authToken} = $plain
Remove-Variable plain
cd src\uni_modules\codedog-ui; npm publish
```

::: warning
`ConvertFrom-SecureString` 产出的是 **DPAPI 密文**，Node/其他会话读出来是解不开的乱码——
别用它当 `--token-file` 的输入。要落文件就写明文，用完立刻删。
:::
:::

若仍选择手搓 token 方式，拿到 200 之后：

```bash
# 换掉当前 session token（session token 只能 whoami，不能 publish）
npm config set //registry.npmjs.org/:_authToken=<粘贴你的token>

# 再发布——这次不需要 --otp
cd src\uni_modules\codedog-ui
npm publish
```

### 更省事的一条路：干脆启用账号 2FA，用 6 位动态码发

如果反复卡在「复制 40 位长串」（已经失败过一次），**别再用 token**：

1. <https://www.npmjs.com/settings/penngu/profile> → 启用 **2FA (auth-and-writes)**，
   用 Microsoft/Google Authenticator 扫码，Recovery codes 抄下来离线保存
2. `npm run release:publish`（或 `node scripts/publish.mjs` 时 token 留空回车）
3. 终端出现 `Enter OTP:` → 填 Authenticator 当前显示的 6 位数字

这条路的好处：不用碰长串 token，也不受 2027-01「bypass-2FA 禁止直发」政策影响。

### 发布脚本 `release:interactive` 说明

`scripts/publish.mjs` 已内置发布前体检，避免又白跑一趟：

- 打 registry 查该版本是否已存在（同版本号不可重发，提前拦下）
- token 长度/前缀可疑时先警告再问是否继续
- registry 不可达时给出网络/代理提示
- Windows 下自动走 `cmd.exe`（直接 spawn `npm.cmd` 会 EINVAL）

```bash
npm run release:interactive                    # 交互式，token 键入或用动态码
npm run release:interactive -- --dry-run       # 只体检 + 干跑，不真发
node scripts/publish.mjs --token-file=~/.npm-token
```

发布后即可在 <https://www.npmjs.com/package/codedog-ui> 查看。

## Trusted Publishing（推荐，仓库零密钥）

`.github/workflows/publish.yml` 已就位，推 `v*` tag 即自动发布，走 OIDC 短时凭证，
完全不需要 granular token，也不受 2027-01「bypass-2FA 禁止直发」政策影响。

**启用只需两步：**

1. npm 网站：<https://www.npmjs.com/package/codedog-ui> → Settings → Publishing access
   → **Add trusted publisher** → GitHub Actions | Owner `peen-gu` | Repo `CodeDog-ui` | Workflow `publish.yml`
   （包已发布，这一步随时可以做；做完即可停用手搓 token）
2. GitHub 仓库：Settings → Environments / Actions 允许读写；`id-token: write` 已在 workflow 里声明，无需改

> ⚠️ 前提：本机到 github.com:443 目前**不可达**（21 秒超时），所以 `git push` 只能在打通网络后做。
> 本地已 `git init` 完毕（commit `005b52d`）并打好 `v0.5.0` tag，网络通了直接：
> `git push -u origin main --follow-tags`（远端为空仓库，不会冲突；被拒的话用 `--allow-unrelated-histories`，**禁止 `-f` 强推**）

**触发发布：**

```bash
git tag -a v0.5.0 -m "v0.5.0"
git push origin main --follow-tags
# 或 Actions 页面手动 Run workflow（workflow_dispatch 已开）
```

::: warning 两个坑
- **不要**给 `setup-node` 传 `registry-url`：它会把 `//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}`
  写进 `.npmrc`，而 OIDC 模式下该变量为空，发布反而失败
- workflow 里必须升级 npm（`npm i -g npm@latest`）：Trusted Publishing 要求 CLI ≥ 11.5.1 + Node ≥ 22.14
:::

工作流跑完，到 Actions 页面查看 `npm view codedog-ui version` 的输出即为最终核验。

## 四、发布后验证（0.5.0 已全项通过 ✅）

| 检查 | 结果 |
|---|---|
| `npm view codedog-ui version` | `0.5.0` |
| `dist-tags.latest` | `0.5.0`（versions 仅此一版） |
| 元信息 | MIT / Penn.Gu / ui.codedog.tech / repo 均正确写入 registry |
| 冷启动真实安装 | `npm i codedog-ui` → 62 组件 + LICENSE + README.md + index.d.ts + styles 齐全 |

```bash
# 1. 换一个空目录，真实拉一次
mkdir /tmp/verify && cd /tmp/verify
npm init -y
npm i codedog-ui
ls node_modules/codedog-ui          # 应有 LICENSE / README.md / components / styles

# 2. 冷启动不可用时（镜像同步延迟），显式指定官方源
npm i codedog-ui --registry=https://registry.npmjs.org/
```

npmmirror 通常在几分钟内同步；若着急，让使用者临时加 `--registry=https://registry.npmjs.org/`。

同时建议在仓库打 tag 并与 npm 版本对齐：

```bash
git tag -a v0.5.0 -m "v0.5.0"
git push origin v0.5.0
```

## 五、后续版本

每次发版：改 `version` → 补 changelog → `npm run release:check` → `npm run release:publish`。

若将来要发测试版，用 `--tag beta` 避免抢占 latest：

```bash
cd src/uni_modules/codedog-ui && npm publish --tag beta
```

## 六、发布前仍未决的事项

- **对外文案口径**：README、npm 页面、文档站等对外物料**不再放置商标检索、权利冲突之类的免责声明**，统一改成「有问题直接来反馈」的友好提示。若确有必要评估品牌风险，放内部文档私下处理，不外露。
- **图标署名**：`cd-icon` 72 个图标衍生自 Feather(MIT) 与 Lucide(ISC)，署名注释已写入 `icons.js` 头部并随包分发，分发时不得删除。
- **无法撤回**：npm 的包在发布后 72 小时以外无法删除（unpublish 政策）。发错内容的处理方式是发一个补丁版本覆盖。
