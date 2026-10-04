<template>
<view class="row row--gap">
  <view class="qr-box">
    <cd-qrcode value="https://ui.codedog.tech" :size="140" />
    <text class="qr-box__text">默认 M 档</text>
  </view>
  <view class="qr-box">
    <cd-qrcode value="CodeDogUI 跨四端组件库" :size="140" level="H" />
    <text class="qr-box__text">H 档带中文</text>
  </view>
  <view class="qr-box">
    <cd-qrcode value="https://doc.codedog.tech" :size="140" level="Q" :margin="2" />
    <text class="qr-box__text">静默区 2 格</text>
  </view>
</view>

<view class="row">
  <cd-qrcode
    :value="qrText"
    :size="120"
    level="H"
    @click="log('点击了二维码')"
  />
  <cd-input v-model="qrText" class="qr-input" placeholder="改内容试试" />
</view>
</template>

<script setup>
/**
 * 扩展组件演示页
 * ---------------------------------------------------------------
 * 覆盖 0.5.4 新增的 12 个组件。
 * 每个分区都用 `<!-- ================= cd-xxx ================= -->` 点名 ——
 * scripts/gen-component-docs.mjs 靠这行注释（与卡片标题）把片段挂到对应组件页，
 * 不点名的片段只能当兜底，最多取 1 条。
 */
import { computed, ref } from 'vue'

/* ---------------- 密度 ---------------- */
const density = ref('default')
function toggleDensity() {
  density.value = density.value === 'small' ? 'default' : 'small'
}

function log(msg) {
  uni.showToast({ title: String(msg), icon: 'none' })
}

/* ---------------- cd-typing ---------------- */
const typingText = ref('你好，我是一条会逐字出现的回复。')
const streamText = ref('流式推送模式：每次推进 3 个字符，更像真实的分块返回。')
function restartTyping() {
  typingText.value = '你好，我是一条会逐字出现的回复。'
}

/* ---------------- cd-guide ---------------- */
const guideVisible = ref(false)
const guideSteps = [
  {
    target: '.guide-target',
    title: '从这里开始',
    content: '引导会先把这一块高亮出来，其余区域压暗。点遮罩可以跳过。',
  },
  {
    target: '.guide-target-2',
    title: '第二步',
    content: 'placement 为 auto 时，若目标下方空间不足会自动翻到上方。',
    shape: 'rect',
  },
  {
    target: '.guide-target-3',
    title: '最后一步',
    content: '高亮框默认是圆角矩形，shape 传 circle 就变成正圆，长按目标也能圈住。',
    shape: 'circle',
  },
]
function startGuide() {
  guideVisible.value = true
}

/* ---------------- cd-tabbar ---------------- */
const tabbarActive = ref('home')
const tabbarItems = [
  { value: 'home', text: '首页', icon: 'home' },
  { value: 'order', text: '订单', icon: 'list', badge: '6' },
  { value: 'message', text: '消息', icon: 'bell', dot: true },
  { value: 'mine', text: '我的', icon: 'user' },
]

/* ---------------- cd-tree ---------------- */
const treeCheckable = ref(true)
const treeStrictly = ref(false)
const treeChecked = ref(['11'])
const treeData = [
  {
    id: '1',
    label: '研发中心',
    children: [
      { id: '11', label: '前端组' },
      { id: '12', label: '后端组' },
      {
        id: '13',
        label: '测试组',
        children: [
          { id: '131', label: '自动化测试' },
          { id: '132', label: '性能测试', disabled: true },
        ],
      },
    ],
  },
  {
    id: '2',
    label: '产品设计',
    children: [
      { id: '21', label: '交互设计' },
      { id: '22', label: '视觉设计' },
    ],
  },
  { id: '3', label: '市场部' },
]
function onTreeCheck(payload) {
  treeChecked.value = payload.checkedKeys || []
}

function onTabbarChange(payload) {
  log('切换到 ' + payload.value)
}

/* ---------------- cd-descriptions ---------------- */
const descItems = [
  { label: '订单号', value: '20261004-8837' },
  { label: '下单时间', value: '2026-10-04 14:22' },
  { label: '客户', value: 'CodeDog 科技' },
  { label: '金额', value: '¥ 12,800.00' },
  { label: '收货地址', value: '杭州市余杭区未来科技城海创园 5 号楼', span: 2 },
]
const descItems2 = [
  { label: '联系人', value: '顾鹏' },
  { label: '电话', value: '138-0013-8000' },
  { label: '状态', value: '已签收' },
]

/* ---------------- cd-color-picker ---------------- */
const pickedColor = ref('#2563eb')
const colorPresets = [
  '#2563eb',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#0f172a',
]

/* ---------------- cd-transfer ---------------- */
const transferValue = ref(['dev', 'design'])
function onTransferChange(payload) {
  log((payload.direction === 'right' ? '移入' : '移出') + ' ' + payload.keys.length + ' 项')
}
const transferData = [
  { key: 'dev', label: '研发' },
  { key: 'design', label: '设计' },
  { key: 'pm', label: '产品' },
  { key: 'qa', label: '测试' },
  { key: 'ops', label: '运维' },
  { key: 'sales', label: '销售', disabled: true },
  { key: 'hr', label: '人力资源' },
]

/* ---------------- cd-qrcode ---------------- */
const qrText = ref('https://ui.codedog.tech/components/qrcode.html')

/* ---------------- cd-index-bar ---------------- */
const cityGroups = [
  { letter: 'A', cities: ['安庆', '鞍山'] },
  { letter: 'B', cities: ['北京', '包头'] },
  { letter: 'C', cities: ['成都', '长沙'] },
  { letter: 'D', cities: ['大连', '东莞'] },
  { letter: 'H', cities: ['杭州', '合肥'] },
  { letter: 'N', cities: ['南京', '宁波'] },
  { letter: 'S', cities: ['上海', '深圳'] },
  { letter: 'W', cities: ['武汉', '无锡'] },
  { letter: 'Z', cities: ['郑州', '中山'] },
]
const cityLetters = computed(() => cityGroups.map((g) => g.letter))
const cityAnchor = ref('')
const currentLetter = ref('')
function onIndexSelect(payload) {
  currentLetter.value = payload.value
  cityAnchor.value = 'city-' + payload.value
}
</script>
