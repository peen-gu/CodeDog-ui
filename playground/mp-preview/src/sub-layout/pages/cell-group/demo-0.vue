<template>
<view class="split">
  <view class="split__col">
    <text class="col-label">inset=false（通铺）</text>
    <cd-cell-group title="账号设置">
      <cd-cell title="头像" value="已上传" clickable @click="log('头像')" />
      <cd-cell title="昵称" value="CodeDog" clickable />
      <cd-cell icon="bell" title="消息通知" arrow label="接收订单与系统通知" />
      <cd-cell title="账号 ID" value="cd_8f3a21" :arrow="false" />
    </cd-cell-group>
  </view>

  <view class="split__col">
    <text class="col-label">inset=true（卡片）</text>
    <cd-cell-group inset title="订单">
      <cd-cell title="待付款" value="2" clickable />
      <cd-cell title="待发货" value="1" clickable />
      <cd-cell title="售后中" value="0" :arrow="false" />
    </cd-cell-group>
  </view>
</view>

<cd-divider position="left">独立使用 / 必填 / 禁用 / 长值</cd-divider>

<cd-cell-group inset>
  <cd-cell title="手机号" required value="138****8888" clickable />
  <cd-cell title="这是很长的标题文案用来验证右侧值区不会被挤没" value="右侧值" />
  <cd-cell
    icon="lock"
    title="登录密码"
    label="建议 8 位以上，包含字母与数字"
    required
    clickable
  />
  <cd-cell title="已停用的项" value="不可点" disabled clickable />
</cd-cell-group>

<cd-divider position="left">右侧自由内容（默认插槽）</cd-divider>

<cd-cell-group inset>
  <cd-cell title="默认插槽塞任意内容">
    <cd-tag type="success" size="small" label="已通过" />
    <cd-tag type="info" size="small" label="V2" />
  </cd-cell>
  <cd-cell title="带操作按钮" :arrow="false">
    <cd-button size="small" type="primary" plain>去处理</cd-button>
  </cd-cell>
</cd-cell-group>
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
