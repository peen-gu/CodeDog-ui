#!/usr/bin/env node
/**
 * 交互式发布脚本 —— 不必再手抄长串 npm token。
 *
 * 设计要点：
 *  - token 来源三选一：终端键入（TTY 下隐藏） / --token-file=<path> / --token=<value>
 *    任何来源都只注入子进程环境变量，不写 ~/.npmrc、不入 shell 历史
 *  - 两条发布路径：① granular token（bypass 2FA） ② 留空 → npm 会用账号 2FA 提示 6 位动态码
 *  - 发布前自动校验：版本是否已被占用 / registry 可达性
 *
 * 用法：
 *   npm run release:interactive                       # 交互式
 *   npm run release:interactive -- --dry-run          # 干跑
 *   node scripts/publish.mjs --token-file=~/.npm-token # 从临时文件读
 */
import { createInterface } from 'node:readline'
import { spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const argv = process.argv.slice(2)

/**
 * 取 --xxx=value 或 --xxx value 两种写法。
 *
 * 早期只认空格分隔，但本文件头部的用法示例写的是 `--token-file=~/.npm-token`。
 * 按示例传参时 `indexOf('--token-file')` 命中不到（argv 里是连成一体的一个元素），
 * token 静默读成 null → 不注入凭据 → npm 报 ENEEDAUTH，
 * 而报错信息完全不提「没读到 token」，排查时极易误判成 token 无效或没勾 Bypass 2FA。
 * 两种写法都支持，并顺手让文档与实现对齐。
 */
const flag = (n) => {
  const eq = argv.find((a) => a.startsWith(`--${n}=`))
  if (eq) return eq.slice(`--${n}=`.length)
  const i = argv.indexOf(`--${n}`)
  return i > -1 ? argv[i + 1] : null
}
const dry = argv.includes('--dry-run')
const yes = argv.includes('--yes')

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const pkgDir = join(root, 'src', 'uni_modules', 'codedog-ui')
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))

const REGISTRY = pkg.publishConfig?.registry ?? 'https://registry.npmjs.org/'
const AUTH_ENV = `npm_config_${REGISTRY.replace(/^https?:/, '')}:_authToken`

const ok = (s) => console.log(`\x1b[32m✔\x1b[0m ${s}`)
const bad = (s) => console.log(`\x1b[31m✘\x1b[0m ${s}`)
const info = (s) => console.log(`\x1b[36mℹ\x1b[0m ${s}`)

// ---- 读取凭据（TTY 才交互，管道/非交互环境一律回退到文件或缺省）----
function readTokenFromFlags() {
  const f = flag('token-file')
  if (f) {
    const p = f.replace(/^~/, homedir())
    if (!existsSync(p)) { bad(`临时文件不存在：${p}`); process.exit(1) }
    return readFileSync(p, 'utf8').trim()
  }
  const inline = flag('token')
  return inline ? inline.trim() : null
}

async function askTokenInteractively() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return null
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const q = (text) => new Promise((resolve) => {
    rl.question(text, (a) => resolve((a ?? '').trim()))
  })
  let answer
  try {
    console.log([
      '',
      '  凭据二选一：',
      '    ① granular token（须勾 Bypass 2FA + Read and write (publish and stage)）',
      '    ② 留空 → 账号已启用 2FA，发布时 npm 会提示输入 6 位动态验证码',
      '',
    ].join('\n'))
    answer = await q('粘贴 granular token（或直接回车用动态验证码）> ')
  } finally {
    rl.close()
  }
  return answer || null
}

// ---- 1. 版本自检 ----
const res = await fetch(`${REGISTRY}${pkg.name}`).catch(() => null)
if (res && res.ok) {
  const data = await res.json()
  if (data.versions?.[pkg.version]) {
    bad(`${pkg.name}@${pkg.version} 已存在于 registry，同一版本号不可重复发布`)
    info(`最新已发布版本：${data['dist-tags']?.latest}。请上调 package.json 的 version。`)
    process.exit(1)
  }
  ok(`${pkg.name}@${pkg.version} 尚未发布，版本可用`)
} else if (res && res.status === 404) {
  ok(`${pkg.name} 尚未注册 —— 本次为首版发布`)
} else {
  bad(`无法访问 ${REGISTRY}（HTTP ${res?.status ?? 'network error'}）`)
  info('检查网络 / 代理，或确认未被防火墙拦截。')
  process.exit(1)
}

