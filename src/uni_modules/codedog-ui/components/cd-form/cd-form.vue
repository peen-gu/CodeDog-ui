<template>
  <view class="cd-form" :class="rootClass" :style="formStyle">
    <slot />
  </view>
</template>

<script setup>
/**
 * cd-form —— 表单容器与校验调度
 * ---------------------------------------------------------------
 * 职责划分（这是整个表单体系最重要的一条约定）：
 *   cd-form      只做两件事：向下提供上下文、统一调度所有字段的校验。
 *                它不渲染任何字段，也不知道字段长什么样。
 *   cd-form-item 负责单项：渲染标签、跑自己那几条规则、显示错误。
 *   cd-input 等  只负责交互，通过 inject 把 blur / change 事件回报给所属 form-item。
 *
 * 为什么向下传的是「函数」而不是「值」：
 *   ctx 是个普通对象，创建时若直接写 ctx.model = props.model，
 *   业务一旦整体替换 model（这很常见，比如从接口拿到数据后 model.value = res.data），
 *   ctx 里持有的还是旧对象，校验就会去查一个已经没人用的对象。
 *   统一用 getModel() / getRules() 每次现取，这个坑就不存在了。
 */
import { computed, provide } from 'vue'
import { CD_FORM_KEY } from '../../constants'

defineOptions({
  name: 'cd-form',
})

