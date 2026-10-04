<template>
<view class="row">
  <cd-button size="small" @click="sheetVisible = true">打开动作面板</cd-button>
  <cd-button size="small" type="danger" plain @click="sheetDangerVisible = true">含危险项</cd-button>
</view>

<cd-action-sheet
  v-model="sheetVisible"
  title="选择操作"
  description="选择一个动作，或者取消"
  :actions="sheetActions"
  @select="onSheetSelect"
/>

<cd-action-sheet
  v-model="sheetDangerVisible"
  title="确认要执行吗"
  :actions="sheetDangerActions"
  @select="onSheetSelect"
>
  <template #header>
    <text class="sheet-header">这一份头部是自定义插槽，标题与描述都由业务书写</text>
  </template>
</cd-action-sheet>
</template>

<script setup>
import { ref } from 'vue'

const density = ref('default')

/* 搜索栏 */
const keyword = ref('')
const keyword2 = ref('二次封装')
const keyword3 = ref('')

/* 滑块 */
const sliderValue = ref(42)
const sliderRange = ref([20, 70])
const sliderDisabled = ref(30)

/* 评分 */
const rate1 = ref(4)
const rate2 = ref(3.5)

/* 气泡确认 */
const popconfirmOpen = ref(false)

/* 动作面板 */
const sheetVisible = ref(false)
const sheetDangerVisible = ref(false)
const sheetActions = ref([
  { name: 'share', label: '分享给好友', icon: 'link' },
  { name: 'copy', label: '复制链接', icon: 'copy', description: '复制后可粘贴到任意位置' },
  { name: 'download', label: '下载文件', icon: 'download', disabled: true },
])

const sheetDangerActions = ref([
  { name: 'archive', label: '归档', icon: 'folder' },
  { name: 'delete', label: '删除', icon: 'trash', danger: true, description: '删除后无法恢复' },
])

/* 倒计时 */
const countdownRef = ref(null)

/* 数字滚动 */
const countToRef = ref(null)

/* 图片三态演示。
   第一张用内联 SVG data URI：不依赖外网，任何环境下都能稳定演示「加载成功」，
   否则截图与离线环境里第一格永远在转圈，看不出 loaded 态长什么样。 */
const DEMO_SVG =
  'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D\'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg\'%20viewBox%3D\'0%200%20120%20120\'%3E%3Cdefs%3E%3ClinearGradient%20id%3D\'g\'%20x1%3D\'0\'%20y1%3D\'0\'%20x2%3D\'1\'%20y2%3D\'1\'%3E%3Cstop%20offset%3D\'0\'%20stop-color%3D\'%233b76f6\'%2F%3E%3Cstop%20offset%3D\'1\'%20stop-color%3D\'%2393bafd\'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D\'120\'%20height%3D\'120\'%20rx%3D\'20\'%20fill%3D\'url(%23g)\'%2F%3E%3Ccircle%20cx%3D\'46\'%20cy%3D\'52\'%20r%3D\'13\'%20fill%3D\'none\'%20stroke%3D\'%23fff\'%20stroke-width%3D\'5\'%2F%3E%3Ccircle%20cx%3D\'74\'%20cy%3D\'52\'%20r%3D\'13\'%20fill%3D\'none\'%20stroke%3D\'%23fff\'%20stroke-width%3D\'5\'%2F%3E%3Cpath%20d%3D\'M34%2084c8%2010%2044%2010%2052%200\'%20fill%3D\'none\'%20stroke%3D\'%23fff\'%20stroke-width%3D\'5\'%20stroke-linecap%3D\'round\'%2F%3E%3C%2Fsvg%3E'

const imageCases = ref([
  { src: DEMO_SVG, fit: 'cover', round: false, label: '内联 SVG', text: '' },
  { src: 'https://this-host-does-not-exist.invalid/a.png', fit: 'cover', round: false, label: '404', text: '加载失败' },
  { src: '', fit: 'cover', round: true, label: '空地址', text: '空地址' },
  { src: 'data:text/plain;charset=utf-8,not-an-image', fit: 'cover', round: false, label: '非图片', text: '非图片' },
])

const imgStates = ref({})

function setImageState(index, state) {
  imgStates.value = { ...imgStates.value, [index]: state }
}

function toggleDensity() {
  density.value = density.value === 'small' ? 'default' : 'small'
}

function log(message) {
  uni.showToast({ title: message, icon: 'none' })
}

function onNoticeChange(index) {
  // eslint-disable-next-line no-console
  console.log('[CodeDogUI] 公告切换到第', index + 1, '条')
}

function handleSearchAction() {
  keyword2.value = ''
  log('已取消搜索')
}

function onSheetSelect(item) {
  log(`选择了：${item.label}`)
}

function startCountdown() {
  if (countdownRef.value) countdownRef.value.start()
}

function pauseCountdown() {
  if (countdownRef.value) countdownRef.value.pause()
}

function resetCountdown() {
  if (countdownRef.value) countdownRef.value.reset(3600 * 1000)
}

function replayCountTo() {
  /* 重播走 start()（从 start 重新滚到 end）；
     restart() 则是「从当前显示值继续滚到 end」，适合刷新数据时不要从 0 重来 */
  if (countToRef.value) countToRef.value.start()
}
</script>