// ---- 2. 选定凭据 ----
let token = readTokenFromFlags()
if (!token) token = await askTokenInteractively()

/*
 * 非交互环境（CI / 被别的脚本调用）拿不到 token 就直说，不要静默继续。
 * 空凭据发出去只会得到 ENEEDAUTH，而这条报错完全看不出「是没读到 token」，
 * 上一次就是这样绕了半天才定位到。TTY 下允许留空 —— 那是「用账号 2FA 动态码」的合法选择。
 */
if (!token && (!process.stdin.isTTY || !process.stdout.isTTY)) {
  bad('没有拿到 token，且当前不是交互终端（无法提示输入动态码）')
  info('用法：node scripts/publish.mjs --token-file=<path>  或  --token=<value>')
  info('也可以在本机终端直接跑 `npm run release:interactive`，由终端隐藏输入。')
  process.exit(1)
}

/*
 * npm_ / nvf_ 是**前缀**，后面还跟着 30+ 位主体。
 * 旧正则写成 `^(npm_|nvf_|[a-f0-9]{32,})$`，等于要求整串就是 `npm_` 三个字符 ——
 * 于是所有合法的 granular token（实测长度 40）都被判成「不像 token」。
 * 之前 --token-file 读不到、token 为 null 时校验被跳过，这个 bug 才一直没暴露。
 */
const TOKEN_RE = /^(?:npm_|nvf_)[A-Za-z0-9_-]{20,}$|^[a-f0-9]{32,}$/
if (token && !TOKEN_RE.test(token)) {
  bad(`这串不像 npm token（长度 ${token.length}）`)
  info('常见原因：复制时被截断 / 已在网页端删除 / 创建时填了 Allowed IP Ranges。')
  if (process.stdin.isTTY && !yes) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const go = await new Promise((r) => rl.question('仍然尝试？(y/N) > ', (a) => r((a ?? '').trim().toLowerCase())))
    rl.close()
    if (go !== 'y') process.exit(1)
  }
}

// ---- 3. 发布 ----
// Windows CreateProcess 遇上非法环境变量名（Git Bash 导出的 BASH_FUNC_xxx%% 之类）会 EINVAL，过滤掉
const env = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(k)),
)
if (token) env[AUTH_ENV] = token

// Windows 下以 // 开头的参数会被 spawn 当成选项解析而报 EINVAL，必须用 = 合并写法
const args = ['publish', `--registry=${REGISTRY}`, ...(dry ? ['--dry-run'] : [])]
info(`${dry ? '干跑' : '发布'} ${pkg.name}@${pkg.version} → ${REGISTRY}`)

const child = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', args, {
  cwd: pkgDir,
  stdio: 'inherit',
  env,
  // Windows 下不带 shell 直接 spawn npm.cmd 会 EINVAL（实测），必须经由 cmd.exe
  shell: /^win/.test(process.platform),
})

child.on('exit', (code) => {
  if (code === 0 && !dry) {
    ok(`发布成功 → https://www.npmjs.com/package/${pkg.name}`)
    console.log(`\n验证：npm view ${pkg.name} version`)
    console.log(`打 tag：git tag -a v${pkg.version} -m "v${pkg.version}"`)
  } else if (code !== 0) {
    bad(`退出码 ${code}`)
    info('403 → token 没勾 Bypass 2FA，或权限选成了 stage only / Read-only。')
    info('401 → token 串无效：是否被截断 / 已删除 / IP 白名单不符。')
    info('EOTP → 动态验证码错误，等下一个 30 秒窗口重试。')
  }
})
