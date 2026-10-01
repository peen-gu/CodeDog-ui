<template>
  <view :id="itemId" class="cd-form-item" :class="rootClass" :style="rootStyle">
    <!-- ---------- 标签 ---------- -->
    <view v-if="hasLabel" class="cd-form-item__label-wrap">
      <text v-if="showAsterisk" class="cd-form-item__asterisk">*</text>
      <text class="cd-form-item__label">{{ label }}</text>
    </view>

    <!-- ---------- 内容 ---------- -->
    <view class="cd-form-item__content">
      <slot />

      <!-- 错误提示优先于帮助文案：出错时最重要的是让用户看到为什么错 -->
      <view v-if="showError" class="cd-form-item__error">
        <cd-icon name="warning" :size="12" />
        <text class="cd-form-item__error-text">{{ errorText }}</text>
      </view>

      <view v-else-if="help" class="cd-form-item__help">
        <text class="cd-form-item__help-text">{{ help }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-form-item —— 表单项
 * ---------------------------------------------------------------
 * 它是「校验」这个动作真正发生的地方：cd-form 只是调度者。
 *
 * 三个值得说明的实现决定：
 *
 * 1. 谁触发校验。cd-input 通过 inject 拿到本组件提供的字段上下文，
 *    在 blur / change 时回调。这条链路让「控件」与「校验」解耦 ——
 *    cd-form-item 完全不知道 slot 里塞的是 input 还是 select 还是自定义组件，
 *    任何自定义控件只要回调 onFieldBlur/onFieldChange 就能接入表单。
 *
 * 2. change 触发的策略。规则里显式声明了 trigger:'change' 才逐字校验；
 *    没声明的，只在**当前已处于错误态**时重新校验。
 *    这样既满足「填错后边改边消错」，又不会在用户第一次输入时就跳红。
 *
 * 3. 并发防护。改一个字就发一次校验，异步规则可能后发先至。
 *    用自增序号丢弃过期结果，避免「错误提示显示的是上一个值的校验结果」。
 */
import { computed, getCurrentInstance, inject, onMounted, onUnmounted, provide, ref } from 'vue'
import { CD_FORM_ITEM_KEY, CD_FORM_KEY } from '../../constants'
import { getValueByPath, matchTrigger, normalizeRules, runRules, setValueByPath } from '../../utils/validate'

defineOptions({
  name: 'cd-form-item',
})

/** 每项一个 id：页面级滚动定位要用，必须全页唯一 */
let uid = 0

const props = defineProps({
  /** 对应 form.model 中的字段名，支持 'user.name' 嵌套写法 */
  prop: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  /** 覆盖表单级的标签位置 top / left / right */
  labelPosition: {
    type: String,
    default: '',
  },
  /** 覆盖表单级的标签宽度 */
  labelWidth: {
    type: [String, Number],
    default: '',
  },
  /** 本项独有的规则，会与 form.rules[prop] 合并（表单级在前，本项在后） */
  rules: {
    type: [Object, Array],
    default: () => [],
  },
  /** 强制标记必填（即使规则里没写 required），用于「必填但无规则」的场景 */
  required: {
    type: Boolean,
    default: false,
  },
  /** 覆盖表单级的错误提示开关 */
  showMessage: {
    type: Boolean,
    default: true,
  },
  /** 常驻帮助文案，出错时让位给错误提示 */
  help: {
    type: String,
    default: '',
  },
  /** 外部直接指定错误文案（例如接口返回的字段级错误），非空时优先展示 */
  error: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const form = inject(CD_FORM_KEY, null)

const instance = getCurrentInstance()
const itemId = `cd-form-item-${uid++}`

/* -------------------- 校验状态 -------------------- */

/** '' | 'error' | 'success' */
const validateState = ref('')
const validateMessage = ref('')

/** 并发防护序号 */
let validateSeq = 0
/** resetFields 要还原到的初始值 */
let initialValue

/* -------------------- 取值 -------------------- */

function getModel() {
  return form ? form.getModel() : {}
}

function getFieldValue() {
  if (!props.prop) return undefined
  return getValueByPath(getModel(), props.prop)
}

/* -------------------- 规则 -------------------- */

const mergedRules = computed(() => {
  const formRules = form ? normalizeRules(form.getRules()[props.prop]) : []
  return [...formRules, ...normalizeRules(props.rules)]
})

const isRequired = computed(() => props.required || mergedRules.value.some((rule) => rule.required))

/* -------------------- 配置解析（本项 → 表单 → 默认） -------------------- */

const effectiveLabelPosition = computed(() => props.labelPosition || (form ? form.labelPosition.value : 'top'))

const effectiveLabelWidth = computed(() => {
  const raw = props.labelWidth !== '' ? props.labelWidth : form ? form.labelWidth.value : ''
  if (raw === '' || raw === null || raw === undefined) return ''
  return typeof raw === 'number' ? `${raw}px` : String(raw)
})

const effectiveShowMessage = computed(() => {
  if (!props.showMessage) return false
  return form ? form.showMessage.value : true
})

const effectiveDisabled = computed(() => props.disabled || (form ? form.disabled.value : false))

const hideAsterisk = computed(() => (form ? form.hideRequiredAsterisk.value : false))

const hasLabel = computed(() => !!props.label)
const showAsterisk = computed(() => isRequired.value && !hideAsterisk.value)
const showError = computed(() => validateState.value === 'error' && effectiveShowMessage.value && !!validateMessage.value)
const errorText = computed(() => props.error || validateMessage.value)

/* -------------------- 上下文（供 slot 内的控件注入） -------------------- */

/**
 * 注意：这是个**普通对象**，不是 reactive。
 * 它只作为「通道」存在，内部持有的是 ref（自带响应式），
 * 整体若被包成 Proxy，反而会破坏 form 里按引用比对的字段注册表。
 */
const fieldCtx = {
  get prop() {
    return props.prop
  },
  disabled: effectiveDisabled,
  validateState,
  validateMessage,
  validate,
  onFieldChange,
  onFieldBlur,
  resetField,
  clearValidate,
  scrollIntoView,
}

provide(CD_FORM_ITEM_KEY, fieldCtx)

onMounted(() => {
  if (form) form.addField(fieldCtx)
  /* 挂载时记录初始值，供 resetFields 还原 */
  initialValue = getFieldValue()
})

onUnmounted(() => {
  if (form) form.removeField(fieldCtx)
})

/* -------------------- 校验逻辑 -------------------- */

function applyError(message) {
  validateState.value = 'error'
  validateMessage.value = message
}

function clearState() {
  validateState.value = ''
  validateMessage.value = ''
}

/**
 * @param {string} [trigger] 'blur' / 'change'；不传表示「显式校验」，跑全部规则
 * @returns {Promise<boolean>}
 */
async function validate(trigger) {
  /* 外部传入的错误（接口字段级报错）优先级最高，直接透传 */
  if (props.error) {
    applyError(props.error)
    return false
  }

  const applicable = mergedRules.value.filter((rule) => matchTrigger(rule, trigger))

  /* 该触发器下没有规则要跑，视为通过，并且清掉旧状态。
     这一步不能省：否则「先 blur 报错、改对后再 blur」会因为没规则而永远留着红字 */
  if (!applicable.length) {
    clearState()
    return true
  }

  const seq = (validateSeq += 1)
  const value = getFieldValue()

  const result = await runRules(applicable, value, {
    label: props.label,
    model: getModel(),
    prop: props.prop,
  })

  /* 期间又有新的校验发起，说明本结果已过期，直接丢弃 */
  if (seq !== validateSeq) return true

  if (result.passed) {
    clearState()
    return true
  }

  applyError(result.message)
  return false
}

/** 控件内容变化时由控件回调进来 */
function onFieldChange() {
  const hasExplicitChangeRule = mergedRules.value.some((rule) => {
    const triggers = Array.isArray(rule.trigger) ? rule.trigger : rule.trigger ? [rule.trigger] : []
    return triggers.indexOf('change') > -1
  })

  if (hasExplicitChangeRule) {
    validate('change')
    return
  }

  /* 没显式声明时，只在已经报错的情况下重新校验：
     让用户一边改一边看到红字消失，但不会一上来就报错 */
  if (validateState.value === 'error') {
    validate()
  }
}

/** 控件失焦时由控件回调进来 */
function onFieldBlur() {
  validate('blur')
}

/** 还原为初始值并清空校验态 */
function resetField() {
  if (props.prop) {
    setValueByPath(getModel(), props.prop, initialValue)
  }
  validateSeq += 1
  clearState()
}

/** 只清校验态，不动数据 */
function clearValidate() {
  validateSeq += 1
  clearState()
}

/**
 * 滚动到本项。
 * 用 pageScrollTo 的 selector 形式而不是先测量再算 scrollTop：
 * 少一次异步查询就少一处时序风险，offsetTop 负值相当于给顶部留出余量。
 * 若所在平台不支持 selector 形式，静默失败即可 —— 滚动只是锦上添花，
 * 不该因为它让校验流程出错。
 */
function scrollIntoView() {
  if (typeof uni === 'undefined' || !uni.pageScrollTo) return
  try {
    uni.pageScrollTo({ selector: `#${itemId}`, offsetTop: -16, duration: 200 })
  } catch (error) {
    /* 静默忽略 */
  }
}

/* -------------------- 类名与样式 -------------------- */

const rootClass = computed(() =>
  [
    `cd-form-item--label-${effectiveLabelPosition.value}`,
    `cd-form-item--align-${form ? form.labelAlign.value : 'left'}`,
    validateState.value === 'error' ? 'cd-form-item--error' : '',
    effectiveDisabled.value ? 'cd-form-item--disabled' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const rootStyle = computed(() =>
  effectiveLabelWidth.value ? `--cd-form-label-width:${effectiveLabelWidth.value};` : ''
)

defineExpose({
  validate,
  resetField,
  clearValidate,
  validateState,
  validateMessage,
})
</script>

<script>
export default {
  name: 'cd-form-item',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-form-item {
  @include cd-reset;

  display: block;
  width: 100%;
  margin-bottom: var(--cd-form-item-gap, 20px);
}

/* 最后一个字段不再留底部间距，否则表单底部会多出一段空白 */
.cd-form-item:last-child {
  margin-bottom: 0;
}

/* 标签在左 / 右时，错误提示也要跟着标签一起右移，否则会和标签文字错位 */
.cd-form-item--label-left,
.cd-form-item--label-right {
  display: flex;
  align-items: flex-start;
}

.cd-form-item--label-top {
  display: block;
}

/* ==================================================================
 * 标签
 * ================================================================== */
.cd-form-item__label-wrap {
  display: flex;
  align-items: center;
  margin-bottom: var(--cd-space-2, 8px);
  line-height: var(--cd-line-height-base, 1.5);
}

.cd-form-item--label-left .cd-form-item__label-wrap,
.cd-form-item--label-right .cd-form-item__label-wrap {
  flex-shrink: 0;
  width: var(--cd-form-label-width, 96px);
  /* 与控件首行文字对齐：控件高度 36px、行高 20px，故上边距 8px。
     这个数值写成固定值而不是百分比，因为控件高度是由 CSS 变量控制的确定值 */
  margin-bottom: 0;
  padding-top: 8px;
}

.cd-form-item__label {
  font-size: var(--cd-form-label-font-size, 14px);
  color: var(--cd-text-regular, #334155);
}

.cd-form-item--label-top .cd-form-item__label {
  color: var(--cd-text-secondary, #64748b);
  font-size: var(--cd-font-size-sm, 12px);
}

/* 左标签：右对齐更利于阅读；右标签：左对齐并加左边距 */
.cd-form-item--label-left.cd-form-item--align-left .cd-form-item__label-wrap {
  justify-content: flex-start;
}
.cd-form-item--label-left.cd-form-item--align-right .cd-form-item__label-wrap {
  justify-content: flex-end;
  padding-right: var(--cd-space-3, 12px);
}
.cd-form-item--label-right .cd-form-item__label-wrap {
  justify-content: flex-start;
  padding-left: var(--cd-space-3, 12px);
}

.cd-form-item__asterisk {
  margin-right: 2px;
  color: var(--cd-color-danger, #ef4444);
  font-size: var(--cd-font-size-base, 14px);
  line-height: 1;
}

/* ==================================================================
 * 内容
 * ================================================================== */
.cd-form-item__content {
  flex: 1;
  min-width: 0;
}

/* ==================================================================
 * 提示
 * ================================================================== */
.cd-form-item__error {
  display: flex;
  align-items: flex-start;
  margin-top: var(--cd-space-1, 4px);
  color: var(--cd-color-danger, #ef4444);
}

.cd-form-item__error .cd-icon {
  margin-top: 3px;
  margin-right: var(--cd-space-1, 4px);
}

.cd-form-item__error-text {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-xs, 11px);
  line-height: var(--cd-line-height-base, 1.5);
}

.cd-form-item__help {
  margin-top: var(--cd-space-1, 4px);
}

.cd-form-item__help-text {
  font-size: var(--cd-font-size-xs, 11px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-placeholder, #94a3b8);
}
</style>
