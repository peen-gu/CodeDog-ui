/**
 * CodeDogUI / usePageScroll —— 页面滚动信号
 * ---------------------------------------------------------------
 * cd-backtop 与 cd-affix 都需要知道「页面滚到哪了」，但这件事在两端的能力不同：
 *
 *   H5：可以直接监听 window 的 scroll，组件自给自足；
 *   小程序：页面滚动只会在 Page 的 onPageScroll 里回调，
 *          **组件拿不到**（这不是实现偷懒，是运行时没有这个口子）。
 *
 * 所以统一约定成：
 *   1. 父级把 scrollTop 通过属性传进来（小程序必走这条）；
 *   2. 没传（null）时，H5 自动监听 window；小程序则保持 0 不动。
 *
 * 把这段差异收在一个地方，是为了让两个组件里都不出现条件编译分支 ——
 * 条件编译写散在各处是最容易「改了一处忘了另一处」的形态。
 *
 * 顺带把 rAF 节流也做在这里：滚动事件一秒能来上百次，
 * 用 requestAnimationFrame 合并到「每帧最多一次」，
 * 既够跟手，又不会让测量把主线程占满。
 *
 * ⚠️ 静默失效警告（非 H5 端）
 * 小程序端既没有 window.scroll，也没有任何替代口子，
 * 于是不传 scroll-top 时 scrollTop 恒为 0 —— cd-backtop 永不出现、
 * cd-affix 永不固定，而且**不报任何错**。
 * 这不是实现缺陷，是运行时能力缺失，所以这里在开发态打一条告警，
 * 并把透传模板写在下面，方便直接复制。
 *
 * 页面侧透传模板（微信小程序 / 其它小程序端必写）：
 *   ```js
 *   // pages/xxx/xxx.vue
 *   import { ref } from 'vue'
 *   const pageScrollTop = ref(0)
 *   // 与 onLoad 同级：页面滚动只在这里回调，组件自己拿不到
 *   onPageScroll((e) => { pageScrollTop.value = e.scrollTop })
 *   ```
 *   ```html
 *   <cd-backtop :scroll-top="pageScrollTop" />
 *   <cd-affix :scroll-top="pageScrollTop">…</cd-affix>
 *   ```
 * 传了非负数值即视为「父级已接管」，H5 上会自动摘掉 window 监听，两端都不重复。
 */

import { onUnmounted, ref, watch } from 'vue'

/** 非 H5 端的静默失效告警只打一次，避免每个用到它的组件都刷一条 */
let warnedUnavailable = false

export function usePageScroll(options = {}) {
  const opts = {
    /** 父级传入的 scrollTop（ComputedRef 或 getter）。null / 负数表示「没传」 */
    propScrollTop: null,
    ...options,
  }

  const scrollTop = ref(0)
  let rafId = null
  let bound = false

  /** 父级是否接管了滚动信号 */
  const isControlled = () => {
    if (!opts.propScrollTop) return false
    const value = typeof opts.propScrollTop === 'function' ? opts.propScrollTop() : opts.propScrollTop.value
    return typeof value === 'number' && value >= 0
  }

  function schedule() {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      /* #ifdef H5 */
      if (typeof window !== 'undefined') {
        scrollTop.value = window.scrollY || document.documentElement.scrollTop || 0
      }
      /* #endif */
    })
  }

  function bind() {
    /* #ifdef H5 */
    if (bound || isControlled() || typeof window === 'undefined') return
    bound = true
    window.addEventListener('scroll', schedule, { passive: true })
    schedule()
    /* #endif */
    /* #ifndef H5 */
    /*
     * 走到这里说明「父级没有传 scrollTop」，而这一端又没有 window 可听：
     * scrollTop 会永远停在 0，cd-backtop 永不显示、cd-affix 永不固定，
     * 界面看起来只是「功能没生效」，没有任何报错 —— 这是最难查的一类问题。
     * 与其假装两端一致，不如在开发态明确喊一声。
     */
    if (!warnedUnavailable && process.env.NODE_ENV !== 'production') {
      warnedUnavailable = true
      console.warn(
        '[CodeDogUI] 当前端没有页面滚动事件，usePageScroll 拿不到 scrollTop（恒为 0）。' +
          '小程序端请在页面 onPageScroll 里把 scrollTop 透传给组件，详见本文件头部注释。'
      )
    }
    /* #endif */
  }

  function unbind() {
    /* #ifdef H5 */
    if (!bound || typeof window === 'undefined') return
    bound = false
    window.removeEventListener('scroll', schedule)
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    /* #endif */
  }

  if (opts.propScrollTop) {
    watch(
      () => (typeof opts.propScrollTop === 'function' ? opts.propScrollTop() : opts.propScrollTop.value),
      (value) => {
        if (typeof value === 'number' && value >= 0) {
          scrollTop.value = value
          unbind()
        } else {
          bind()
        }
      },
      { immediate: true }
    )
  } else {
    bind()
  }

  onUnmounted(unbind)

  return {
    scrollTop,
    isControlled,
    destroy: unbind,
  }
}

export default usePageScroll
