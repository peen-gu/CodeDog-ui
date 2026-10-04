<template>
  <view class="home">
    <!-- 品牌区：渐变 logo + 名称 + 一句价值主张 -->
    <view class="home__hero">
      <view class="home__mark"><text class="home__mark-text">C</text></view>
      <text class="home__name">CodeDogUI</text>
      <text class="home__slogan">80 个组件 · 一套代码跑通四端</text>
    </view>

    <!-- 搜索：直接按组件中文名 / 标签名过滤 -->
    <view class="home__search">
      <cd-search-bar v-model="keyword" placeholder="搜索组件，如「按钮」或 button" />
    </view>

    <!-- 命中结果：有关键词时优先展示，命中即直达组件页 -->
    <view v-if="keyword" class="home__section">
      <text class="home__section-title">搜索结果 · {{ hits.length }}</text>
      <cd-empty v-if="!hits.length" description="没有匹配的组件" />
      <cd-cell-group v-else inset>
        <cd-cell
          v-for="item in hits"
          :key="item.name"
          :title="item.title"
          :label="item.name"
          arrow
          clickable
          @click="goto(item.name)"
        />
      </cd-cell-group>
    </view>

    <!-- 分类入口 -->
    <view v-else class="home__section">
      <text class="home__section-title">组件分类</text>
      <view
        v-for="cat in categories"
        :key="cat.id"
        class="cat"
        @click="openCategory(cat.id)"
      >
        <view class="cat__icon">
          <cd-icon :name="cat.icon" :size="20" />
        </view>
        <view class="cat__main">
          <text class="cat__title">{{ cat.title }}</text>
          <text class="cat__desc">{{ cat.items.length }} 个组件</text>
        </view>
        <cd-icon name="chevron-right" :size="16" class="cat__arrow" />
      </view>
    </view>

    <view class="home__foot">
      <text class="home__foot-text">CodeDogUI · MIT License</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { categories, components } from '../../component-catalog.js'

const keyword = ref('')

const hits = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return []
  return components.filter(
    (c) => c.title.toLowerCase().includes(k) || c.name.includes(k),
  )
})

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

function openCategory(id) {
  uni.navigateTo({ url: `/pages/category/index?id=${id}` })
}
</script>

<style lang="scss">
/* 间距规范与组件页一致：左右 12px、区块间距 12px */
.home {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 0 12px 24px;
  background-color: var(--cd-bg-page, #f5f7fa);
}

.home__hero {
  padding: 32px 4px 20px;
}

.home__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--cd-brand-500, #3b76f6), var(--cd-brand-700, #1d4cd8));
}

.home__mark-text {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
}

.home__name {
  display: block;
  margin-top: 14px;
  font-size: 22px;
  font-weight: 700;
  color: var(--cd-text-primary, #0f172a);
}

.home__slogan {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--cd-text-secondary, #64748b);
}

.home__search {
  margin-bottom: 12px;
}

.home__section {
  margin-bottom: 12px;
}

.home__section-title {
  display: block;
  margin-bottom: 8px;
  padding-left: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--cd-text-secondary, #64748b);
}

/* 分类卡：图标 + 名称 + 数量 + 箭头，信息密度低、留白足 */
.cat {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 14px;
  margin-bottom: 12px;
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: 12px;
}

.cat__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: var(--cd-color-primary, #3b76f6);
  background-color: var(--cd-color-primary-soft, #eff5ff);
}

.cat__main {
  flex: 1;
  min-width: 0;
  margin-left: 12px;
}

.cat__title {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: var(--cd-text-primary, #0f172a);
}

.cat__desc {
  display: block;
  margin-top: 3px;
  font-size: 12px;
  color: var(--cd-text-placeholder, #94a3b8);
}

.cat__arrow {
  flex-shrink: 0;
  color: var(--cd-text-placeholder, #94a3b8);
}

.home__foot {
  padding: 28px 0 8px;
}

.home__foot-text {
  display: block;
  font-size: 12px;
  color: var(--cd-text-placeholder, #94a3b8);
  text-align: center;
}
</style>
