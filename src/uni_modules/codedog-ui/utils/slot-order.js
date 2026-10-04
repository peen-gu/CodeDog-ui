/**
 * CodeDogUI / 按 slot 顺序重排子项注册表
 * ---------------------------------------------------------------
 * 解决的是「在列表中间插入一项，后面所有项的序号全错位」。
 *
 * cd-steps / cd-timeline / cd-breadcrumb 都需要知道「我是第几项」
 * （画连接线、判断首尾）。它们让子项在 onMounted 时 push 进一个普通数组，
 * 于是数组顺序 = 挂载顺序。
 *
 * 静态渲染时挂载顺序就是书写顺序，没问题；
 * 但在中间插入一项时，Vue 会**复用**已有子项的实例（不重新挂载），
 * 只挂载新插入的那一项 —— 新项就排到了数组末尾。
 * 结果：视觉上是第 2 项，注册表里是最后一项，连接线与末项标记全错。
 *
 * 真正的顺序只存在于**已渲染的 vnode 树**里，所以每次渲染后按 vnode 顺序重排一次。
 *
 * ⚠️ 这里必须用「已渲染的树」（instance.subTree），**不能**重新调用 slots.default()。
 *
 * slots.default() 是一个工厂函数：每次调用都**新建一批 vnode**。
 * 新建出来的 vnode 上 .component 恒为 null（组件实例只挂在真正渲染过的那个 vnode 上），
 * 于是 uidOf() 全部返回 null、ordered 恒为空、数量永远对不上 ——
 * 结果是这个函数一次都没真正重排过（而且每次调用还会在开发环境刷一条
 * 「Slot "default" invoked outside of the render function」警告）。
 *
 * instance.subTree 是当前这次渲染产出的真实 vnode 树，上面的 .component
 * 指向活着的组件实例，才能拿到子项暴露出来的 __cdOrderUid。
 *
 * 两道保险，缺一不可：
 *   1. 只有当「已注册项」与「树里能识别的项」数量一致时才重排 ——
 *      否则说明还有子项没挂载完（首帧、v-if 条件渲染），
 *      此时按挂载顺序走，避免把序号抖成一片 -1；
 *   2. 顺序没变就不动数组 —— 否则 version 自增会反复触发更新。
 *
 * ⚠️ 校正时机不能只挂在 onUpdated 上（实测踩过）：
 *   父容器只有稳定插槽、props 又没变化时，Vue 判定它「不需要更新」，
 *   onUpdated 根本不会触发 —— 但子项已经增减了，序号照样错。
 *   所以真正的触发点是子项自己的 register / unregister，
 *   用 nextTick 等这一帧渲染完再校正（见 createOrderRegistry）。
 */

import { getCurrentInstance, nextTick, onMounted, onUpdated, ref } from 'vue'

/** 子项需要用它把 uid 暴露出来，父级才能把 vnode 与注册表对上 */
export const ORDER_UID_KEY = '__cdOrderUid'

/**
 * 深度优先遍历已渲染的 vnode 树，按遍历顺序收集子项 uid。
 *
 * 遍历顺序就是渲染顺序 —— 正是「谁排在第几位」的唯一真值来源。
 * 遇到目标子项就停止下钻（子项内部不会再嵌同种子项）。
 */
