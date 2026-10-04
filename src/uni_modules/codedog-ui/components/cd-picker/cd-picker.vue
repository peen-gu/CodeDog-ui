<template>
  <view class="cd-picker" :class="rootClass">
    <!-- ==================== 弹层：遮罩 ==================== -->
    <view
      v-if="visible"
      class="cd-picker__mask"
      :style="maskStyle"
      @click="handleMaskClick"
      @touchmove.stop.prevent="noop"
    />

    <!-- ==================== 弹层主体 ==================== -->
    <view v-if="visible" class="cd-picker__sheet" :class="sheetClass" :style="sheetStyle">
      <!-- ---------- 工具条 ---------- -->
      <view class="cd-picker__toolbar">
        <view class="cd-picker__action" hover-class="cd-picker__action--pressed" @click="handleCancel">
          <text class="cd-picker__action-text">{{ cancelText }}</text>
        </view>
        <text v-if="title" class="cd-picker__title">{{ title }}</text>
        <view class="cd-picker__action cd-picker__action--primary" hover-class="cd-picker__action--pressed" @click="handleConfirm">
          <text class="cd-picker__action-text cd-picker__action-text--primary">{{ confirmButtonText }}</text>
        </view>
      </view>

      <!-- ---------- 列 ---------- -->
      <view class="cd-picker__columns" :style="columnsStyle">
        <!-- 中间那条「选中窗口」：画在列之上、文字之下，靠 z-index 与 pointer-events:none 实现 -->
        <view class="cd-picker__window" :style="windowStyle" />

        <scroll-view
          v-for="(col, colIndex) in displayColumns"
          :key="colIndex"
          class="cd-picker__col"
          scroll-y
          :scroll-top="scrollTops[colIndex] || 0"
          :scroll-with-animation="true"
          :show-scrollbar="false"
          @scroll="noop"
        >
          <!-- 上下各垫 (VISIBLE_ROWS-1)/2 行，让首尾项也能滚到中间 -->
          <view class="cd-picker__pad" :style="padStyle" />
          <view
            v-for="(opt, optIndex) in col"
            :key="optionKey(opt, optIndex)"
            class="cd-picker__option"
            :class="optionClass(colIndex, opt)"
            hover-class="cd-picker__option--pressed"
            @click="handleOptionClick(colIndex, opt)"
          >
            <text class="cd-picker__option-text">{{ opt.label }}</text>
          </view>
          <view class="cd-picker__pad" :style="padStyle" />
        </scroll-view>

        <!-- ---------- 加载中 ---------- -->
        <view v-if="loading" class="cd-picker__loading">
          <cd-icon name="loader" :size="18" spin />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-picker —— 通用多列选择器
 * ---------------------------------------------------------------
 * 它是 date-picker / time-picker 之外的「第三块拼图」：
 * 那两个只能选日期和时间，业务里真正高频的是「选自定义数据」——
 * 品牌 → 车系 → 车型、一级分类 → 二级分类、仓库 → 库位……
 * 这类需求在没有通用 picker 的库里，只能靠多层 select 硬凑，
 * 联动逻辑全落到业务侧，每次都重写一遍。
 *
 * 四个实现决定：
 *
 * 1. 数据形态二选一，且必须显式声明。
 *    cascade=false（默认）：columns 是「列数组的数组」，每列互不相关。
 *    cascade=true：columns 是一棵树，后面每一列由前一列的选中项 children 展开。
 *    不做「检测到 children 就算级联」的自动推断 ——
 *    同一份数据在不同页面想要不同解释时，隐式推断会让人猜不透。
 *
 * 2. 列用 scroll-view + scroll-top 受控定位，不用原生 picker-view。
 *    picker-view 在 H5 与小程序上的样式与手感差异很大（H5 是滚轮、小程序是惯性滑动），
 *    且高度、行距、文字样式几乎不可控。scroll-view 两端表现一致，
 *    代价是要自己算 scrollTop —— 算法很简单：index * 行高 - 居中偏移。
 *
 * 3. 选中态与提交态分离。
 *    点选项只改「草稿」innerValues，点确定才 emit 到 modelValue。
 *    否则用户滑到一半、还没点确定，外部数据就已经被改了，
 *    而「取消」要还原成什么就成了个说不清的问题。
 *
 * 4. 级联时改动上游列要截断下游。
 *    选中「浙江」后列 2/3 是浙江的下级；此时改选「江苏」，
 *    列 2/3 必须整体重算，且之前选中的「西湖区」要丢掉 ——
 *    留着它会出现「江苏 / 西湖区」这种不存在的组合。
 *
 * 已知限制：
 *   - 列数超过 3 列时移动端会挤，由业务自行决定是否拆成两步；
 *   - 惯性滑动结束后的「吸附到整行」依赖 scroll-with-animation，
 *     小程序低端机在快速连续滑动时可能停不住整行（原生 picker-view 同样如此）。
 */
