<template>
  <view class="cd-form-render" :class="rootClass" :style="props.customStyle">
    <slot name="header" :model="props.modelValue" :schema="props.schema" />

    <cd-form
      ref="formRef"
      :model="props.modelValue"
      :rules="mergedRules"
      :label-position="props.labelPosition"
      :label-width="props.labelWidth"
      :label-align="props.labelAlign"
      :size="props.size"
      :disabled="props.disabled"
      :show-message="props.showMessage"
      :hide-required-asterisk="props.hideRequiredAsterisk"
    >
      <view class="cd-form-render__grid" :style="gridStyle">
        <view
          v-for="(field, index) in visibleFields"
          :key="field.prop || index"
          class="cd-form-render__cell"
          :style="{ width: cellWidth(field) }"
        >
          <cd-form-item
            :prop="field.prop || ''"
            :label="field.label || ''"
            :required="!!field.required"
            :help="field.help || ''"
            :disabled="isFieldDisabled(field)"
            :label-position="field.labelPosition || ''"
            :label-width="field.labelWidth === undefined ? '' : field.labelWidth"
          >
            <!--
              内建控件：mp-weixin 编译期拒绝 <component :is>（X_DYNAMIC_COMPONENT_NOT_SUPPORTED），
              所以只能把 widget 类型铺成一条 v-if 链。事件名一律静态写死 ——
              v-on="{...}" 同样被禁（X_V_ON_NO_ARGUMENT），分发靠 handler 内的 field 参数。
            -->
            <cd-input
              v-if="field.widget === 'input'"
              v-bind="widgetProps(field, { size: mappedSize.input })"
              :model-value="getValue(field)"
              :disabled="isFieldDisabled(field)"
              @update:model-value="setValue(field, $event)"
            />

            <cd-select
              v-else-if="field.widget === 'select'"
              v-bind="widgetProps(field, { size: mappedSize.select })"
              :model-value="getValue(field)"
              :disabled="isFieldDisabled(field)"
              @update:model-value="setValue(field, $event)"
            />

            <cd-switch
              v-else-if="field.widget === 'switch'"
              v-bind="widgetProps(field, { size: mappedSize.toggle })"
              :model-value="getValue(field)"
              :disabled="isFieldDisabled(field)"
              @update:model-value="setValue(field, $event)"
            />

            <cd-checkbox-group
              v-else-if="field.widget === 'checkbox'"
              v-bind="widgetProps(field, { size: mappedSize.toggle })"
              :model-value="getValue(field)"
              :disabled="isFieldDisabled(field)"
              @update:model-value="setValue(field, $event)"
            >
              <cd-checkbox
                v-for="(opt, oi) in fieldOptions(field)"
                :key="`${field.prop}-${oi}`"
                :value="opt.value"
                :label="opt.label"
                :disabled="!!opt.disabled"
              />
            </cd-checkbox-group>

            <cd-radio-group
              v-else-if="field.widget === 'radio'"
              v-bind="widgetProps(field, { size: mappedSize.toggle })"
              :model-value="getValue(field)"
              :disabled="isFieldDisabled(field)"
              @update:model-value="setValue(field, $event)"
            >
              <cd-radio
                v-for="(opt, oi) in fieldOptions(field)"
                :key="`${field.prop}-${oi}`"
                :value="opt.value"
                :label="opt.label"
                :disabled="!!opt.disabled"
              />
            </cd-radio-group>

            <cd-date-picker
              v-else-if="field.widget === 'date'"
              v-bind="widgetProps(field, {})"
              :model-value="getValue(field)"
              :disabled="isFieldDisabled(field)"
              @update:model-value="setValue(field, $event)"
            />

            <cd-time-picker
              v-else-if="field.widget === 'time'"
              v-bind="widgetProps(field, {})"
              :model-value="getValue(field)"
              :disabled="isFieldDisabled(field)"
              @update:model-value="setValue(field, $event)"
            />

            <cd-slider
              v-else-if="field.widget === 'slider'"
              v-bind="widgetProps(field, {})"
              :model-value="getValue(field)"
              :disabled="isFieldDisabled(field)"
              @update:model-value="setValue(field, $event)"
            />

            <cd-rate
              v-else-if="field.widget === 'rate'"
              v-bind="widgetProps(field, {})"
              :model-value="getValue(field)"
              :disabled="isFieldDisabled(field)"
              @update:model-value="setValue(field, $event)"
            />

            <cd-stepper
              v-else-if="field.widget === 'stepper'"
              v-bind="widgetProps(field, { size: mappedSize.toggle })"
              :model-value="getValue(field)"
              :disabled="isFieldDisabled(field)"
              @update:model-value="setValue(field, $event)"
            />

            <cd-upload
              v-else-if="field.widget === 'upload'"
              v-bind="widgetProps(field, {})"
              :model-value="getValue(field)"
              :disabled="isFieldDisabled(field)"
              @update:model-value="setValue(field, $event)"
            />

            <text v-else-if="field.widget === 'text'" class="cd-form-render__static">
              {{ displayText(field) }}
            </text>

            <slot
              v-else-if="field.widget === 'custom'"
              name="widget"
              :field="field"
              :value="getValue(field)"
              :disabled="isFieldDisabled(field)"
              :set-value="(v) => setValue(field, v)"
            />

            <view v-else class="cd-form-render__unknown">
              <text class="cd-form-render__unknown-text">
                未知控件类型：{{ field.widget }}
              </text>
            </view>
          </cd-form-item>
        </view>
      </view>
    </cd-form>

    <slot name="footer" :model="props.modelValue" :validate="validate" :reset-fields="resetFields" />
  </view>
