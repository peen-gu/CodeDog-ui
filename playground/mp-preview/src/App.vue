<script setup>
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  // 预览应用：不做业务初始化
})
</script>

<template>
  <!--
    cd-config-provider 是页面根容器：向下广播主题 / 密度 / 圆角，
    并把 wot-design-uni 的 CSS 变量桥接过去。
    theme 传空串 = 跟随全局主题状态（包内默认亮色）。
    demo 里 5 个浮层组件（select / dialog / drawer / action-sheet）内部渲染 <wd-*>，
    少了这一层拿不到桥接变量。
  -->
  <cd-config-provider theme="">
    <view class="app">
      <slot />
    </view>
  </cd-config-provider>
</template>

<style lang="scss">
/* 真实用户视角：从 npm 包引入样式，而不是从源码目录 */
@import 'codedog-ui/styles';
/* demo 支撑样式的小程序端副本（由 scripts/gen-mp-preview-pages.mjs 生成） */
@import './styles/demo-shell.scss';

page {
  background-color: var(--cd-bg-page, #f5f7fa);
}
</style>
