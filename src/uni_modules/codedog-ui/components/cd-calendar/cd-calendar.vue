<template>
  <view class="cd-calendar" :class="rootClass">
    <!-- ==================== 年月标题 + 上/下月 ==================== -->
    <view v-if="showTitle" class="cd-calendar__header">
      <view
        class="cd-calendar__nav"
        :class="canPrev ? 'cd-calendar__nav--enabled' : 'cd-calendar__nav--disabled'"
        :hover-class="canPrev ? navPressClass : 'none'"
        @click="shiftMonth(-1)"
      >
        <cd-icon class="cd-calendar__nav-icon" name="chevron-left" :size="16" />
      </view>

      <view class="cd-calendar__title">
        <slot name="title" :year="viewYear" :month="viewMonth + 1" :text="titleText">
          <text class="cd-calendar__title-text">{{ titleText }}</text>
        </slot>
      </view>

      <view
        class="cd-calendar__nav"
        :class="canNext ? 'cd-calendar__nav--enabled' : 'cd-calendar__nav--disabled'"
        :hover-class="canNext ? navPressClass : 'none'"
        @click="shiftMonth(1)"
      >
        <cd-icon class="cd-calendar__nav-icon" name="chevron-right" :size="16" />
      </view>
    </view>

    <!-- ==================== 星期表头 ====================
         周末不是靠 nth-child 判断的 —— 小程序 WXSS 对 nth-child 支持不稳，
         且 weekStart 可变时「第几个是周末」本来就会变。
         所以周末在 weekRow 数据里就预先算好，模板只做类名映射。 -->
    <view v-if="showSubtitle" class="cd-calendar__week">
      <text
        v-for="(item, i) in weekRow"
        :key="i"
        class="cd-calendar__week-label"
        :class="item.isWeekend ? 'cd-calendar__week-label--weekend' : ''"
      >{{ item.label }}</text>
    </view>

    <!-- ==================== 日期网格 ====================
         按「行」渲染：一行的相邻兄弟选择器就能画行分隔线，
         不需要 nth-child(7n) 这种在小程序上不可靠的写法。 -->
    <view class="cd-calendar__body">
      <view v-for="(row, rowIndex) in rows" :key="rowIndex" class="cd-calendar__row">
        <view
          v-for="(cell, cellIndex) in row"
          :key="cellIndex"
          class="cd-calendar__cell"
          :class="cellClass(cell)"
          :hover-class="pressClassFor(cell)"
          @click="handleCellClick(cell)"
        >
          <slot v-if="cell.type !== 'placeholder'" name="cell" :cell="cell">
            <view class="cd-calendar__cell-inner">
              <text class="cd-calendar__cell-day">{{ cell.text }}</text>
              <text
                v-if="cell.mark && cell.mark.type === 'text' && cell.mark.text"
                class="cd-calendar__cell-mark"
              >{{ cell.mark.text }}</text>
              <view v-else-if="cell.mark && cell.mark.type === 'dot'" class="cd-calendar__cell-dot" />
            </view>
          </slot>
        </view>
      </view>
    </view>

    <!-- ==================== 底部 ==================== -->
    <view v-if="showConfirm || $slots.footer" class="cd-calendar__footer">
      <slot name="footer" :value="currentValue">
        <cd-button
          v-if="showConfirm"
          type="primary"
          size="small"
          block
          :disabled="!canConfirm"
          @click="handleConfirm"
        >{{ confirmText }}</cd-button>
      </slot>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-calendar —— 日历（单选 / 多选 / 区间）
 * ---------------------------------------------------------------
 * 关键实现决策：
 *
 * 1) 常驻面板优先，不做「下拉触发器」。
 *    本组件只负责日历本体：标题、星期、网格、确认按钮。
 *    需要下拉形态时由外层（popup / popover）包裹它即可 ——
 *    日历自己再包一层浮层定位、滚动收起、遮挡层，会让同一个组件
 *    背上两套生命周期。shape 只用来切换触摸密度（格子高度 / 字号），
 *    沿用库内的 resolveDesktopShape，PC 上更紧凑、移动端手指更好点。
 *
 * 2) 日期计算全部走 utils/date.js。
 *    firstWeekday / daysInMonth 算网格，compareDay 判先后，
 *    inRange 判 min/max，clampDay 定位初始月份。
 *    一行日期算法都不自己写 —— 月初是周几、跨月进位、1/31→2/28 这类
 *    off-by-one 全在纯函数里被单独验证过了。
 *
 * 3) 三种模式共用一套「草稿 → 提交」状态机。
 *    点击只改草稿；showConfirm 为 false 时立刻提交（区间要选满两端），
 *    为 true 时等点「确定」再 emit。
 *    这样 modelValue 永远是「已经确定的值」，父级不会收到残缺的区间。
 *    代价是 showConfirm=true 时单次点击不会更新 v-model —— 这是刻意的，
 *    与「确认按钮存在即代表需要确认」的语义一致。
 *
 * 4) 草稿数组用「普通数组 + version ref」。
 *    draftList / draftRange 是可变数组，如果放进 ref()，
 *    push / splice 之后引用没变，按引用比对的计算属性不会重算。
 *    所以数组保持普通变量，另用一个 draftVersion 手动 bump，
 *    计算属性通过 readDraft() 读到版本号才接上响应式链。
 *
 * 5) 网格用占位格而不是补上/下月日期。
 *    前置空位与末排空位都是 type:'placeholder' 的空格子（不可点），
 *    视觉上当月边界干净；想要「前后月日期可点」的场景等有需求再开开关。
 *
 * 6) cell.type 的优先级：选中态 → min/max 越界 → formatter。
 *    formatter 最后执行，因此它可以改文案、把任意一天改成 disabled，
 *    也可以把越界的日期重新放开（最终判定以它返回的 type 为准）。
 *
 * 已知限制：
 *   - 只做「月」视图，没有年/月快速选择器，也没有滑动切换手势；
 *   - 外部改 modelValue 不会把面板翻到对应月份（仅初始化时定位一次），
 *     否则用户正在翻月时被外部值拽走会很突兀；
 *   - maxRange 判定的是「起止相隔天数」，不是「包含的自然日数」；
 *   - marks 的 type:'custom' 默认不渲染任何东西，交给 cell 插槽。
 */
