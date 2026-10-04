<template>
  <view class="cd-cascader" :class="rootClass">
    <!-- ==================== 触发区 ==================== -->
    <view class="cd-cascader__trigger" :class="triggerClass" hover-class="cd-cascader__trigger--pressed" @click="handleTriggerClick">
      <text v-if="displayText" class="cd-cascader__value">{{ displayText }}</text>
      <text v-else class="cd-cascader__placeholder">{{ placeholder }}</text>

      <view v-if="showClear" class="cd-cascader__clear" @click.stop="handleClear">
        <view class="cd-cascader__clear-bar cd-cascader__clear-bar--a" />
        <view class="cd-cascader__clear-bar cd-cascader__clear-bar--b" />
      </view>

      <view v-if="!showClear" class="cd-cascader__arrow" :class="{ 'cd-cascader__arrow--open': open }" />
    </view>

    <!-- ============ 形态一：桌面端 —— 锚定下拉面板 ============ -->
    <template v-if="desktopShape">
      <!-- 透明全屏捕获层：点任意空白处关闭。小程序端没有 document 事件委托，
           两端用同一套「铺一层透明 view」的逻辑最省心 -->
      <view v-if="open" class="cd-cascader__catcher" @click="close" />

      <view v-if="open" class="cd-cascader__panel">
        <scroll-view
          v-for="(col, colIndex) in columns"
          :key="colIndex"
          class="cd-cascader__col"
          scroll-y
          :show-scrollbar="false"
        >
          <view
            v-for="(node, nodeIndex) in col"
            :key="nodeKey(node, nodeIndex)"
            class="cd-cascader__node"
            :class="nodeClass(colIndex, node)"
            hover-class="cd-cascader__node--pressed"
            @click="handleNodeClick(colIndex, node)"
          >
            <text class="cd-cascader__node-label">{{ labelOf(node) }}</text>
            <view v-if="hasChildren(node)" class="cd-cascader__node-arrow" />
            <view v-else-if="isChecked(colIndex, node)" class="cd-cascader__tick" />
          </view>

          <view v-if="!col.length" class="cd-cascader__empty">
            <text class="cd-cascader__empty-text">暂无数据</text>
          </view>
        </scroll-view>
      </view>
    </template>

    <!-- ============ 形态二：移动端 —— 底部弹层 ============ -->
    <template v-else>
      <view v-if="open" class="cd-cascader__mask" :style="maskStyle" @click="close" @touchmove.stop.prevent="noop" />

      <view v-if="open" class="cd-cascader__sheet" :style="maskStyle">
        <view class="cd-cascader__toolbar">
          <view class="cd-cascader__action" hover-class="cd-cascader__action--pressed" @click="close">
            <text class="cd-cascader__action-text">取消</text>
          </view>
          <text class="cd-cascader__title">{{ title || placeholder }}</text>
          <view class="cd-cascader__action cd-cascader__action--placeholder" />
        </view>

        <view class="cd-cascader__columns">
          <scroll-view
            v-for="(col, colIndex) in columns"
            :key="colIndex"
            class="cd-cascader__col"
            scroll-y
            :show-scrollbar="false"
          >
            <view
              v-for="(node, nodeIndex) in col"
              :key="nodeKey(node, nodeIndex)"
              class="cd-cascader__node"
              :class="nodeClass(colIndex, node)"
              hover-class="cd-cascader__node--pressed"
              @click="handleNodeClick(colIndex, node)"
            >
              <text class="cd-cascader__node-label">{{ labelOf(node) }}</text>
              <view v-if="hasChildren(node)" class="cd-cascader__node-arrow" />
              <view v-else-if="isChecked(colIndex, node)" class="cd-cascader__tick" />
            </view>

            <view v-if="!col.length" class="cd-cascader__empty">
              <text class="cd-cascader__empty-text">暂无数据</text>
            </view>
          </scroll-view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
