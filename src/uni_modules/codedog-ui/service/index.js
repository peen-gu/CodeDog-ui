/**
 * CodeDogUI / 命令式反馈服务 —— 对外 API
 * ---------------------------------------------------------------
 * 用法：
 *   import { toast, confirm, alert, loading } from '@/uni_modules/codedog-ui'
 *
 *   toast.success('保存成功')
 *   const ok = await confirm({ title: '删除确认', content: '删除后无法恢复' })
 *   if (ok) ...
 *   const close = loading('提交中...'); close()
 *   previewImage({ urls, current: 2 })
 *
 * 挂载策略（两套通道，API 完全一致）：
 *
 *   H5 —— 零配置。首次调用时动态挂载宿主组件到 document.body。
 *         动态 import 让宿主及其依赖（cd-dialog 等）只在真正用到时才进入产物。
 *         「view 编译成字符串标签 uni-view、不依赖全局组件注册」是这条路成立的前提，
 *         已用探针在真实产物里验证过。
 *
 *   小程序 —— 没有body，宿主只能挂在页面里。约定：
 *         页面里放了 <cd-toast-host /> → 品牌样式；
 *         没放 → 自动降级 uni.showToast / showModal / showLoading，API 依然可用。
 *         降级是刻意的兜底而不是偷懒：小程序端任何库都绕不开「宿主必须手动挂」，
 *         与其让调用报错，不如保证语义一致的原生反馈。
 *
 * previewImage 是这套策略里唯一的例外：它在小程序端**总是**走 uni.previewImage，
 * 因为大图预览在小程序里是系统能力（自带手势与长按保存），自绘一份反而更差；
 * 只有 H5 端才动态挂载 cd-image-preview。
 *
 * 主题作用域由宿主自己负责（use-wot-scope），调用方不需要关心。
 */

import { toastList, modalState, loadingState, hostReady, forceFallback, nextUid, TOAST_MAX, TOAST_DURATION } from './state'

/* ------------------------------------------------------------------
 * 内部：定时器与去重
 * ------------------------------------------------------------------ */

const timers = new Map()

function clearTimer(id) {
  const t = timers.get(id)
  if (t) {
    clearTimeout(t)
    timers.delete(id)
  }
}

/* ------------------------------------------------------------------
 * 内部：H5 宿主自动挂载
 * ------------------------------------------------------------------ */

/* #ifdef H5 */
import { createApp, h } from 'vue'
/**
 * 宿主组件用**静态导入**，不能用 import() 懒加载。
 *
 * 2026-10-04 实测（npm 形态装到独立工程后构建 H5）：
 * 包内对 `../components/...` 的动态 import，会被 Vite 以「模块相对项目根的路径」
 * 生成 chunk 名，包在 node_modules 下时该路径是 `../node_modules/codedog-ui/...`，
 * 斜杠被替换后得到 `..-node_modules-codedog-ui-components-cd-toast-host-cd-toast-host.js`，
 * 产物里的引用就变成 `import("..-node_modules-...js")` —— 这个 specifier 既不是
 * 合法相对路径（不以 ./ ../ / 开头）也不是合法裸包名，浏览器直接
 * `Failed to resolve module specifier`，并且该 chunk 会被写进所在页面的
 * 依赖预载表，导致**整个页面**加载失败（表现为 uni 的「连接服务器超时，点击屏幕重试」）。
 *
 * 代价：宿主组件会随包入口进入业务产物。二者体量有限（cd-toast-host 约 340 行），
 * 且凡是调用 toast / confirm 的业务都用得到它，权衡后取「一定能跑」。
 */
import CdToastHost from '../components/cd-toast-host/cd-toast-host.vue'

let mounted = false