import { computed, ref, watch } from 'vue'
import { useBreakpoint, resolveDesktopShape } from '../../composables/use-breakpoint'
import { useField } from '../../composables/use-field'
import { isH5 } from '../../composables/use-platform'
import {
  toDate,
  formatDate,
  firstWeekday,
  daysInMonth,
  addMonths,
  addDays,
  compareDay,
  isToday,
  inRange,
  clampDay,
  weekLabels,
} from '../../utils/date'
import CdButton from '../cd-button/cd-button.vue'
import CdIcon from '../cd-icon/cd-icon.vue'

defineOptions({
  name: 'cd-calendar',
  options: {
    addGlobalClass: true,
  },
})

const props = defineProps({
  /**
   * 选中值。single 模式为 'YYYY-MM-DD'；multiple 模式为字符串数组；
   * range 模式为 [start, end] 二元组（未选完时可以是长度 0/1 的数组）。
   * 也接受 Date 与时间戳，内部统一格式化成 'YYYY-MM-DD'。
   */
  modelValue: {
    type: [String, Number, Date, Array],
    default: '',
  },
  /** 选择模式：single（单选）/ multiple（多选）/ range（区间） */
  mode: {
    type: String,
    default: 'single',
  },
  /** 可选最小日期 'YYYY-MM-DD' */
  minDate: {
    type: String,
    default: '',
  },
  /** 可选最大日期 'YYYY-MM-DD' */
  maxDate: {
    type: String,
    default: '',
  },
  /**
   * 一周从周几开始：0 = 周日，1 = 周一。
   * 默认与 cd-date-picker 对齐取 1（国内习惯）——
   * 早先是 0，同页同时放日历和日期选择器时两个星期表头顺序不一致。
   */
  weekStart: {
    type: Number,
    default: 1,
  },
  /** range 模式下是否允许起止为同一天 */
  allowSameDay: {
    type: Boolean,
    default: false,
  },
  /** range 模式起止相隔天数的上限，0 表示不限制 */
  maxRange: {
    type: Number,
    default: 0,
  },
  /**
   * 打点标记。每项形如 { date: 'YYYY-MM-DD', text?: string, type?: 'dot'|'text'|'custom' }；
   * dot 默认渲染一个小圆点，text 渲染底部小字，custom 不渲染、交给 cell 插槽
   */
  marks: {
    type: Array,
    default: () => [],
  },
  /**
   * 单元格格式化函数 (cell) => cell。
   * cell 形如 { date, text, type: 'normal'|'disabled'|'selected'|'start'|'end'|'middle', isWeekend, isToday }，
   * 可改文案、把某天改成 disabled，或返回全新的 cell 对象
   */
  formatter: {
    type: Function,
    default: null,
  },
  /** 是否显示确认按钮。为 false 时点击日期即提交（range 需选满两端才提交） */
  showConfirm: {
    type: Boolean,
    default: true,
  },
  /** 显示年月标题 */
  showTitle: {
    type: Boolean,
    default: true,
  },
  /** 显示星期表头 */
  showSubtitle: {
    type: Boolean,
    default: true,
  },
  /** 确认按钮文案 */
  confirmText: {
    type: String,
    default: '确定',
  },
  /** 只读：可浏览不可选择 */
  readonly: {
    type: Boolean,
    default: false,
  },
  /** 形态：auto（跟随视口）/ mobile / desktop。仅影响格子密度，本组件默认是常驻面板 */
  shape: {
    type: String,
    default: 'auto',
  },
  /** 追加到根节点的类名，便于业务做局部覆盖 */
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'confirm', 'select', 'panel-change'])

