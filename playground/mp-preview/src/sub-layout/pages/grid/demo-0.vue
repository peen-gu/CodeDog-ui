<template>
<view class="stack">
  <view>
    <text class="col-label">columns=4（默认，带网格线）</text>
    <cd-grid :columns="4">
      <cd-grid-item icon="home" text="首页" url="/pages/index/index" />
      <cd-grid-item icon="chart" text="报表" :badge="5" />
      <cd-grid-item icon="file" text="文档" is-dot :badge="1" />
      <cd-grid-item icon="setting" text="设置" />
      <cd-grid-item icon="users" text="成员" :badge="128" />
      <cd-grid-item icon="bell" text="通知" :badge="0" />
      <cd-grid-item icon="star" text="收藏" />
      <cd-grid-item icon="lock" text="禁用项" disabled />
    </cd-grid>
  </view>

  <view>
    <text class="col-label">columns=3 / border=false</text>
    <cd-grid :columns="3" :border="false">
      <cd-grid-item icon="cloud" text="云盘" />
      <cd-grid-item icon="image" text="相册" />
      <cd-grid-item icon="mail" text="邮件" :badge="9" />
    </cd-grid>
  </view>

  <view>
    <text class="col-label">columns=5（图标色跟随主色）</text>
    <cd-grid :columns="5">
      <cd-grid-item icon="tag" text="标签" />
      <cd-grid-item icon="award" text="勋章" />
      <cd-grid-item icon="globe" text="站点" />
      <cd-grid-item icon="shield" text="安全" />
      <cd-grid-item icon="more-horizontal" text="更多" />
    </cd-grid>
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
