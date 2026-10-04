/**
 * 文档站专用 uni API shim（浏览器端）
 * ---------------------------------------------------------------
 * 目的：让 62 个 cd-* 组件在 VitePress 的纯浏览器环境里真实渲染、真实交互。
 *
 * 覆盖范围就是组件库里实际用到的 12 个 uni.* API（2026-10 盘点）：
 *   createSelectorQuery / pageScrollTo / navigateTo / switchTab /
 *   previewImage / onWindowResize / offWindowResize / showToast /
 *   chooseImage / chooseMessageFile / chooseFile / uploadFile
 *
 * 不做完整 uni-app 运行时 —— 文档站不是沙箱之外的第二运行环境，
 * 只是「H5 形态的真实预览」；小程序专有行为不在此模拟。
 */

/* ---------------- 迷你浮层：给 toast / 跳转提示一个可见反馈 ---------------- */

let tipHost = null
let tipTimer = null

function showTip(text) {
  if (typeof document === 'undefined') return
  if (!tipHost) {
    tipHost = document.createElement('div')
    tipHost.setAttribute('data-cd-uni-shim-tip', '')
    tipHost.style.cssText =
      'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);' +
      'max-width:70vw;padding:8px 16px;border-radius:8px;' +
      'background:rgba(15,23,42,.85);color:#fff;font-size:13px;line-height:1.5;' +
      'z-index:2147483000;pointer-events:none;transition:opacity .25s;opacity:0;'
    document.body.appendChild(tipHost)
  }
  tipHost.textContent = String(text)
  tipHost.style.opacity = '1'
  clearTimeout(tipTimer)
  tipTimer = setTimeout(() => {
    if (tipHost) tipHost.style.opacity = '0'
  }, 1800)
}

/* ---------------- createSelectorQuery ---------------- */

function rectOf(el) {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return {
    left: r.left,
    right: r.right,
    top: r.top,
    bottom: r.bottom,
    width: r.width,
    height: r.height,
  }
}

function rootOf(scope) {
  if (!scope) return document
  /* .in() 可能传内部实例、代理或普通元素，逐级兜底 */
  const proxy = scope.proxy || scope.$ || scope
  const el = proxy && (proxy.$el !== undefined ? proxy.$el : proxy)
  if (el instanceof Element) return el
  if (el && el.querySelector) return el
  return document
}

function createSelectorQuery() {
  let root = document
  const tasks = []

  const query = {
    in(scope) {
      root = rootOf(scope)
      return query
    },
    select(selector) {
      tasks.push({ selector, all: false, cb: null })
      return query
    },
    selectAll(selector) {
      tasks.push({ selector, all: true, cb: null })
      return query
    },
    boundingClientRect(cb) {
      const last = tasks[tasks.length - 1]
      if (last) last.cb = cb
      return query
    },
    exec(done) {
      const results = tasks.map((t) => {
        const scopeEl = root && root.querySelector ? root : document
        const found = t.all
          ? [...scopeEl.querySelectorAll(t.selector)]
          : scopeEl.querySelector(t.selector)
        const list = t.all ? found : [found]
        const rects = list.map(rectOf)
        const value = t.all ? rects : rects[0] || null
        if (t.cb) t.cb(value)
        return value
      })
      if (done) done(results)
      return query
    },
  }
  return query
}

/* ---------------- 滚动 / 跳转 / 图片预览 ---------------- */

function pageScrollTo(options = {}) {
  const { selector, offsetTop = 0, scrollTop, duration = 300 } = options
  let top = 0
  if (typeof scrollTop === 'number') {
    top = scrollTop
  } else if (selector) {
    const el = document.querySelector(selector)
    if (el) top = el.getBoundingClientRect().top + window.scrollY + offsetTop
  }
  window.scrollTo({ top, behavior: duration > 0 ? 'smooth' : 'auto' })
}

function navStub(kind) {
  return (options = {}) => {
    const url = options.url || ''
    showTip(`文档站预览不执行 ${kind}：${url}`)
    if (typeof options.fail === 'function') options.fail({ errMsg: `${kind}:fail unsupported` })
  }
}

function previewImage(options = {}) {
  const urls = options.urls || []
  const current = options.current || urls[0]
  if (current && typeof window !== 'undefined') window.open(current, '_blank', 'noopener')
}

/* ---------------- 窗口尺寸监听 ---------------- */

const resizeListeners = new Set()

function onWindowResize(cb) {
  if (typeof cb !== 'function') return
  resizeListeners.add(cb)
  window.addEventListener('resize', cb)
}

function offWindowResize(cb) {
  if (typeof cb !== 'function') return
  resizeListeners.delete(cb)
  window.removeEventListener('resize', cb)
}

/* ---------------- 媒体选择 / 上传（预览环境给提示，不给真实文件对话框） ---------------- */

function chooseStub(kind) {
  return (options = {}) => {
    showTip(`文档站预览不弹出${kind}，真实端为系统选择面板`)
    if (typeof options.fail === 'function') options.fail({ errMsg: 'choose:fail unsupported' })
  }
}

function uploadFile(options = {}) {
  showTip('文档站预览不执行真实上传')
  if (typeof options.fail === 'function') options.fail({ errMsg: 'uploadFile:fail unsupported' })
  return { abort() {} }
}

/* ---------------- 原生反馈降级（文档站没有 cd-toast-host 全局挂载） ---------------- */

function showToast(options = {}) {
  showTip(options.title || '')
}

/* ---------------- 系统信息 / 存储 / 主题（use-platform、use-theme 用到） ---------------- */

function getSystemInfoSync() {
  return {
    uniPlatform: 'web',
    platform: 'web',
    osName: /Mac/i.test(navigator.platform) ? 'mac' : 'windows',
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    language: navigator.language,
  }
}

function getStorageSync(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return ''
  }
}

function setStorageSync(key, value) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    /* 隐私模式等场景下静默 */
  }
}

const themeListeners = new Set()

function onThemeChange(cb) {
  if (typeof cb !== 'function') return
  themeListeners.add(cb)
}

function offThemeChange(cb) {
  themeListeners.delete(cb)
}

/* 安装入口 ---------------- */

export function installUniShim() {
  if (typeof window === 'undefined') return
  if (window.uni && window.uni.__cdShim) return
  window.uni = {
    __cdShim: true,
    createSelectorQuery,
    pageScrollTo,
    navigateTo: navStub('navigateTo'),
    switchTab: navStub('switchTab'),
    previewImage,
    onWindowResize,
    offWindowResize,
    showToast,
    showTip,
    chooseImage: chooseStub('图片选择'),
    chooseMessageFile: chooseStub('会话文件选择'),
    chooseFile: chooseStub('文件选择'),
    uploadFile,
    getSystemInfoSync,
    getStorageSync,
    setStorageSync,
    onThemeChange,
    offThemeChange,
  }
}