/**
 * 表单接线（可选依赖）。
 * 此前 cd-calendar 完全没有接 useField：<cd-form disabled> 对它无效
 * （别的控件都禁用了、日历还能点），选完也不会触发校验。
 */
const { formDisabled, notifyChange, notifyBlur } = useField()

const { isPC } = useBreakpoint()
const desktopShape = computed(() => resolveDesktopShape(props.shape, isPC))

/** 表单禁用等价于只读：可浏览，不可选择 */
const isDisabled = computed(() => props.readonly || formDisabled.value)

const rootClass = computed(() =>
  [
    desktopShape.value ? 'cd-calendar--desktop' : 'cd-calendar--mobile',
    props.readonly ? 'cd-calendar--readonly' : '',
    isDisabled.value ? 'cd-calendar--disabled' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

/**
 * 按压态双写：H5 交给 CSS :active（:hover 只在精确指针下生效），
 * 小程序端 WXSS 的 :active 不可靠，改用 hover-class。
 * H5 必须显式写 'none'，否则 uni-app 用鼠标事件模拟的 hover-class
 * 会和 :hover 叠出脏效果。
 */
const cellPressClass = isH5 ? 'none' : 'cd-calendar__cell--pressed'
const navPressClass = isH5 ? 'none' : 'cd-calendar__nav--pressed'

/* -------------------- 面板年月 -------------------- */

const MONTH_CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

const titleText = computed(() => `${viewYear.value} 年 ${MONTH_CN[viewMonth.value]} 月`)

const weekRow = computed(() => {
  const labels = weekLabels(props.weekStart)
  /* 周末在数据层算好：表头的第 i 格对应真实星期 (i + weekStart) % 7 */
  return labels.map((label, i) => {
    const raw = (i + props.weekStart) % 7
    return { label, isWeekend: raw === 0 || raw === 6 }
  })
})

const canPrev = computed(() => {
  if (!props.minDate) return true
  const target = addMonths(new Date(viewYear.value, viewMonth.value, 1), -1)
  if (!target) return true
  const last = new Date(target.getFullYear(), target.getMonth(), daysInMonth(target.getFullYear(), target.getMonth()))
  return compareDay(last, props.minDate) >= 0
})

const canNext = computed(() => {
  if (!props.maxDate) return true
  const target = addMonths(new Date(viewYear.value, viewMonth.value, 1), 1)
  if (!target) return true
  return compareDay(new Date(target.getFullYear(), target.getMonth(), 1), props.maxDate) <= 0
})

function shiftMonth(delta) {
  if (delta < 0 && !canPrev.value) return
  if (delta > 0 && !canNext.value) return
  const target = addMonths(new Date(viewYear.value, viewMonth.value, 1), delta)
  if (!target) return
  viewYear.value = target.getFullYear()
  viewMonth.value = target.getMonth()
  /* 对外统一给 1-12 的自然月，内部始终是 0-11 */
  emit('panel-change', viewYear.value, viewMonth.value + 1)
}

/* -------------------- 草稿选择态 -------------------- */

/**
 * single 是字符串，用 ref 即可；
 * multiple / range 是会被 push / splice 的数组，
 * 刻意保持「普通数组 + version ref」——放进 ref() 反而会因为引用不变而不触发更新。
 */
const draftSingle = ref('')
let draftList = []
let draftRange = []
const draftVersion = ref(0)

function bumpDraft() {
  draftVersion.value += 1
}

/** 读草稿的唯一入口：读了 version 才能把普通数组接进响应式链 */
function readDraft() {
  return {
    v: draftVersion.value,
    single: draftSingle.value,
    list: draftList,
    range: draftRange,
  }
}

function toDayString(value) {
  return formatDate(toDate(value))
}

function syncDraft() {
  if (props.mode === 'range') {
    const arr = Array.isArray(props.modelValue) ? props.modelValue : []
    draftRange = arr.map(toDayString).filter(Boolean).slice(0, 2)
  } else if (props.mode === 'multiple') {
    const arr = Array.isArray(props.modelValue)
      ? props.modelValue
      : props.modelValue
        ? [props.modelValue]
        : []
    draftList = arr.map(toDayString).filter(Boolean)
  } else {
    draftSingle.value = toDayString(Array.isArray(props.modelValue) ? props.modelValue[0] : props.modelValue)
  }
  bumpDraft()
}

/** 对外值：multiple 按日期升序，range 原样（起点在前），single 是字符串 */
const currentValue = computed(() => {
  const draft = readDraft()
  if (props.mode === 'range') return draft.range.slice()
  if (props.mode === 'multiple') return draft.list.slice().sort((a, b) => compareDay(a, b))
  return draft.single
})

const canConfirm = computed(() => {
  const draft = readDraft()
  if (props.mode === 'range') return draft.range.length === 2
  if (props.mode === 'multiple') return draft.list.length > 0
  return !!draft.single
})

/* -------------------- 网格 -------------------- */

const markMap = computed(() => {
  const map = {}
  const list = Array.isArray(props.marks) ? props.marks : []
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i]
    if (!item || !item.date) continue
    const key = toDayString(item.date)
    if (!key) continue
    map[key] = { text: item.text || '', type: item.type || 'dot' }
  }
  return map
})

