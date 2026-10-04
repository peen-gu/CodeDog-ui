<template>
<cd-button size="small" @click="visible = true">打开对话框</cd-button>
<cd-dialog
  v-model="visible"
  title="删除确认"
  content="删除后不可恢复，确定继续吗？"
  @confirm="visible = false"
  @cancel="visible = false"
/>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
</script>
