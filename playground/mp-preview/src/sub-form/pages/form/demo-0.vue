<template>
<cd-form
  ref="formRef"
  :model="form"
  :rules="rules"
  :label-position="labelPosition"
  :label-width="96"
  :disabled="formDisabled"
>
  <cd-form-item label="用户名" prop="username">
    <cd-input v-model="form.username" placeholder="4-16 位字母或数字" clearable />
  </cd-form-item>

  <cd-form-item label="手机号" prop="phone">
    <cd-input v-model="form.phone" type="number" :maxlength="11" placeholder="11 位手机号" clearable />
  </cd-form-item>

  <cd-form-item label="邮箱" prop="email" help="选填。留空则不校验格式。">
    <cd-input v-model="form.email" placeholder="name@example.com" clearable />
  </cd-form-item>

  <cd-form-item label="年龄" prop="age">
    <cd-input v-model="form.age" type="number" align="right" placeholder="18 - 120" />
  </cd-form-item>

  <cd-form-item label="交付方式" prop="delivery">
    <cd-select v-model="form.delivery" placeholder="请选择" clearable :options="deliveryOptions" />
  </cd-form-item>

  <cd-form-item label="备注" prop="remark">
    <cd-input v-model="form.remark" type="textarea" :rows="2" :maxlength="50" show-word-limit placeholder="最多 50 字" />
  </cd-form-item>
</cd-form>

<view class="row form-actions">
  <cd-button type="primary" :loading="submitting" @click="handleSubmit">提交校验</cd-button>
  <cd-button @click="handleReset">重置</cd-button>
  <cd-button :type="formDisabled ? 'warning' : 'info'" plain @click="formDisabled = !formDisabled">
    {{ formDisabled ? '解除禁用' : '整体禁用' }}
  </cd-button>
</view>

<view class="result-block">
  <text class="result-block__label">表单数据</text>
  <text class="cd-code">{{ formSnapshot }}</text>
</view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ICON_NAMES } from 'codedog-ui/components/cd-icon/icons.js'
import { PATTERNS } from 'codedog-ui/utils/validate.js'

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