/**
 * cd-cascader —— 级联选择器
 * ---------------------------------------------------------------
 * 省市区、品类树、组织架构这类「选一个从根到叶的路径」的需求，
 * 用多级 select 硬凑的话，联动逻辑要业务侧自己写、每次都重写一遍；
 * 用单列 picker 又装不下树形结构。这个组件把两者之间的空档补上。
 *
 * 五个实现决定：
 *
 * 1. 面板是「多列并排」，不是「一级一屏」。
 *    移动端常见的另一种做法是顶部 Tab 切层级、一屏只显示一层 ——
 *    那样要来回切才能看全路径。多列并排一眼能看到「浙江 / 杭州 / 西湖区」，
 *    代价是列数多时每列会变窄，所以文档里写清楚建议不超过 3 列。
 *
 * 2. 点选即提交，没有「确定」按钮。
 *    级联选择是「点到底就选完了」的操作，中间不需要确认态；
 *    加了确定按钮反而多一次点击。取消/关闭只丢弃「点了一半的中间态」，
 *    已经提交的值不受影响。
 *
 * 3. 「能不能选中间层」由 checkStrictly 显式控制。
 *    默认 false —— 只有叶子可选，点父级只展开下一列；
 *    true 时任意层都能选。不做「数据里有没有 children」的自动推断，
 *    因为同一棵树在不同页面可能有不同诉求。
 *
 * 4. emitPath 决定 modelValue 是路径数组还是单个值。
 *    表单里通常要整条路径（省市区三个字段一起存），
 *    但有时业务表只存最末级的 id —— 两种都要支持，且默认给路径（信息更全）。
 *
 * 5. 字段映射走 fieldNames，不写死 label / value / children。
 *    后端返回的树很少正好叫这三个名字（常见 areaName / areaCode / subList），
 *    写死了业务就得先做一次遍历转换，那是纯粹的额外开销。
 *
 * 已知限制：
 *   - 不做异步加载子节点（lazy）。需要懒加载的场景请用 cd-picker 自行组织列数据；
 *   - 桌面面板用 position:absolute 锚定，若触发器祖先带 overflow:hidden 会被裁切。
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import { useBreakpoint, resolveDesktopShape } from '../../composables/use-breakpoint'
import { useField } from '../../composables/use-field'
import { useEscLayer } from '../../composables/use-esc-stack'

defineOptions({
  name: 'cd-cascader',
  options: {
    addGlobalClass: true,
  },
})

const props = defineProps({
  /** 选中值。emitPath=true 时为「从根到叶」的值数组；false 时为末级单个值 */
  modelValue: {
    type: [Array, String, Number],
    default: () => [],
  },
  /**
   * 树形数据
   * @type {{ label: string, value: string|number, children?: Array, disabled?: boolean }[]}
   */
  options: {
    type: Array,
    default: () => [],
  },
  /** 字段映射：后端字段名对不上时改这里，不必先转换数据 */
  fieldNames: {
    type: Object,
    default: () => ({ label: 'label', value: 'value', children: 'children', disabled: 'disabled' }),
  },
  /** 未选中时的提示文案 */
  placeholder: {
    type: String,
    default: '请选择',
  },
  /** 移动端弹层标题，缺省用 placeholder */
  title: {
    type: String,
    default: '',
  },
  /** 展示已选路径时的分隔符 */
  separator: {
    type: String,
    default: ' / ',
  },
  /** 是否可清空 */
  clearable: {
    type: Boolean,
    default: false,
  },
  /** 是否允许选中任意层级（true 时父级也能选） */
  checkStrictly: {
    type: Boolean,
    default: false,
  },
  /** 选中中间层是否立即提交（false 时点父级只展开下一列） */
  changeOnSelect: {
    type: Boolean,
    default: false,
  },
  /** modelValue 是整条路径还是末级值 */
  emitPath: {
    type: Boolean,
    default: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** auto / mobile / desktop */
  shape: {
    type: String,
    default: 'auto',
  },
  /** 层级 */
  zIndex: {
    type: Number,
    default: 2100,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'clear', 'visible-change'])

const { field, formDisabled, notifyChange, notifyBlur } = useField()

const { isPC } = useBreakpoint()
const desktopShape = computed(() => resolveDesktopShape(props.shape, isPC))
const isDisabled = computed(() => props.disabled || formDisabled.value)

/* -------------------- 字段读取 -------------------- */

const f = computed(() => ({
  label: props.fieldNames.label || 'label',
  value: props.fieldNames.value || 'value',
  children: props.fieldNames.children || 'children',
  disabled: props.fieldNames.disabled || 'disabled',
}))

function labelOf(node) {
  if (!node) return ''
  const v = node[f.value.label]
  return v === undefined || v === null ? '' : String(v)
}

function valueOf(node) {
  return node ? node[f.value.value] : undefined
}

function childrenOf(node) {
  const kids = node ? node[f.value.children] : null
  return Array.isArray(kids) ? kids : []
}

function isNodeDisabled(node) {
  return !!(node && node[f.value.disabled])
}

function hasChildren(node) {
  return childrenOf(node).length > 0
}

/* -------------------- 已选路径 -------------------- */

