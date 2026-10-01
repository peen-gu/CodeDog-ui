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
 */

import { onUnmounted, ref, watch } from 'vue'

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
