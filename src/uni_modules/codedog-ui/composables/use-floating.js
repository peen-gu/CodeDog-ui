/**
 * CodeDogUI / useFloating —— 浮层定位内核
 * ---------------------------------------------------------------
 * tooltip / popover / dropdown 三个组件共用的定位逻辑。
 *
 * 为什么不用 wd-popup：wd-popup 带遮罩、滚动锁和 root-portal 传送，
 * 这些对「弹窗」是对的，对「气泡」全是负担 ——
 *   气泡不挡操作、不锁滚动、不能被传送走（传送出去就丢了主题作用域，
 *   还要处理传送后的测量）。所以气泡类浮层直接用 position:fixed 渲染
 *   在组件内部，轻、快、主题天然继承。
 *
 * 定位必须是两段式：
 *   浮层自身的尺寸只有渲染出来才知道，而 left/top 又必须在渲染前算好。
 *   所以先渲染（visibility:hidden 占位）→ 测量触发物与浮层 → 再定位显形。
 *
 * 已知限制：定位基于 position:fixed，如果触发物的祖先带 transform
 * （例如放在正在做动画的弹层里），fixed 的参照物会变成那个祖先，
 * 位置会偏。这是 CSS 规则而非实现缺陷，文档里要写清楚。
 */

import { ref, computed, nextTick, getCurrentInstance, onUnmounted } from 'vue'

export const FLOAT_PLACEMENTS = [
  'top',
  'top-start',
  'top-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'left',
  'left-start',
  'left-end',
  'right',
  'right-start',
  'right-end',
]

/** 视口安全边距：浮层贴边太近会显得要掉出去 */
const VIEWPORT_GAP = 8

let uidSeed = 0

