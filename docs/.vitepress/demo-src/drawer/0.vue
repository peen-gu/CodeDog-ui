<template>
<cd-button size="small" @click="visible = true">打开抽屉</cd-button>
<cd-drawer v-model="visible" position="right" :size="320" title="侧边抽屉">
  <text class="body-text">抽屉承载工作区类操作，dialog 承载决策类操作。</text>
</cd-drawer>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
</script>