function ensureHost() {
  if (hostReady.value || mounted) return
  try {
    const el = document.createElement('div')
    el.setAttribute('data-cd-feedback-host', '')
    document.body.appendChild(el)
    createApp(CdToastHost).mount(el)
    mounted = true
  } catch (err) {
    // 挂载失败不能静默：降级到原生，让调用方至少拿到可用的反馈
    console.warn('[codedog-ui] 反馈宿主挂载失败，已降级到原生 API：', err)
    forceFallback.value = true
  }
}
/* #endif */

/* #ifndef H5 */
function ensureHost() {
  /* 小程序端由页面里的 cd-toast-host 自己上报 hostReady，这里无事可做 */
}
/* #endif */

/** 是否走原生降级通道 */
function useNative() {
  /* #ifdef H5 */
  return forceFallback.value && !hostReady.value
  /* #endif */
  /* #ifndef H5 */
  return !hostReady.value
  /* #endif */
}

/* ------------------------------------------------------------------
 * toast
 * ------------------------------------------------------------------ */

const TOAST_ICONS = {
  success: 'check-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'info',
  loading: 'loader',
}

function normalizeToast(options) {
  const o = typeof options === 'string' ? { message: options } : { ...(options || {}) }
  const type = TOAST_ICONS[o.type] ? o.type : 'info'
  return {
    id: nextUid(),
    type,
    message: String(o.message ?? o.title ?? o.content ?? ''),
    duration: Number.isFinite(o.duration) ? o.duration : TOAST_DURATION,
    /** auto：PC 顶部（不挡内容）/ 移动端中部（贴近 uni 习惯） */
    position: ['top', 'middle', 'bottom'].includes(o.position) ? o.position : 'auto',
    showIcon: o.showIcon !== false,
  }
}

/** PC 与移动的默认位置不同：这是本框架「双形态」理念在反馈层最直接的体现 */
function resolvePosition(position) {
  if (position !== 'auto') return position
  /* #ifdef H5 */
  return typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'top' : 'middle'
  /* #endif */
  /* #ifndef H5 */
  return 'middle'
  /* #endif */
}

/**
 * 给一条 toast 起关闭定时器。
 *
 * H5 端宿主是动态 import 的，弱网下它落地的时间可能比 duration 还长。
 * 如果定时器在 push 那一刻就起，会出现「toast 已经被清掉了宿主才挂载，
 * 用户全程什么都没看到」。所以定时器必须等宿主就绪之后再启动。
 */
function armTimer(item) {
  if (item.duration <= 0) return
  const start = () => {
    /* 期间可能已经被 dismissToast 移除了 */
    if (!toastList.value.some((t) => t.id === item.id)) return
    clearTimer(item.id)
    timers.set(
      item.id,
      setTimeout(() => dismissToast(item.id), item.duration),
    )
  }

  /* #ifdef H5 */
  Promise.resolve(ensureHost()).then(start)
  /* #endif */
  /* #ifndef H5 */
  start()
  /* #endif */
}

function pushToast(opts) {
  const item = { ...opts, position: resolvePosition(opts.position) }

  /*
   * 同文案去重：连点「保存」不该堆出三条一样的「保存成功」，重置计时即可。
   * 去重键必须带上 position —— 否则「顶部提示」与「底部提示」文案相同时
   * 会被判成同一条，第二条根本不会出现。
   */
  const existing = toastList.value.find(
    (t) => t.message === item.message && t.type === item.type && t.position === item.position,
  )

  if (existing) {
    clearTimer(existing.id)
    /*
     * 常驻优先：已经在显示的常驻 toast（duration=0）不该被一次「默认时长」
     * 的重复调用改成 2 秒后消失 —— 常驻通常意味着「这个操作还在进行中」。
     */
    existing.duration = existing.duration === 0 ? 0 : item.duration
    armTimer(existing)
    return
  }

  const next = [...toastList.value, item]
  /* 超限丢最旧 */
  toastList.value = next.length > TOAST_MAX ? next.slice(next.length - TOAST_MAX) : next

  armTimer(item)
}

