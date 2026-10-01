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

/** 安全转 Date：'YYYY-MM-DD' 用显式分段解析，避免 iOS 对 'YYYY-MM-DD' 的时区歧义 */
export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (m) {
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
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
  return !!a && !!b && compareDay(a, b) === 0
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

/** 星期表头。weekStart = 1（周一）为默认，0 表示周日开头 */
export function weekLabels(weekStart = 1) {
  const base = ['日', '一', '二', '三', '四', '五', '六']
  if (weekStart === 0) return base
  return base.slice(1).concat(base[0])
}
