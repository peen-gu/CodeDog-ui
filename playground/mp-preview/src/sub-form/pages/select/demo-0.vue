<template>
<cd-select v-model="picked" :options="pickOptions" placeholder="请选择" />
<view class="row">
  <cd-tag type="info">当前值：{{ picked || "（未选）" }}</cd-tag>
</view>
</template>

<script setup>
import { ref } from 'vue'

const picked = ref('')
const pickOptions = [
  { label: '选项一', value: 'a' },
  { label: '选项二', value: 'b' },
  { label: '选项三（禁用）', value: 'c', disabled: true },
]
</script>