const props = defineProps({
  /** 表单数据对象 */
  model: {
    type: Object,
    default: () => ({}),
  },
  /**
   * 校验规则，按字段名索引
   * @type {Record<string, Object|Object[]>}
   */
  rules: {
    type: Object,
    default: () => ({}),
  },
  /** top / left / right */
  labelPosition: {
    type: String,
    default: 'top',
  },
  /** 标签宽度，数字按 px 处理。仅 labelPosition 为 left / right 时生效 */
  labelWidth: {
    type: [String, Number],
    default: '',
  },
  /** left / right，标签文字对齐 */
  labelAlign: {
    type: String,
    default: 'left',
  },
  /** small / default / large —— 统一控制所有字段控件的密度 */
  size: {
    type: String,
    default: 'default',
  },
  /** 一键禁用整个表单 */
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 是否显示错误信息 */
  showMessage: {
    type: Boolean,
    default: true,
  },
  /** 隐藏必填星号（有些业务规范不允许出现星号） */
  hideRequiredAsterisk: {
    type: Boolean,
    default: false,
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

const emit = defineEmits(['validate', 'submit'])

/* -------------------- 字段注册表 -------------------- */

/**
 * 刻意不用 ref([])。
 * 字段实例是带着一堆 ref 的普通对象，塞进响应式数组会被包成 Proxy，
 * 后续按引用比对（indexOf）就可能失效。
 * 校验是命令式的、只在调用时遍历，本来也不需要响应式。
 */
const fields = []

function addField(field) {
  if (field && fields.indexOf(field) === -1) fields.push(field)
}

function removeField(field) {
  const index = fields.indexOf(field)
  if (index > -1) fields.splice(index, 1)
}

function pickFields(target) {
  const list = fields.slice()
  if (!target) return list
  const keys = Array.isArray(target) ? target : [target]
  return list.filter((field) => keys.indexOf(field.prop) > -1)
}

/* -------------------- 尺寸与标签宽度 -------------------- */

function normalizeWidth(value) {
  if (value === '' || value === null || value === undefined) return ''
  return typeof value === 'number' ? `${value}px` : String(value)
}

const labelWidthValue = computed(() => normalizeWidth(props.labelWidth))

/**
 * size 直接映射到 cd-config-provider 已有的尺寸档位类名，
 * 于是「表单密度」和「全局密度」用的是同一套变量，不引入第二套体系。
 */
const sizeClass = computed(() => {
  if (props.size === 'small') return 'cd-size-small'
  if (props.size === 'large') return 'cd-size-large'
  return ''
})

const rootClass = computed(() =>
  [
    `cd-form--label-${props.labelPosition}`,
    `cd-form--align-${props.labelAlign}`,
    sizeClass.value,
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const formStyle = computed(() =>
  [labelWidthValue.value ? `--cd-form-label-width:${labelWidthValue.value};` : '', props.customStyle].join('')
)

/* -------------------- 上下文 -------------------- */

provide(CD_FORM_KEY, {
  getModel: () => props.model,
  getRules: () => props.rules,
  labelPosition: computed(() => props.labelPosition),
  labelWidth: labelWidthValue,
  labelAlign: computed(() => props.labelAlign),
  disabled: computed(() => props.disabled),
  showMessage: computed(() => props.showMessage),
  hideRequiredAsterisk: computed(() => props.hideRequiredAsterisk),
  addField,
  removeField,
})

/* -------------------- 对外方法 -------------------- */

/**
 * 校验全部（或指定）字段。
 * @param {string|string[]} [target] 不传则校验全部
 * @returns {Promise<boolean>} 是否全部通过
 *
 * 刻意返回 boolean 而不是 reject：
 * 表单校验失败是**正常业务分支**，不是异常。
 * 用 reject 会迫使每个调用点写 try/catch，也容易产生 unhandled rejection 噪音。
 * 需要知道具体哪些字段失败时，用 validateField() 或监听 validate 事件。
 */
/**
 * 校验串行链。
 *
 * 没有它的时候，连点提交会让两轮校验并发跑起来：两轮各自持有一份字段快照，
 * 后完成的那一轮覆盖先完成的错误态，于是 validate 事件 emit 两次、
 * 页面滚动两次，调用方还可能拿到「先发起那轮」的结果。
 * 排队之后同一时刻只有一轮在跑，每轮拿到的都是自己那轮的真实结果。
 */
let validateChain = Promise.resolve()

/**
 * 把一轮校验排到队尾。
 * 链上只承接「完成」，不让单个任务的失败顺着链往下传污染后续任务。
 */
function enqueue(task) {
  const run = validateChain.then(task, task)
  validateChain = run.then(
    () => {},
    () => {},
  )
  return run
}

async function validate(target) {
  return enqueue(async () => {
    const list = pickFields(target)
    const outcomes = await Promise.all(list.map((field) => field.validate()))
    const invalid = list.filter((field, index) => !outcomes[index])
    const passed = invalid.length === 0

    emit('validate', { passed, props: invalid.map((field) => field.prop) })

    /* 校验失败时把页面滚到第一个出错项。
       移动端表单动辄好几屏，不滚的话用户只看到「提交没反应」 */
    if (!passed && invalid[0] && typeof invalid[0].scrollIntoView === 'function') {
      invalid[0].scrollIntoView()
    }

    return passed
  })
}

/** 校验单个 / 若干字段，返回同样的 boolean 语义 */
async function validateField(target) {
  return enqueue(async () => {
    const list = pickFields(target)
    const outcomes = await Promise.all(list.map((field) => field.validate()))
    return outcomes.every(Boolean)
  })
}

/** 还原为初始值并清除校验态。传字段名则只还原指定字段 */
function resetFields(target) {
  pickFields(target).forEach((field) => field.resetField())
}

/** 只清除校验提示，不动数据 */
function clearValidate(target) {
  pickFields(target).forEach((field) => field.clearValidate())
}

defineExpose({
  validate,
  validateField,
  resetFields,
  clearValidate,
  /** 暴露给极端场景（比如自定义按钮在表单外触发提交） */
  submit() {
    emit('submit')
  },
})
</script>

<script>
export default {
  name: 'cd-form',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-form {
  @include cd-reset;

  display: block;
  width: 100%;
}

/* 字段之间的垂直间距由 cd-form-item 自己的 margin-bottom 提供。
   这里刻意不再写 `.cd-form-item + .cd-form-item { margin-top }` ——
   两者叠加会得到双倍留白，是表单类组件最常见的样式 bug 来源。 */
</style>
