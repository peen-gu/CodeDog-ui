import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

/**
 * 刻意**不加**任何 chunk 相关的 workaround。
 *
 * 这里曾经有一段 manualChunks，把 cd-toast-host 强制并进 index 主 chunk，
 * 用来绕开一个包自身的构建缺陷：service 对宿主组件用相对路径动态 import，
 * 包装在 node_modules 里时 Vite 会产出 `..-node_modules-...` 这种非法
 * module specifier（既不是合法相对路径也不是合法裸包名），所在页面整页加载失败。
 *
 * 2026-10-04 已在包里根治（service/index.js 改为静态导入，见该文件注释）。
 * 因此这条 workaround 撤掉了 —— 预览应用装的是 npm 形态的包，撤掉之后它同时
 * 充当「npm 消费者视角」的回归判据：哪天包再引入同类写法，这里会再次构建出
 * 非法 chunk，一眼可见。
 */
export default defineConfig({
  plugins: [uni()],
})