</template>

<script setup>
/**
 * cd-form-render —— Schema 驱动的表单渲染引擎
 * ---------------------------------------------------------------
 * 一句话：给它一份 schema（字段描述数组）和一个对象，它把整张表单渲染出来，
 * 并复用 cd-form / cd-form-item 已有的校验与错误展示能力。
 *
 * 为什么不用 <component :is>：
 *   uni-app 的 mp-weixin 编译器在**编译期**就拒绝动态组件，报
 *   X_DYNAMIC_COMPONENT_NOT_SUPPORTED（2026-10-03 在本仓库 playground 实测；
 *   同一份代码 build:h5 是通过的，所以这是 mp 端专属限制，不是全平台限制）。
 *   同理 v-is、v-on="{...}" 也都被禁。
 *   → 本组件四端统一走「v-for 遍历 + 每条字段内 v-if 枚举控件」，
 *     不在 H5 端单独用动态组件，避免两端行为分叉。
 *
 * 为什么值不走 v-model：
 *   字段值落在 model[path] 上（支持 'user.name' 这类嵌套路径），
 *   v-model 无法直接绑到动态路径。统一走「读 getValue(field) 、
 *   写 setValue(field, value)」这一对方法，读写都经过路径解析。
 *
 * schema 里每个字段支持这些键：
 *   prop          字段名（必填，支持 'user.name' 嵌套路径）
 *   label         标签文案
 *   widget        控件类型，见下方枚举
 *   props         透传给该控件的属性（v-bind 展开，modelValue / disabled 除外）
 *   defaultValue  默认值，只在该字段当前为空时写入，不覆盖已有输入
 *   required      强制标记必填
 *   rules         本字段校验规则，与表单级 rules 合并（表单级在前）
 *   help          常驻帮助文案
 *   span          栅格占几列，默认 1，上限是 cols
 *   visible       是否渲染，布尔或 (model) => boolean，缺省为 true
 *   disabled      是否禁用，布尔或 (model) => boolean，缺省为 false
 *   labelPosition / labelWidth  覆盖表单级标签布局
 *   emptyText     widget 为 text 且值为空时显示的占位，默认 '-'
 *
 * widget 枚举：input（props.type=textarea 时为多行）/ select / switch /
 *   checkbox / radio / date / time / slider / rate / stepper / upload /
 *   text（纯展示）/ custom（走 widget 插槽）
 *
 * 为什么改 model 是「原地写」而不是「换新对象」：
 *   cd-form-item 的 resetFields 走的是 setValueByPath(getModel(), prop, initialValue)，
 *   它依赖 form.getModel() 每次现取同一引用。若这里每次都 emit 一个新对象，
 *   表单项的「初始值快照」会和当前 model 脱钩，reset 就还原不回去。
 *
 * 模型对象怎么声明（这是个会炸的坑，实测踩过）：
 *   用 `const model = ref({})` + `v-model="model"`    ✅
 *   用 `const model = reactive({})` + `v-model="model"` ❌
 *   后者 Vue 会编译成 `model = $event`，而 const 不可赋值，运行时抛
 *   TypeError: Assignment to constant variable。
 *   若坚持用 reactive，就把绑定写成 `:model-value="model"`（不要 v-model）。
 */
