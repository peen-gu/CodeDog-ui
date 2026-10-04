<template>
<view class="stack">
  <text class="body-text">预览里不做真实滚动 —— 用下面的开关直接驱动 scroll-top，越过 visibility-height（360）后按钮出现。</text>
  <view class="row">
    <cd-button size="small" type="primary" @click="scrollTop = scrollTop > 360 ? 0 : 600">
      {{ scrollTop > 360 ? "模拟回到顶部" : "模拟滚动到 600px" }}
    </cd-button>
    <cd-tag type="info">scrollTop = {{ scrollTop }}</cd-tag>
  </view>
  <cd-backtop :scroll-top="scrollTop" :visibility-height="360" />
</view>
</template>

<script setup>
import { ref } from 'vue'

const scrollTop = ref(0)
</script>
