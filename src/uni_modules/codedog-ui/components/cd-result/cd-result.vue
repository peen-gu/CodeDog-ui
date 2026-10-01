<template>
  <view class="cd-result" :class="rootClass" :style="customStyle">
    <view v-if="showIcon" class="cd-result__badge" :class="`cd-result__badge--${type}`">
      <slot name="icon">
        <cd-icon :name="iconName" size="var(--cd-result-icon-size, 34px)" />
      </slot>
    </view>

    <view v-if="title || $slots.title" class="cd-result__title">
      <slot name="title">
        <text class="cd-result__title-text">{{ title }}</text>
      </slot>
    </view>

    <view v-if="description || $slots.description" class="cd-result__desc">
      <slot name="description">
        <text class="cd-result__desc-text">{{ description }}</text>
      </slot>
    </view>

    <view v-if="$slots.extra" class="cd-result__extra">
      <slot name="extra" />
    </view>

    <view v-if="$slots.default" class="cd-result__content">
      <slot />
    </view>
  </view>
</template>

<script setup>
/**
 * cd-result —— 结果页
 * ---------------------------------------------------------------
 * 它存在的理由是「让结论先于数据出现」。
 * 提交成功、支付失败、无权限、系统异常 —— 这类页面如果让业务自己拼，
 * 十有八九拼成「一行加粗标题 + 一段灰字」，然后每个页面各不相同。
 *
 * 一个刻意的取舍：图标外面套一个 72px 的浅色圆底，而不是直接放一个大图标。
 * 原因是纯图标在大屏上会显得「飘」—— 没有形状边界，视觉重心不稳；
 * 浅色圆底给它一个明确的落点，也让语义色（红 / 黄 / 绿）有地方铺开，
 * 不用把颜色糊到图标线条上（那会让描边图标显得脏）。
 *
 * 槽位按「信息层级」拆成四段而不是给一堆属性：
 *   默认槽放详细数据（明细、单号），extra 槽放操作按钮。
 *   顺序刻意为「结论 → 说明 → 操作 → 明细」——
 *   用户最需要点的东西不该被一张明细表推到底部。
 */
import { computed } from 'vue'

defineOptions({
  name: 'cd-result',
})

const props = defineProps({
  /** success / warning / error / info */
  type: {
    type: String,
    default: 'info',
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  /** 自定义图标，覆盖 type 的默认图标 */
  icon: {
    type: String,
    default: '',
  },
  showIcon: {
    type: Boolean,
    default: true,
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

const TYPE_ICONS = {
  success: 'check-circle',
  warning: 'warning',
  error: 'close-circle',
  info: 'info',
}

const iconName = computed(() => props.icon || TYPE_ICONS[props.type] || TYPE_ICONS.info)

const rootClass = computed(() =>
  [`cd-result--${props.type}`, props.customClass].filter(Boolean).join(' ')
)
</script>

<script>
export default {
  name: 'cd-result',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-result {
  @include cd-reset;

  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: var(--cd-result-padding, 40px 20px);
  text-align: center;
}

/* ==================================================================
 * 图标
 * ================================================================== */
.cd-result__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--cd-result-badge-size, 72px);
  height: var(--cd-result-badge-size, 72px);
  border-radius: var(--cd-radius-round, 999px);
  background-color: var(--cd-color-info-soft, #f1f5f9);
  color: var(--cd-color-info, #64748b);
}

.cd-result--success .cd-result__badge {
  background-color: var(--cd-color-success-soft, #f0fdf4);
  color: var(--cd-color-success, #22c55e);
}

.cd-result--warning .cd-result__badge {
  background-color: var(--cd-color-warning-soft, #fffbeb);
  color: var(--cd-color-warning, #f59e0b);
}

.cd-result--error .cd-result__badge {
  background-color: var(--cd-color-danger-soft, #fef2f2);
  color: var(--cd-color-danger, #ef4444);
}

/* ==================================================================
 * 文案
 * ================================================================== */
.cd-result__title {
  margin-top: var(--cd-space-5, 20px);
  max-width: 100%;
}

.cd-result__title-text {
  font-size: var(--cd-font-size-xl, 20px);
  font-weight: var(--cd-font-weight-semibold, 600);
  line-height: var(--cd-line-height-tight, 1.25);
  color: var(--cd-text-primary, #0f172a);
}

.cd-result__desc {
  margin-top: var(--cd-space-2, 8px);
  max-width: 480px;
}

.cd-result__desc-text {
  font-size: var(--cd-font-size-base, 14px);
  line-height: var(--cd-line-height-base, 1.5);
  color: var(--cd-text-secondary, #64748b);
}

.cd-result__extra {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: var(--cd-space-6, 24px);
}

.cd-result__content {
  width: 100%;
  margin-top: var(--cd-space-6, 24px);
  /* 明细区回到左对齐：结果页的居中只服务于「结论」那一段，
     一张表格也居中会很难读 */
  text-align: left;
}
</style>
