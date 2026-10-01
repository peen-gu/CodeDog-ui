/**
 * CodeDogUI / Electron 桌面套壳
 * ---------------------------------------------------------------
 * 套壳成立的前提是 H5 产物满足两个条件（已在工程里配置好）：
 *   1. manifest.json → h5.router.mode = 'hash'
 *      file:// 协议下没有服务端路由，history 模式会 404
 *   2. manifest.json → h5.router.base = './'
 *      资源路径必须相对，否则 Electron 加载不到 JS 与 CSS
 *
 * 开发模式：
 *   npm run dev:h5        # 先起 uni-app 的 dev server（5173 端口）
 *   npm run electron:dev  # 另开一个终端，Electron 加载 5173
 *
 * 生产模式：
 *   npm run build:h5 && npm run electron:start
 */
const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

/** dev 模式加载 uni-app 的 dev server，而不是打包产物 */
const IS_DEV = !!process.env.CD_ELECTRON_DEV

const DEV_URL = 'http://localhost:5173'
const DIST_INDEX = path.join(__dirname, '..', 'dist', 'build', 'h5', 'index.html')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 360,
    minHeight: 480,
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    title: 'CodeDogUI',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (IS_DEV) {
    win.loadURL(DEV_URL)
    // 开发时顺手打开 DevTools，排样式问题很省事
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(DIST_INDEX)
  }

  // 外链交给系统默认浏览器，避免在桌面应用里开出一层嵌套的页面
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return win
}

app.whenReady().then(() => {
  createWindow()

  // macOS 点 Dock 图标时如果没有窗口则重建
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Windows / Linux：关掉所有窗口就退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
