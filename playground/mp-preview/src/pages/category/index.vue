<template>
  <view class="cat-page">
    <view class="cat-page__head">
      <text class="cat-page__title">{{ current.title }}</text>
      <text class="cat-page__desc">{{ current.items.length }} 个组件</text>
    </view>

    <cd-cell-group inset>
      <cd-cell
        v-for="item in list"
        :key="item.name"
        :title="item.title"
        :label="item.name"
        arrow
        clickable
        @click="goto(item.name)"
      />
    </cd-cell-group>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { categories, components } from '../../component-catalog.js'

/* 从首页带过来的分类 id；缺省回落到第一个分类 */
const id = ref('')
const current = computed(
  () => categories.find((c) => c.id === id.value) || categories[0],
)
const list = computed(() =>
  current.value.items
    .map((name) => components.find((c) => c.name === name))
    .filter(Boolean),
)

const ROUTE = {
  "config-provider": "/sub-infrastructure/pages/config-provider/index",
  "toast-host": "/sub-infrastructure/pages/toast-host/index",
  "button": "/sub-general/pages/button/index",
  "icon": "/sub-general/pages/icon/index",
  "divider": "/sub-general/pages/divider/index",
  "typing": "/sub-general/pages/typing/index",
  "watermark": "/sub-general/pages/watermark/index",
  "row": "/sub-layout/pages/row/index",
  "col": "/sub-layout/pages/col/index",
  "grid": "/sub-layout/pages/grid/index",
  "grid-item": "/sub-layout/pages/grid-item/index",
  "cell": "/sub-layout/pages/cell/index",
  "cell-group": "/sub-layout/pages/cell-group/index",
  "affix": "/sub-layout/pages/affix/index",
  "form": "/sub-form/pages/form/index",
  "form-item": "/sub-form/pages/form-item/index",
  "form-render": "/sub-form/pages/form-render/index",
  "input": "/sub-form/pages/input/index",
  "search-bar": "/sub-form/pages/search-bar/index",
  "select": "/sub-form/pages/select/index",
  "checkbox": "/sub-form/pages/checkbox/index",
  "checkbox-group": "/sub-form/pages/checkbox-group/index",
  "radio": "/sub-form/pages/radio/index",
  "radio-group": "/sub-form/pages/radio-group/index",
  "switch": "/sub-form/pages/switch/index",
  "slider": "/sub-form/pages/slider/index",
  "rate": "/sub-form/pages/rate/index",
  "stepper": "/sub-form/pages/stepper/index",
  "upload": "/sub-form/pages/upload/index",
  "date-picker": "/sub-form/pages/date-picker/index",
  "time-picker": "/sub-form/pages/time-picker/index",
  "calendar": "/sub-form/pages/calendar/index",
  "picker": "/sub-form/pages/picker/index",
  "cascader": "/sub-form/pages/cascader/index",
  "color-picker": "/sub-form/pages/color-picker/index",
  "transfer": "/sub-form/pages/transfer/index",
  "signature": "/sub-form/pages/signature/index",
  "avatar": "/sub-data/pages/avatar/index",
  "badge": "/sub-data/pages/badge/index",
  "card": "/sub-data/pages/card/index",
  "table": "/sub-data/pages/table/index",
  "tag": "/sub-data/pages/tag/index",
  "progress": "/sub-data/pages/progress/index",
  "collapse": "/sub-data/pages/collapse/index",
  "collapse-item": "/sub-data/pages/collapse-item/index",
  "timeline": "/sub-data/pages/timeline/index",
  "timeline-item": "/sub-data/pages/timeline-item/index",
  "image": "/sub-data/pages/image/index",
  "image-preview": "/sub-data/pages/image-preview/index",
  "swiper": "/sub-data/pages/swiper/index",
  "count-down": "/sub-data/pages/count-down/index",
  "count-to": "/sub-data/pages/count-to/index",
  "empty": "/sub-data/pages/empty/index",
  "skeleton": "/sub-data/pages/skeleton/index",
  "result": "/sub-data/pages/result/index",
  "tree": "/sub-data/pages/tree/index",
  "descriptions": "/sub-data/pages/descriptions/index",
  "qrcode": "/sub-data/pages/qrcode/index",
  "tabs": "/sub-navigation/pages/tabs/index",
  "pagination": "/sub-navigation/pages/pagination/index",
  "steps": "/sub-navigation/pages/steps/index",
  "step": "/sub-navigation/pages/step/index",
  "breadcrumb": "/sub-navigation/pages/breadcrumb/index",
  "breadcrumb-item": "/sub-navigation/pages/breadcrumb-item/index",
  "dropdown": "/sub-navigation/pages/dropdown/index",
  "fab": "/sub-navigation/pages/fab/index",
  "backtop": "/sub-navigation/pages/backtop/index",
  "navbar": "/sub-navigation/pages/navbar/index",
  "tabbar": "/sub-navigation/pages/tabbar/index",
  "index-bar": "/sub-navigation/pages/index-bar/index",
  "alert": "/sub-feedback/pages/alert/index",
  "dialog": "/sub-feedback/pages/dialog/index",
  "drawer": "/sub-feedback/pages/drawer/index",
  "loading": "/sub-feedback/pages/loading/index",
  "notice-bar": "/sub-feedback/pages/notice-bar/index",
  "action-sheet": "/sub-feedback/pages/action-sheet/index",
  "popconfirm": "/sub-feedback/pages/popconfirm/index",
  "popover": "/sub-feedback/pages/popover/index",
  "tooltip": "/sub-feedback/pages/tooltip/index",
  "guide": "/sub-feedback/pages/guide/index"
}

function goto(name) {
  const url = ROUTE[name]
  if (!url) return
  uni.navigateTo({ url, fail: () => uni.showToast({ title: '页面未找到', icon: 'none' }) })
}

/* uni-app 页面参数通过 onLoad 注入 */
onLoad((query) => {
  if (query && query.id) id.value = query.id
})
</script>

<style lang="scss">
.cat-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 12px 12px 24px;
  background-color: var(--cd-bg-page, #f5f7fa);
}

.cat-page__head {
  box-sizing: border-box;
  padding: 16px;
  margin-bottom: 12px;
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: 12px;
}

.cat-page__title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--cd-text-primary, #0f172a);
}

.cat-page__desc {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--cd-text-secondary, #64748b);
}
</style>
