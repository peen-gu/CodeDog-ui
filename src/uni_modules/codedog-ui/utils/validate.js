/**
 * CodeDogUI / 校验内核
 * ---------------------------------------------------------------
 * 抽成独立模块而不是写进组件的原因：
 * cd-form（整体校验）与 cd-form-item（单项校验）都需要同一套规则求值逻辑，
 * 复制两份必然会在某次修 bug 时只改一份。
 *
 * 设计取向：**只依赖 Promise，不依赖任何 Vue API**。
 * 这样这段逻辑可以脱离组件单独测试，也不会在小程序端引入额外的响应式开销。
 */

/**
 * 空值判定。
 * 注意 0 与 false 不算空值 —— 这是数字型字段（数量、金额）最容易踩的坑：
 * 用 `if (!value)` 判断会把「数量填了 0」误判成「未填写」。
 */
export function isValueEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  /*
   * NaN 必须算空值。
   * 业务把 Number(未填的输入框) 写进 model 就会得到 NaN，
   * 而 NaN 既不是 null 也不是空串 —— 不拦住它的话，
   * { required: true } 会判定「已填写」并放行，NaN 直接被提交上去。
   */
  if (typeof value === 'number' && Number.isNaN(value)) return true
  return false
}

/**
 * 统一规则写法：
 *   rules 为单条规则时也允许，不必强制写成数组
 *   过滤掉 null / undefined，方便业务用条件表达式拼规则
 */
export function normalizeRules(rules) {
  if (!rules) return []
  const list = Array.isArray(rules) ? rules : [rules]
  return list.filter(Boolean)
}

/**
 * 按路径取值，支持 'user.name' 这类嵌套。
 * 表单模型常常是嵌套对象，没有这个能力就只能要求业务把数据结构拍平。
 */
export function getValueByPath(source, path) {
  if (!source || !path) return undefined
  if (path.indexOf('.') === -1) return source[path]
  return path.split('.').reduce((acc, key) => (acc === null || acc === undefined ? undefined : acc[key]), source)
}

/**
 * 用路径写值，用于 resetFields 还原初始值。
 */
export function setValueByPath(target, path, value) {
  if (!target || !path) return
  const keys = path.split('.')
  let cursor = target
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i]
    if (cursor[key] === null || cursor[key] === undefined || typeof cursor[key] !== 'object') {
      cursor[key] = {}
    }
    cursor = cursor[key]
  }
  cursor[keys[keys.length - 1]] = value
}

/** 规则的 trigger 允许写成字符串或数组 */
export function matchTrigger(rule, trigger) {
  if (!trigger) return true
  if (!rule.trigger) return true
  const triggers = Array.isArray(rule.trigger) ? rule.trigger : [rule.trigger]
  return triggers.indexOf(trigger) > -1
}

/** 给默认提示语兜底，避免业务忘写 message 时弹出空白提示 */
function fallbackMessage(rule, label) {
  const name = label || '该字段'
  if (rule.required) return `${name}不能为空`
  if (rule.pattern) return `${name}格式不正确`
  if (rule.len !== undefined) return `${name}长度必须为 ${rule.len}`
  if (rule.min !== undefined && rule.max !== undefined) return `${name}长度应在 ${rule.min} 到 ${rule.max} 之间`
  if (rule.min !== undefined) return `${name}不能小于 ${rule.min}`
  if (rule.max !== undefined) return `${name}不能大于 ${rule.max}`
  return `${name}校验未通过`
}

/**
 * 单条规则求值。
 * @returns {Promise<string>} 通过时返回空字符串，失败时返回错误文案
 */