export function useFloating(options) {
  const opts = {
    /** 触发物的选择器（组件内部节点） */
    triggerSelector: '.cd-floating__trigger',
    /** 浮层面板的选择器（组件内部节点） */
    panelSelector: '.cd-floating__panel',
    /** 浮层与触发物的间距 */
    gap: 8,
    /** 箭头尺寸（正方形旋转前的一半边长），0 表示无箭头 */
    arrowSize: 6,
    ...options,
  }

  const instance = getCurrentInstance()
  uidSeed += 1
  const uid = `cd-flt-${uidSeed}`

  const open = ref(false)
  /** 两段式定位的第一拍：面板已渲染但还没算出位置 */
  const measuring = ref(false)
  /** 测量失败时降级为「跟在触发物下方居中」的估算定位 */
  const degraded = ref(false)

  const panelX = ref(0)
  const panelY = ref(0)
  const arrowOffset = ref(null)

  /**
   * 读取节点矩形。H5 直接用 getBoundingClientRect（视图相对坐标，
   * 与 fixed 定位同参照系）；小程序走 createSelectorQuery。
   */
  function measureRect(selector, usePageScope) {
    return new Promise((resolve) => {
      /* #ifdef H5 */
      try {
        const root = instance?.proxy?.$el
        const el = usePageScope ? document.querySelector(selector) : root && root.querySelector(selector)
        if (el && el.getBoundingClientRect) {
          const r = el.getBoundingClientRect()
          resolve({
            left: r.left,
            top: r.top,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          })
          return
        }
      } catch (e) {
        /* 落到小程序通道 */
      }
      /* #endif */

      const query = usePageScope ? uni.createSelectorQuery() : uni.createSelectorQuery().in(instance)
      query
        .select(selector)
        .boundingClientRect((rect) => resolve(rect || null))
        .exec()
    })
  }

  function computePosition(placement, trigger, panel) {
    const gap = opts.gap
    const pw = panel ? panel.width : 200
    const ph = panel ? panel.height : 40
    const cx = trigger.left + trigger.width / 2
    const cy = trigger.top + trigger.height / 2
    const vw = typeof window !== 'undefined' ? window.innerWidth : 750
    const vh = typeof window !== 'undefined' ? window.innerHeight : 600

    const [base, align] = placement.split('-')
    let x = 0
    let y = 0
    let arrow = null
    let finalPlacement = placement

    /* 空间不足时反向翻转 —— 气泡体验的基本盘 */
    const roomAbove = trigger.top
    const roomBelow = vh - trigger.bottom
    const roomLeft = trigger.left
    const roomRight = vw - trigger.right

    if (base === 'top' && roomAbove < ph + gap && roomBelow > roomAbove) finalPlacement = 'bottom'
    if (base === 'bottom' && roomBelow < ph + gap && roomAbove > roomBelow) finalPlacement = 'top'
    if (base === 'left' && roomLeft < pw + gap && roomRight > roomLeft) finalPlacement = 'right'
    if (base === 'right' && roomRight < pw + gap && roomAbove > roomRight && roomLeft > roomRight) finalPlacement = 'left'

    const [fBase, fAlign] = finalPlacement.split('-')

    if (fBase === 'top' || fBase === 'bottom') {
      y = fBase === 'top' ? trigger.top - gap - ph : trigger.bottom + gap
      x = fAlign === 'start' ? trigger.left : fAlign === 'end' ? trigger.right - pw : cx - pw / 2
      if (opts.arrowSize > 0) {
        const raw = cx - x - opts.arrowSize
        arrow = Math.max(opts.arrowSize + 4, Math.min(raw, pw - opts.arrowSize * 3 - 4))
      }
    } else {
      x = fBase === 'left' ? trigger.left - gap - pw : trigger.right + gap
      y = fAlign === 'start' ? trigger.top : fAlign === 'end' ? trigger.bottom - ph : cy - ph / 2
      if (opts.arrowSize > 0) {
        const raw = cy - y - opts.arrowSize
        arrow = Math.max(opts.arrowSize + 4, Math.min(raw, ph - opts.arrowSize * 3 - 4))
      }
    }

    /* 视口钳制：宁可稍微错位，也不能让浮层掉出屏幕外 */
    if (x < VIEWPORT_GAP) x = VIEWPORT_GAP
    if (y < VIEWPORT_GAP) y = VIEWPORT_GAP
    if (x + pw > vw - VIEWPORT_GAP) x = vw - VIEWPORT_GAP - pw
    if (y + ph > vh - VIEWPORT_GAP) y = vh - VIEWPORT_GAP - ph

    return { x, y, arrow, placement: finalPlacement }
  }

  async function place(silent = false) {
    /* 静默重定位（滚动 / resize 跟随）不闪隐面板：它本来就渲染着、
       尺寸没变，只需要重新量一次触发物坐标。 */
    if (!silent) measuring.value = true
    open.value = true

    await nextTick()
    await new Promise((r) => setTimeout(r, 30))

    const [trigger, panel] = await Promise.all([
      measureRect(opts.triggerSelector, false),
      measureRect(`.${uid}`, true),
    ])

    if (!trigger) {
      /* 拿不到触发物位置时退化为屏幕中下方 —— 比「完全不显示」友好 */
      panelX.value = 0
      panelY.value = 0
      degraded.value = true
      measuring.value = false
      return
    }

    const pos = computePosition(opts.placement.value, trigger, panel)
    panelX.value = pos.x
    panelY.value = pos.y
    arrowOffset.value = pos.arrow
    measuring.value = false
  }

  function show() {
    if (open.value) return
    place()
    bindFollow()
  }

  function hide() {
    open.value = false
    measuring.value = false
    unbindFollow()
  }

  function toggle() {
    if (open.value) hide()
    else show()
  }

  /* ----------------------------------------------------------------
   * 视口变化跟随：滚动 / 改变窗口尺寸后，测量出的坐标就作废了。
   * 气泡的正确行为是「跟着触发物走」，而不是消失 ——
   * 用 rAF 节流的静默重定位实现跟随，指针停在长列表上滚动时也不闪烁。
   * 面板内部滚动（如长菜单）不触发跟随：那是用户在读内容。
   * ---------------------------------------------------------------- */

  let rafId = null

  function onViewportChange(event) {
    /* #ifdef H5 */
    if (typeof document === 'undefined' || !open.value) return
    if (event && event.type === 'scroll') {
      const panelEl = document.querySelector(`.${uid}`)
      if (panelEl && panelEl.contains(event.target)) return
    }
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      if (open.value) place(true)
    })
    /* #endif */
  }

  let followBound = false

  function bindFollow() {
    /* #ifdef H5 */
    if (followBound || typeof window === 'undefined') return
    followBound = true
    document.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    /* #endif */
  }

  function unbindFollow() {
    /* #ifdef H5 */
    if (!followBound || typeof window === 'undefined') return
    followBound = false
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    document.removeEventListener('scroll', onViewportChange, true)
    window.removeEventListener('resize', onViewportChange)
    /* #endif */
  }

  onUnmounted(() => {
    open.value = false
    unbindFollow()
  })

  /** 面板内联样式：两段式期间只占位不显形 */
  const panelStyle = computed(() => {
    const parts = [`z-index:var(--cd-z-dropdown, 1500);`]
    if (degraded.value) {
      parts.push('left:50%;top:60%;transform:translate(-50%, 0);')
    } else {
      parts.push(`left:${panelX.value}px;`)
      parts.push(`top:${panelY.value}px;`)
    }
    if (measuring.value) {
      parts.push('visibility:hidden;pointer-events:none;')
    }
    if (opts.customStyle) parts.push(opts.customStyle)
    return parts.join('')
  })

  /**
   * 箭头样式。箭头是一个旋转 45 度的正方形，半个露在面板外。
   * 用变量而非四套规则：一边定位 + 一边颜色，旋转交给 transform。
   */
  const arrowStyle = computed(() => {
    if (opts.arrowSize <= 0 || arrowOffset.value === null || measuring.value) return ''
    const s = opts.arrowSize * 2
    const placement = opts.placement.value
    const base = placement.split('-')[0]
    const half = opts.arrowSize + 1
    const parts = [`width:${s}px;`, `height:${s}px;`]

    if (base === 'top') {
      parts.push(`left:${arrowOffset.value}px;`, `bottom:${-half + 1}px;`)
    } else if (base === 'bottom') {
      parts.push(`left:${arrowOffset.value}px;`, `top:${-half + 1}px;`)
    } else if (base === 'left') {
      parts.push(`top:${arrowOffset.value}px;`, `right:${-half + 1}px;`)
    } else {
      parts.push(`top:${arrowOffset.value}px;`, `left:${-half + 1}px;`)
    }
    return parts.join('')
  })

  return {
    uid,
    open,
    measuring,
    degraded,
    show,
    hide,
    toggle,
    panelStyle,
    arrowStyle,
  }
}

export default useFloating