/** 按值数组走一遍树，拿到对应节点链。断了就停在断处，不伪造节点 */
function nodesByValues(values) {
  const path = []
  let level = props.options || []
  for (let i = 0; i < values.length; i += 1) {
    const hit = level.find((node) => valueOf(node) === values[i])
    if (!hit) break
    path.push(hit)
    level = childrenOf(hit)
  }
  return path
}

/** modelValue → 值数组。emitPath=false 时只有末级值，需要反查祖先 */
const valuePath = computed(() => {
  const mv = props.modelValue
  if (props.emitPath) {
    if (Array.isArray(mv)) return mv.slice()
    if (mv === null || mv === undefined || mv === '') return []
    return [mv]
  }
  if (mv === null || mv === undefined || mv === '') return []
  /* 单值模式：深度优先找它，同时把走过的祖先链带出来 */
  const chain = []
  const walk = (list) => {
    for (let i = 0; i < list.length; i += 1) {
      const node = list[i]
      chain.push(node)
      if (valueOf(node) === mv) return true
      if (walk(childrenOf(node))) return true
      chain.pop()
    }
    return false
  }
  walk(props.options || [])
  return chain.map(valueOf)
})

const resolvedPath = computed(() => nodesByValues(valuePath.value))

const displayText = computed(() => resolvedPath.value.map(labelOf).join(props.separator))

const hasValue = computed(() => resolvedPath.value.length > 0)

/* -------------------- 面板与展开态 -------------------- */

const open = ref(false)
/** 当前展开路径（草稿）。点父级只改它，只有真正选中才落到 modelValue */
const activePath = ref([])

/**
 * 面板里的列：第 n 列 = 第 n-1 列选中节点的 children。
 * 展开上限 32 层，防御业务数据成环。
 */
const columns = computed(() => {
  const cols = []
  let level = props.options || []
  for (let i = 0; i < 32; i += 1) {
    if (!Array.isArray(level) || !level.length) break
    cols.push(level)
    const hit = level.find((node) => valueOf(node) === activePath.value[i])
    if (!hit) break
    level = childrenOf(hit)
  }
  return cols
})

const maskStyle = computed(() => `z-index:${props.zIndex};`)

/** 表单校验报错时，触发区也要变红描边，否则用户看不出是哪个控件错了 */
const hasFormError = computed(() => !!(field && field.validateState && field.validateState.value === 'error'))

