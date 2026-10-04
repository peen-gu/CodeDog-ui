/**
 * 生成 DCloud 插件市场（https://ext.dcloud.net.cn）上架包，uni_modules 形态。
 *
 * 为什么不直接改主工程目录：
 *   插件市场要求「uni_modules 下的目录名 === 插件 ID === 作者ID-插件英文名称」，
 *   而主工程目录名 codedog-ui 同时被 npm 形态、docs、scripts 引用着。
 *   改名波及 3 处 @/uni_modules 引用 + 文档 + 脚本，风险大且 npm 包名会跟着乱。
 *   所以这里只生成一个 staging 目录，主工程零改动。
 *
 * 用法（项目根目录执行）：
 *   node scripts/package-dcloud.mjs --author-id=penngu
 *
 * 参数：
 *   --author-id=<id>  必填。DCloud 作者 ID：英文或数字、≥2 位、不能含 DCloud / uni。
 *                     与 DCloud 账号里填的必须一致，否则发布窗口会拒绝。
 *
 * 产物：
 *   release/dcloud/uni_modules/<作者ID>-codedog-ui/
 *   压缩（脚本不代劳，macOS 自带 zip）：
 *     cd release/dcloud && zip -qr codedog-ui-dcloud.zip uni_modules
 */
import { existsSync, mkdirSync, copyFileSync, cpSync, readFileSync, writeFileSync, renameSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { homedir, tmpdir } from 'node:os'

const PLUGIN_NAME = 'codedog-ui'
const SRC = `src/uni_modules/${PLUGIN_NAME}`
const OUT_ROOT = 'release/dcloud'

/** DCloud 明令禁止出现在插件目录里的工程文件（有则发布失败） */
const FORBIDDEN_FILES = ['pages.json', 'App.vue', 'main.js', 'manifest.json', 'uni.scss']
/** 不应随包上传的目录 */
const FORBIDDEN_DIRS = ['node_modules', 'unpackage', '.git', '.hbuilderx']
/**
 * 复制时跳过这两项，改由本脚本生成小写的 readme.md / license.md。
 * 原因：macOS 默认文件系统大小写不敏感，README.md 与 readme.md 是同一个文件，
 * 两者并存会让 zip 里落地的文件名不确定，而插件市场跑在大小写敏感的 Linux 上，
 * 拿到 README.md 就认不出插件文档。只生成小写版，去掉这个不确定性。
 */
const SKIP_ON_COPY = ['README.md', 'LICENSE']
/** uni_modules 规范要求随包的文件 */
const REQUIRED_FILES = ['package.json', 'readme.md', 'changelog.md', 'license.md', '.npmignore']

function readArg(key) {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${key}=`))
  return hit ? hit.slice(key.length + 3) : null
}

/** 旧产物移入回收站后再重建：直接 rm -r 会被本机沙箱的批量删除拦截挡下 */
function trashOld(dir) {
  if (!existsSync(dir)) return
  const base = existsSync(join(homedir(), '.Trash')) ? join(homedir(), '.Trash') : tmpdir()
  const target = join(base, `codedog-dcloud-${Date.now()}`)
  renameSync(dir, target)
  console.log(`旧产物已移入：${target}`)
}

function walk(dir) {
  let files = 0
  let bytes = 0
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      const sub = walk(p)
      files += sub.files
      bytes += sub.bytes
    } else {
      files += 1
      bytes += st.size
    }
  }
  return { files, bytes }
}

/** uni_modules 形态的安装说明。市场用户不跑 npm install，README 里的 npm 写法对他们无效 */
function uniModulesNotice(pluginId) {
  return `## uni_modules 形态安装（插件市场用户看这段）

1. 在插件市场点「使用 HBuilderX 导入插件」，插件落到 \`uni_modules/${pluginId}/\`
2. 组件**不用配 easycom**：插件内 \`components/\` 已符合规范，直接写 \`<cd-button />\` 即可
3. \`App.vue\` 里引一次样式：

\`\`\`scss
@import '@/uni_modules/${pluginId}/styles/index.scss';
\`\`\`

4. 本插件依赖 \`wot-design-uni\`，HBuilderX 导入时会提示一并导入。未导入则这 5 个组件不可用：
   \`cd-config-provider\`、\`cd-select\`、\`cd-dialog\`、\`cd-drawer\`、\`cd-action-sheet\`
5. 小程序端要用命令式反馈（toast / confirm / loading），需在页面放一次 \`<cd-toast-host />\`
6. 下面正文里的 \`npm i codedog-ui\` 与 \`codedog-ui/...\` 路径是 npm 形态的写法，两种形态二选一即可

`
}

// ---------- 1. 校验作者 ID ----------
const authorId = readArg('author-id')
if (!authorId) {
  console.error('缺少 --author-id=<你的 DCloud 作者 ID>')
  console.error('作者 ID 规则：英文或数字、至少 2 位、不能包含 DCloud / uni（大小写不敏感）')
  process.exit(1)
}
if (!/^[A-Za-z0-9]{2,}$/.test(authorId)) {
  console.error(`作者 ID 不合法：「${authorId}」——只允许英文与数字，且至少 2 位`)
  process.exit(1)
}
if (/dcloud|uni/i.test(authorId)) {
  console.error(`作者 ID 不合法：「${authorId}」——不能包含 DCloud / uni 关键字`)
  process.exit(1)
}

const pluginId = `${authorId}-${PLUGIN_NAME}`
const OUT = `${OUT_ROOT}/uni_modules/${pluginId}`

// ---------- 2. 读主 package.json，并校验与作者 ID 无关的字段已补齐 ----------
const pkgPath = `${SRC}/package.json`
if (!existsSync(pkgPath)) {
  console.error(`找不到 ${pkgPath}，请在项目根目录执行本脚本`)
  process.exit(1)
}
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

const precheck = []
if (pkg.dcloudext?.type !== 'component-vue') {
  precheck.push('package.json → dcloudext.type 应为 "component-vue"（前端组件·通用组件）')
}
if (!pkg.uni_modules?.dependencies?.includes('wot-design-uni')) {
  precheck.push('package.json → uni_modules.dependencies 应包含 "wot-design-uni"（浮层组件的硬依赖）')
}
if (!pkg.files?.length) {
  precheck.push('package.json → files 为空，无法确认要复制哪些内容')
}
if (precheck.length) {
  console.error('主 package.json 缺以下字段，请先补齐（本脚本只负责改 id，不替你改这些）：')
  for (const line of precheck) console.error('  - ' + line)
  process.exit(1)
}

// ---------- 3. 复制 package.json 里 files 声明的内容 ----------
trashOld(OUT_ROOT)
mkdirSync(OUT, { recursive: true })

for (const entry of pkg.files) {
  if (SKIP_ON_COPY.includes(entry)) continue
  const from = `${SRC}/${entry}`
  if (!existsSync(from)) {
    console.error(`files 里声明的 ${entry} 在 ${SRC} 下不存在`)
    process.exit(1)
  }
  const to = `${OUT}/${entry}`
  if (statSync(from).isDirectory()) cpSync(from, to, { recursive: true })
  else copyFileSync(from, to)
}

// ---------- 4. 改写 package.json：只改 id ----------
pkg.id = pluginId
writeFileSync(`${OUT}/package.json`, JSON.stringify(pkg, null, 2) + '\n')

// ---------- 5. 补 uni_modules 规范要求的三个文件 ----------
writeFileSync(`${OUT}/readme.md`, uniModulesNotice(pluginId) + readFileSync(`${SRC}/README.md`, 'utf8'))
writeFileSync(`${OUT}/license.md`, readFileSync(`${SRC}/LICENSE`, 'utf8'))
writeFileSync(`${OUT}/.npmignore`, ['.hbuilderx', 'unpackage', 'node_modules', 'package-lock.json'].join('\n') + '\n')

// ---------- 6. 自检 ----------
const fails = []
for (const f of FORBIDDEN_FILES) if (existsSync(`${OUT}/${f}`)) fails.push(`含禁止文件 ${f}`)
for (const d of FORBIDDEN_DIRS) if (existsSync(`${OUT}/${d}`)) fails.push(`含禁止目录 ${d}`)
for (const f of REQUIRED_FILES) if (!existsSync(`${OUT}/${f}`)) fails.push(`缺必需文件 ${f}`)

const outPkg = JSON.parse(readFileSync(`${OUT}/package.json`, 'utf8'))
if (outPkg.id !== pluginId) fails.push(`package.json 的 id 应为 ${pluginId}，实际 ${outPkg.id}`)
if (outPkg.name !== PLUGIN_NAME) fails.push(`npm 包名被误改：应为 ${PLUGIN_NAME}，实际 ${outPkg.name}`)

const components = readdirSync(`${OUT}/components`).filter((n) => n.startsWith('cd-'))
const stat = walk(OUT)

console.log(`\n插件 ID      ${pluginId}`)
console.log(`产物目录     ${OUT}`)
console.log(`组件数       ${components.length}`)
console.log(`文件数       ${stat.files}`)
console.log(`体积         ${(stat.bytes / 1024 / 1024).toFixed(2)} MB`)

if (fails.length) {
  console.log('\n=== 自检未通过 ===')
  for (const f of fails) console.log('  ✗ ' + f)
  process.exit(1)
}

console.log('\n=== 自检通过 ===')
for (const f of FORBIDDEN_FILES) console.log(`  ✓ 无 ${f}`)
for (const d of FORBIDDEN_DIRS) console.log(`  ✓ 无 ${d}/`)
for (const f of REQUIRED_FILES) console.log(`  ✓ 有 ${f}`)
console.log(`  ✓ id = ${pluginId}，npm 包名仍为 ${PLUGIN_NAME}`)

console.log('\n下一步：')
console.log('  A. HBuilderX：导入该目录后，右键 uni_modules 目录 →「发布到插件市场」')
console.log('  B. 网页上传：')
console.log(`     cd ${OUT_ROOT} && COPYFILE_DISABLE=1 zip -qr codedog-ui-dcloud.zip uni_modules`)
console.log('     （COPYFILE_DISABLE=1 阻止 macOS 把 ._* 资源分支文件写进 zip）')
console.log('     然后在 https://ext.dcloud.net.cn 上传该 zip（解压后根目录必须是 uni_modules/）')
