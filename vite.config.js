import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// CodeDogUI 工作区构建配置
// H5 产物需要同时服务两个目标：
//   1. 浏览器直接访问（npm run dev:h5 / build:h5）
//   2. Electron 套壳以 file:// 协议加载（需要相对路径）
// 因此 base 使用相对路径，配合 manifest.json 中 h5.router.base = './' 与 hash 路由。
export default defineConfig({
  base: './',
  plugins: [uni()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2015',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
})
