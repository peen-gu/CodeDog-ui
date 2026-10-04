<template>
<cd-row :gutter="[16, 16]">
  <cd-col :span="{ xs: 24, md: 12 }">
    <view class="field">
      <text class="field__label">基础</text>
      <cd-input v-model="inputDemo.basic" placeholder="请输入内容" clearable />
    </view>
  </cd-col>

  <cd-col :span="{ xs: 24, md: 12 }">
    <view class="field">
      <text class="field__label">前置图标 + 后缀</text>
      <cd-input v-model="inputDemo.search" placeholder="搜索关键字" prefix-icon="search">
        <template #suffix>
          <text class="field__suffix">条</text>
        </template>
      </cd-input>
    </view>
  </cd-col>

  <cd-col :span="{ xs: 24, md: 12 }">
    <view class="field">
      <text class="field__label">密码（可切换可见）</text>
      <cd-input v-model="inputDemo.password" type="password" placeholder="请输入密码" clearable />
    </view>
  </cd-col>

  <cd-col :span="{ xs: 24, md: 12 }">
    <view class="field">
      <text class="field__label">金额（右对齐）</text>
      <cd-input v-model="inputDemo.amount" align="right" prefix-icon="chart" placeholder="0.00" />
    </view>
  </cd-col>

  <cd-col :span="24">
    <view class="field">
      <text class="field__label">多行文本（带字数统计）</text>
      <cd-input
        v-model="inputDemo.remark"
        type="textarea"
        :rows="3"
        :maxlength="120"
        show-word-limit
        placeholder="最多 120 字"
      />
    </view>
  </cd-col>

  <cd-col :span="{ xs: 24, md: 12 }">
    <view class="field">
      <text class="field__label">禁用 / 只读</text>
      <cd-input :model-value="'已锁定的内容'" disabled />
    </view>
  </cd-col>

  <cd-col :span="{ xs: 24, md: 12 }">
    <view class="field">
      <text class="field__label">尺寸档位</text>
      <view class="stack">
        <cd-input v-model="inputDemo.s1" size="small" placeholder="small" />
        <cd-input v-model="inputDemo.s2" size="medium" placeholder="medium" />
        <cd-input v-model="inputDemo.s3" size="large" placeholder="large" />
      </view>
    </view>
  </cd-col>
</cd-row>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ICON_NAMES } from '@/uni_modules/codedog-ui/components/cd-icon/icons'
import { PATTERNS } from '@/uni_modules/codedog-ui/utils/validate'

/* ---------------- 密度 ---------------- */
const density = ref('default')
function toggleDensity() {
  density.value = density.value === 'small' ? 'default' : 'small'
}

/* ---------------- 图标 ---------------- */
const iconNames = ICON_NAMES

function handleCardClick() {
  uni.showToast({ title: '卡片被点击', icon: 'none' })
}

/* ---------------- 输入框 ---------------- */
const inputDemo = reactive({
  basic: '',
  search: '',
  password: '',
  amount: '',
  remark: '',
  s1: '',
  s2: '',
  s3: '',
})

/* ---------------- 标签页 ---------------- */
const tabLine = ref('overview')
const tabsLine = [
  { label: '概览', name: 'overview' },
  { label: '配置', name: 'config', badge: 3 },
  { label: '日志', name: 'logs' },
  { label: '禁用项', name: 'disabled', disabled: true },
]

const tabCard = ref('day')
const tabsCard = [
  { label: '日', name: 'day' },
  { label: '周', name: 'week' },
  { label: '月', name: 'month' },
  { label: '季', name: 'quarter' },
]

const tabScroll = ref('t1')
const tabsScroll = Array.from({ length: 9 }, (_, i) => ({
  label: `较长标签名称 ${i + 1}`,
  name: `t${i + 1}`,
}))

/* ---------------- 表单 ---------------- */
const formRef = ref(null)
const labelPosition = ref('top')
const formDisabled = ref(false)
const submitting = ref(false)

const form = reactive({
  username: '',
  phone: '',
  email: '',
  age: '',
  delivery: '',
  remark: '',
})

const deliveryOptions = [
  { label: '立即交付', value: 'now', description: '审核通过后自动发布' },
  { label: '定时交付', value: 'scheduled', description: '按指定时间自动执行' },
  { label: '人工审核', value: 'manual' },
]

const rules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 4, max: 16, message: '用户名长度应为 4-16 位' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字与下划线' },
  ],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: PATTERNS.mobile, message: '手机号格式不正确' },
  ],
  email: [{ pattern: PATTERNS.email, message: '邮箱格式不正确' }],
  age: [
    { required: true, message: '请输入年龄' },
    {
      /* 自定义校验：允许返回字符串作为错误文案。
         这里刻意做成异步，用来验证 validate 的并发防护是有效的 */
      validator: (value) =>
        new Promise((resolve) => {
          setTimeout(() => {
            const num = Number(value)
            if (num < 18) resolve('年龄不能小于 18 岁')
            else if (num > 120) resolve('年龄不能大于 120 岁')
            else resolve(true)
          }, 200)
        }),
    },
  ],
  delivery: [{ required: true, message: '请选择交付方式' }],
  remark: [{ max: 50, message: '备注最多 50 字' }],
}

const formSnapshot = computed(() => JSON.stringify(form, null, 2))

function toggleLabelPosition() {
  labelPosition.value = labelPosition.value === 'top' ? 'left' : 'top'
}

async function handleSubmit() {
  submitting.value = true
  /* validate() 返回 boolean 而不是 reject：
     校验失败是正常业务分支，不该逼调用方写 try/catch */
  const passed = await formRef.value.validate()
  submitting.value = false

  if (passed) {
    uni.showToast({ title: '校验通过', icon: 'success' })
  } else {
    uni.showToast({ title: '请检查标红字段', icon: 'none' })
  }
}

function handleReset() {
  formRef.value.resetFields()
}

/* ---------------- 导航 ---------------- */
function navigate(url) {
  uni.navigateTo({ url })
}
</script>