/** 关闭指定 toast；不传 id 关闭全部 */
export function dismissToast(id) {
  if (id === undefined) {
    toastList.value.forEach((t) => clearTimer(t.id))
    timers.clear()
    toastList.value = []
    return
  }
  clearTimer(id)
  toastList.value = toastList.value.filter((t) => t.id !== id)
}

function showToast(options) {
  const opts = normalizeToast(options)
  if (useNative()) {
    /* 原生通道：warning/info 用 icon:none（原生 success/error 图标与品牌色不可控） */
    const iconMap = { success: 'success', error: 'error' }
    uni.showToast({
      title: opts.message,
      icon: iconMap[opts.type] || 'none',
      duration: opts.duration > 0 ? opts.duration : 2000,
    })
    return
  }
  ensureHost()
  pushToast(opts)
}

/*
 * 基础调用必须和 toast.success 一样支持第二参。
 * 原来写成 `(options) => showToast(options)`，于是
 * `toast('保存成功', { duration: 0 })` 的第二个参数被静默丢弃，
 * 同一族 API 两套签名，是最容易踩的那种不一致。
 */
const toast = Object.assign(
  (message, options) =>
    showToast({ ...(typeof message === 'string' ? { message } : message), ...(options || {}) }),
  {
    success: (m, o) => showToast({ ...(typeof m === 'string' ? { message: m } : m), type: 'success', ...(o || {}) }),
    error: (m, o) => showToast({ ...(typeof m === 'string' ? { message: m } : m), type: 'error', ...(o || {}) }),
    warning: (m, o) => showToast({ ...(typeof m === 'string' ? { message: m } : m), type: 'warning', ...(o || {}) }),
    info: (m, o) => showToast({ ...(typeof m === 'string' ? { message: m } : m), type: 'info', ...(o || {}) }),
    /** 关闭当前 toast（不传 id 全关） */
    hide: (id) => dismissToast(id),
  },
)

/* ------------------------------------------------------------------
 * confirm / alert
 * ------------------------------------------------------------------ */

function normalizeModal(options, defaults) {
  const o = typeof options === 'string' ? { content: options } : { ...(options || {}) }
  return {
    type: ['warning', 'error', 'info', 'success'].includes(o.type) ? o.type : defaults.type,
    title: o.title ?? defaults.title,
    content: String(o.content ?? o.message ?? ''),
    confirmText: o.confirmText || '确定',
    cancelText: o.cancelText || '取消',
    showCancel: o.showCancel ?? defaults.showCancel,
    maskClosable: o.maskClosable ?? defaults.maskClosable,
    confirmLoading: o.confirmLoading ?? false,
  }
}

/**
 * 确认框，resolve(true)=确认 / resolve(false)=取消或关闭。
 * 先到的模态若还没被处理，按取消结算 —— 悬挂的 Promise 比被顶掉更糟。
 */
export function confirm(options) {
  const opts = normalizeModal(options, { type: 'warning', title: '', showCancel: true, maskClosable: true })

  let settle
  const promise = new Promise((resolve) => {
    let settled = false
    settle = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }
  })

  /* 先到的模态若还没被处理，按取消结算 —— 悬挂的 Promise 比被顶掉更糟 */
  if (modalState.value && modalState.value.settle) {
    modalState.value.settle(false)
  }

  /*
   * H5 端宿主是动态 import 出来的，第一次调用时它还没落地。
   * 所以「走哪条通道」这件事必须等宿主落地之后再判定，不能提前决定：
   *
   *   提前判定的后果（实测）——import 失败时（弱网、或发版后旧页面引用了已失效的
   *   chunk hash），modalState 已经被写进 host 通道，却永远不会有人来结算它，
   *   这个 Promise 就永久悬挂：用户点了确认，后面的删除请求永远不发。
   *
   * ensureHost() 内部已 catch：失败时会把 forceFallback 置 true，
   * 因此 await 之后重新判定 useNative()，就会正确地落到原生 uni.showModal。
   */
  const openModal = async () => {
    /* #ifdef H5 */
    await ensureHost()
    /* #endif */

    if (useNative()) {
      uni.showModal({
        title: opts.title || undefined,
        content: opts.content,
        showCancel: opts.showCancel,
        confirmText: opts.confirmText,
        cancelText: opts.cancelText,
        success: (res) => settle(!!res.confirm),
        fail: () => settle(false),
      })
      return
    }

    ensureHost()
    modalState.value = { id: nextUid(), ...opts, settle }
  }

  openModal()

  return promise
}