function makePlaceholder() {
  return {
    date: '',
    text: '',
    type: 'placeholder',
    isWeekend: false,
    isToday: false,
    mark: null,
    isStart: false,
    isEnd: false,
  }
}

function makeCell(year, month, day, draft, marks) {
  const d = new Date(year, month, day)
  const date = formatDate(d)
  const weekday = d.getDay()
  const cell = {
    date,
    text: String(day),
    type: 'normal',
    isWeekend: weekday === 0 || weekday === 6,
    isToday: isToday(d),
    mark: marks[date] || null,
    isStart: false,
    isEnd: false,
  }

  /* ① 选中态 */
  if (props.mode === 'range') {
    const start = draft.range[0] || ''
    const end = draft.range[1] || ''
    if (start && compareDay(date, start) === 0) {
      cell.type = 'start'
      cell.isStart = true
    }
    if (end && compareDay(date, end) === 0) {
      cell.isEnd = true
      if (!cell.isStart) cell.type = 'end'
    }
    if (start && end && compareDay(date, start) > 0 && compareDay(date, end) < 0) {
      cell.type = 'middle'
    }
  } else if (props.mode === 'multiple') {
    if (draft.list.indexOf(date) >= 0) cell.type = 'selected'
  } else if (draft.single && compareDay(date, draft.single) === 0) {
    cell.type = 'selected'
  }

  /* ② 越界禁用 */
  if (!inRange(d, props.minDate, props.maxDate)) cell.type = 'disabled'

  /* ③ formatter 最终说了算：允许原地改，也允许返回新对象 */
  if (typeof props.formatter === 'function') {
    const next = props.formatter(cell)
    if (next && typeof next === 'object') return next
  }
  return cell
}

