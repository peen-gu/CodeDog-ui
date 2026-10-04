<template>
  <view class="cd-tree" :class="rootClass" :style="customStyle">
    <view v-if="!visibleNodes.length" class="cd-tree__empty">
      <slot name="empty">{{ emptyText }}</slot>
    </view>

    <view
      v-for="row in visibleNodes"
      :key="row.key"
      class="cd-tree__node"
      :class="{ 'cd-tree__node--selected': selectedKey === row.key, 'cd-tree__node--disabled': row.disabled }"
      :style="`padding-left:${row.level * indent}px;`"
      @click.stop="onNodeTap(row)"
    >
      <!-- 展开箭头：叶子节点保留等宽占位，否则同级文字会左右错位 -->
      <view class="cd-tree__arrow" @click.stop="toggle(row)">
        <cd-icon
          v-if="row.hasChildren"
          class="cd-tree__arrow-icon"
          :name="row.expanded ? 'chevron-down' : 'chevron-right'"
          :size="16"
        />
      </view>

      <view
        v-if="checkable && !checkStrictly"
        class="cd-tree__check"
        :class="{ 'cd-tree__check--on': isChecked(row.key) }"
        @click.stop="toggleCheck(row)"
      >
        <cd-icon
          v-if="isChecked(row.key)"
          class="cd-tree__check-icon"
          name="check"
          :size="14"
        />
        <text v-else-if="isIndeterminate(row.key)" class="cd-tree__check-part">-</text>
      </view>

      <slot name="node" :node="row.node" :level="row.level" :expanded="row.expanded">
        <text class="cd-tree__label">{{ row.label }}</text>
      </slot>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-tree —— 树形控件
 * ---------------------------------------------------------------
 * **不做递归渲染**，这是本组件唯一重要的实现决策。
 *
 * 两条路摆在面前：
 *   A. 组件在自己的模板里引用自己（按 name 自引用）；
 *   B. 把树在 script 里摊平成一层可见节点数组，模板只 v-for 一层。
 * 选 B，理由是可验证的硬约束，不是口味：
 *   - mp-weixin 编译器对 `<component :is>` 直接报错
 *     X_DYNAMIC_COMPONENT_NOT_SUPPORTED（本仓库 cd-form-render 已踩过）；
 *   - 自引用递归在小程序端的层深上限没有公开承诺，深树有风险；
 *   - 摊平之后「谁可见」只是一次 JS 遍历，顺手把过滤 / 排序 / 层级限制了做进去，
 *     模板层面反而更简单。
 *
 * 勾选联动走「向下全量 + 向上回算」两趟：
 *   向下：勾选/取消时把整棵子树写入或剔除；
 *   向上：从被点节点一路走到根，子节点全勾则自己也勾，否则清掉并把沿途标半选。
 * `checkStrictly` 打开时跳过两趟，父子各算各的（业务常见诉求，别替他们删）。
 */
import { computed, ref, watch } from 'vue'

defineOptions({
  name: 'cd-tree',
})

const props = defineProps({
  /** 树数据 */
  data: {
    type: Array,
    default: () => [],
  },
  /** 节点唯一标识字段名 */
  nodeKey: {
    type: String,
    default: 'id',
  },
  /** 显示文案字段名 */
  labelKey: {
    type: String,
    default: 'label',
  },
  /** 子节点字段名 */
  childrenKey: {
    type: String,
    default: 'children',
  },
  /** 禁用字段名 */
  disabledKey: {
    type: String,
    default: 'disabled',
  },
  /** 是否显示复选框 */
  checkable: {
    type: Boolean,
    default: false,
  },
  /** 父子勾选互不相干 */
  checkStrictly: {
    type: Boolean,
    default: false,
  },
  /** 默认展开全部 */
  defaultExpandAll: {
    type: Boolean,
    default: false,
  },
  /** 每层缩进 */
  indent: {
    type: Number,
    default: 16,
  },
  /** 点文字是否选中（单选高亮） */
  selectable: {
    type: Boolean,
    default: true,
  },
  emptyText: {
    type: String,
    default: '暂无数据',
  },
  /** 已勾选的 key 数组 */
  checkedKeys: {
    type: Array,
    default: () => [],
  },
  /** 已展开的 key 数组 */
  expandedKeys: {
    type: Array,
    default: () => [],
  },
  customClass: {
    type: String,
    default: '',
  },
  customStyle: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'update:checkedKeys',
  'update:expandedKeys',
  'check',
  'expand',
  'select',
])

