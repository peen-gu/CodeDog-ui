<template>
  <cd-config-provider :size="density">
    <view class="cd-page cd-page--desktop">
      <view class="cd-container">
        <!-- ================= 页头 ================= -->
        <view class="hero">
          <view class="hero__main">
            <text class="hero__title">组件库</text>
            <text class="hero__desc">
              icon · input · card · row/col · tabs · form —— 全部零外部依赖，两端（H5 / 小程序）行为一致
            </text>
          </view>
          <view class="hero__actions">
            <cd-button size="small" @click="toggleDensity">
              {{ density === 'small' ? '默认密度' : '紧凑密度' }}
            </cd-button>
          </view>
        </view>

        <!-- ================= cd-icon ================= -->
        <cd-card class="section" title="cd-icon" desc="自研矢量图标。零字体、零外链 CDN，颜色跟随父级文字色。">
          <template #extra>
            <text class="muted">{{ iconNames.length }} 个</text>
          </template>

          <view class="icon-grid">
            <view v-for="name in iconNames" :key="name" class="icon-cell">
              <cd-icon :name="name" :size="20" />
              <text class="icon-cell__name">{{ name }}</text>
            </view>
          </view>
        </cd-card>

        <!-- ================= 图标在上下文中的用法 ================= -->
        <cd-card class="section" title="图标的实际用法" desc="图标默认 1em，自动跟随所在文字的字号；也可以显式给颜色。">
          <view class="row">
            <cd-button type="primary">
              <template #icon><cd-icon name="plus" :size="16" /></template>
              新建
            </cd-button>
            <cd-button>
              <template #icon><cd-icon name="download" :size="16" /></template>
              导出
            </cd-button>
            <cd-button type="danger" plain>
              <template #icon><cd-icon name="trash" :size="16" /></template>
              删除
            </cd-button>
            <cd-button type="text">
              <template #icon><cd-icon name="refresh" :size="16" /></template>
              刷新
            </cd-button>
          </view>

          <view class="row row--baseline">
            <text class="inline-text">
              <cd-icon name="check-circle" color="var(--cd-color-success, #10b981)" /> 校验通过
            </text>
            <text class="inline-text">
              <cd-icon name="warning" color="var(--cd-color-warning, #f59e0b)" /> 存在风险
            </text>
            <text class="inline-text">
              <cd-icon name="close-circle" color="var(--cd-color-danger, #ef4444)" /> 已失败
            </text>
            <text class="inline-text">
              <cd-icon name="loader" spin /> 加载中
            </text>
          </view>
        </cd-card>

        <!-- ================= cd-input ================= -->
        <cd-card class="section" title="cd-input" desc="清空、密码、字数统计、前后缀图标、多行文本。">
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
        </cd-card>

        <!-- ================= cd-card ================= -->
        <cd-card class="section" title="cd-card" desc="带 header / extra / footer 插槽的结构化容器，密度随 Provider 变化。">
          <cd-row :gutter="[16, 16]">
            <cd-col :span="{ xs: 24, md: 12, lg: 8 }">
              <cd-card title="基础卡片" desc="带标题与副标题">
                <text class="body-text">主体内容区。点击下方按钮可以看到交互反馈。</text>
                <template #footer>
                  <cd-button size="small" type="primary" block>查看详情</cd-button>
                </template>
              </cd-card>
            </cd-col>

            <cd-col :span="{ xs: 24, md: 12, lg: 8 }">
              <cd-card title="可点击卡片" desc="有悬停浮起与按压反馈" hoverable shadow="hover" @click="handleCardClick">
                <text class="body-text">PC 上悬停会微微上浮，手机上按压会轻微收缩。</text>
              </cd-card>
            </cd-col>

            <cd-col :span="{ xs: 24, md: 12, lg: 8 }">
              <cd-card compact>
                <template #header>
                  <text class="body-text">自定义 header 插槽</text>
                </template>
                <template #extra>
                  <cd-icon name="setting" :size="16" />
                </template>
                <text class="body-text">紧凑模式，间距更小，适合列表型信息。</text>
              </cd-card>
            </cd-col>
          </cd-row>
        </cd-card>

        <!-- ================= cd-row / cd-col ================= -->
        <cd-card title="cd-row / cd-col" desc="24 栅格。窄屏堆叠、宽屏并排，全部由 CSS 媒体查询完成，不需要 JS 参与。">
          <template #extra>
            <text class="muted">gutter 16</text>
          </template>

          <cd-row :gutter="[16, 16]">
            <cd-col v-for="n in 4" :key="`a-${n}`" :span="{ xs: 24, sm: 12, md: 6 }">
              <view class="grid-box"><text class="grid-box__text">xs24 / sm12 / md6</text></view>
            </cd-col>
          </cd-row>

          <cd-row :gutter="[16, 16]" class="grid-gap-top">
            <cd-col :span="8"><view class="grid-box grid-box--brand"><text class="grid-box__text">span 8</text></view></cd-col>
            <cd-col :span="8"><view class="grid-box"><text class="grid-box__text">span 8</text></view></cd-col>
            <cd-col :span="8"><view class="grid-box grid-box--brand"><text class="grid-box__text">span 8</text></view></cd-col>
          </cd-row>

          <cd-row :gutter="[16, 16]" class="grid-gap-top">
            <cd-col :span="6" :offset="6">
              <view class="grid-box grid-box--soft"><text class="grid-box__text">span 6 + offset 6</text></view>
            </cd-col>
            <cd-col :span="6"><view class="grid-box"><text class="grid-box__text">span 6</text></view></cd-col>
          </cd-row>

          <cd-row :gutter="[16, 16]" justify="between" class="grid-gap-top">
            <cd-col :span="6"><view class="grid-box"><text class="grid-box__text">between</text></view></cd-col>
            <cd-col :span="6"><view class="grid-box"><text class="grid-box__text">between</text></view></cd-col>
            <cd-col :span="6"><view class="grid-box"><text class="grid-box__text">between</text></view></cd-col>
          </cd-row>
        </cd-card>

        <!-- ================= cd-tabs ================= -->
        <cd-card class="section" title="cd-tabs" desc="下划线形态用百分比定位指示器，零测量；分段控件形态用背景块表达选中。">
          <cd-tabs v-model="tabLine" :tabs="tabsLine">
            <template #default="{ active }">
              <view class="tab-pane">
                <text class="body-text">当前选中：{{ active }}</text>
                <text class="body-text">内容区由业务自己渲染 —— 组件只回传 active，不托管 pane，因而不会被强制套上懒加载与缓存策略。</text>
              </view>
            </template>
          </cd-tabs>

          <view class="tabs-gap">
            <cd-tabs v-model="tabCard" type="card" :tabs="tabsCard" />
          </view>

          <view class="tabs-gap">
            <text class="field__label">可滚动（标签较多时）</text>
            <cd-tabs v-model="tabScroll" scrollable :tabs="tabsScroll" />
          </view>
        </cd-card>

        <!-- ================= cd-form ================= -->
        <cd-card title="cd-form + cd-form-item" desc="必填、正则、长度、自定义异步校验；blur / change 两种触发时机。">
          <template #extra>
            <cd-button size="small" @click="toggleLabelPosition">
              {{ labelPosition === 'top' ? '改成左标签' : '改成上标签' }}
            </cd-button>
          </template>

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
        </cd-card>

        <cd-card class="section" title="继续查看">
          <view class="row">
            <cd-button @click="navigate('/pages/index/index')">返回总览</cd-button>
            <cd-button @click="navigate('/pages/tokens/index')">设计变量</cd-button>
            <cd-button @click="navigate('/pages/desktop/index')">PC 布局示例</cd-button>
          </view>
        </cd-card>
      </view>
    </view>
  </cd-config-provider>
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