import { computed, ref, watch, onUnmounted } from 'vue'
import { useBreakpoint, resolveDesktopShape } from '../../composables/use-breakpoint'
import { useField } from '../../composables/use-field'
import { useEscLayer } from '../../composables/use-esc-stack'
import { raf } from '../../utils/raf'
import CdIcon from '../cd-icon/cd-icon.vue'

defineOptions({
  name: 'cd-picker',
  options: {
    addGlobalClass: true,
  },
})

const props = defineProps({
  /** 选中值数组，每列一个；级联模式下是「从根到叶」的路径。用 v-model 绑定 */
  modelValue: {
    type: Array,
    default: () => [],
  },
  /** 是否显示（弹层开关）。用 v-model:visible 绑定 */
  visible: {
    type: Boolean,
    default: false,
  },
  /**
   * 列数据。
   * cascade=false 时为「列数组的数组」：[[{label,value}],[{label,value}]]；
   * cascade=true 时为树：{label,value,children:[...]}
   */
  columns: {
    type: Array,
    default: () => [],
  },
  /** 是否按级联（树形）解释 columns。true 时后一列由前一列选中项的 children 展开 */
  cascade: {
    type: Boolean,
    default: false,
  },
  /** 工具条标题 */
  title: {
    type: String,
    default: '',
  },
  /** 取消按钮文案 */
  cancelText: {
    type: String,
    default: '取消',
  },
  /** 确定按钮文案 */
  confirmButtonText: {
    type: String,
    default: '确定',
  },
  /** 列视口高度（px）。行高固定 36，建议传 5 或 7 的倍数再乘行高 */
  visibleRows: {
    type: Number,
    default: 5,
  },
  /** 数据加载中：显示一个转圈并挡住列，避免用户点到还没到的数据 */
  loading: {
    type: Boolean,
    default: false,
  },
  /** 只读：可以打开看，但不能改 */
  readonly: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** auto / mobile / desktop。桌面端为居中面板，移动端为底部弹层 */
  shape: {
    type: String,
    default: 'auto',
  },
  /** 点击遮罩是否关闭 */
  closeOnClickMask: {
    type: Boolean,
    default: true,
  },
  /** 层级 */
  zIndex: {
    type: Number,
    default: 2200,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'update:visible', 'change', 'confirm', 'cancel'])

const { field, formDisabled, notifyChange, notifyBlur } = useField()

const { isPC } = useBreakpoint()
const desktopShape = computed(() => resolveDesktopShape(props.shape, isPC))
const isDisabled = computed(() => props.disabled || formDisabled.value)

/* -------------------- 常量 -------------------- */

const OPTION_HEIGHT = 36

/* -------------------- 草稿态 -------------------- */

/** 当前（未提交）的选中值：点选项改它，点确定才 emit 出去 */
const innerValues = ref([])
/** 每列的 scrollTop */
const scrollTops = ref([])

/** 打开弹层、或外部值变化时，把草稿同步成外部值 */
function syncFromModel() {
  innerValues.value = Array.isArray(props.modelValue) ? [...props.modelValue] : []
}

watch(() => props.modelValue, syncFromModel, { deep: false })
watch(() => props.visible, (v) => { if (v) syncFromModel() })

/* -------------------- 列数据展开 -------------------- */

/** 取一棵（或一列）里的子级列表 */
function childrenOf(list) {
  return Array.isArray(list) ? list : []
}

/**
 * 把 columns 解释成「列数组的数组」。
 * 级联模式下：第 n 列 = 第 n-1 列选中项的 children；
 * 一旦某级断了（没有 children），后面就不再有列。
 */
const displayColumns = computed(() => {
  if (!props.cascade) {
    const first = props.columns[0]
    /* 单列写法：[{label,value}] —— 外面不是数组包数组，这里补一层 */
    if (Array.isArray(first)) return props.columns
    return props.columns.length ? [props.columns] : []
  }

  const cols = []
  let level = props.columns
  /* 最多展开 32 层，防御业务数据里出现环 */
  for (let i = 0; i < 32 && Array.isArray(level) && level.length; i += 1) {
    cols.push(level)
    const picked = level.find((item) => item.value === innerValues.value[i])
    const next = picked ? picked.children : null
    if (!Array.isArray(next) || !next.length) break
    level = next
  }
  return cols
})

/* -------------------- 滚动定位 -------------------- */

/** 让第 colIndex 列的第 index 项停在中间 */
function scrollTo(colIndex, index) {
  /*
   * 居中由「上下垫片」承担：pad 高度 = (visibleRows-1)/2 行，
   * 所以把第 index 项推到窗口正中，只需要滚 index * 行高 ——
   * 不需要再减居中偏移，减了反而偏上一行。
   */
  const top = Math.max(0, index * OPTION_HEIGHT)
  const next = [...scrollTops.value]
  next[colIndex] = top
  scrollTops.value = next
}

/**
 * 把所有列滚到各自的选中项。
 *
 * resetFirst=true 时必须「先归零、下一帧再写目标值」两步走：
 * scroll-view 只在 scroll-top **发生变化**时才滚动，写入值与当前值相同
 * 会被直接忽略。关闭后用户滑到的位置仍留在 scrollTops 里，
 * 若目标值恰好等于它（例如用户就停在选中项附近），重新打开时不会滚动，
 * 面板就会停在用户上次滑到的位置而不是选中项。
 *
 * resetFirst=false（数据异步到达时用）：此时不该再归零 ——
 * 归零会让已经滚好的列先弹回顶部再滚回来，级联模式下每点一次都会看到
 * 这个回弹。新出现的列 scrollTops 本来就是空的，直接写目标值即可。
 */
function scrollAllToSelected(resetFirst) {
  if (!resetFirst) {
    writeTargets()
    return
  }
  scrollTops.value = displayColumns.value.map(() => 0)
  raf(writeTargets)
}

function writeTargets() {
  displayColumns.value.forEach((col, colIndex) => {
    const idx = col.findIndex((item) => item.value === innerValues.value[colIndex])
    scrollTo(colIndex, idx < 0 ? 0 : idx)
  })
}

watch(
  () => props.visible,
  (v) => {
    if (!v) return
    /* 等一帧再滚：弹层刚渲染时 scroll-view 还没有可滚动高度，
       此刻设 scroll-top 会被忽略 */
    raf(() => scrollAllToSelected(true))
  },
)

/*
 * columns 异步到达（接口返回 / 级联展开）时同样要定位一次：
 * 打开时数据还是空的，之后补进来就没人再滚了。
 * 这里不传 resetFirst —— 见 scrollAllToSelected 的注释。
 */
watch(displayColumns, () => {
  if (!props.visible) return
  raf(() => scrollAllToSelected(false))
})

/* -------------------- 交互 -------------------- */

function optionKey(opt, index) {
  return opt && opt.value !== undefined ? `${opt.value}` : `i-${index}`
}

function optionClass(colIndex, opt) {
  const active = opt && opt.value === innerValues.value[colIndex]
  return active ? 'cd-picker__option--active' : ''
}

function handleOptionClick(colIndex, opt) {
  if (isDisabled.value || props.readonly || props.loading || !opt) return

  const next = [...innerValues.value]
  next[colIndex] = opt.value

  /* 级联模式：改了上游，下游全部作废。
     不截断的话会留下「江苏 / 西湖区」这种不存在的组合 */
  if (props.cascade) next.length = colIndex + 1

  innerValues.value = next
  scrollTo(colIndex, displayColumns.value[colIndex].indexOf(opt))
}

function handleConfirm() {
  /* 禁用 / 只读同样要拦：它们只是不让改，但「确定」按钮此前没被挡住，
     于是只读面板上点确定仍会把草稿写回 modelValue */
  if (isDisabled.value || props.readonly || props.loading) return
  const value = [...innerValues.value]
  emit('update:modelValue', value)
  emit('change', value)
  emit('confirm', value)
  notifyChange(value)
  close()
}

function handleCancel() {
  /* 取消：草稿丢弃，外部值不变 */
  syncFromModel()
  emit('cancel')
  close()
}

function close() {
  emit('update:visible', false)
  notifyBlur()
}

function handleMaskClick() {
  if (!props.closeOnClickMask) return
  handleCancel()
}

function noop() {}

/* -------------------- Esc 与滚动锁 -------------------- */

const esc = useEscLayer(() => {
  if (!props.visible) return
  handleCancel()
})

/* 滚动锁：H5 端给 body 加锁；小程序端没有 body，由弹层自己的遮罩挡住滚动即可 */
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

watch(
  () => props.visible,
  (v) => {
    if (v) {
      esc.push()
      lockScroll()
    } else {
      esc.remove()
      unlockScroll()
    }
  },
)

onUnmounted(() => {
  unlockScroll()
})

/* -------------------- 样式 -------------------- */

/** 表单校验失败时的错误视觉：选中窗口转红底，用户一眼能定位到是哪个字段 */
const hasFormError = computed(() => !!(field && field.validateState && field.validateState.value === 'error'))

const rootClass = computed(() =>
  [
    desktopShape.value ? 'cd-picker--desktop' : 'cd-picker--mobile',
    isDisabled.value ? 'cd-picker--disabled' : '',
    hasFormError.value ? 'cd-picker--error' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const sheetClass = computed(() =>
  [props.loading ? 'cd-picker__sheet--loading' : '', props.visible ? 'cd-picker__sheet--in' : '']
    .filter(Boolean)
    .join(' ')
)

const maskStyle = computed(() => `z-index:${props.zIndex};`)
const sheetStyle = computed(() => `z-index:${props.zIndex};`)
const columnsStyle = computed(() => `height:${props.visibleRows * OPTION_HEIGHT}px;`)
const padStyle = computed(() => `height:${((props.visibleRows - 1) / 2) * OPTION_HEIGHT}px;`)
const windowStyle = computed(() => {
  const top = ((props.visibleRows - 1) / 2) * OPTION_HEIGHT
  return `top:${top}px;height:${OPTION_HEIGHT}px;`
})

defineExpose({
  /** 手动把某列滚到指定项（业务异步补数据时用） */
  scrollTo,
  /** 丢弃草稿、与外部值对齐 */
  reset: syncFromModel,
})
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-picker {
  @include cd-reset;

  /*
   * 根结点不占空间：mask 与 sheet 都是 position:fixed，靠自身定位出屏，
   * 根标签只作容器。这里不写 display:contents —— 小程序 WXSS 不保证支持它，
   * 空 view 本身就是零高度，不需要额外处理。
   */
}

/* ==================== 遮罩 ==================== */

.cd-picker__mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: var(--cd-bg-mask, rgba(15, 23, 42, 0.45));
  animation: cd-picker-mask-in 180ms ease-out;
}

/* ==================== 弹层 ==================== */

.cd-picker__sheet {
  position: fixed;
  background-color: var(--cd-bg-elevated, #ffffff);
  overflow: hidden;
}

/* 移动端：贴底，左右满宽 */
.cd-picker--mobile .cd-picker__sheet {
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: var(--cd-radius-lg, 12px) var(--cd-radius-lg, 12px) 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  animation: cd-picker-sheet-up 220ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* 桌面端：居中面板 */
.cd-picker--desktop .cd-picker__sheet {
  top: 50%;
  left: 50%;
  width: 420px;
  max-width: calc(100vw - 32px);
  border-radius: var(--cd-radius-lg, 12px);
  box-shadow: var(--cd-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.16));
  /* 不用 translate(-50%,-50%) 之外的写法：它是让未知尺寸居中的唯一可靠手段 */
  transform: translate(-50%, -50%);
  animation: cd-picker-sheet-in 180ms ease-out;
}

/* ==================== 工具条 ==================== */

.cd-picker__toolbar {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 var(--cd-space-4, 16px);
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
}

.cd-picker__title {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #0f172a);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cd-picker__action {
  flex-shrink: 0;
  min-width: 48px;
  cursor: pointer;
}

.cd-picker__action--primary {
  text-align: right;
}

.cd-picker__action-text {
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-secondary, #64748b);
}

.cd-picker__action-text--primary {
  color: var(--cd-color-primary, #3b76f6);
  font-weight: var(--cd-font-weight-semibold, 600);
}

.cd-picker__action:active .cd-picker__action-text {
  opacity: 0.6;
}

.cd-picker__action--pressed .cd-picker__action-text {
  opacity: 0.6;
}

@include cd-hover {
  .cd-picker__action:hover .cd-picker__action-text {
    color: var(--cd-color-primary, #3b76f6);
  }
}

/* ==================== 列 ==================== */

.cd-picker__columns {
  position: relative;
  display: flex;
  overflow: hidden;
}

.cd-picker__col {
  flex: 1;
  min-width: 0;
  height: 100%;
}

/* 列间分隔线：画在「后一列」的左边界上，不用 nth-child */
.cd-picker__col + .cd-picker__col {
  border-left: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
}

/* 中间那条选中窗口 */
.cd-picker__window {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 1;
  pointer-events: none;
  background-color: var(--cd-bg-sunken, #f8fafc);
  border-top: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #eef2f7);
}

/* 校验失败：选中窗口转浅红底 */
.cd-picker--error .cd-picker__window {
  background-color: var(--cd-color-danger-soft, #fef2f2);
}

.cd-picker__pad {
  width: 100%;
}

.cd-picker__option {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 var(--cd-space-2, 8px);
  cursor: pointer;
}

.cd-picker__option-text {
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-regular, #334155);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cd-picker__option--active .cd-picker__option-text {
  color: var(--cd-text-primary, #0f172a);
  font-weight: var(--cd-font-weight-semibold, 600);
}

.cd-picker__option:active .cd-picker__option-text {
  color: var(--cd-color-primary, #3b76f6);
}

.cd-picker__option--pressed .cd-picker__option-text {
  color: var(--cd-color-primary, #3b76f6);
}

@include cd-hover {
  .cd-picker__option:hover .cd-picker__option-text {
    color: var(--cd-color-primary, #3b76f6);
  }
}

/* ==================== 加载中 ==================== */

.cd-picker__loading {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--cd-bg-mask-light, rgba(255, 255, 255, 0.6));
}

.cd-picker__loading .cd-icon {
  color: var(--cd-color-primary, #3b76f6);
}

/* ==================== 动画 ==================== */

@keyframes cd-picker-mask-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes cd-picker-sheet-up {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

@keyframes cd-picker-sheet-in {
  from {
    opacity: 0;
    transform: translate(-50%, calc(-50% + 8px));
  }

  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
</style>
