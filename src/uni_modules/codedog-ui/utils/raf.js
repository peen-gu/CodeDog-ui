/**
 * CodeDogUI / 跨端帧调度
 * ---------------------------------------------------------------
 * requestAnimationFrame 在 H5 上一定有，但在小程序里**不保证存在** ——
 * 它是浏览器环境的产物，小程序只提供视图层与逻辑层两套线程，
 * 部分基础库/渲染器里根本没有这个全局函数。
 *
 * 所以凡是「每帧做点事」的地方（固钉跟随、数字滚动）都必须走这一层。
 * 有 rAF 就用 rAF（跟屏幕刷新同步、后台自动降频），
 * 没有就退化成 16ms 的 setTimeout —— 精度差一点，但行为不会崩。
 *
 * 用 typeof 判断而不是直接调用：对未声明的标识符做 typeof 是安全的，
 * 不会抛 ReferenceError，这是这个写法唯一正确的原因。
 */

const HAS_RAF = typeof requestAnimationFrame === 'function'

export function raf(callback) {
  if (HAS_RAF) return requestAnimationFrame(callback)
  return setTimeout(() => callback(Date.now()), 16)
}

export function cancelRaf(id) {
  if (id === null || id === undefined) return
  if (HAS_RAF) cancelAnimationFrame(id)
  else clearTimeout(id)
}

export default { raf, cancelRaf }
