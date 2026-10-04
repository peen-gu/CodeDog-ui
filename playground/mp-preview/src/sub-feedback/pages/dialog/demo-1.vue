<template>
<cd-button size="small" type="danger" @click="delVisible = true">删除这个项目</cd-button>
<cd-dialog
  v-model="delVisible"
  title="危险操作"
  content="删除后无法恢复，确认要继续吗？"
  confirm-text="确认删除"
  :confirm-loading="submitting"
  @confirm="runDelete"
  @cancel="delVisible = false"
/>
<cd-tag v-if="done" type="success">已模拟删除完成</cd-tag>
</template>

<script setup>
import { ref } from 'vue'

const delVisible = ref(false)
const submitting = ref(false)
const done = ref(false)

function runDelete() {
  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    delVisible.value = false
    done.value = true
  }, 1200)
}
</script>
