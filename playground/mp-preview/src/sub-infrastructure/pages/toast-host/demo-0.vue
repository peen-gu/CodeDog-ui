<template>
<view class="stack">
  <text class="body-text">下列反馈全部由 service 触发。H5 端宿主会在首次调用时自动挂载；小程序端需要自己在页面里放一个 cd-toast-host。</text>
  <view class="row">
    <cd-button size="small" @click="toast.success('保存成功')">成功提示</cd-button>
    <cd-button size="small" @click="toast.error('保存失败')">失败提示</cd-button>
    <cd-button size="small" @click="runLoading">加载 1.2s</cd-button>
    <cd-button size="small" @click="runConfirm">确认框</cd-button>
  </view>
  <view class="row"><cd-tag type="info">confirm 结果：{{ result || "（未触发）" }}</cd-tag></view>
  <cd-toast-host />
</view>
</template>

<script setup>
import { ref } from 'vue'
import { toast, confirm, loading, hideLoading } from 'codedog-ui'

const result = ref('')

async function runConfirm() {
  const ok = await confirm({ title: '删除确认', content: '删除后不可恢复，确定继续吗？' })
  result.value = ok ? '确定' : '取消'
}

function runLoading() {
  loading('提交中')
  setTimeout(() => {
    hideLoading()
    toast.success('已完成')
  }, 1200)
}
</script>