const grid = computed(() => {
  const year = viewYear.value
  const month = viewMonth.value
  const draft = readDraft()
  const marks = markMap.value

  const lead = firstWeekday(year, month, props.weekStart)
  const total = daysInMonth(year, month)
  const cells = []

  for (let i = 0; i < lead; i += 1) cells.push(makePlaceholder())
  for (let day = 1; day <= total; day += 1) cells.push(makeCell(year, month, day, draft, marks))
  /* 末排补齐：否则最后一行会缺一块，看起来像掉了一行格子 */
  const rest = cells.length % 7
  if (rest > 0) {
    for (let i = 0; i < 7 - rest; i += 1) cells.push(makePlaceholder())
  }
  return cells
})

/** 每 7 格切一行：行与行之间用相邻兄弟选择器画分隔线，不碰 nth-child */
const rows = computed(() => {
  const list = grid.value
  const out = []
  for (let i = 0; i < list.length; i += 7) out.push(list.slice(i, i + 7))
  return out
})

/* -------------------- 交互 -------------------- */

function isEnabled(cell) {
  if (isDisabled.value) return false
  return cell.type !== 'placeholder' && cell.type !== 'disabled'
}

function cellClass(cell) {
  const list = []
  if (cell.type === 'placeholder') {
    list.push('cd-calendar__cell--placeholder')
    return list
  }
  if (isEnabled(cell)) list.push('cd-calendar__cell--enabled')
  if (cell.isWeekend) list.push('cd-calendar__cell--weekend')
  if (cell.isToday) list.push('cd-calendar__cell--today')
  if (cell.type === 'disabled') {
    list.push('cd-calendar__cell--disabled')
  } else if (cell.type === 'selected') {
    list.push('cd-calendar__cell--selected')
  } else if (cell.type === 'start') {
    list.push('cd-calendar__cell--start')
    /* 起止同一天时同时带上 end，让底色带两侧都收口 */
    if (cell.isEnd) list.push('cd-calendar__cell--end')
  } else if (cell.type === 'end') {
    list.push('cd-calendar__cell--end')
  } else if (cell.type === 'middle') {
    list.push('cd-calendar__cell--middle')
  }
  if (cell.mark) list.push('cd-calendar__cell--marked')
  return list
}

function pressClassFor(cell) {
  return isEnabled(cell) ? cellPressClass : 'none'
}

