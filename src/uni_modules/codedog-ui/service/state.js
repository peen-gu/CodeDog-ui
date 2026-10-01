/**
 * CodeDogUI / 命令式反馈服务 —— 全局状态
 * ---------------------------------------------------------------
 * 为什么放在独立模块而不是 composable 里：
 *   服务要跨「组件实例」工作 —— 调用方可能在任何地方（事件回调、
 *   请求拦截器、甚至没有 Vue 上下文的纯 JS 模块里）。所以状态必须是
 *   模块级单例，谁挂了宿主谁来渲染，调用方只管往里塞数据。
 *
 * 小程序端的多宿主问题：
 *   小程序没有 body，宿主只能挂在页面里；多个页面都挂时会出现多个宿主。
 *   这里刻意不做「唯一宿主」仲裁 —— 让所有宿主渲染同一份全局状态，
 *   内容与坐标完全一致，重叠后视觉上就是一份。
 *   仲裁（哪个页面在最上面）在小程序里拿不到可靠信号，赌它不如绕过它。
 */

import { ref } from 'vue'

/** toast 队列，最多同时 TOAST_MAX 条，超限丢最旧 */
export const toastList = ref([])

/** confirm / alert 的模态状态，同一时间只有一个（后到者把先到的按取消处理） */
export const modalState = ref(null)

/** loading 状态（全局单例：重复调用只更新文案） */
export const loadingState = ref(null)

/**
 * 宿主是否就绪。
 * H5：自动挂载完成后为 true；小程序：cd-toast-host 的 onMounted 里置 true。
 * 小程序端没有宿主时为 false，服务降级到 uni.showToast / showModal / showLoading。
 */
export const hostReady = ref(false)

/** 小程序端宿主挂载失败 / 不存在时的降级开关（H5 挂载失败也会打开它） */
export const forceFallback = ref(false)

let uid = 0
export function nextUid() {
  uid += 1
  return `cd-fb-${uid}`
}

/** toast 同时最多几条。超限丢最旧 —— 无限堆叠是移动端 toast 最常见的灾难 */
export const TOAST_MAX = 3

/** 默认展示时长 */
export const TOAST_DURATION = 2000
