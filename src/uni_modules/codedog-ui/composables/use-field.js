/**
 * CodeDogUI / useField —— 表单字段接线
 * ---------------------------------------------------------------
 * 把「控件」与「校验」之间的通道收敛到一个地方。
 *
 * 自定义控件只要能拿到两个回调（我变了 / 我失焦了），就能接入 cd-form 的校验链，
 * 不需要继承任何东西，也不需要知道 cd-form 的存在。
 *
 * 顺带修掉一个真实缺口：cd-form 有 disabled 属性，cd-form-item 也正确算出了
 * effectiveDisabled 并放进了字段上下文，但**没有任何控件去读它** ——
 * 于是「禁用整个表单」这个能力实际是不生效的。
 * 这里统一提供 formDisabled，让每个控件都能一行接上。
 */
import { computed, inject } from 'vue'
import { CD_FORM_ITEM_KEY } from '../constants'

export function useField() {
  /*
   * 默认值必须是 null：组件可以脱离表单独立使用，
   * 这时 inject 返回 null 而不是抛错。
   */
  const field = inject(CD_FORM_ITEM_KEY, null)

  return {
    /** 原始字段上下文，需要读校验态（validateState / validateMessage）时用 */
    field,

    /** 表单或表单项把本字段标记为禁用 */
    formDisabled: computed(() => !!(field && field.disabled && field.disabled.value)),

    /** 值变化后调用，触发 change 校验 */
    notifyChange(value) {
      if (field && field.onFieldChange) field.onFieldChange(value)
    },

    /** 失焦后调用，触发 blur 校验 */
    notifyBlur() {
      if (field && field.onFieldBlur) field.onFieldBlur()
    },
  }
}
