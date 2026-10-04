<template>
  <view class="cdp">
    <view class="cdp-header">
      <text class="cdp-header__title">Qrcode 二维码</text>
      <text class="cdp-header__desc">编码核心自研零依赖（版本 1~10 / L M Q H / 字节模式），与 npm qrcode 包逐位比对通过。渲染是纯 view 节点且坐标全部取整，不会出现 1px 白缝。</text>
      <text class="cdp-header__chip">cd-qrcode</text>
    </view>

    <view class="cdp-section">
      <text class="cdp-section__title">基础用法</text>
      <view class="cdp-card cdp-host">
        <Demo0 />
      </view>
    </view>
    <view class="cdp-section">
      <text class="cdp-section__title">相关组件</text>
      <cd-cell-group inset>
        <cd-cell title="Input 输入框" label="cd-input" arrow clickable @click="goto('input')" />
        <cd-cell title="Icon 图标" label="cd-icon" arrow clickable @click="goto('icon')" />
      </cd-cell-group>
    </view>
  </view>
</template>

<script setup>
import Demo0 from './demo-0.vue'

/**
 * 关联组件可能落在别的子包里。小程序允许跨子包 navigateTo，
 * 路径写绝对路径即可（/sub-<分类>/pages/<组件>/index）。
 */
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
  uni.navigateTo({
    url,
    fail: () => uni.showToast({ title: '页面未找到', icon: 'none' }),
  })
}
</script>

<style lang="scss">
/* ------------------------------------------------------------------ *
 * 页面壳间距规范（唯一来源）
 *   页面左右留白  12px  —— .cdp
 *   区块之间      12px  —— .cdp-section 的 margin-bottom（全文仅此一处）
 *   卡片内边距    14px  —— .cdp-card
 *   标题与卡片     8px  —— .cdp-section__title 的 margin-bottom
 * 不用 :last-child 归零（WXSS 不支持结构伪类），靠页面底部 24px padding 兜底。
 * ------------------------------------------------------------------ */
.cdp {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 12px 12px 24px;
  background-color: var(--cd-bg-page, #f5f7fa);
}

/* 顶部信息卡：组件名 + 一句说明 + 标签名 chip */
.cdp-header {
  box-sizing: border-box;
  padding: 16px;
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: 12px;
}

.cdp-header__title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--cd-text-primary, #0f172a);
  line-height: 1.3;
}

.cdp-header__desc {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--cd-text-secondary, #64748b);
  line-height: 1.7;
}

.cdp-header__chip {
  display: inline-block;
  margin-top: 12px;
  padding: 3px 8px;
  font-family: var(--cd-font-family-mono, monospace);
  font-size: 11px;
  color: var(--cd-color-primary, #3b76f6);
  background-color: var(--cd-color-primary-soft, #eff5ff);
  border-radius: 4px;
}

/* 区块：间距只在这里定义一处 */
.cdp-section {
  margin-bottom: 12px;
}

.cdp-section__title {
  display: block;
  margin-bottom: 8px;
  padding-left: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--cd-text-secondary, #64748b);
}

/* demo 画布 */
.cdp-card {
  box-sizing: border-box;
  padding: 14px;
  background-color: var(--cd-bg-container, #ffffff);
  border-radius: 12px;
}
</style>