const innerExpanded = ref([...props.expandedKeys])
const innerChecked = ref([...props.checkedKeys])
const selectedKey = ref('')

watch(
  () => props.expandedKeys,
  (v) => {
    innerExpanded.value = [...v]
  },
)

watch(
  () => props.checkedKeys,
  (v) => {
    innerChecked.value = [...v]
  },
)

const keyOf = (node) => node[props.nodeKey]
const labelOf = (node) => node[props.labelKey] === undefined ? '' : String(node[props.labelKey])
const childrenOf = (node) => {
  const c = node[props.childrenKey]
  return Array.isArray(c) ? c : []
}

/** 父子索引一次性建好：后续勾选回算要反复向上找 parent，不能每次再遍历整棵树 */
const index = computed(() => {
  const parentMap = {}
  const nodeMap = {}
  const walk = (list, parentKey) => {
    for (const node of list) {
      const key = keyOf(node)
      if (key === undefined || key === null) continue
      nodeMap[key] = node
      if (parentKey !== null) parentMap[key] = parentKey
      walk(childrenOf(node), key)
    }
  }
  walk(props.data, null)
  return { parentMap, nodeMap }
})

/** 所有「有子节点」的 key —— defaultExpandAll 就是全部展开这些 */
const allParentKeys = computed(() => {
  const out = []
  const walk = (list) => {
    for (const node of list) {
      if (childrenOf(node).length) {
        out.push(keyOf(node))
        walk(childrenOf(node))
      }
    }
  }
  walk(props.data)
  return out
})

/* data 变更（比如重新请求了整棵树）时按策略重置展开态，
   但不清空勾选 —— 勾选是用户的选择，跟着刷新丢掉体验很糟。
   ⚠️ 这个 watch 必须写在 allParentKeys 之后：immediate 会在 setup 里同步执行，
      此时引用后面才声明的 const 会撞暂时性死区（TDZ）——
      实测报 "Cannot access '...' before initialization" 并整页白屏。
      这类错误只在运行时出现，编译与静态门禁都查不出来，只能靠跑一遍。 */
watch(
  () => props.data,
  () => {
    if (props.defaultExpandAll) {
      innerExpanded.value = allParentKeys.value
    }
  },
  { immediate: true },
)

/** 摊平后的可见节点：模板只认这一层 */
const visibleNodes = computed(() => {
  const expandedSet = new Set(innerExpanded.value)
  const rows = []
  const walk = (list, level) => {
    for (const node of list) {
      const children = childrenOf(node)
      const hasChildren = children.length > 0
      const key = keyOf(node)
      const expanded = expandedSet.has(key)
      rows.push({
        key,
        node,
        level,
        hasChildren,
        expanded,
        label: labelOf(node),
        disabled: !!node[props.disabledKey],
      })
      if (hasChildren && expanded) walk(children, level + 1)
    }
  }
  walk(props.data, 0)
  return rows
})

const rootClass = computed(() => [props.customClass].filter(Boolean).join(' '))

function isChecked(key) {
  return innerChecked.value.indexOf(key) > -1
}

/**
 * 半选：自己没勾，但子树里有勾上的。
 * 这里只需向下扫子树；祖先的半选状态在 toggleCheck 回算时一并处理。
 */
const indeterminateKeys = computed(() => {
  if (props.checkStrictly) return []
  const out = new Set()
  const checkedSet = new Set(innerChecked.value)
  const walk = (list) => {
    let has = false
    for (const node of list) {
      const children = childrenOf(node)
      const key = keyOf(node)
      if (!children.length) {
        if (checkedSet.has(key)) has = true
        continue
      }
      const childHas = walk(children)
      if (!checkedSet.has(key) && childHas) out.add(key)
      if (childHas || checkedSet.has(key)) has = true
    }
    return has
  }
  walk(props.data)
  return [...out]
})

function isIndeterminate(key) {
  return indeterminateKeys.value.indexOf(key) > -1
}

function toggle(row) {
  if (!row.hasChildren) return
  const next = [...innerExpanded.value]
  const at = next.indexOf(row.key)
  if (at > -1) next.splice(at, 1)
  else next.push(row.key)
  innerExpanded.value = next
  emit('update:expandedKeys', next)
  emit('expand', { key: row.key, expanded: at === -1, node: row.node })
}