import { computed, ref, watch } from 'vue'
import { getValueByPath, isValueEmpty, normalizeRules, setValueByPath } from '../../utils/validate'
import { useBreakpoint } from '../../composables/use-breakpoint'

defineOptions({
  name: 'cd-form-render',
})

const props = defineProps({
  /**
   * 表单数据。必须是响应式对象（reactive({}) 或 ref({}) 的 .value）。
   * @type {Record<string, any>}
   */
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  /**
   * 字段描述数组。
   * @type {Array<{
   *   prop: string,
   *   label?: string,
   *   widget?: string,
   *   props?: Record<string, any>,
   *   defaultValue?: any,
   *   required?: boolean,
   *   rules?: Object|Object[],
   *   help?: string,
   *   span?: number,
   *   visible?: boolean|((model: object) => boolean),
   *   disabled?: boolean|((model: object) => boolean),
   *   labelPosition?: string,
   *   labelWidth?: string|number,
   *   emptyText?: string
   * }>}
   */
  schema: {
    type: Array,
    default: () => [],
  },
  /**
   * 表单级规则（按字段名索引），会与 schema 内各字段的 rules 合并。
   * 合并顺序：本处在前，字段自带在后。
   */
  rules: {
    type: Object,
    default: () => ({}),
  },
  /** 每行几列。窄屏（移动端）强制降为 1 列 */
  cols: {
    type: Number,
    default: 1,
  },
  /** 列间距与行间距（px） */
  gutter: {
    type: Number,
    default: 12,
  },
  /** top / left / right */
  labelPosition: {
    type: String,
    default: 'top',
  },
  labelWidth: {
    type: [String, Number],
    default: '',
  },
  labelAlign: {
    type: String,
    default: 'left',
  },
  /** small / default / large —— 主要影响间距与内建控件的默认尺寸档位 */
  size: {
    type: String,
    default: 'default',
  },
  /** 一键禁用整张表单 */
  disabled: {
    type: Boolean,
    default: false,
  },
  showMessage: {
    type: Boolean,
    default: true,
  },
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

const emit = defineEmits(['update:modelValue', 'change', 'validate'])

const formRef = ref(null)
const { isMobile } = useBreakpoint()

/* -------------------- 尺寸档位映射 -------------------- */

/*
 * cd-form 用 small/default/large，但各控件的档位命名不一致：
 * cd-input / cd-select 是 small/medium/large，cd-switch / cd-stepper / 勾选组是
 * small/default/large。这里集中做一次翻译，省得每个分支各写一套。
 */
const SIZE_PRESET = {
  small: { input: 'small', select: 'small', toggle: 'small' },
  default: { input: 'medium', select: 'medium', toggle: 'default' },
  large: { input: 'large', select: 'large', toggle: 'large' },
}
const mappedSize = computed(() => SIZE_PRESET[props.size] || SIZE_PRESET.default)

/* -------------------- 默认值初始化 -------------------- */

/*
 * 只写「还没值」的字段，绝不覆盖用户已经填过的东西 ——
 * 包括 0 和 false：isValueEmpty 特意把它们算作非空，
 * 否则「数量填了 0」会在下一次 schema 抖动时被 defaultValue 冲掉。
 */
const initializedProps = new Set()

function ensureDefaults() {
  for (const field of props.schema) {
    if (!field || !field.prop) continue
    if (initializedProps.has(field.prop)) continue
    initializedProps.add(field.prop)
    if (field.defaultValue === undefined) continue
    if (!isValueEmpty(getValueByPath(props.modelValue, field.prop))) continue
    setValueByPath(props.modelValue, field.prop, field.defaultValue)
  }
}

watch(
  () => [props.schema, props.modelValue],
  () => ensureDefaults(),
  { immediate: true }
)

/* -------------------- 取值 / 写值 -------------------- */

function getValue(field) {
  if (!field || !field.prop) return undefined
  return getValueByPath(props.modelValue, field.prop)
}

function setValue(field, value) {
  if (!field || !field.prop) return
  setValueByPath(props.modelValue, field.prop, value)
  /* model 是原地改的，这里 emit 是让外部 v-model 能感知到「变了」 */
  emit('update:modelValue', props.modelValue)
  emit('change', { prop: field.prop, value, model: props.modelValue })
}

/* -------------------- 联动（显隐 / 禁用） -------------------- */

/*
 * visible 与 disabled 的**缺省语义是相反的**：
 * 没写 visible 意味着「显示」，没写 disabled 意味着「不禁用」。
 * 早先这里共用一个 resolveExpression、把 undefined 一律判成 true，
 * 结果所有没写 disabled 的字段全被禁用 —— 编译不报错、页面也照常渲染，
 * 只有真的去点输入框才会发现点不动。两者必须分开写，不能图省事合一。
 */
function resolveVisible(expr, model) {
  if (typeof expr === 'function') return !!expr(model)
  if (expr === undefined) return true
  return !!expr
}

function resolveDisabled(expr, model) {
  if (typeof expr === 'function') return !!expr(model)
  if (expr === undefined) return false
  return !!expr
}

const visibleFields = computed(() =>
  props.schema.filter((field) => field && resolveVisible(field.visible, props.modelValue))
)

function isFieldDisabled(field) {
  return props.disabled || resolveDisabled(field.disabled, props.modelValue)
}

/* -------------------- 规则聚合 -------------------- */

const mergedRules = computed(() => {
  const out = { ...(props.rules || {}) }
  for (const field of props.schema) {
    if (!field || !field.prop) continue
    const own = normalizeRules(field.rules)
    if (!own.length) continue
    out[field.prop] = [...normalizeRules(out[field.prop]), ...own]
  }
  return out
})

/* -------------------- 控件属性 -------------------- */

/**
 * 计算最终透传给控件的 props。
 *
 * modelValue 与 disabled 被**主动剔除**：它们由本组件按字段路径统一接管，
 * 若允许 schema 里再写一份，就会出现「两个来源谁生效」的歧义。
 * 其余属性以 field.props 为准，可覆盖 defaults（尺寸档位）。
 */
function widgetProps(field, defaults) {
  const merged = { ...defaults, ...(field && field.props ? field.props : {}) }
  delete merged.modelValue
  delete merged.disabled
  return merged
}

/** select / checkbox / radio 的选项统一从 field.props.options 取，不另设一级字段 */
function fieldOptions(field) {
  const raw = field && field.props ? field.props.options : null
  return Array.isArray(raw) ? raw : []
}

/** 纯展示态：select/radio 这一类的「值」要翻成「人看的文字」 */
function displayText(field) {
  const value = getValue(field)
  if (value === null || value === undefined || value === '') return field.emptyText || '-'
  const options = fieldOptions(field)
  if (options.length) {
    const hit = options.filter((opt) => opt.value === value)[0]
    if (hit) return hit.label
  }
  if (Array.isArray(value)) return value.join('、')
  return String(value)
}

/* -------------------- 布局 -------------------- */

const effectiveCols = computed(() => {
  const raw = Number(props.cols)
  const cols = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1
  /* 手机上多列会把控件挤到没法点，直接降成单列 */
  return isMobile.value ? 1 : cols
})

/**
 * 列宽用「JS 算好的百分比字符串」，不用 calc。
 * 项目硬约束禁止 CSS 变量参与 calc 除法；这里即便不涉及变量，
 * 也顺手在 JS 里算完 —— 少一个端间差异来源。
 */
function cellWidth(field) {
  const span = Number(field.span)
  const safeSpan = Number.isFinite(span) && span >= 1 ? Math.min(Math.floor(span), effectiveCols.value) : 1
  return `${((safeSpan / effectiveCols.value) * 100).toFixed(4)}%`
}

/*
 * 间距用「容器负外边距 + 每格内边距」，而不是 gap 或 :last-child。
 * 前者在部分小程序基础库上不支持，后者被项目硬约束明令禁止。
 */
const halfGutter = computed(() => Math.max(0, Number(props.gutter) || 0) / 2)
const gridStyle = computed(() => `margin:0 -${halfGutter.value}px;`)

const rootClass = computed(() => [`cd-form-render--${props.size}`, props.customClass].filter(Boolean).join(' '))

/* -------------------- 对外方法（透传 cd-form） -------------------- */

function pickForm() {
  return formRef.value || null
}

function validate(target) {
  const form = pickForm()
  return form ? form.validate(target) : Promise.resolve(true)
}

function validateField(target) {
  const form = pickForm()
  return form ? form.validateField(target) : Promise.resolve(true)
}

function resetFields() {
  const form = pickForm()
  if (form) form.resetFields()
}

function clearValidate() {
  const form = pickForm()
  if (form) form.clearValidate()
}

function submit() {
  const form = pickForm()
  if (form) form.submit()
}

/*
 * 必须写成多行、每个键缩进两格：文档生成器按「行首两个空格 + 标识符」抓 Expose 项，
 * 挤成一行会抓不到，文档里就少一块。
 *
 * 注意别在这段注释里再写出那个函数调用的字面量 —— 文档生成器是用正则找
 * 第一个匹配来定位的，注释里的示例会比真正的定义先被命中。
 */
defineExpose({
  validate,
  validateField,
  resetFields,
  clearValidate,
  submit,
})
</script>

<!--
  刻意不加 scoped：本库 68 个组件统一不加。
  小程序端组件库形态下 scoped 编译的 data-v 处理不稳定（曾实测到 scoped 块内的
  @media 在产物里直接消失），统一靠 BEM 前缀 `cd-form-render__` 隔离样式。
-->
<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-form-render {
  @include cd-reset;
  display: block;
  width: 100%;
}

.cd-form-render__grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
}

/*
 * 每格的左右内边距撑出列间距、下内边距撑出行间距。
 * 容器那圈负外边距把最外层的多余间距吃掉，保证整块内容与外部对齐。
 */
.cd-form-render__cell {
  box-sizing: border-box;
  flex-shrink: 0;
  padding-left: 6px;
  padding-right: 6px;
  padding-bottom: 12px;
  min-width: 0;
}

.cd-form-render--small .cd-form-render__cell {
  padding-bottom: 8px;
}

.cd-form-render--large .cd-form-render__cell {
  padding-bottom: 16px;
}

.cd-form-render__static {
  display: block;
  font-size: var(--cd-font-size-base, 14px);
  line-height: 22px;
  color: var(--cd-text-color-regular, #4b5563);
  word-break: normal;
  overflow-wrap: break-word;
}

.cd-form-render__unknown {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 6px 8px;
  background: var(--cd-color-danger-light, #fef2f2);
  border-radius: var(--cd-radius-base, 4px);
}

.cd-form-render__unknown-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-color-danger, #dc2626);
}
</style>
