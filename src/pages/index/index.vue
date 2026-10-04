<template>
  <cd-config-provider :size="density">
    <view class="cd-page cd-page--desktop">
      <view class="cd-container">
        <!-- ---------- 页头 ---------- -->
        <view class="hero">
          <view class="hero__main">
            <text class="hero__title">CodeDogUI</text>
            <text class="hero__desc">
              一套 Vue3 代码 → H5 移动端 / H5 PC 浏览器 / 微信小程序 / Electron 桌面套壳
            </text>

            <view class="hero__meta">
              <text class="hero__meta-item">Codedog.tech 长期维护</text>
              <text class="hero__meta-sep">·</text>
              <text class="hero__meta-item">UI 作者 Penn.Gu</text>
            </view>

            <view class="hero__links">
              <text class="hero__link">ui.codedog.tech</text>
              <text class="hero__link">doc.ui.codedog.tech</text>
              <text class="hero__link">github.com/peen-gu/CodeDog-ui</text>
              <text class="hero__link">codedog.tech@icloud.com</text>
              <text class="hero__link">微信 penngu777</text>
            </view>
          </view>

          <view class="hero__actions">
            <cd-button size="small" @click="cycleTheme">{{ themeLabel }}</cd-button>
            <cd-button size="small" @click="toggleDensity">{{ density === 'small' ? '默认密度' : '紧凑密度' }}</cd-button>
          </view>
        </view>

        <!-- ---------- 端能力探测 ---------- -->
        <view class="cd-panel section">
          <text class="cd-panel__title">端能力探测</text>
          <text class="cd-panel__desc">
            所有双形态组件都依赖这几个信号做决策。缩窄 / 拉宽窗口，或切换设备模拟器，数值会实时变化。
          </text>

          <view class="probe">
            <view v-for="item in probeItems" :key="item.label" class="probe__item">
              <text class="probe__label">{{ item.label }}</text>
              <text class="probe__value" :class="item.strong ? 'probe__value--strong' : ''">{{ item.value }}</text>
            </view>
          </view>

          <view class="probe__hint">
            <text class="probe__hint-text">{{ probeHint }}</text>
          </view>
        </view>

        <!-- ---------- 按钮 ---------- -->
        <view class="cd-panel section">
          <text class="cd-panel__title">cd-button</text>
          <text class="cd-panel__desc">单形态组件：一套实现通吃两端，只靠 CSS 变量区分视觉。</text>

          <view class="row">
            <cd-button type="primary">主要</cd-button>
            <cd-button type="success">成功</cd-button>
            <cd-button type="warning">警告</cd-button>
            <cd-button type="danger">危险</cd-button>
            <cd-button type="info">信息</cd-button>
            <cd-button>默认</cd-button>
            <cd-button type="text">文字按钮</cd-button>
          </view>

          <view class="row">
            <cd-button type="primary" plain>幽灵主要</cd-button>
            <cd-button type="danger" plain>幽灵危险</cd-button>
            <cd-button type="primary" size="small">小号</cd-button>
            <cd-button type="primary" size="large">大号</cd-button>
            <cd-button type="primary" round>胶囊</cd-button>
            <cd-button type="primary" loading>加载中</cd-button>
            <cd-button type="primary" disabled>禁用</cd-button>
          </view>
        </view>

        <!-- ---------- 双形态：弹窗 ---------- -->
        <view class="cd-panel section">
          <text class="cd-panel__title">cd-dialog · 双形态</text>
          <text class="cd-panel__desc">
            自动形态下：窄屏从底部滑出（抽屉），宽屏居中缩放（模态）。
            也可以强制指定形态，用来验证两端效果。
          </text>

          <view class="row">
            <cd-button type="primary" @click="openDialog('auto')">自动形态</cd-button>
            <cd-button @click="openDialog('mobile')">强制移动形态</cd-button>
            <cd-button @click="openDialog('desktop')">强制桌面形态</cd-button>
          </view>

          <cd-dialog
            v-model="dialogVisible"
            :mode="dialogMode"
            title="删除确认"
            content="删除后无法恢复。该操作会同时移除关联的 3 条记录，请确认后继续。"
            confirm-text="确认删除"
            :confirm-loading="dialogLoading"
            @confirm="handleDialogConfirm"
          />
        </view>

        <!-- ---------- 双形态：选择器 ---------- -->
        <view class="cd-panel section">
          <text class="cd-panel__title">cd-select · 双形态</text>
          <text class="cd-panel__desc">
            移动端弹出底部动作面板，桌面端展开下拉面板并支持 ↑ ↓ 与 Enter 键操作。
          </text>

          <view class="field">
            <text class="field__label">交付方式</text>
            <cd-select
              v-model="delivery"
              placeholder="请选择交付方式"
              clearable
              :options="deliveryOptions"
            />
          </view>

          <text class="result">当前值：{{ delivery || '（空）' }}</text>
        </view>

        <!-- ---------- 导航 ---------- -->
        <view class="cd-panel section">
          <text class="cd-panel__title">继续查看</text>
          <view class="row">
            <cd-button type="primary" @click="navigate('/pages/components/index')">组件库（icon / input / tabs / form）</cd-button>
            <cd-button type="primary" plain @click="navigate('/pages/showcase/index')">展示与表单控件</cd-button>
            <cd-button plain @click="navigate('/pages/service/index')">命令式反馈（toast / confirm / loading）</cd-button>
            <cd-button plain @click="navigate('/pages/feedback/index')">反馈与录入（drawer / picker / upload）</cd-button>
            <cd-button type="primary" plain @click="navigate('/pages/navigation/index')">结构与导航（cell / grid / steps / timeline）</cd-button>
            <cd-button type="primary" plain @click="navigate('/pages/widgets/index')">交互与展示（slider / rate / result / count-to）</cd-button>
            <cd-button @click="navigate('/pages/tokens/index')">设计变量</cd-button>
            <cd-button @click="navigate('/pages/desktop/index')">PC 布局示例</cd-button>
          </view>
        </view>
      </view>
    </view>
  </cd-config-provider>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDevice, useTheme } from '@/uni_modules/codedog-ui'