/**
 * 宿主组件回传结算结果：确认 true / 取消与关闭 false。
 * 结算后立刻清空状态，让 cd-dialog 卸载。
 */
export function settleModal(value) {
  if (modalState.value && modalState.value.settle) {
    modalState.value.settle(value)
  }
  modalState.value = null
}

/** 警告框：只有确认按钮，resolve 表示「用户已知悉」 */
export function alert(options) {
  const opts = normalizeModal(options, { type: 'warning', title: '', showCancel: false, maskClosable: false })
  return confirm({ ...opts, showCancel: false, maskClosable: false }).then(() => undefined)
}

/* ------------------------------------------------------------------
 * loading
 * ------------------------------------------------------------------ */

/**
 * 本次 loading 实际走的通道。
 *
 * 关闭动作必须按「显示时那一条」通道来，不能重新判定一次 useNative()。
 * 反例（小程序端很容易撞上）：loading() 时宿主还没挂载 → hostReady 为 false，
 * 于是走原生 uni.showLoading；等用户操作完，宿主早已挂载 → hostReady 为 true，
 * 此时 hideLoading() 重新判定得到「走 host 通道」，只去清 loadingState，
 * 原生那层遮罩就永远关不掉了。
 */
/*
 * 用「两条通道各自的开关」而不是单个变量。
 *
 * 单变量会在这种序列下漏关（小程序端很容易撞上）：
 *   ① 页面初始化时 loading() —— 宿主还没挂载，走 uni.showLoading（原生）；
 *   ② 宿主挂载后再 loading() —— 走 host 通道，单变量被覆盖成 'host'；
 *   ③ close() —— 只清 host，原生那层遮罩再也没人关，页面被永久锁死。
 *
 * 所以两条通道各记一个开关，关闭时把「开着的」全部关掉。
 */
const loadingChannels = { native: false, host: false }

/**
 * 全局 loading。重复调用只更新文案（同一个全局单例，不做队列）。
 * 返回 { close }；也可以直接调 loading.hide()。
 */
export function loading(options) {
  const o = typeof options === 'string' ? { message: options } : { ...(options || {}) }
  const message = String(o.message ?? '')
  const mask = o.mask !== false

  const native = useNative()
  if (native) {
    uni.showLoading({ title: message, mask })
    loadingChannels.native = true
  } else {
    ensureHost()
    loadingState.value = { id: nextUid(), message, mask }
    loadingChannels.host = true
  }

  return { close: hideLoading }
}

export function hideLoading() {
  /* 把开着的通道全部关掉，而不是只关「最后一次」那一条 */
  if (loadingChannels.native) {
    uni.hideLoading()
    loadingChannels.native = false
  }
  loadingState.value = null
  loadingChannels.host = false
}

Object.assign(loading, { hide: hideLoading })

/* ------------------------------------------------------------------
 * previewImage —— 命令式图片预览
 * ------------------------------------------------------------------ */

/* #ifdef H5 */
let previewComp = null
let previewLoading = null
let previewApp = null
let previewEl = null

/** 组件本体按需加载：没用过预览的业务不会把它打进首屏 */
function loadPreviewComp() {
  if (previewComp) return Promise.resolve(previewComp)
  if (!previewLoading) {
    previewLoading = import('../components/cd-image-preview/cd-image-preview.vue').then((mod) => {
      previewComp = mod.default || mod
      return previewComp
    })
  }
  return previewLoading
}

