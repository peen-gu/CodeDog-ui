<template>
<view class="row">
  <cd-button size="small" @click="stepCurrent = Math.max(0, stepCurrent - 1)">上一步</cd-button>
  <cd-button size="small" type="primary" @click="stepCurrent = Math.min(4, stepCurrent + 1)">
    下一步（{{ stepCurrent + 1 }}/5）
  </cd-button>
  <cd-button size="small" @click="stepStatus = stepStatus === 'error' ? 'process' : 'error'">
    {{ stepStatus === 'error' ? '恢复正常' : '模拟报错' }}
  </cd-button>
</view>

<cd-divider position="left">align=center（默认，移动端）</cd-divider>
<cd-steps :current="stepCurrent" :status="stepStatus">
  <cd-step title="提交申请" description="填写基本信息" />
  <cd-step title="资料审核" description="预计 1 个工作日" />
  <cd-step title="签署合同" description="电子签" />
  <cd-step title="开通服务" description="自动开通" />
  <cd-step title="完成" />
</cd-steps>

<cd-divider position="left">align=start（PC 后台）</cd-divider>
<cd-steps :current="2" align="start">
  <cd-step title="创建任务" description="2026-10-01 09:12" />
  <cd-step title="数据采集" description="共 12.8 万条" />
  <cd-step title="模型训练" description="进行中 42%" />
  <cd-step title="结果输出" />
</cd-steps>

<cd-divider position="left">vertical</cd-divider>
<cd-steps :current="stepCurrent" :status="stepStatus" direction="vertical">
  <cd-step title="提交申请" description="填写基本信息" />
  <cd-step title="资料审核" description="预计 1 个工作日" />
  <cd-step title="签署合同" />
  <cd-step title="开通服务" />
</cd-steps>
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
