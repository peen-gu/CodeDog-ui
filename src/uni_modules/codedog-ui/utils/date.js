/**
 * CodeDogUI / 日期工具
 * ---------------------------------------------------------------
 * 全部纯函数：入参出参都是字符串或 Date，不碰组件、不碰 DOM。
 * 刻意保持可测试性 —— 日期计算是组件库里最容易出 off-by-one 的地方，
 * 纯函数意味着以后可以不挂组件就把边界测完。
 *
 * 统一约定：组件层传出的日期一律是 'YYYY-MM-DD' / 'HH:mm' 字符串，
 * Date 对象只在这个模块内部流转。
 */

/** 补零 */
export function pad(n) {
  return n < 10 ? `0${n}` : String(n)
}

/**
 * 'YYYY-MM-DD' 或 'YYYY-MM-DD HH:mm[:ss]'（也接受 T 分隔）。
 *
 * 正则必须锚到字符串末尾：只锚开头时，'2024-05-06 13:45' 的前半段就能匹配上，
 * 于是被当成纯日期解析成当天 00:00，时分秒静默丢掉 ——
 * 带时分的 date-picker 值会全部塌到零点。
 * 时间部分整段可选，且末尾带时区字母（如 ...Z）的 ISO 串会匹配失败，
 * 从而落到下面的 new Date(value) 分支交给引擎处理，这是期望行为。
 */
const DATE_TIME_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/

/** 安全转 Date：'YYYY-MM-DD' 用显式分段解析，避免 iOS 对 'YYYY-MM-DD' 的时区歧义 */
export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const m = value.match(DATE_TIME_RE)
    if (m) {
      /*
       * 构造完必须回读校验。
       * Date 的构造参数是「会溢出回滚」的：
       *   '2024-13-45' → 2025-02-13，'2024-02-30' → 2024-02-29
       * 不校验的话，业务把 min/max 传错一位数字也不会有任何提示，
       * 日历与日期选择器会静默用一个完全错误的边界。
       */
      const y = Number(m[1])
      const mo = Number(m[2])
      const d = Number(m[3])
      const h = Number(m[4] || 0)
      const mi = Number(m[5] || 0)
      const s = Number(m[6] || 0)
      const built = new Date(y, mo - 1, d, h, mi, s)
      const rolled =
        built.getFullYear() !== y || built.getMonth() !== mo - 1 || built.getDate() !== d
      return rolled ? null : built
    }
    const t = new Date(value)
    return Number.isNaN(t.getTime()) ? null : t
  }
  if (typeof value === 'number') {
    const t = new Date(value)
    return Number.isNaN(t.getTime()) ? null : t
  }
  return null
}

/** 格式化为 'YYYY-MM-DD' */
export function formatDate(date) {
  const d = toDate(date)
  if (!d) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 格式化为 'HH:mm' */
export function formatTime(date) {
  const d = toDate(date)
  if (!d) return ''
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 当月第一天是星期几（0 = 周日）。周一开头的日历用 weekStart 换算 */
export function firstWeekday(year, month, weekStart = 1) {
  const raw = new Date(year, month, 1).getDay()
  return (raw - weekStart + 7) % 7
}

/** 某月天数。month 传 0-11；new Date(y, m+1, 0) 的巧用：第 0 天即上月最后一天 */
export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

/** 加减月份数（自动处理 1/31 → 2/28 的溢出钳制） */
export function addMonths(date, delta) {
  const d = toDate(date)
  if (!d) return null
  const target = new Date(d.getFullYear(), d.getMonth() + delta, 1)
  const maxDay = daysInMonth(target.getFullYear(), target.getMonth())
  target.setDate(Math.min(d.getDate(), maxDay))
  return target
}

/** 加减天数 */
export function addDays(date, delta) {
  const d = toDate(date)
  if (!d) return null
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta)
  return target
}

/** 只比较「日」层面的先后，忽略时分秒 */
export function compareDay(a, b) {
  const da = toDate(a)
  const db = toDate(b)
  if (!da || !db) return 0
  const na = new Date(da.getFullYear(), da.getMonth(), da.getDate()).getTime()
  const nb = new Date(db.getFullYear(), db.getMonth(), db.getDate()).getTime()
  if (na < nb) return -1
  if (na > nb) return 1
  return 0
}

export function isSameDay(a, b) {
  /*
   * 必须先把两边都转成 Date 再比，不能只判 !!a && !!b。
   *
   * compareDay 在任一边解析失败时返回 0（表示「无从比较」），
   * 于是 isSameDay('bad', '2024-01-01') 会得到 true ——
   * 一个非法日期被判定为「与任意合法日期同一天」，
   * 日历会据此显示错误的选中态与高亮。
   */
  const da = toDate(a)
  const db = toDate(b)
  return !!da && !!db && compareDay(a, b) === 0
}

/** 是否是今天 */
export function isToday(date) {
  return isSameDay(date, new Date())
}

/** 钳制到 [min, max] 区间内；越界返回边界值，未越界返回原值 */
export function clampDay(date, min, max) {
  const d = toDate(date)
  if (!d) return null
  if (min && compareDay(d, min) < 0) return toDate(min)
  if (max && compareDay(d, max) > 0) return toDate(max)
  return d
}

/** 是否在 [min, max] 区间内（闭区间） */
export function inRange(date, min, max) {
  const d = toDate(date)
  if (!d) return false
  if (min && compareDay(d, min) < 0) return false
  if (max && compareDay(d, max) > 0) return false
  return true
}

/**
 * 构造日历网格（6 行 × 7 列）。
 * 空位补上月 / 下月的日期，组件层用 inCurrentMonth 标记区分渲染样式。
 */
export function buildMonthGrid(year, month, weekStart = 1) {
  const lead = firstWeekday(year, month, weekStart)
  const total = daysInMonth(year, month)
  const cells = []
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const prevDays = daysInMonth(prevYear, prevMonth)
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  for (let i = lead - 1; i >= 0; i -= 1) {
    cells.push({
      day: prevDays - i,
      month: prevMonth,
      year: prevYear,
      inCurrentMonth: false,
    })
  }
  for (let d = 1; d <= total; d += 1) {
    cells.push({ day: d, month, year, inCurrentMonth: true })
  }
  let tail = 42 - cells.length
  let nd = 1
  while (tail > 0) {
    cells.push({ day: nd, month: nextMonth, year: nextYear, inCurrentMonth: false })
    nd += 1
    tail -= 1
  }
  return cells
}

/**
 * 星期表头。weekStart = 1（周一）为默认，0 表示周日开头。
 *
 * 用「按 weekStart 切两段再拼接」的通用写法，而不是 `weekStart === 0 ? base : 平移一位`。
 * 后者只认 0 与非 0 两种情况：weekStart=2 会返回和 1 完全一样的结果，
 * 表头与网格错位（第一列写着「一」，实际排的却是周二）。
 */
export function weekLabels(weekStart = 1) {
  const base = ['日', '一', '二', '三', '四', '五', '六']
  const start = ((weekStart % 7) + 7) % 7
  return base.slice(start).concat(base.slice(0, start))
}