function closePreviewHost() {
  if (previewApp) {
    previewApp.unmount()
    previewApp = null
  }
  if (previewEl && previewEl.parentNode) {
    previewEl.parentNode.removeChild(previewEl)
  }
  previewEl = null
}

function openPreviewHost(opts) {
  /* 同一时刻只允许一个预览：新的顶掉旧的，而不是叠两层黑遮罩 */
  closePreviewHost()
  const zIndex = Number(opts.zIndex)

  loadPreviewComp()
    .then((Comp) => {
      const el = document.createElement('div')
      el.setAttribute('data-cd-preview-host', '')
      document.body.appendChild(el)
      previewEl = el

      /**
       * 用渲染函数包一层，才能把 onClose / onChange 这类回调挂上去
       * （props 只能传声明过的字段，回调必须走事件或这里的 vnode props）。
       * 独立 app 拿不到业务的 cd-config-provider，主题变量走组件内的兜底值 ——
       * 预览层是纯黑底 + 白字，天然与主题无关，这里不需要补作用域。
       */
      const Host = {
        render() {
          return h(Comp, {
            modelValue: true,
            urls: opts.urls,
            current: opts.current,
            loop: opts.loop !== false,
            showIndex: opts.showIndex !== false,
            closeOnClickMask: opts.closeOnClickMask !== false,
            zoomable: opts.zoomable !== false,
            maxZoom: Number(opts.maxZoom) > 1 ? Number(opts.maxZoom) : 3,
            zIndex: Number.isFinite(zIndex) && zIndex > 0 ? zIndex : 3000,
            onChange: typeof opts.onChange === 'function' ? opts.onChange : undefined,
            'onUpdate:modelValue': (value) => {
              if (!value) closePreviewHost()
            },
          })
        },
      }

      previewApp = createApp(Host)
      previewApp.mount(el)
    })
    .catch((err) => {
      console.warn('[codedog-ui] 图片预览宿主挂载失败，已降级到原生 API：', err)
      uni.previewImage({ urls: opts.urls, current: opts.current })
    })
}
/* #endif */

/**
 * 命令式打开图片预览。
 *
 * 两端的策略与 toast 刻意不同：预览是「独占全屏」的浮层，小程序端没有 body 可挂宿主，
 * 与其要求业务在每个页面塞一个宿主节点，不如直接降级到平台原生的 uni.previewImage ——
 * 小程序的大图预览本来就是系统能力（自带手势、长按保存），自绘一份反而是体验降级。
 * H5 端没有原生可用，才动态挂载自绘组件，拿到统一视觉与 change 回调。
 *
 * @param {Object|string} options 图集数组，或 { urls, current, loop, showIndex,
 *   closeOnClickMask, zoomable, maxZoom, zIndex, onChange }
 * @example
 *   previewImage(photoList)
 *   previewImage({ urls: photoList, current: 2, onChange: (i) => console.log(i) })
 */
export function previewImage(options) {
  const o = typeof options === 'string' ? { urls: [options] } : { ...(options || {}) }
  const raw = Array.isArray(o.urls) ? o.urls : o.urls ? [o.urls] : []
  const urls = raw
    .map((item) => (typeof item === 'string' ? item : String((item && item.url) || '')))
    .filter(Boolean)
  if (!urls.length) return

  let current = o.current === undefined ? urls[0] : o.current
  if (typeof current === 'number') {
    const i = Math.min(urls.length - 1, Math.max(0, Math.trunc(current)))
    current = urls[i]
  }
  current = String(current || urls[0])

  /* #ifdef H5 */
  if (typeof document !== 'undefined' && !forceFallback.value) {
    openPreviewHost({ ...o, urls, current })
    return
  }
  /* #endif */
  uni.previewImage({ urls, current })
}

/* ------------------------------------------------------------------
 * 导出
 * ------------------------------------------------------------------ */

export { toast }

export default {
  toast,
  confirm,
  alert,
  loading,
  hideLoading,
  dismissToast,
  previewImage,
}