const rootClass = computed(() =>
  [
    desktopShape.value ? 'cd-cascader--desktop' : 'cd-cascader--mobile',
    open.value ? 'cd-cascader--open' : '',
    isDisabled.value ? 'cd-cascader--disabled' : '',
    hasFormError.value ? 'cd-cascader--error' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const triggerClass = computed(() =>
  [
    open.value ? 'cd-cascader__trigger--open' : '',
    isDisabled.value ? 'cd-cascader__trigger--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')
)

/* 面板打开时不显示清空叉：此时点叉会先被面板捕获层吃掉，点了没反应更奇怪 */
const showClear = computed(() => props.clearable && hasValue.value && !isDisabled.value && !props.readonly && !open.value)

function nodeKey(node, index) {
  const v = valueOf(node)
  return v === undefined || v === null ? `i-${index}` : `v-${v}`
}

function nodeClass(colIndex, node) {
  const parts = []
  if (valueOf(node) === activePath.value[colIndex]) parts.push('cd-cascader__node--active')
  if (isNodeDisabled(node)) parts.push('cd-cascader__node--disabled')
  return parts.join(' ')
}

function isChecked(colIndex, node) {
  return valueOf(node) === activePath.value[colIndex]
}

/* -------------------- 交互 -------------------- */

const esc = useEscLayer(() => {
  if (open.value) close()
})

function openPanel() {
  if (isDisabled.value || props.readonly) return
  /* 每次打开都从已提交值重新出发：上次点了一半就关掉的中间态不该留着 */
  activePath.value = valuePath.value.slice()
  open.value = true
  esc.push()
  lockScroll()
  emit('visible-change', true)
}

function close() {
  if (!open.value) return
  open.value = false
  esc.remove()
  unlockScroll()
  emit('visible-change', false)
}

function handleTriggerClick() {
  if (open.value) close()
  else openPanel()
}

function commit(values) {
  const nodes = nodesByValues(values)
  const value = props.emitPath ? values.slice() : values.length ? values[values.length - 1] : null
  emit('update:modelValue', value)
  emit('change', value, nodes)
  notifyChange(value)
  notifyBlur()
}

function handleNodeClick(colIndex, node) {
  if (isNodeDisabled(node)) return

  /* 改上游必须截断下游，否则会留下「江苏 / 西湖区」这种不存在的组合 */
  const next = activePath.value.slice(0, colIndex)
  next.push(valueOf(node))
  activePath.value = next

  const leaf = !hasChildren(node)
  const selectable = props.checkStrictly || leaf || props.changeOnSelect
  if (!selectable) return

  commit(next)
  close()
}

function handleClear() {
  const value = props.emitPath ? [] : null
  activePath.value = []
  emit('update:modelValue', value)
  emit('change', value, [])
  emit('clear')
  notifyChange(value)
}

function noop() {}

/*
 * 外部把值清空 / 改成别的值、**或者 options 后到**时，草稿都要跟着走。
 *
 * 只监听 modelValue 是不够的：emitPath=false 且 options 是异步拿到的场景下，
 * 组件初始化时 options 还是空数组，valuePath 的深查找找不到任何节点，
 * activePath 就一直是空的 —— 而 modelValue 之后再没变过，watcher 也不会再触发，
 * 于是触发区永远显示 placeholder，尽管值其实已经选过了。
 */
watch(
  () => [props.modelValue, props.options],
  () => {
    activePath.value = valuePath.value.slice()
  },
  { deep: false },
)

/* -------------------- H5 body 滚动锁 -------------------- */

/**
 * 移动端的底部弹层只有遮罩、没有滚动锁：
 * 遮罩挡住了点击，但 H5 上页面本身依然能滚，手指在遮罩上滑会带着
 * 背景一起动 —— 弹层看起来像「浮在会跑的背景上」。
 * 这里与 cd-picker 用同一套实现（H5 给 body 加 overflow:hidden，
 * 小程序端没有 body，靠遮罩本身挡住滚动即可）。
 */
let locked = false

function lockScroll() {
  /* #ifdef H5 */
  if (locked || typeof document === 'undefined' || !document.body) return
  locked = true
  document.body.style.overflow = 'hidden'
  /* #endif */
}

function unlockScroll() {
  /* #ifdef H5 */
  if (!locked || typeof document === 'undefined' || !document.body) return
  locked = false
  document.body.style.overflow = ''
  /* #endif */
}

onUnmounted(() => {
  unlockScroll()
})
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-cascader {
  @include cd-reset;
  position: relative;
  display: block;
  width: 100%;
}

/* ==================================================================
 * 触发区：视觉语言与 cd-select 保持一致
 * ================================================================== */
.cd-cascader__trigger {
  position: relative;
  display: flex;
  align-items: center;
  height: var(--cd-control-height, 36px);
  padding: 0 var(--cd-space-3, 12px);
  background-color: var(--cd-bg-container, #ffffff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-md, 8px);
  cursor: pointer;
  transition: border-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease),
    box-shadow var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

@include cd-hover {
  .cd-cascader__trigger:hover {
    border-color: var(--cd-border-color-strong, #cbd5e1);
  }
}

.cd-cascader__trigger--open {
  border-color: var(--cd-color-primary, #3b76f6);
  box-shadow: 0 0 0 3px var(--cd-color-primary-soft, #eff5ff);
}

.cd-cascader__trigger--pressed {
  border-color: var(--cd-color-primary, #3b76f6);
}

.cd-cascader--error .cd-cascader__trigger {
  border-color: var(--cd-color-danger, #ef4444);
}

.cd-cascader--error .cd-cascader__trigger--open {
  box-shadow: 0 0 0 3px var(--cd-color-danger-soft, #fef2f2);
}

.cd-cascader__trigger--disabled {
  cursor: not-allowed;
  background-color: var(--cd-bg-disabled, #f1f5f9);
}

.cd-cascader__value {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-primary, #0f172a);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cd-cascader__placeholder {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-placeholder, #94a3b8);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 箭头：纯 CSS 三角，任意端都不用引图标资源 */
.cd-cascader__arrow {
  flex-shrink: 0;
  width: 0;
  height: 0;
  margin-left: var(--cd-space-2, 8px);
  border-right: 4px solid transparent;
  border-bottom: 5px solid var(--cd-text-placeholder, #94a3b8);
  border-left: 4px solid transparent;
  transition: transform var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-cascader__arrow--open {
  transform: rotate(180deg);
}

/* 清空按钮：两根细条叠成叉 */
.cd-cascader__clear {
  position: relative;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-left: var(--cd-space-2, 8px);
  border-radius: var(--cd-radius-round, 999px);
  background-color: var(--cd-text-placeholder, #94a3b8);
}

.cd-cascader__clear-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 1.5px;
  margin-top: -0.75px;
  margin-left: -4px;
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: 2px;
}

.cd-cascader__clear-bar--a {
  transform: rotate(45deg);
}

.cd-cascader__clear-bar--b {
  transform: rotate(-45deg);
}

/* ==================================================================
 * 桌面端面板
 * ================================================================== */
.cd-cascader__catcher {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--cd-z-dropdown, 1500);
  background-color: transparent;
}

.cd-cascader__panel {
  position: absolute;
  right: 0;
  left: 0;
  z-index: calc(var(--cd-z-dropdown, 1500) + 1);
  display: flex;
  max-height: 280px;
  padding: var(--cd-space-1, 4px);
  background-color: var(--cd-bg-elevated, #ffffff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-md, 8px);
  box-shadow: var(--cd-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.1));
  overflow: hidden;
}

/* ==================================================================
 * 移动底端弹层
 * ================================================================== */
.cd-cascader__mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: var(--cd-bg-mask, rgba(15, 23, 42, 0.45));
  animation: cd-cascader-mask-in 180ms ease-out;
}

.cd-cascader__sheet {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: var(--cd-bg-elevated, #ffffff);
  border-radius: var(--cd-radius-lg, 12px) var(--cd-radius-lg, 12px) 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  overflow: hidden;
  animation: cd-cascader-sheet-up 220ms cubic-bezier(0.32, 0.72, 0, 1);
}

.cd-cascader__toolbar {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 var(--cd-space-4, 16px);
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
}

.cd-cascader__title {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #0f172a);
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cd-cascader__action {
  flex-shrink: 0;
  min-width: 48px;
  cursor: pointer;
}

/* 占位：让标题始终居中，省掉「左右不等宽就歪」的问题 */
.cd-cascader__action--placeholder {
  min-width: 48px;
  text-align: right;
}

.cd-cascader__action-text {
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-secondary, #64748b);
}

.cd-cascader__action:active .cd-cascader__action-text {
  opacity: 0.6;
}

.cd-cascader__action--pressed .cd-cascader__action-text {
  opacity: 0.6;
}

.cd-cascader__columns {
  display: flex;
  height: 280px;
  overflow: hidden;
}

/* ==================================================================
 * 列与节点
 * ================================================================== */
.cd-cascader__col {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: var(--cd-space-1, 4px) 0;
}

/* 列间分隔线画在「后一列」的左边界上，不用 nth-child */
.cd-cascader__col + .cd-cascader__col {
  border-left: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
}

.cd-cascader__node {
  display: flex;
  align-items: center;
  min-height: 34px;
  padding: 0 var(--cd-space-3, 12px);
  cursor: pointer;
}

.cd-cascader__node-label {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-regular, #334155);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cd-cascader__node--active .cd-cascader__node-label {
  color: var(--cd-color-primary, #3b76f6);
  font-weight: var(--cd-font-weight-semibold, 600);
}

.cd-cascader__node--disabled {
  cursor: not-allowed;
}

.cd-cascader__node--disabled .cd-cascader__node-label {
  color: var(--cd-text-disabled, #cbd5e1);
}

.cd-cascader__node:active .cd-cascader__node-label {
  color: var(--cd-color-primary, #3b76f6);
}

.cd-cascader__node--pressed .cd-cascader__node-label {
  color: var(--cd-color-primary, #3b76f6);
}

@include cd-hover {
  .cd-cascader__node:hover .cd-cascader__node-label {
    color: var(--cd-color-primary, #3b76f6);
  }
}

/* 有下级：右侧小箭头，暗示「点这里是展开，不是选中」 */
.cd-cascader__node-arrow {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  margin-left: var(--cd-space-2, 8px);
  border-top: var(--cd-border-width, 1px) solid var(--cd-text-placeholder, #94a3b8);
  border-right: var(--cd-border-width, 1px) solid var(--cd-text-placeholder, #94a3b8);
  transform: rotate(45deg);
}

/* 已选中的叶子：一个勾 */
.cd-cascader__tick {
  flex-shrink: 0;
  width: 10px;
  height: 5px;
  margin-left: var(--cd-space-2, 8px);
  border-bottom: 1.5px solid var(--cd-color-primary, #3b76f6);
  border-left: 1.5px solid var(--cd-color-primary, #3b76f6);
  transform: rotate(-45deg);
}

.cd-cascader__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--cd-space-4, 16px) 0;
}

.cd-cascader__empty-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-placeholder, #94a3b8);
}

/* ==================================================================
 * 动画
 * ================================================================== */
@keyframes cd-cascader-mask-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes cd-cascader-sheet-up {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}
</style>
