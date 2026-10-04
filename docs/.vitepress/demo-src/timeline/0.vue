<template>
<view class="row">
  <cd-button size="small" @click="timelineReverse = !timelineReverse">
    reverse: {{ timelineReverse ? 'true' : 'false' }}
  </cd-button>
</view>

<view class="split">
  <view class="split__col">
    <text class="col-label">默认（实心点 + 语义色）</text>
    <cd-timeline :reverse="timelineReverse">
      <cd-timeline-item timestamp="2026-10-01 16:52" type="success" icon="check">
        <text class="tl-title">构建通过</text>
        <text class="tl-text">h5 与 mp-weixin 双端产物均生成成功。</text>
      </cd-timeline-item>
      <cd-timeline-item timestamp="2026-10-01 15:40" type="primary" icon="edit">
        <text class="tl-title">第五批组件提交</text>
        <text class="tl-text">新增 25 个组件，组件总数达到 62。</text>
      </cd-timeline-item>
      <cd-timeline-item timestamp="2026-10-01 11:02" type="warning" icon="warning">
        <text class="tl-title">发现一个真 bug</text>
        <text class="tl-text">折叠面板展开态读到了旧值，已修复。</text>
      </cd-timeline-item>
      <cd-timeline-item timestamp="2026-10-01 09:00" type="info">
        <text class="tl-title">开始工作</text>
      </cd-timeline-item>
    </cd-timeline>
  </view>

  <view class="split__col">
    <text class="col-label">空心 / 大号 / 无时间戳</text>
    <cd-timeline>
      <cd-timeline-item timestamp="待处理" hollow>等待人工确认</cd-timeline-item>
      <cd-timeline-item timestamp="处理中" hollow size="large" type="warning">
        正在同步数据
      </cd-timeline-item>
      <cd-timeline-item timestamp="已完成" type="success" size="large" icon="check">
        全部同步完成
      </cd-timeline-item>
      <cd-timeline-item hide-timestamp type="danger" icon="close">
        这一项隐藏了时间戳，只有内容
      </cd-timeline-item>
    </cd-timeline>
  </view>
</view>
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
