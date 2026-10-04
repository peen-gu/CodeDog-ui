/**
 * CodeDogUI / Esc 层级栈
 * ---------------------------------------------------------------
 * 解决的是「一次 Esc 关掉所有浮层」。
 *
 * 每个浮层组件各自 `document.addEventListener('keydown', ...)` 时，
 * 页面上同时开着三层（抽屉里套弹窗，弹窗里再套下拉），
 * 按一次 Esc 三层会一起收到事件、一起关闭 ——
 * 用户的预期是只关掉最上面那一层。
 *
 * 所以这里维护一个模块级栈：
 *   谁打开了就入栈，谁关了就出栈，Esc 只派发给栈顶那一个。
 * 栈是模块级单例，跨组件共享；监听器也只挂一份，
 * 栈空了才摘掉（省掉常驻的全局监听）。
 */

import { onUnmounted } from 'vue'

const stack = []
let bound = false

function onKeydown(event) {
  if (event.key !== 'Escape' && event.keyCode !== 27) return
  if (!stack.length) return
  const top = stack[stack.length - 1]
  if (typeof top === 'function') top(event)
}

/**
 * 注册一个 Esc 层。
 * 返回的 push / remove 由调用方在「打开 / 关闭」时调用；
 * 组件卸载时会自动出栈，避免异常路径下留下幽灵层把栈堵死。
 *
 * @param {(event: KeyboardEvent) => void} handler 该层对 Esc 的响应
 */
export function useEscLayer(handler) {
  function push() {
    if (stack.indexOf(handler) === -1) stack.push(handler)
    /* #ifdef H5 */
    if (!bound && typeof document !== 'undefined') {
      bound = true
      document.addEventListener('keydown', onKeydown)
    }
    /* #endif */
  }

  function remove() {
    const i = stack.indexOf(handler)
    if (i > -1) stack.splice(i, 1)
    /* 栈空时必须把监听摘掉并把 bound 复位。
       只 splice 不摘的话：document 上的 keydown 会永久常驻，
       每次按键都要白跑一次分发；更糟的是 bound 一直为 true，
       下一层浮层 push() 时会以为监听已经挂好了 —— 栈是空的、监听却是旧的，
       一旦 onKeydown 的引用被替换过就会出现「按 Esc 什么都没反应」。 */
    /* #ifdef H5 */
    if (!stack.length && bound) {
      if (typeof document !== 'undefined') document.removeEventListener('keydown', onKeydown)
      bound = false
    }
    /* #endif */
  }

  /** 自己是不是当前最上面那一层（供「Esc 与其他按键共用一个监听」的组件判断） */
  function isTop() {
    return stack.length > 0 && stack[stack.length - 1] === handler
  }

  onUnmounted(remove)

  return { push, remove, isTop }
}

export default useEscLayer
