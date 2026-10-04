<template>
  <view class="cd-transfer" :class="rootClass" :style="customStyle">
    <!-- ---------- 左：待选 ---------- -->
    <view class="cd-transfer__panel">
      <view class="cd-transfer__head">
        <view class="cd-transfer__check-all" @click.stop="toggleAll('left')">
          <view class="cd-transfer__box" :class="{ 'cd-transfer__box--on': allLeftOn }">
            <cd-icon v-if="allLeftOn" class="cd-transfer__box-icon" name="check" :size="12" />
          </view>
          <text class="cd-transfer__head-text">{{ titles[0] }}</text>
        </view>
        <text class="cd-transfer__count">{{ leftChecked.length }} / {{ leftList.length }}</text>
      </view>

      <view v-if="filterable" class="cd-transfer__filter">
        <input
          class="cd-transfer__input"
          :value="leftKeyword"
          :placeholder="placeholder"
          @input="onLeftInput"
        />
      </view>

      <view class="cd-transfer__body" :style="`height:${height}px;`">
        <view
          v-for="item in leftList"
          :key="item[keyField]"
          class="cd-transfer__item"
          :class="{ 'cd-transfer__item--disabled': item[disabledField] }"
          @click.stop="toggleItem('left', item)"
        >
          <view class="cd-transfer__box" :class="{ 'cd-transfer__box--on': inLeft(item) }">
            <cd-icon v-if="inLeft(item)" class="cd-transfer__box-icon" name="check" :size="12" />
          </view>
          <text class="cd-transfer__label">{{ item[labelField] }}</text>
        </view>
        <view v-if="!leftList.length" class="cd-transfer__empty">{{ emptyText }}</view>
      </view>
    </view>

    <!-- ---------- 中间按钮 ---------- -->
    <view class="cd-transfer__actions" :class="`cd-transfer__actions--${direction}`">
      <view class="cd-transfer__btn" :class="{ 'cd-transfer__btn--off': !canToRight }" @click.stop="moveToRight">
        <cd-icon name="chevron-right" :size="16" />
      </view>
      <view class="cd-transfer__btn" :class="{ 'cd-transfer__btn--off': !canToLeft }" @click.stop="moveToLeft">
        <cd-icon name="chevron-left" :size="16" />
      </view>
    </view>

    <!-- ---------- 右：已选 ---------- -->
    <view class="cd-transfer__panel">
      <view class="cd-transfer__head">
        <view class="cd-transfer__check-all" @click.stop="toggleAll('right')">
          <view class="cd-transfer__box" :class="{ 'cd-transfer__box--on': allRightOn }">
            <cd-icon v-if="allRightOn" class="cd-transfer__box-icon" name="check" :size="12" />
          </view>
          <text class="cd-transfer__head-text">{{ titles[1] }}</text>
        </view>
        <text class="cd-transfer__count">{{ rightChecked.length }} / {{ rightList.length }}</text>
      </view>

      <view v-if="filterable" class="cd-transfer__filter">
        <input
          class="cd-transfer__input"
          :value="rightKeyword"
          :placeholder="placeholder"
          @input="onRightInput"
        />
      </view>

      <view class="cd-transfer__body" :style="`height:${height}px;`">
        <view
          v-for="item in rightList"
          :key="item[keyField]"
          class="cd-transfer__item"
          @click.stop="toggleItem('right', item)"
        >
          <view class="cd-transfer__box" :class="{ 'cd-transfer__box--on': inRight(item) }">
            <cd-icon v-if="inRight(item)" class="cd-transfer__box-icon" name="check" :size="12" />
          </view>
          <text class="cd-transfer__label">{{ item[labelField] }}</text>
        </view>
        <view v-if="!rightList.length" class="cd-transfer__empty">{{ emptyText }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-transfer —— 穿梭框
 * ---------------------------------------------------------------
 * 状态模型刻意做成「**只存右侧的 key 数组**」而不是两边各存一份：
 * 左边永远是「全集 - 右边」，所以任何时刻都不会出现两边不一致 ——
 * 不存在同步问题，也就不需要 reconcile 逻辑。
 *
 * 穿梭（move）时不删除右边原项的位置记忆：多数业务希望「移过去再移回来」
 * 保持插入顺序，而不是被推到末尾。所以右侧顺序按**初始 data 顺序**过滤得到，
 * 而不是按移入先后 push 出来的。这是本组件唯一一处为了手感多做的一点事。
 *
 * 筛选框用原生 input（uni 内建组件），不是 cd-input：
 * 穿梭框往往是密集列表里的小输入框，套一整层表单组件会让行高失控，
 * 而且这里的输入不需要校验 / 清空 / 前后缀那些能力。
 */
import { computed, ref, watch } from 'vue'

defineOptions({
  name: 'cd-transfer',
})

const props = defineProps({
  /** 全部可选项。每项 { [keyField], [labelField], [disabledField] } */
  data: {
    type: Array,
    default: () => [],
  },
  /** 右侧已选项的 key 数组 */
  modelValue: {
    type: Array,
    default: () => [],
  },
  /** 两侧标题 */
  titles: {
    type: Array,
    default: () => ['待选', '已选'],
  },
  keyField: {
    type: String,
    default: 'key',
  },
  labelField: {
    type: String,
    default: 'label',
  },
  disabledField: {
    type: String,
    default: 'disabled',
  },
  /** 是否显示搜索框 */
  filterable: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '搜索',
  },
  /** horizontal 左右并排 / vertical 上下堆叠（窄屏推荐） */
  direction: {
    type: String,
    default: 'horizontal',
  },
  height: {
    type: Number,
    default: 220,
  },
  emptyText: {
    type: String,
    default: '暂无数据',
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

const emit = defineEmits(['update:modelValue', 'change'])

const leftChecked = ref([])
const rightChecked = ref([])
const leftKeyword = ref('')
const rightKeyword = ref('')

/** 右侧集合：唯一真源是 modelValue，这里只做快速查找用 */
const rightKeys = computed(() => props.modelValue.map(String))

const leftList = computed(() => {
  const set = new Set(rightKeys.value)
  const kw = leftKeyword.value.trim().toLowerCase()
  return props.data.filter((item) => {
    if (set.has(String(item[props.keyField]))) return false
    if (!kw) return true
    return String(item[props.labelField] || '').toLowerCase().indexOf(kw) > -1
  })
})

/** 顺序跟随原始 data，见文件头注释里「不受移入先后影响」的说明 */
const rightList = computed(() => {
  const set = new Set(rightKeys.value)
  const kw = rightKeyword.value.trim().toLowerCase()
  return props.data.filter((item) => {
    if (!set.has(String(item[props.keyField]))) return false
    if (!kw) return true
    return String(item[props.labelField] || '').toLowerCase().indexOf(kw) > -1
  })
})

const selectableLeft = computed(() => leftList.value.filter((i) => !i[props.disabledField]))
const allLeftOn = computed(
  () =>
    selectableLeft.value.length > 0 &&
    selectableLeft.value.every((i) => leftChecked.value.indexOf(String(i[props.keyField])) > -1),
)
const allRightOn = computed(
  () => rightList.value.length > 0 && rightList.value.every((i) => inRight(i)),
)

const canToRight = computed(() => leftChecked.value.length > 0)
const canToLeft = computed(() => rightChecked.value.length > 0)

const rootClass = computed(
  () => [`cd-transfer--${props.direction}`, props.customClass].filter(Boolean).join(' '),
)

function inLeft(item) {
  return leftChecked.value.indexOf(String(item[props.keyField])) > -1
}

function inRight(item) {
  return rightChecked.value.indexOf(String(item[props.keyField])) > -1
}

function toggleItem(side, item) {
  if (item[props.disabledField]) return
  const box = side === 'left' ? leftChecked : rightChecked
  const list = [...box.value]
  const id = String(item[props.keyField])
  const at = list.indexOf(id)
  if (at > -1) list.splice(at, 1)
  else list.push(id)
  box.value = list
}

/* 全选只作用于「可选项」：禁用的项永远不能被全选勾上，
   否则一次误触就把不该动的记录送到了对面 */
function toggleAll(side) {
  if (side === 'left') {
    leftChecked.value = allLeftOn.value ? [] : selectableLeft.value.map((i) => String(i[props.keyField]))
    return
  }
  rightChecked.value = allRightOn.value ? [] : rightList.value.map((i) => String(i[props.keyField]))
}

function moveToRight() {
  if (!canToRight.value) return
  const moved = selectableLeft.value
    .filter((i) => leftChecked.value.indexOf(String(i[props.keyField])) > -1)
    .map((i) => String(i[props.keyField]))
  if (!moved.length) return
  const next = [...rightKeys.value, ...moved]
  push(next, moved, 'right')
  leftChecked.value = []
}

function moveToLeft() {
  if (!canToLeft.value) return
  const movedSet = new Set(rightChecked.value)
  const next = rightKeys.value.filter((k) => !movedSet.has(k))
  push(next, [...movedSet], 'left')
  rightChecked.value = []
}

function push(next, movedKeys, direction) {
  emit('update:modelValue', next)
  emit('change', {
    keys: next,
    moved: movedKeys.map(String),
    direction,
    items: props.data.filter((i) => movedKeys.indexOf(String(i[props.keyField])) > -1),
  })
}

function onLeftInput(e) {
  leftKeyword.value = (e && (e.detail ? e.detail.value : e.target && e.target.value)) || ''
}

function onRightInput(e) {
  rightKeyword.value = (e && (e.detail ? e.detail.value : e.target && e.target.value)) || ''
}

/** 外部改动 modelValue 后，本地勾选可能已经不在对应侧了，顺势清掉 */
watch(rightKeys, (keys) => {
  const set = new Set(keys)
  leftChecked.value = leftChecked.value.filter((k) => !set.has(k))
  rightChecked.value = rightChecked.value.filter((k) => set.has(k))
})

defineExpose({ clearSelection: () => {
  leftChecked.value = []
  rightChecked.value = []
} })
</script>

<script>
export default {
  name: 'cd-transfer',
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

.cd-transfer {
  @include cd-reset;

  display: flex;
  width: 100%;
}

.cd-transfer--horizontal {
  flex-direction: row;
  align-items: center;
}

.cd-transfer--vertical {
  flex-direction: column;
}

.cd-transfer__panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-md, 8px);
  overflow: hidden;
}

.cd-transfer__head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: var(--cd-space-2, 8px) var(--cd-space-3, 12px);
  background-color: var(--cd-bg-sunken, #f8fafc);
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
}

.cd-transfer__check-all {
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  min-width: 0;
}

/* 标题不许换行：窄屏两栏并排时面板只有 ~130px，标题一旦折成两行会把
   头部挤成三行高。宁可截断也不要破版 —— (0/5) 的计数信息比标题全称重要 */
.cd-transfer__head-text {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-primary, #1e293b);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cd-transfer__count {
  padding-left: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-tertiary, #94a3b8);
}

.cd-transfer__filter {
  padding: var(--cd-space-2, 8px);
  border-bottom: var(--cd-border-width, 1px) solid var(--cd-border-color-light, #f1f5f9);
}

.cd-transfer__input {
  width: 100%;
  height: 28px;
  padding: 0 var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-sm, 12px);
  background-color: var(--cd-bg-container, #fff);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-sm, 4px);
}

.cd-transfer__body {
  overflow-y: auto;
}

.cd-transfer__item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: var(--cd-space-2, 8px) var(--cd-space-3, 12px);
}

.cd-transfer__item--disabled {
  color: var(--cd-text-disabled, #cbd5e1);
}

.cd-transfer__box {
  display: flex;
  flex: 0 0 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: var(--cd-space-2, 8px);
  border: var(--cd-border-width, 1px) solid var(--cd-border-color-strong, #cbd5e1);
  border-radius: var(--cd-radius-sm, 4px);
}

.cd-transfer__box--on {
  background-color: var(--cd-color-primary, #2563eb);
  border-color: var(--cd-color-primary, #2563eb);
}

.cd-transfer__box-icon {
  color: #fff;
}

.cd-transfer__label {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-sm, 12px);
  color: inherit;
}

.cd-transfer__empty {
  padding: var(--cd-space-4, 16px);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-tertiary, #94a3b8);
  text-align: center;
}

.cd-transfer__actions {
  display: flex;
  justify-content: center;
  padding: 0 var(--cd-space-3, 12px);
}

.cd-transfer__actions--horizontal {
  flex-direction: column;
}

.cd-transfer__actions--vertical {
  flex-direction: row;
  padding: var(--cd-space-3, 12px) 0;
}

.cd-transfer__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #fff;
  background-color: var(--cd-color-primary, #2563eb);
  border-radius: var(--cd-radius-sm, 4px);
}

.cd-transfer__btn--off {
  background-color: var(--cd-bg-disabled, #f1f5f9);
  color: var(--cd-text-disabled, #cbd5e1);
}

.cd-transfer__actions--horizontal .cd-transfer__btn + .cd-transfer__btn {
  margin-top: var(--cd-space-2, 8px);
}

.cd-transfer__actions--vertical .cd-transfer__btn + .cd-transfer__btn {
  margin-left: var(--cd-space-2, 8px);
}

.cd-transfer--vertical .cd-transfer__panel {
  width: 100%;
}
</style>
