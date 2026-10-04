<template>
<view class="row row--baseline">
  <cd-checkbox v-model="singleCheck" label="独立勾选" />
  <cd-checkbox :model-value="false" indeterminate label="不确定态" />
  <cd-checkbox :model-value="true" disabled label="选中且禁用" />
  <cd-checkbox :model-value="false" disabled label="未选且禁用" />
</view>

<cd-divider position="left">多选组（横向 / 纵向）</cd-divider>

<view class="row">
  <cd-checkbox-group v-model="hobbies">
    <cd-checkbox value="read" label="阅读" />
    <cd-checkbox value="code" label="编码" />
    <cd-checkbox value="run" label="跑步" />
    <cd-checkbox value="music" label="音乐" />
  </cd-checkbox-group>
</view>

<view class="row row--baseline">
  <text class="body-text">选中：{{ hobbies.join('、') || '（无）' }}</text>
</view>

<cd-checkbox-group v-model="cities" direction="vertical">
  <cd-checkbox value="bj" label="北京" />
  <cd-checkbox value="sh" label="上海" />
  <cd-checkbox value="gz" label="广州（禁用）" disabled />
</cd-checkbox-group>

<cd-divider position="left">上限 2 项 —— 选第 3 个时会触发 overlimit</cd-divider>

<cd-checkbox-group v-model="limited" :max="2" @overlimit="handleOverlimit">
  <cd-checkbox value="a" label="选项 A" />
  <cd-checkbox value="b" label="选项 B" />
  <cd-checkbox value="c" label="选项 C" />
  <cd-checkbox value="d" label="选项 D" />
</cd-checkbox-group>
<text class="body-text">{{ limitTip }}</text>
</template>

<script setup>
/**
 * 展示与表单控件演示页。
 * 覆盖第二批 15 个组件，以及它们与 cd-form 的校验联动。
 */
import { computed, reactive, ref } from 'vue'
import { previewImage } from '@/uni_modules/codedog-ui'

/* ---------------- 密度 ---------------- */
const density = ref('default')
function toggleDensity() {
  density.value = density.value === 'small' ? 'default' : 'small'
}

/* ---------------- 标签 ---------------- */
const closableTags = ref(['可关闭 A', '可关闭 B', '可关闭 C'])
function removeTag(index) {
  closableTags.value.splice(index, 1)
}

/* ---------------- 加载 ---------------- */
const fullscreenLoading = ref(false)

/* ---------------- 骨架屏 ---------------- */
const skeletonLoading = ref(true)

/* ---------------- 提示条 ---------------- */
function handleAlertClose() {
  uni.showToast({ title: '触发了 close 事件', icon: 'none' })
}

/* ---------------- 开关 ---------------- */
const switchBasic = ref(true)
const switchValue = ref('ON')
const switchText = ref(false)
const s1 = ref(true)
const s2 = ref(false)
const s3 = ref(true)
const switchGuard = ref(false)

/** 演示 beforeChange：取消返回 false，开关不会先动再弹回 */
function confirmSwitch(next) {
  return new Promise((resolve) => {
    uni.showModal({
      title: '确认切换',
      content: `确定要切换到 ${next} 吗？`,
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false),
    })
  })
}

/* ---------------- 复选 / 单选 ---------------- */
const singleCheck = ref(true)
const hobbies = ref(['read', 'code'])
const cities = ref(['bj'])
const limited = ref(['a'])
const limitTip = ref('')

function handleOverlimit(payload) {
  limitTip.value = `已达上限 ${payload.limit} 项，无法继续选择`
}

const plan = ref('pro')
const range = ref('week')
const size = ref('m')
const channel = ref('sms')

/* ---------------- 步进器 ---------------- */
const count = ref(3)
const price = ref(1.5)
const qty = ref(1)
const big = ref(12)

/* ---------------- 表单校验 ---------------- */
const formRef = ref(null)

const form = reactive({
  plan: 'pro',
  hobbies: ['read'],
  seat: 3,
  notify: true,
  channel: 'sms',
})

const rules = {
  plan: [{ required: true, message: '请选择套餐' }],
  hobbies: [
    {
      validator: (value) =>
        Array.isArray(value) && value.length >= 2 ? true : '请至少选择 2 项兴趣',
      trigger: 'change',
    },
  ],
  seat: [
    {
      validator: (value) => (value >= 3 && value <= 8 ? true : '席位数量需要在 3~8 之间'),
      trigger: 'change',
    },
  ],
  channel: [{ required: true, message: '请选择通知渠道', trigger: 'change' }],
}

const submitResult = ref(null)

async function handleSubmit() {
  submitResult.value = null
  const passed = await formRef.value.validate()

  if (passed) {
    submitResult.value = {
      type: 'success',
      title: '校验通过',
      desc: `提交数据：${JSON.stringify(form)}`,
    }
    return
  }

  submitResult.value = {
    type: 'danger',
    title: '校验未通过',
    desc: '已自动滚动到第一个出错的字段，请修正后重试。',
  }
}

