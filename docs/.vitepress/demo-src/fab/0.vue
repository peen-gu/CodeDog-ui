<template>
<view class="stack">
  <text class="body-text">悬浮球固定在视口右下角，按住可拖拽换位。</text>
  <cd-fab icon="plus" text="新建" draggable @click="count += 1" />
  <view class="row"><cd-tag type="info">已点击 {{ count }} 次</cd-tag></view>
</view>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>
