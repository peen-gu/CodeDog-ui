/**
 * 预加载脚本：以最小暴露面给页面提供「我跑在桌面壳里」的判断依据。
 *
 * 只通过 contextBridge 暴露一个极小的只读对象，不开 nodeIntegration。
 * H5 页面里可以这样用：
 *   const isDesktopApp = !!window.cdDesktop
 */
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('cdDesktop', {
  isElectron: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
})
