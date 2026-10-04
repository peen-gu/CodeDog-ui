<template>
  <view
    class="cd-switch"
    :class="rootClass"
    :style="rootStyle"
    @click="handleToggle"
  >
    <view class="cd-switch__track">
      <view class="cd-switch__thumb">
        <cd-icon v-if="loading" name="loader" spin size="0.7em" />
      </view>
    </view>

    <text v-if="activeText || inactiveText" class="cd-switch__text">
      {{ isChecked ? activeText : inactiveText }}
    </text>
  </view>
</template>

<script setup>
/**
 * cd-switch —— 开关
 * ---------------------------------------------------------------
 * 支持任意「一对值」而不是只支持布尔：
 *   v-model="enabled"                              → true / false
 *   v-model="status" active-value="on" inactive-value="off"
 *
 * 为什么不只做布尔？因为后端接口里「启用状态」常常就是 '1'/'0' 或 'ON'/'OFF'，
 * 只支持布尔会逼业务在 v-model 后面挂一层 computed 做转换，
 * 每个用到开关的地方都要写一遍。让组件吸收这个映射更合理。
 *
 * beforeChange 支持返回 Promise：确认弹窗这类「点了开关但要先问一句」的场景
 * 需要能异步拦截。返回 false 或 reject 就回弹，开关不会先动再弹回去 ——
 * 开关「先动一下再弹回来」是很明显的体验瑕疵。
 */
import { computed } from 'vue'
import { useField } from '../../composables/use-field'

defineOptions({
  name: 'cd-switch',
})