const { platform, isH5, isMP, isApp, isTouchDevice, width, height, breakpoint, isPC, canHover, isMobile, isDesktop } =
  useDevice()
const { mode: themeMode, isDark, setMode } = useTheme()

/* ---------- 主题 ---------- */
const themeLabel = computed(() => {
  if (themeMode.value === 'auto') return '跟随系统'
  return isDark.value ? '暗色主题' : '亮色主题'
})

function cycleTheme() {
  const order = ['light', 'dark', 'auto']
  const next = order[(order.indexOf(themeMode.value) + 1) % order.length]
  setMode(next)
}

/* ---------- 密度 ---------- */
const density = ref('default')
function toggleDensity() {
  density.value = density.value === 'small' ? 'default' : 'small'
}

/* ---------- 端能力探测 ---------- */
const probeItems = computed(() => [
  { label: '运行平台', value: platform, strong: true },
  { label: '视口尺寸', value: `${width.value} × ${height.value}` },
  { label: '当前断点', value: breakpoint.value },
  { label: 'isPC', value: String(isPC.value), strong: true },
  { label: '具备鼠标悬停', value: String(canHover.value) },
  { label: '触屏设备', value: String(isTouchDevice) },
  { label: 'isMobile / isDesktop', value: `${isMobile.value} / ${isDesktop.value}` },
  { label: 'isH5 / isMP / isApp', value: `${isH5} / ${isMP} / ${isApp}` },
])

const probeHint = computed(() => {
  if (isPC.value) return '当前判定为 PC 形态：弹窗居中、选择器下拉、表格多列。'
  if (isH5) return '当前为 H5 但未达到 PC 判定（宽度 < 1024 或无精确指针）：使用移动形态。'
  return '当前为小程序 / App 端：交互模型是触摸 + 底部弹出，' + '即使跑在宽屏 PC 微信里也保持移动形态。'
})