function collectOrder(node, out) {
  if (!node) return
  if (Array.isArray(node)) {
    for (const n of node) collectOrder(n, out)
    return
  }
  if (typeof node !== 'object') return

  const uid = uidOf(node)
  if (uid != null) {
    out.push(uid)
    return
  }

  /*
   * 组件节点必须下钻到它**自己渲染出来的那棵树**，不能遍历它的 children。
   *
   * uni 的 <view> 编译后不是元素节点而是组件（rootTag.name === 'View'），
   * 组件 vnode 的 children 是 slots 对象、值是 slot 函数而不是 vnode，
   * 按「数组 / 对象」去遍历会一个都认不出来（实测 ord 恒为 0）。
   * component.subTree 才是它渲染出来的真实子结构。
   */
  const comp = node.component
  if (comp && comp.subTree) {
    collectOrder(comp.subTree, out)
    return
  }

  const children = node.children
  if (Array.isArray(children)) {
    collectOrder(children, out)
    return
  }
  /* 兜底：对象形态的 children（键为插槽名）。slot 函数不调用 ——
     调出来的是新 vnode，.component 恒为 null，取不到 uid 还白白建一批节点 */
  if (children && typeof children === 'object') {
    for (const key of Object.keys(children)) {
      const slot = children[key]
      if (typeof slot !== 'function') collectOrder(slot, out)
    }
  }
}

function uidOf(vnode) {
  const inst = vnode.component
  if (!inst) return null
  const exposed = inst.exposed || inst.proxy
  const uid = exposed && exposed[ORDER_UID_KEY]
  return typeof uid === 'number' ? uid : null
}

/**
 * @param {number[]} registry 父组件的注册表（原地重排）
 * @param {object} instance 父组件的 getCurrentInstance() —— 用它的 subTree 取真实渲染顺序
 * @returns {boolean} 是否发生了重排（true 时调用方需要让 version 自增）
 */
export function resortBySlotOrder(registry, instance) {
  try {
    if (!registry.length) return false
    const root = instance && instance.subTree
    if (!root) return false

    const ordered = []
    collectOrder(root, ordered)
    if (ordered.length !== registry.length) return false

    let changed = false
    for (let i = 0; i < ordered.length; i += 1) {
      if (registry[i] !== ordered[i]) {
        changed = true
        break
      }
    }
    if (!changed) return false

    registry.splice(0, registry.length, ...ordered)
    return true
  } catch (e) {
    /* 拿不到 slot 顺序就退回挂载顺序：错位是显示问题，抛错是可用性问题 */
    return false
  }
}

/**
 * 建一个「按渲染顺序维护的子项注册表」。
 *
 * cd-steps / cd-timeline / cd-breadcrumb 的注册表逻辑逐字相同，
 * 各写一份必然会在某次修 bug 时只改一处 —— 所以收敛到这里。
 *
 * 为什么用普通数组而不是 ref 数组：
 * 被 Proxy 包过的数组会让 indexOf 的引用比对失效，
 * 因此另设一个 version ref，谁读它谁就建立响应式依赖。
 *
 * 校正时机的三条来源，缺一不可：
 *   1. register / unregister —— 主要来源。子项增减发生在渲染过程中，
 *      用 nextTick 等这一帧渲染完再按真实渲染顺序校正；
 *   2. onUpdated —— 覆盖「顺序变了但没增删子项」的情形；
 *   3. onMounted —— 首帧。
 */
export function createOrderRegistry() {
  const instance = getCurrentInstance()
  const registry = []
  const version = ref(0)
  let uidSeed = 0
  let scheduled = false

  function sync() {
    if (resortBySlotOrder(registry, instance)) version.value += 1
  }

  function schedule() {
    if (scheduled) return
    scheduled = true
    nextTick(() => {
      scheduled = false
      sync()
    })
  }

  function register() {
    uidSeed += 1
    registry.push(uidSeed)
    version.value += 1
    schedule()
    return uidSeed
  }

  function unregister(uid) {
    const i = registry.indexOf(uid)
    if (i > -1) registry.splice(i, 1)
    version.value += 1
    schedule()
  }

  function indexOf(uid) {
    /* 先读版本号建立依赖，再查表 —— 顺序不能反 */
    void version.value
    return registry.indexOf(uid)
  }

  onMounted(sync)
  onUpdated(sync)

  return {
    register,
    unregister,
    indexOf,
    /** 用 getter 而不是函数：调用方写 steps.total 而不是 steps.total()，读起来像属性 */
    get total() {
      void version.value
      return registry.length
    },
  }
}

export default resortBySlotOrder