function handleReset() {
  formRef.value.resetFields()
  submitResult.value = null
}

function handleClear() {
  formRef.value.clearValidate()
  submitResult.value = null
}

/* ---------------- 整体禁用 ---------------- */
const formDisabled = ref(false)
const disabledModel = reactive({
  name: '示例名称',
  type: 'a',
  enabled: true,
  count: 2,
})

const typeOptions = [
  { label: '类型 A', value: 'a' },
  { label: '类型 B', value: 'b' },
  { label: '类型 C', value: 'c' },
]

/* 用于页头展示新增组件数量 */
const newComponentCount = computed(() => 15)

/* ---------------- 轮播 / 图片预览 ----------------
 * 演示图用内联 SVG（data URI）生成 —— 不依赖任何外链，
 * 断网、内网、小程序校验域名没配时都能正常渲染。 */
function gradientImage(title, from, to) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="960" height="540" fill="url(#g)"/>` +
    `<text x="480" y="290" font-size="72" fill="#ffffff" text-anchor="middle" font-family="sans-serif">${title}</text>` +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const swiperList = [
  { image: gradientImage('第一屏', '#3b76f6', '#7c3aed'), text: '蓝紫渐变' },
  { image: gradientImage('第二屏', '#0ea5e9', '#10b981'), text: '青绿渐变' },
  { image: gradientImage('第三屏', '#f59e0b', '#ef4444'), text: '橙红渐变' },
]

const swiperIndex = ref(0)
function onSwiperChange(index) {
  swiperIndex.value = index
}

const previewUrls = [
  gradientImage('图一', '#3b76f6', '#1e293b'),
  gradientImage('图二', '#10b981', '#0f766e'),
  gradientImage('图三', '#f59e0b', '#b45309'),
]

const previewVisible = ref(false)

function openPreview() {
  previewImage({ urls: previewUrls, current: 1 })
}

function openPreviewAt(index) {
  previewImage({ urls: previewUrls, current: index })
}

/* ---------------- Schema 表单引擎 ---------------- */

const schemaRef = ref(null)
const schemaResult = ref('未校验')

/*
 * 用 ref 而不是 reactive：组件是「原地改传入对象」的，同时 emit update:modelValue。
 * 若模型是 `const x = reactive({})` 再 v-model 绑定，Vue 编译出的是 `x = $event`，
 * 而 const 不能赋值 —— 运行时会抛 TypeError: Assignment to constant variable。
 * 这里用 ref + :model-value，两条路都避开。
 */
const schemaModel = ref({
  name: '',
  phone: '',
  city: '',
  level: 'normal',
  birthday: '',
  progress: 30,
  count: 1,
  notify: false,
  channel: 'sms',
})

const schemaFields = [
  {
    prop: 'name',
    label: '姓名',
    widget: 'input',
    required: true,
    props: { placeholder: '请输入姓名', clearable: true },
    rules: [{ required: true, message: '姓名不能为空' }],
  },
  {
    prop: 'phone',
    label: '手机号',
    widget: 'input',
    props: { type: 'number', maxlength: 11, placeholder: '请输入手机号' },
    rules: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }],
  },
  {
    prop: 'city',
    label: '城市',
    widget: 'select',
    props: {
      placeholder: '请选择城市',
      options: [
        { label: '北京', value: 'bj' },
        { label: '上海', value: 'sh' },
        { label: '广州', value: 'gz' },
      ],
    },
  },
  {
    prop: 'level',
    label: '会员等级',
    widget: 'radio',
    defaultValue: 'normal',
    props: {
      options: [
        { label: '普通', value: 'normal' },
        { label: '黄金', value: 'gold' },
      ],
    },
  },
  { prop: 'birthday', label: '生日', widget: 'date' },
  {
    prop: 'progress',
    label: '完成度',
    widget: 'slider',
    defaultValue: 30,
    props: { min: 0, max: 100, step: 5 },
  },
  {
    prop: 'count',
    label: '席位',
    widget: 'stepper',
    defaultValue: 1,
    props: { min: 1, max: 20 },
  },
  {
    prop: 'notify',
    label: '接收通知',
    widget: 'switch',
    defaultValue: false,
  },
  {
    /* 只有打开「接收通知」才渲染这一项 —— 隐藏字段不会注册校验规则 */
    prop: 'channel',
    label: '通知渠道',
    widget: 'select',
    span: 2,
    visible: (m) => !!m.notify,
    props: {
      options: [
        { label: '短信', value: 'sms' },
        { label: '邮件', value: 'mail' },
      ],
    },
  },
]

async function submitSchema() {
  const ok = await schemaRef.value.validate()
  schemaResult.value = ok ? '校验通过' : '校验未通过，见字段下方红字'
}

function resetSchema() {
  schemaRef.value.resetFields()
  schemaResult.value = '已重置'
}
</script>