/* ---------- 弹窗 ---------- */
const dialogVisible = ref(false)
const dialogMode = ref('auto')
const dialogLoading = ref(false)

function openDialog(mode) {
  dialogMode.value = mode
  dialogVisible.value = true
}

async function handleDialogConfirm() {
  dialogLoading.value = true
  // 模拟一次异步提交，用来看清 loading 态与关闭时机
  await new Promise((resolve) => setTimeout(resolve, 900))
  dialogLoading.value = false
  dialogVisible.value = false
}

/* ---------- 选择器 ---------- */
const delivery = ref('')
const deliveryOptions = [
  { label: '立即交付', value: 'now', description: '审核通过后自动发布' },
  { label: '定时交付', value: 'scheduled', description: '按指定时间自动执行' },
  { label: '人工审核', value: 'manual', description: '需专人确认后发布' },
  { label: '暂不交付', value: 'hold' },
]

/* ---------- 导航 ---------- */
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
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  margin-left: var(--cd-space-4, 16px);
}

/* 归属信息：两端都只呈现文本，不做外部跳转（小程序无外链能力） */
.hero__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: var(--cd-space-3, 12px);
}

.hero__meta-item {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-regular, #334155);
}

.hero__meta-sep {
  margin: 0 6px;
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-disabled, #c0c4cc);
}

.hero__links {
  display: flex;
  flex-wrap: wrap;
  margin-top: 6px;
}

.hero__link {
  margin: 0 var(--cd-space-2, 8px) 0 0;
  padding: 2px var(--cd-space-2, 8px);
  font-family: var(--cd-font-family-mono, monospace);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-color-primary, #3b76f6);
  background-color: var(--cd-color-primary-soft, #eff5ff);
  border-radius: var(--cd-radius-sm, 4px);
}

.section {
  margin-bottom: var(--cd-space-4, 16px);
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-top: var(--cd-space-3, 12px);
}

/* .row 不用通配符 >*：WXSS 不支持。小程序端 <view>/<text> 编译成原标签，H5 端编译成 uni-view / uni-text，两端标签都列 */
.row > view,
.row > uni-view,
.row > text,
.row > uni-text,
.row > button,
.row > uni-button {
  margin: 0 var(--cd-space-2, 8px) var(--cd-space-2, 8px) 0;
}

/* 探测面板：两列自适应，宽屏下自动铺开 */
.probe {
  display: flex;
  flex-wrap: wrap;
  margin-top: var(--cd-space-3, 12px);
}

.probe__item {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  padding: var(--cd-space-2, 8px);
  margin-bottom: var(--cd-space-2, 8px);
  background-color: var(--cd-bg-sunken, #f1f5f9);
  border-radius: var(--cd-radius-md, 8px);
}

@media (min-width: 768px) {
  .probe__item {
    width: calc(50% - 8px);
    margin-right: 8px;
  }
}

.probe__label {
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-secondary, #64748b);
}

.probe__value {
  margin-top: 2px;
  font-family: var(--cd-font-family-mono, monospace);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-regular, #334155);
  word-break: break-all;
}

.probe__value--strong {
  color: var(--cd-color-primary, #3b76f6);
  font-weight: var(--cd-font-weight-semibold, 600);
}

.probe__hint {
  padding: var(--cd-space-3, 12px);
  background-color: var(--cd-color-primary-soft, #eff5ff);
  border-radius: var(--cd-radius-md, 8px);
}

.probe__hint-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-color-primary, #3b76f6);
  line-height: 1.6;
}

.field {
  margin-top: var(--cd-space-3, 12px);
}

.field__label {
  display: block;
  margin-bottom: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
}

.result {
  display: block;
  margin-top: var(--cd-space-3, 12px);
  font-family: var(--cd-font-family-mono, monospace);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-regular, #334155);
}
</style>