<style lang="scss" scoped>
.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--cd-space-5, 20px);
  margin-bottom: var(--cd-space-4, 16px);
  background-color: var(--cd-bg-container, #ffffff);
  border: 1px solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-lg, 12px);
}

.hero__main {
  flex: 1;
  min-width: 0;
}

.hero__title {
  display: block;
  font-size: var(--cd-font-size-2xl, 24px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #0f172a);
  line-height: 1.25;
}

.hero__desc {
  display: block;
  margin-top: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  line-height: 1.6;
}

.hero__actions {
  flex-shrink: 0;
  margin-left: var(--cd-space-4, 16px);
}

.section {
  margin-bottom: var(--cd-space-4, 16px);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.row > * {
  margin: 0 var(--cd-space-2, 8px) var(--cd-space-2, 8px) 0;
}

.row--baseline {
  margin-top: var(--cd-space-3, 12px);
}

.muted {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-placeholder, #94a3b8);
}

.body-text {
  display: block;
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  line-height: 1.7;
}

/* ---------------- 表单字段 ---------------- */
.field {
  display: block;
}

.field__label {
  display: block;
  margin-bottom: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
}

.field__suffix {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-placeholder, #94a3b8);
}

.stack {
  display: flex;
  flex-direction: column;
}

.stack > * {
  margin-bottom: var(--cd-space-2, 8px);
}

/* ---------------- 图标网格 ---------------- */
.icon-grid {
  display: flex;
  flex-wrap: wrap;
}

.icon-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 25%;
  padding: var(--cd-space-2, 8px) 2px;
}

@media (min-width: 768px) {
  .icon-cell {
    width: 12.5%;
  }
}

@media (min-width: 1024px) {
  .icon-cell {
    width: 8.3333%;
  }
}

.icon-cell__name {
  margin-top: 6px;
  font-size: 10px;
  color: var(--cd-text-placeholder, #94a3b8);
  text-align: center;
  word-break: break-all;
  line-height: 1.3;
}

.inline-text {
  display: inline-flex;
  align-items: center;
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-regular, #334155);
}

/* ---------------- 栅格演示 ---------------- */
.grid-box {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 44px;
  padding: var(--cd-space-2, 8px);
  background-color: var(--cd-bg-sunken, #f1f5f9);
  border-radius: var(--cd-radius-md, 8px);
}

.grid-box--brand {
  background-color: var(--cd-color-primary-soft, #eff5ff);
}

.grid-box--soft {
  background-color: var(--cd-color-success-soft, #ecfdf5);
}

.grid-box__text {
  font-family: var(--cd-font-family-mono, monospace);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-regular, #334155);
  text-align: center;
}

.grid-gap-top {
  margin-top: var(--cd-space-4, 16px);
}

/* ---------------- 标签页 ---------------- */
.tab-pane {
  display: block;
}

.tabs-gap {
  margin-top: var(--cd-space-5, 20px);
}

/* ---------------- 表单结果 ---------------- */
.form-actions {
  margin-top: var(--cd-space-4, 16px);
}

.result-block {
  margin-top: var(--cd-space-4, 16px);
}

.result-block__label {
  display: block;
  margin-bottom: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
}
</style>
