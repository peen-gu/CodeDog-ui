<template>
<cd-breadcrumb>
  <cd-breadcrumb-item to="/pages/index/index">首页</cd-breadcrumb-item>
  <cd-breadcrumb-item>组件库</cd-breadcrumb-item>
  <cd-breadcrumb-item>导航</cd-breadcrumb-item>
  <cd-breadcrumb-item>面包屑</cd-breadcrumb-item>
</cd-breadcrumb>

<cd-divider position="left">图标分隔符 / 长路径自动换行</cd-divider>

<cd-breadcrumb separator-icon="chevron-right">
  <cd-breadcrumb-item>工作台</cd-breadcrumb-item>
  <cd-breadcrumb-item>数据中心</cd-breadcrumb-item>
  <cd-breadcrumb-item>华东区</cd-breadcrumb-item>
  <cd-breadcrumb-item>订单明细</cd-breadcrumb-item>
</cd-breadcrumb>
</template>

<script setup>
import { ref } from 'vue'

const density = ref('default')
const collapseNormal = ref(['a'])
const collapseAccordion = ref('2')
const stepCurrent = ref(2)
const stepStatus = ref('process')
const timelineReverse = ref(false)

function toggleDensity() {
  density.value = density.value === 'small' ? 'default' : 'small'
}

function log(message) {
  uni.showToast({ title: `点击：${message}`, icon: 'none' })
}
</script>