function descendants(node, acc = []) {
  for (const child of childrenOf(node)) {
    acc.push(keyOf(child))
    descendants(child, acc)
  }
  return acc
}

/**
 * 勾选：向下全量子树，向上回算祖先。
 * 回算用 Map 去重，否则「同一祖先被多个子树触及」会重复写数组。
 */
function toggleCheck(row) {
  if (row.disabled) return

  const checkedSet = new Set(innerChecked.value)
  const nodes = index.value.nodeMap
  const parents = index.value.parentMap
  const subtree = descendants(row.node, [])
  const on = checkedSet.has(row.key)

  if (on) {
    checkedSet.delete(row.key)
    subtree.forEach((k) => checkedSet.delete(k))
  } else {
    checkedSet.add(row.key)
    subtree.forEach((k) => checkedSet.add(k))
  }

  if (!props.checkStrictly) {
    let parentKey = parents[row.key]
    while (parentKey !== undefined) {
      const parentNode = nodes[parentKey]
      const childKeys = childrenOf(parentNode).map(keyOf)
      const allOn = childKeys.length > 0 && childKeys.every((k) => checkedSet.has(k))
      if (allOn) checkedSet.add(parentKey)
      else checkedSet.delete(parentKey)
      parentKey = parents[parentKey]
    }
  }

  const next = [...checkedSet]
  innerChecked.value = next
  emit('update:checkedKeys', next)
  emit('check', { key: row.key, checked: !on, node: row.node, checkedKeys: next })
}

function onNodeTap(row) {
  if (row.disabled) return
  if (props.checkable) {
    toggleCheck(row)
    return
  }
  if (props.selectable) {
    selectedKey.value = row.key
    emit('select', { key: row.key, node: row.node })
  }
  toggle(row)
}

/** 取被勾节点的实体：业务通常要拿整条数据去提交，而不是只拿一堆 key */
function getCheckedNodes() {
  const nodes = index.value.nodeMap
  return innerChecked.value.map((k) => nodes[k]).filter(Boolean)
}

function getHalfCheckedKeys() {
  return [...indeterminateKeys.value]
}

function expandAll() {
  innerExpanded.value = [...allParentKeys.value]
  emit('update:expandedKeys', innerExpanded.value)
}

function collapseAll() {
  innerExpanded.value = []
  emit('update:expandedKeys', [])
}

defineExpose({ getCheckedNodes, getHalfCheckedKeys, expandAll, collapseAll })
</script>

<script>
export default {
  name: 'cd-tree',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-tree {
  @include cd-reset;

  width: 100%;
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-primary, #1e293b);
}

.cd-tree__node {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: var(--cd-tree-node-height, 32px);
}

.cd-tree__node--selected {
  background-color: var(--cd-tree-selected-bg, var(--cd-color-primary-soft, #eff5ff));
}

.cd-tree__node--disabled {
  color: var(--cd-text-disabled, #cbd5e1);
}

/* 箭头与复选框都给固定宽度：
   叶子节点没有箭头时占位仍在，同级标题才不会左右参差 */
.cd-tree__arrow {
  display: flex;
  flex: 0 0 20px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--cd-tree-arrow-color, var(--cd-text-tertiary, #94a3b8));
}

.cd-tree__check {
  display: flex;
  flex: 0 0 18px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-right: 6px;
  background-color: transparent;
  border: var(--cd-border-width, 1px) solid var(--cd-border-color-strong, #cbd5e1);
  border-radius: var(--cd-radius-sm, 4px);
}

/* 「选中」与「勾选」是两回事：前者只是高亮行，后者才染色复选框。
   把两条规则分开写，选中的行不会被误认为已勾选 */
.cd-tree__check--on {
  background-color: var(--cd-color-primary, #2563eb);
  border-color: var(--cd-color-primary, #2563eb);
}

.cd-tree__check-icon {
  color: #fff;
}

.cd-tree__check-part {
  font-size: 12px;
  line-height: 1;
  color: var(--cd-color-primary, #2563eb);
}

.cd-tree__label {
  flex: 1;
  min-width: 0;
  line-height: var(--cd-line-height-base, 1.6);
}

.cd-tree__empty {
  padding: var(--cd-space-4, 16px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-tertiary, #94a3b8);
  text-align: center;
}
</style>
