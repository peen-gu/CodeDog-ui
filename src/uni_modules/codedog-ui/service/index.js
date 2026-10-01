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
import { createApp } from 'vue'

let mountPromise = null

function ensureHost() {
  if (hostReady.value) return
  if (!mountPromise) {
    mountPromise = import('../components/cd-toast-host/cd-toast-host.vue')
      .then((mod) => {
        const el = document.createElement('div')
        el.setAttribute('data-cd-feedback-host', '')
        document.body.appendChild(el)
        createApp(mod.default).mount(el)
      })
      .catch((err) => {
        // 挂载失败不能再静默：降级到原生，让调用方至少拿到可用的反馈
        console.warn('[codedog-ui] 反馈宿主挂载失败，已降级到原生 API：', err)
        forceFallback.value = true
      })
  }
  return mountPromise
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

function pushToast(opts) {
  const existing = toastList.value.find((t) => t.message === opts.message && t.type === opts.type)
  if (existing) {
    /* 同文案去重：连点「保存」不该堆出三条一样的「保存成功」，重置计时即可 */
    clearTimer(existing.id)
    if (opts.duration > 0) {
      timers.set(existing.id, setTimeout(() => dismissToast(existing.id), opts.duration))
    }
    return
  }

  const item = { ...opts, position: resolvePosition(opts.position) }
  const next = [...toastList.value, item]
  /* 超限丢最旧 */
  toastList.value = next.length > TOAST_MAX ? next.slice(next.length - TOAST_MAX) : next

  if (item.duration > 0) {
    timers.set(item.id, setTimeout(() => dismissToast(item.id), item.duration))
  }
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

const toast = Object.assign((options) => showToast(options), {
  success: (m, o) => showToast({ ...(typeof m === 'string' ? { message: m } : m), type: 'success', ...(o || {}) }),
  error: (m, o) => showToast({ ...(typeof m === 'string' ? { message: m } : m), type: 'error', ...(o || {}) }),
  warning: (m, o) => showToast({ ...(typeof m === 'string' ? { message: m } : m), type: 'warning', ...(o || {}) }),
  info: (m, o) => showToast({ ...(typeof m === 'string' ? { message: m } : m), type: 'info', ...(o || {}) }),
  /** 关闭当前 toast（不传 id 全关） */
  hide: (id) => dismissToast(id),
})

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

  return new Promise((resolve) => {
    let settled = false
    const settle = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    if (modalState.value && modalState.value.settle) {
      modalState.value.settle(false)
    }

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
    modalState.value = {
      id: nextUid(),
      ...opts,
      settle,
    }
  })
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
 * 全局 loading。重复调用只更新文案（同一个全局单例，不做队列）。
 * 返回 { close }；也可以直接调 loading.hide()。
 */
export function loading(options) {
  const o = typeof options === 'string' ? { message: options } : { ...(options || {}) }
  const message = String(o.message ?? '')
  const mask = o.mask !== false

  if (useNative()) {
    uni.showLoading({ title: message, mask })
  } else {
    ensureHost()
    loadingState.value = { id: nextUid(), message, mask }
  }

  return { close: hideLoading }
}

export function hideLoading() {
  if (useNative()) {
    uni.hideLoading()
  }
  loadingState.value = null
}

Object.assign(loading, { hide: hideLoading })

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
}
