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
import { raf, cancelRaf } from '../utils/raf'

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

/** MP 端跟随复测的最小间隔（ms）—— 见 bindFollow 里的 MP 分支说明 */
const MP_FOLLOW_INTERVAL = 120

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

    /* 横向翻转只看横向余量：纵向余量（roomAbove）与「能不能往左放」毫无关系，
       拿它来当条件会让右侧没空间、左侧很空的情况永远不翻转，
       浮层被钳制回去压在触发物上。 */
    if (base === 'top' && roomAbove < ph + gap && roomBelow > roomAbove) finalPlacement = 'bottom'
    if (base === 'bottom' && roomBelow < ph + gap && roomAbove > roomBelow) finalPlacement = 'top'
    if (base === 'left' && roomLeft < pw + gap && roomRight > roomLeft) finalPlacement = 'right'
    if (base === 'right' && roomRight < pw + gap && roomLeft >= pw + gap) finalPlacement = 'left'

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

    /* 面板比可用区还高时，上面两步会互相打架：
       先把 y 抬到 8，再因为「y+ph 超出底部」把它推到 vh-8-ph —— 一个负数，
       结果是顶部被顶出屏幕、且再怎么滚也滚不回来。
       这种尺寸下「贴底对齐」已经没有意义，统一钉在顶部，
       并由 overflowing 通知面板自己限高、内部滚动。 */
    const overflowing = ph > vh - VIEWPORT_GAP * 2
    if (overflowing) y = VIEWPORT_GAP

    return { x, y, arrow, placement: finalPlacement, overflowing }
  }

  /**
   * 定位序号：每次 place() 领一个号，只有「最后一次」的结果会被采纳。
   * show() 之后要等 nextTick + 30ms 才量得到面板，连开连关时会同时有
   * 好几个 place() 在飞；谁最后完成谁就写进 panelX/panelY ——
   * 而最后完成的往往是那个更早期的定位，于是气泡闪回旧位置。
   * hide() / 卸载时把号推进一步，在飞的全部作废。
   */
  let placeToken = 0
  /** 面板比视口还高，需要自己限高滚动 */
  const overflowing = ref(false)

  async function place(silent = false) {
    /* 静默重定位（滚动 / resize / 内容变化跟随）不闪隐面板：它本来就渲染着、
       尺寸没变，只需要重新量一次触发物坐标。 */
    const token = (placeToken += 1)
    if (!silent) measuring.value = true
    open.value = true

    await nextTick()
    await new Promise((r) => setTimeout(r, 30))
    if (token !== placeToken) return

    /* 面板也在组件内部，必须用组件作用域测量（usePageScope = false）。
       走页面作用域的话：小程序的 createSelectorQuery() 查不到组件内的节点，
       panel 恒为 null，于是每次都用 pw=200 / ph=40 的估算值定位，气泡位置必偏。 */
    const [trigger, panel] = await Promise.all([
      measureRect(opts.triggerSelector, false),
      measureRect(`.${uid}`, false),
    ])

    /* 异步测量回来时可能已经被 hide() 或新的一次 place() 作废了 */
    if (token !== placeToken) return

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
    overflowing.value = !!pos.overflowing
    /* 定位成功必须把降级标志复位。
       它只在失败分支置过 true、hide() 也不清它 —— 于是「有一次没量到触发物」
       （比如首次打开时节点还没挂上）会让之后每一次都走屏幕中下方的降级位置。 */
    degraded.value = false
    measuring.value = false
    observePanelSize()
  }

  function show() {
    if (open.value) return
    place()
    bindFollow()
  }

  function hide() {
    /* 作废所有在飞的定位：它们完成后会把面板位置又写回去 */
    placeToken += 1
    open.value = false
    measuring.value = false
    overflowing.value = false
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
  let mpRafId = null

  function onViewportChange(event) {
    if (!open.value) return
    if (event && event.type === 'scroll' && typeof document !== 'undefined') {
      const panelEl = document.querySelector(`.${uid}`)
      /* 面板内部滚动（长菜单在读内容）不触发跟随 */
      if (panelEl && panelEl.contains(event.target)) return
    }
    if (rafId) return
    rafId = raf(() => {
      rafId = null
      if (open.value) place(true)
    })
  }

  let followBound = false

  function bindFollow() {
    if (followBound) return
    followBound = true
    /* #ifdef H5 */
    if (typeof window === 'undefined') return
    document.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    /* #endif */

    /* #ifndef H5 */
    // MP 分支为什么不能「监听滚动」：小程序的页面滚动只在 Page 的
    // onPageScroll 里回调，组件拿不到（composables/use-page-scroll.js
    // 已经把这个限制记录在案，它因此要求父级把 scrollTop 传进来）。
    // 而 useFloating 是被气泡组件内部调用的，不可能要求每个使用方
    // 都接一根 scrollTop 属性 —— 那等于把这个坑转嫁给业务。
    //
    // 所以 MP 走「重测」而不是「监听」：气泡打开期间用 utils/raf.js
    // 驱动的节流循环反复 createSelectorQuery 复测触发物坐标。
    //   1. raf.js 在 MP 上会自动降级成 setTimeout(16ms)，
    //      直接写 requestAnimationFrame 会因为没有这个全局函数而崩；
    //   2. 光有 raf 还不够 —— 每帧一次 selectQuery 太重，
    //      所以再加一层 MIN_INTERVAL 间隔门禁，把复测压到每秒 8 次，
    //      肉眼看仍然是「贴着触发物走」；
    //   3. 循环只在 open 期间存在，关掉即停，不会常驻。
    // 面板尺寸变化（列表异步返回变长）同样由这个复测顺带覆盖 ——
    // MP 没有 ResizeObserver，重测是唯一可靠的尺寸信号。
    if (typeof uni === 'undefined' || typeof uni.createSelectorQuery !== 'function') return
    let lastAt = 0
    const tick = () => {
      if (!followBound) return
      const now = Date.now()
      if (now - lastAt >= MP_FOLLOW_INTERVAL) {
        lastAt = now
        onViewportChange()
      }
      mpRafId = raf(tick)
    }
    mpRafId = raf(tick)
    if (typeof uni.onWindowResize === 'function') uni.onWindowResize(onViewportChange)
    /* #endif */
  }

  function unbindFollow() {
    if (!followBound) return
    followBound = false
    if (rafId) {
      cancelRaf(rafId)
      rafId = null
    }
    /* #ifdef H5 */
    if (typeof window !== 'undefined') {
      document.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
    /* #endif */

    /* #ifndef H5 */
    if (mpRafId) {
      cancelRaf(mpRafId)
      mpRafId = null
    }
    if (typeof uni !== 'undefined' && typeof uni.offWindowResize === 'function') {
      uni.offWindowResize(onViewportChange)
    }
    /* #endif */
  }

  /* ----------------------------------------------------------------
   * 面板尺寸变化：内容是异步来的（列表请求返回后从 100px 长到 400px），
   * 首拍定位量到的是旧尺寸，面板会顶出屏幕。
   * H5 用 ResizeObserver（只在尺寸真的变了时才回调，几乎零成本）；
   * MP 没有这个 API，交给上面 MP 跟随循环里的 selectQuery 复测。
   * ---------------------------------------------------------------- */
  let sizeObserver = null

  function observePanelSize() {
    /* #ifdef H5 */
    if (sizeObserver || typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return
    const el = document.querySelector(`.${uid}`)
    if (!el) return
    sizeObserver = new ResizeObserver(() => {
      if (open.value) place(true)
    })
    sizeObserver.observe(el)
    /* #endif */
  }

  function unobservePanelSize() {
    /* #ifdef H5 */
    if (!sizeObserver) return
    sizeObserver.disconnect()
    sizeObserver = null
    /* #endif */
  }

  onUnmounted(() => {
    placeToken += 1
    open.value = false
    unbindFollow()
    unobservePanelSize()
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
    /* 面板比视口还高时自己限高并内部滚动。
       写在内联里而不是组件 CSS 里，是因为只有「已经量过尺寸」才知道
       需不需要限高；平时不加 overflow，否则会裁掉露在面板外的箭头。 */
    if (overflowing.value) {
      parts.push(`max-height:calc(100vh - ${VIEWPORT_GAP * 2}px);overflow-y:auto;`)
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
