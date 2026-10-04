<template>
<view class="split">
  <view class="split__col">
    <text class="col-label">普通模式（可多开）</text>
    <cd-collapse v-model="collapseNormal">
      <cd-collapse-item name="a" title="什么是二次封装" icon="help" value="推荐阅读">
        不改上游源码，只覆盖它的设计变量与关键结构，
        把「平台差异」和「设计语言」两件事收敛到框架内部。
      </cd-collapse-item>
      <cd-collapse-item name="b" title="为什么不直接用 rpx">
        小程序用它没问题，但 H5 大屏上 rpx 会在约 960px 处封顶，
        于是 PC 端只能看到一块被裁掉的窄屏。
      </cd-collapse-item>
      <cd-collapse-item name="c" title="这一项是禁用的" disabled>
        禁用项依然会渲染，只是头部不响应点击。
      </cd-collapse-item>
    </cd-collapse>
  </view>

  <view class="split__col">
    <text class="col-label">手风琴（accordion，单值 v-model）</text>
    <cd-collapse v-model="collapseAccordion" accordion>
      <cd-collapse-item name="1" title="第一步：选择路线" value="已完成">
        路线 B：基于成熟的 uni-app 组件库做二次封装，
        把精力放在双形态与主题系统上，而不是重造轮子。
      </cd-collapse-item>
      <cd-collapse-item name="2" title="第二步：补全组件" value="进行中">
        从 6 个骨架组件补到 60+，覆盖容器、导航、表单、反馈、展示五类。
      </cd-collapse-item>
      <cd-collapse-item name="3" title="第三步：发布">
        以 uni_modules 为主、npm 为辅双发布，附上完整的许可声明。
      </cd-collapse-item>
    </cd-collapse>

    <view class="log">
      <text class="log__text">当前展开：{{ collapseAccordion || '（全部收起）' }}</text>
    </view>
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