function pickRange(date) {
  /* 空 / 已选满 → 这一次点击重新开始 */
  if (draftRange.length === 0 || draftRange.length === 2) {
    draftRange = [date]
    return
  }
  const start = draftRange[0]
  const cmp = compareDay(date, start)
  /* 比起点更早 → 以它为新起点，而不是生成一段倒序区间 */
  if (cmp < 0) {
    draftRange = [date]
    return
  }
  /* 同一天：不允许时视为重新起算，允许时就是长度为 0 的区间 */
  if (cmp === 0 && !props.allowSameDay) {
    draftRange = [date]
    return
  }
  /* 超跨度也重新起算：直接忽略会让用户以为点了没反应 */
  if (props.maxRange > 0 && compareDay(addDays(start, props.maxRange), date) < 0) {
    draftRange = [date]
    return
  }
  draftRange = [start, date]
}

function pickMultiple(date) {
  const at = draftList.indexOf(date)
  if (at >= 0) {
    draftList.splice(at, 1)
    return
  }
  draftList.push(date)
}

function handleCellClick(cell) {
  if (cell.type === 'placeholder') return
  /* 禁用态也把 select 抛出去：调用方常常要提示「这一天不可选」 */
  emit('select', cell)
  if (isDisabled.value || cell.type === 'disabled') return

  const date = cell.date
  if (props.mode === 'range') pickRange(date)
  else if (props.mode === 'multiple') pickMultiple(date)
  else draftSingle.value = date

  bumpDraft()
  commitIfAuto()
}

/** showConfirm=false 时点击即提交；区间的中间态（只选了起点）不外泄 */
function commitIfAuto() {
  if (props.showConfirm) return
  if (props.mode === 'range' && draftRange.length < 2) return
  commit(currentValue.value)
}

function commit(value) {
  emit('update:modelValue', value)
  emit('change', value)
  /* 接入校验链：不回报的话套在表单里选完日期，必填/自定义规则的
     错误文案不会消失（showConfirm=false 时更是完全不触发校验） */
  notifyChange(value)
}

function handleConfirm() {
  const value = currentValue.value
  commit(value)
  emit('confirm', value)
  /* 点「确定」等于这次交互结束，同时回报 blur，
     与 cd-select 的「关闭即失焦」保持同一套语义 */
  notifyBlur()
}

/* -------------------- 与 modelValue 同步 -------------------- */

function resetView() {
  const draft = readDraft()
  let base = null
  if (props.mode === 'range') base = toDate(draft.range[0])
  else if (props.mode === 'multiple') base = toDate(draft.list[0])
  else base = toDate(draft.single)
  if (!base) base = clampDay(new Date(), props.minDate, props.maxDate)
  if (!base) base = new Date()
  viewYear.value = base.getFullYear()
  viewMonth.value = base.getMonth()
}

/* deep：modelValue 是数组时父级可能原地 push */
watch(() => props.modelValue, syncDraft, { deep: true })
/* 切换模式相当于换了一套状态机，草稿与面板一起归位 */
watch(() => props.mode, () => {
  syncDraft()
  resetView()
})