const props = defineProps({
  modelValue: {
    type: [Boolean, String, Number],
    default: false,
  },
  /** 打开时的值 */
  activeValue: {
    type: [Boolean, String, Number],
    default: true,
  },
  /** 关闭时的值 */
  inactiveValue: {
    type: [Boolean, String, Number],
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 切换中，点击无效并显示转圈 */
  loading: {
    type: Boolean,
    default: false,
  },
  /** small / default / large */
  size: {
    type: String,
    default: 'default',
  },
  /** 打开时的轨道色，不传用主色 */
  activeColor: {
    type: String,
    default: '',
  },
  /** 关闭时的轨道色 */
  inactiveColor: {
    type: String,
    default: '',
  },
  /** 打开时的文字（需要在文字与轨道同排时传） */
  activeText: {
    type: String,
    default: '',
  },
  /** 关闭时的文字 */
  inactiveText: {
    type: String,
    default: '',
  },
  /** 切换前的钩子，返回 false / reject 则取消切换。可以是 async 函数 */
  beforeChange: {
    type: Function,
    default: null,
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

const emit = defineEmits(['update:modelValue', 'change', 'click'])

const { field, formDisabled, notifyChange } = useField()

const isChecked = computed(() => props.modelValue === props.activeValue)

const isDisabled = computed(() => props.disabled || formDisabled.value)

/** 表单校验失败时开关自身也要变红，否则看不出是哪个控件错了 */
const hasFormError = computed(() => !!(field && field.validateState && field.validateState.value === 'error'))

const rootClass = computed(() =>
  [
    `cd-switch--${props.size}`,
    isChecked.value ? 'cd-switch--checked' : '',
    isDisabled.value ? 'cd-switch--disabled' : '',
    props.loading ? 'cd-switch--loading' : '',
    hasFormError.value ? 'cd-switch--error' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const rootStyle = computed(() => {
  const parts = []
  if (props.activeColor) parts.push(`--cd-switch-active:${props.activeColor};`)
  if (props.inactiveColor) parts.push(`--cd-switch-inactive:${props.inactiveColor};`)
  if (props.customStyle) parts.push(props.customStyle)
  return parts.join('')
})

/**
 * 异步钩子期间的内部锁。
 * beforeChange 常用于「弹个确认框」，等用户点确定的那几百毫秒里
 * 开关仍然是可点的：连点两次会发起两个钩子，而只有先返回的那个能改到值，
 * 另一个的结果被静默吞掉 —— 用户看到的是「点了两次只生效一次」。
 * pending 期间直接 return，第二次点击被忽略掉。
 */
let pending = false

async function handleToggle(event) {
  emit('click', event)

  if (isDisabled.value || props.loading || pending) return

  const nextValue = isChecked.value ? props.inactiveValue : props.activeValue

  /* 钩子先跑，通过了才改值 —— 这样开关不会出现「先动再弹回」的闪烁 */
  if (props.beforeChange) {
    pending = true
    let allowed = false
    try {
      allowed = await props.beforeChange(nextValue)
    } catch (error) {
      allowed = false
    } finally {
      pending = false
    }
    if (allowed === false) return
  }

  emit('update:modelValue', nextValue)
  emit('change', nextValue)
  notifyChange(nextValue)
}
</script>

<script>
export default {
  name: 'cd-switch',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-switch {
  @include cd-reset;

  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

/* ==================================================================
 * 轨道
 * ================================================================== */
.cd-switch__track {
  position: relative;
  display: block;
  box-sizing: border-box;
  background-color: var(--cd-switch-inactive, var(--cd-border-color-strong, #cbd5e1));
  border-radius: var(--cd-radius-round, 999px);
  transition: background-color var(--cd-duration-base, 250ms) var(--cd-ease-in-out, ease);
}

.cd-switch__thumb {
  position: absolute;
  top: 50%;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--cd-switch-thumb-color, #ffffff);
  border-radius: var(--cd-radius-round, 999px);
  box-shadow: var(--cd-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
  color: var(--cd-switch-active, var(--cd-color-primary, #3b76f6));
  /* 用 transform 而不是改 left：transform 走合成层，两端都不掉帧 */
  transition: transform var(--cd-duration-base, 250ms) var(--cd-ease-out, cubic-bezier(0.16, 1, 0.3, 1));
}

/* ==================================================================
 * 尺寸：轨道宽高与滑块位移都在这里定义，位移量是算好的绝对值
 * ================================================================== */
.cd-switch--small .cd-switch__track {
  width: var(--cd-switch-width-sm, 32px);
  height: var(--cd-switch-height-sm, 18px);
}

.cd-switch--small .cd-switch__thumb {
  width: var(--cd-switch-thumb-sm, 14px);
  height: var(--cd-switch-thumb-sm, 14px);
  margin-left: 2px;
  transform: translateY(-50%);
  font-size: 8px;
}

.cd-switch--default .cd-switch__track {
  width: var(--cd-switch-width, 44px);
  height: var(--cd-switch-height, 24px);
}

.cd-switch--default .cd-switch__thumb {
  width: var(--cd-switch-thumb, 20px);
  height: var(--cd-switch-thumb, 20px);
  margin-left: 2px;
  transform: translateY(-50%);
  font-size: 11px;
}

.cd-switch--large .cd-switch__track {
  width: var(--cd-switch-width-lg, 52px);
  height: var(--cd-switch-height-lg, 28px);
}

.cd-switch--large .cd-switch__thumb {
  width: var(--cd-switch-thumb-lg, 24px);
  height: var(--cd-switch-thumb-lg, 24px);
  margin-left: 2px;
  transform: translateY(-50%);
  font-size: 13px;
}

/* ==================================================================
 * 打开态：轨道变主色，滑块右移
 * 位移量 = 轨道宽 - 滑块宽 - 两侧留白，这些值都写死在尺寸块里，
 * 避免用 calc 混算（小程序对 CSS 变量参与 calc 减法支持不一致）
 * ================================================================== */
.cd-switch--checked .cd-switch__track {
  background-color: var(--cd-switch-active, var(--cd-color-primary, #3b76f6));
}

.cd-switch--checked.cd-switch--small .cd-switch__thumb {
  transform: translate(14px, -50%);
}

.cd-switch--checked.cd-switch--default .cd-switch__thumb {
  transform: translate(20px, -50%);
}

.cd-switch--checked.cd-switch--large .cd-switch__thumb {
  transform: translate(24px, -50%);
}

/* ==================================================================
 * 状态
 * ================================================================== */
.cd-switch--disabled {
  opacity: 0.5;
}

/* 禁用时滑块不该还有投影，否则看起来仍然「可以点」 */
.cd-switch--disabled .cd-switch__thumb {
  box-shadow: none;
}

/**
 * 校验失败：给轨道套一圈红环。
 * 用 box-shadow 而不是 border —— 轨道尺寸是按 px 写死的，
 * 加 border 会撑大尺寸并让滑块位移量对不上。
 */
.cd-switch--error .cd-switch__track {
  box-shadow: 0 0 0 2px var(--cd-color-danger, #ef4444);
}

.cd-switch__text {
  margin-left: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-regular, #334155);
  line-height: 1;
}

/* 按压反馈缩放「轨道」而不是「滑块」：
   滑块的 transform 已经被用来做定位了（translate(x, -50%)），
   再叠加 scale 会互相覆盖 —— 同一个 transform 属性只能有一份值，
   想同时表达位移+缩放就得为每种尺寸、每种开关状态各写一条完整 transform，
   组合数立刻爆炸。缩放轨道则完全绕开这个问题。 */
.cd-switch:not(.cd-switch--disabled):not(.cd-switch--loading):active .cd-switch__track {
  transform: scale(0.95);
}

@include cd-hover {
  .cd-switch:not(.cd-switch--disabled):not(.cd-switch--loading):hover .cd-switch__track {
    opacity: 0.9;
  }
}
</style>
