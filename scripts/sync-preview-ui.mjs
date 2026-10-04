/**
 * 把组件库源码同步进预览应用的 node_modules。
 *
 * 为什么需要：预览应用 npm 装的是 codedog-ui@0.5.2，改 src/uni_modules 的组件源码
 * 不发新版就永远进不了预览（2026-10-03 实测：改 cd-step 字号，截图纹丝不动）。
 *
 * 为什么不用 vite alias 指向 src：uni 的小程序构建拿「模块相对路径」当产物命名
 * pattern，alias 解析出 ../../..//src/... 这种带 ../ 的路径会直接报
 * 「Invalid pattern for output.chunkFileNames」。把源码拷进 node_modules，
 * 模块路径始终在项目内，双端构建都不炸。
 *
 * 用法（项目根目录）：
 *   node scripts/sync-preview-ui.mjs
 *
 * 0.5.3 发布后：重跑 npm i codedog-ui@0.5.3 恢复官方包，本脚本只在质检期用。
 */
import { existsSync, mkdirSync, cpSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { homedir, tmpdir } from 'node:os'

const SRC = 'src/uni_modules/codedog-ui'
const DEST = 'playground/mp-preview/node_modules/codedog-ui'

if (!existsSync(SRC)) {
  console.error(`找不到 ${SRC}，请在项目根目录执行`)
  process.exit(1)
}

if (existsSync(DEST)) {
  const base = existsSync(join(homedir(), '.Trash')) ? join(homedir(), '.Trash') : tmpdir()
  const target = join(base, `mpprev-codedog-ui-${Date.now()}`)
  renameSync(DEST, target)
  console.log(`旧副本已移入：${target}`)
}

mkdirSync(join(DEST, '..'), { recursive: true })
cpSync(SRC, DEST, { recursive: true })
console.log(`已同步 ${SRC} → ${DEST}`)