async function runSingleRule(rule, value, context) {
  const { label, model, prop } = context

  /* ---------- required ---------- */
  if (rule.required && isValueEmpty(value)) {
    return rule.message || fallbackMessage(rule, label)
  }

  /* 非必填且为空时，后续的长度 / 格式规则一律跳过。
     这是「选填项留空不应该报格式错误」的标准语义 */
  if (isValueEmpty(value)) return ''

  /* ---------- 长度 / 数值范围 ---------- */
  /*
   * 「数字字符串」按数值判定，而不是按长度。
   *
   * uni 的 <input type="number"> 回传的 event.detail.value 恒为字符串，
   * 于是规则 { max: 3 } 配值 "100" 会走「长度为 3」这条分支 → 判定通过，
   * 但语义上是 100 > 3、应该报错。反过来 { min: 10 } 配值 "abcd"
   * 会按长度 4 判定 → 报出「不能小于 10」这种莫名奇妙的文案。
   *
   * 所以：看起来是数字的字符串，一律按数字比较。
   */
  const numericString = typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))
  const isString = typeof value === 'string' && !numericString
  const isNumber = typeof value === 'number' && !Number.isNaN(value)
  const isArray = Array.isArray(value)
  const numberValue = isNumber ? value : numericString ? Number(value) : undefined
  const length = isString ? value.length : isArray ? value.length : undefined

  if (rule.len !== undefined && length !== undefined && length !== rule.len) {
    return rule.message || fallbackMessage(rule, label)
  }
  if (rule.min !== undefined) {
    const failed = numberValue !== undefined ? numberValue < rule.min : length !== undefined ? length < rule.min : false
    if (failed) return rule.message || fallbackMessage(rule, label)
  }
  if (rule.max !== undefined) {
    const failed = numberValue !== undefined ? numberValue > rule.max : length !== undefined ? length > rule.max : false
    if (failed) return rule.message || fallbackMessage(rule, label)
  }

  /* ---------- 正则 ---------- */
  if (rule.pattern) {
    /*
     * pattern 允许传字符串 —— 业务从后端拿到的校验配置就是字符串，
     * 要求他们先 new RegExp 一遍纯属额外负担。
     * 但字符串没有 lastIndex，直接赋值会抛
     * TypeError: Cannot create property 'lastIndex' on string，
     * 而这个异常发生在 runRules 里，会让 cd-form.validate() 直接 throw ——
     * 调用方 await 的不是一个 false，而是一个崩溃。
     */
    const re = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern
    /* 每次求值都重置 lastIndex：带 g 标志的正则是有状态的，
       复用同一个实例会让第二次校验随机失败 —— 这是个非常隐蔽的 bug */
    if (typeof re.lastIndex === 'number') re.lastIndex = 0
    if (!re.test(String(value))) {
      return rule.message || fallbackMessage(rule, label)
    }
  }

  /* ---------- 枚举 ---------- */
  if (rule.enum && !rule.enum.some((item) => item === value)) {
    return rule.message || fallbackMessage(rule, label)
  }

  /* ---------- 自定义校验 ----------
     允许返回：true 通过 / false 不通过 / 字符串（作为错误文案）/ Promise<上述>
     返回值大于 1 个的校验器没用，只会让调用方困惑 */
  if (typeof rule.validator === 'function') {
    let result
    try {
      result = await rule.validator(value, { rule, model, prop, label })
    } catch (error) {
      return (error && error.message) || rule.message || fallbackMessage(rule, label)
    }

    if (result === false) return rule.message || fallbackMessage(rule, label)
    if (typeof result === 'string' && result) return result
  }

  return ''
}

/**
 * 按顺序求值一组规则，遇到第一条失败就返回（短路）。
 * 短路是刻意的：同时展示「不能为空」和「格式不正确」对用户毫无帮助。
 *
 * @param {Array} rules   规则数组
 * @param {*} value       当前值
 * @param {Object} context { label, model, prop }
 * @returns {Promise<{ passed: boolean, message: string, rule: Object|null }>}
 */
export async function runRules(rules, value, context = {}) {
  const list = normalizeRules(rules)
  for (let i = 0; i < list.length; i += 1) {
    const rule = list[i]
    // eslint-disable-next-line no-await-in-loop
    const message = await runSingleRule(rule, value, context)
    if (message) {
      return { passed: false, message, rule }
    }
  }
  return { passed: true, message: '', rule: null }
}

/* ------------------------------------------------------------------
 * 常用内置正则，业务不必自己拼
 * ------------------------------------------------------------------ */
export const PATTERNS = {
  mobile: /^1[3-9]\d{9}$/,
  email: /^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/,
  /** 15 位老身份证 / 18 位新身份证（末位可为 X） */
  idcard: /^(^\d{15}$)|(^\d{17}(\d|X|x)$)/,
  /*
   * 密码：6-16 位，字符集限定。
   *
   * 这里刻意**不用** lookahead 去写「必须同时含字母与数字」。
   * lookahead 是 ECMAScript 标准语法、现代引擎都支持，
   * 但本项目把它列为跨端禁用写法（见 scripts/check-hard-rules.mjs 的 no-lookahead 规则），
   * 而 PATTERNS 是会被业务直接复用的 —— 库自己违反自己定的规矩最没说服力。
   *
   * 需要「同时含字母与数字」的强度校验时，用下面的 passwordMixed() 校验器，
   * 它用两条无 lookahead 的正则分别判定，语义一样清楚。
   */
  password: /^[A-Za-z\d!@#$%^&*._-]{6,16}$/,
  /** 中文姓名 */
  chineseName: /^[\u4e00-\u9fa5·]{2,16}$/,
  /** 正整数 */
  positiveInt: /^[1-9]\d*$/,
  /** 金额，最多两位小数 */
  amount: /^\d+(\.\d{1,2})?$/,
  url: /^(https?:\/\/)[\w.-]+(:\d+)?(\/[\w./?%&=#-]*)?$/,
}

/**
 * 密码强度校验：6-16 位，且**同时**含字母与数字。
 *
 * 用两次独立的正则分别判定，而不是一条带 lookahead 的大正则 ——
 * 前者在各端都稳妥，后者是本项目禁用的写法。
 *
 * 可直接作为 rule.validator 使用：
 *   rules: [{ validator: passwordMixed, message: '需 6-16 位且同时含字母与数字' }]
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function passwordMixed(value) {
  const s = String(value ?? '')
  if (s.length < 6 || s.length > 16) return false
  if (!/[A-Za-z]/.test(s)) return false
  if (!/\d/.test(s)) return false
  return true
}