syncDraft()
resetView()
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-calendar {
  @include cd-reset;

  /* 组件级令牌：桌面更紧凑，移动端给手指留更大的点按区 */
  --cd-cal-cell-height: 48px;
  --cd-cal-day-size: 34px;
  --cd-cal-padding: var(--cd-space-3, 12px);

  display: block;
  width: 100%;
  padding: var(--cd-cal-padding, 12px);
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: var(--cd-radius-lg, 12px);
  color: var(--cd-text-regular, #334155);
  font-size: var(--cd-font-size-base, 14px);
  user-select: none;
}

.cd-calendar--desktop {
  --cd-cal-cell-height: 40px;
  --cd-cal-day-size: 30px;
}

/* ==================== 标题与翻月 ==================== */

.cd-calendar__header {
  display: flex;
  align-items: center;
  margin-bottom: var(--cd-space-2, 8px);
}

.cd-calendar__title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cd-calendar__title-text {
  font-size: var(--cd-font-size-md, 16px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #0f172a);
}

.cd-calendar__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--cd-radius-sm, 4px);
  color: var(--cd-text-secondary, #64748b);
}

.cd-calendar__nav--enabled {
  cursor: pointer;
}

.cd-calendar__nav--disabled {
  color: var(--cd-text-disabled, #cbd5e1);
  cursor: not-allowed;
}

@include cd-hover {
  .cd-calendar__nav--enabled:hover {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
    color: var(--cd-text-primary, #0f172a);
  }
}

/* 按压态：H5 走 :active，小程序走 hover-class 挂上的 --pressed */
.cd-calendar__nav--enabled:active,
.cd-calendar__nav--enabled.cd-calendar__nav--pressed {
  background-color: var(--cd-bg-active, rgba(15, 23, 42, 0.08));
}

/* ==================== 星期表头 ==================== */

.cd-calendar__week {
  display: flex;
  align-items: center;
  padding-bottom: var(--cd-space-1, 4px);
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #f1f5f9);
}

.cd-calendar__week-label {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: var(--cd-font-size-xs, 11px);
  line-height: 24px;
  color: var(--cd-text-placeholder, #94a3b8);
}

/* 周末在数据里已标记，这里只做类名映射 */
.cd-calendar__week-label--weekend {
  color: var(--cd-text-secondary, #64748b);
}

/* ==================== 网格 ==================== */

.cd-calendar__body {
  display: block;
  padding-top: var(--cd-space-1, 4px);
}

.cd-calendar__row {
  display: flex;
  align-items: center;
}

/* 行分隔线走相邻兄弟选择器：不依赖 nth-child，小程序端行为一致 */
.cd-calendar__row + .cd-calendar__row {
  border-top: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #f1f5f9);
}

.cd-calendar__cell {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--cd-cal-cell-height, 48px);
}

.cd-calendar__cell--enabled {
  cursor: pointer;
}

.cd-calendar__cell--disabled {
  cursor: not-allowed;
}

.cd-calendar__cell--placeholder {
  cursor: default;
}

/* 表单禁用：格子不可点，指针与禁用格一致 */
.cd-calendar--disabled .cd-calendar__cell {
  cursor: not-allowed;
}

.cd-calendar__cell-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: var(--cd-cal-day-size, 34px);
  min-height: var(--cd-cal-day-size, 34px);
  padding: 0 var(--cd-space-1, 4px);
  border-radius: var(--cd-radius-round, 999px);
  transition: background-color var(--cd-duration-fast, 150ms) var(--cd-ease-in-out, ease);
}

.cd-calendar__cell-day {
  font-size: var(--cd-font-size-base, 14px);
  line-height: 1.25;
  color: var(--cd-text-regular, #334155);
}

.cd-calendar__cell--weekend .cd-calendar__cell-day {
  color: var(--cd-text-primary, #0f172a);
}

.cd-calendar__cell--today .cd-calendar__cell-day {
  color: var(--cd-color-primary, #3b76f6);
  font-weight: var(--cd-font-weight-semibold, 600);
}

/* 打点 / 底部小字 */
.cd-calendar__cell-dot {
  width: 4px;
  height: 4px;
  margin-top: 2px;
  border-radius: 50%;
  background-color: var(--cd-color-danger, #ef4444);
}

.cd-calendar__cell-mark {
  margin-top: 1px;
  font-size: var(--cd-font-size-xs, 11px);
  line-height: 1.25;
  color: var(--cd-text-secondary, #64748b);
}

/* ------------------------------------------------------------------
 * 选中态
 * 区间底色画在「格子」上（整格通铺），主色圆角块画在 inner 上，
 * 于是中间段的底色带是连续的，两端各自收口。
 * ---------------------------------------------------------------- */
.cd-calendar__cell--selected .cd-calendar__cell-inner {
  background-color: var(--cd-color-primary, #3b76f6);
}

.cd-calendar__cell--selected .cd-calendar__cell-day {
  color: var(--cd-text-inverse, #ffffff);
}

.cd-calendar__cell--middle {
  background-color: var(--cd-color-primary-soft, #eff5ff);
}

.cd-calendar__cell--middle .cd-calendar__cell-day {
  color: var(--cd-color-primary, #3b76f6);
}

.cd-calendar__cell--start {
  background-color: var(--cd-color-primary-soft, #eff5ff);
  border-top-left-radius: var(--cd-radius-round, 999px);
  border-bottom-left-radius: var(--cd-radius-round, 999px);
}

.cd-calendar__cell--end {
  background-color: var(--cd-color-primary-soft, #eff5ff);
  border-top-right-radius: var(--cd-radius-round, 999px);
  border-bottom-right-radius: var(--cd-radius-round, 999px);
}

/* 起止同一天：底色带两侧都收口等于一个光环，不如直接去掉 */
.cd-calendar__cell--start.cd-calendar__cell--end {
  background-color: transparent;
}

.cd-calendar__cell--start .cd-calendar__cell-inner,
.cd-calendar__cell--end .cd-calendar__cell-inner {
  background-color: var(--cd-color-primary, #3b76f6);
}

.cd-calendar__cell--start .cd-calendar__cell-day,
.cd-calendar__cell--end .cd-calendar__cell-day {
  color: var(--cd-text-inverse, #ffffff);
}

.cd-calendar__cell--disabled .cd-calendar__cell-day {
  color: var(--cd-text-disabled, #cbd5e1);
}

.cd-calendar__cell--selected .cd-calendar__cell-dot {
  background-color: var(--cd-text-inverse, #ffffff);
}

.cd-calendar__cell--selected .cd-calendar__cell-mark,
.cd-calendar__cell--start .cd-calendar__cell-mark,
.cd-calendar__cell--end .cd-calendar__cell-mark {
  color: var(--cd-text-inverse, #ffffff);
}

/* ------------------------------------------------------------------
 * 悬停 / 按压：hover 只在精确指针下生效，按压三端各走一路
 *   - H5 悬停 → :hover（包在 cd-hover 里）
 *   - H5 按下 → :active
 *   - 小程序按下 → hover-class 带上的 --pressed
 * 选中态的 hover/active 单独压深一档，避免被普通态覆盖成浅色
 * ---------------------------------------------------------------- */
@include cd-hover {
  .cd-calendar__cell--enabled:hover .cd-calendar__cell-inner {
    background-color: var(--cd-bg-hover, rgba(15, 23, 42, 0.04));
  }

  .cd-calendar__cell--selected:hover .cd-calendar__cell-inner,
  .cd-calendar__cell--start:hover .cd-calendar__cell-inner,
  .cd-calendar__cell--end:hover .cd-calendar__cell-inner {
    background-color: var(--cd-color-primary-hover, #2560eb);
  }
}

.cd-calendar__cell--enabled:active .cd-calendar__cell-inner,
.cd-calendar__cell--enabled.cd-calendar__cell--pressed .cd-calendar__cell-inner {
  background-color: var(--cd-bg-active, rgba(15, 23, 42, 0.08));
}

.cd-calendar__cell--selected:active .cd-calendar__cell-inner,
.cd-calendar__cell--start:active .cd-calendar__cell-inner,
.cd-calendar__cell--end:active .cd-calendar__cell-inner,
.cd-calendar__cell--selected.cd-calendar__cell--pressed .cd-calendar__cell-inner,
.cd-calendar__cell--start.cd-calendar__cell--pressed .cd-calendar__cell-inner,
.cd-calendar__cell--end.cd-calendar__cell--pressed .cd-calendar__cell-inner {
  background-color: var(--cd-color-primary-active, #1d4cd8);
}

/* ==================== 底部 ==================== */

.cd-calendar__footer {
  margin-top: var(--cd-space-2, 8px);
  padding-top: var(--cd-space-3, 12px);
  border-top: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #f1f5f9);
}
</style>
