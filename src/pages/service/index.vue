<template>
  <cd-config-provider :size="density">
    <view class="cd-page">
      <view class="cd-container">
        <!-- ================= 页头 ================= -->
        <view class="hero">
          <view class="hero__main">
            <text class="hero__title">命令式反馈</text>
            <text class="hero__desc">
              toast · confirm · alert · loading —— 一行代码调用，无需在页面里挂组件。
              H5 端零配置自动挂载；小程序端建议放置 cd-toast-host 获得品牌样式。
            </text>
          </view>
          <view class="hero__actions">
            <cd-button size="small" @click="toggleDensity">
              {{ density === 'small' ? '默认密度' : '紧凑密度' }}
            </cd-button>
          </view>
        </view>

        <!-- ================= toast ================= -->
        <cd-card class="section" title="toast" desc="轻提示。同文案连发自动去重续时，最多同时 3 条。">
          <view class="row">
            <cd-button type="primary" size="small" @click="toast.success('保存成功')">success</cd-button>
            <cd-button type="danger" size="small" @click="toast.error('网络连接失败')">error</cd-button>
            <cd-button size="small" @click="toast.warning('存储空间不足')">warning</cd-button>
            <cd-button size="small" @click="toast.info('已复制到剪贴板')">info</cd-button>
          </view>
          <view class="row">
            <cd-button size="small" @click="toast('这是一条不带图标的纯文字提示', { showIcon: false })">
              纯文字
            </cd-button>
            <cd-button size="small" @click="toast.loading('正在同步...')">
              loading 形态
            </cd-button>
            <cd-button size="small" @click="toast.hide()">全部关闭</cd-button>
          </view>
          <view class="row">
            <cd-button size="small" @click="toast.info('这条出现在顶部', { position: 'top' })">position: top</cd-button>
            <cd-button size="small" @click="toast.info('这条出现在底部', { position: 'bottom' })">
              position: bottom
            </cd-button>
            <cd-button size="small" @click="toast.info('超长文案会被截断到两行：这里是一段很长的提示信息，用来验证折行与省略是否正常工作，最多显示两行。')">
              超长文案
            </cd-button>
          </view>
        </cd-card>

        <!-- ================= confirm / alert ================= -->
        <cd-card class="section" title="confirm / alert" desc="确认与警告框，Promise 化。同一时间只保留一个，后到的把先到的按取消结算。">
          <view class="row">
            <cd-button type="primary" size="small" @click="runConfirm">await confirm()</cd-button>
            <cd-button type="danger" size="small" @click="runConfirmDanger">危险操作确认</cd-button>
            <cd-button size="small" @click="runAlert">await alert()</cd-button>
          </view>
          <view v-if="lastResult" class="result">
            <text class="result__label">上一次结果</text>
            <text class="result__value">{{ lastResult }}</text>
          </view>
        </cd-card>

        <!-- ================= loading ================= -->
        <cd-card class="section" title="loading" desc="全局加载态。返回 close 句柄；重复调用只更新文案。">
          <view class="row">
            <cd-button type="primary" size="small" @click="runLoading">显示 2 秒后自动关闭</cd-button>
            <cd-button size="small" @click="runLoadingNoMask">无遮罩</cd-button>
            <cd-button size="small" @click="loading.hide()">立即关闭</cd-button>
          </view>
        </cd-card>

        <!-- ================= 压力测试 ================= -->
        <cd-card class="section" title="连发与去重" desc="验证队列上限与同文案去重：连点 5 次同一按钮只保留一条，混发不同文案最多 3 条。">
          <view class="row">
            <cd-button size="small" @click="spamSame">连发 5 条相同文案</cd-button>
            <cd-button size="small" @click="spamMixed">连发 6 条不同文案</cd-button>
          </view>
        </cd-card>

        <!-- 小程序端宿主：挂了用品牌样式，不挂服务会自动降级到原生 API -->
        <!-- #ifndef H5 -->
        <cd-toast-host />
        <!-- #endif -->
      </view>
    </view>
  </cd-config-provider>
</template>

<script setup>
/**
 * 命令式反馈服务演示页。
 * 注意 H5 端页面里不放 cd-toast-host —— 服务会自动挂载，
 * 页面里再放一份会出现双宿主（视觉重叠无害，但没必要）。
 */
import { ref } from 'vue'
import { toast, confirm, alert, loading } from '@/uni_modules/codedog-ui'

const density = ref('default')
const lastResult = ref('')

function toggleDensity() {
  density.value = density.value === 'small' ? 'default' : 'small'
}

async function runConfirm() {
  const ok = await confirm({
    title: '删除确认',
    content: '删除后数据无法恢复，确定要继续吗？',
  })
  lastResult.value = `confirm → ${ok}`
  if (ok) toast.success('已删除')
}

async function runConfirmDanger() {
  const ok = await confirm({
    type: 'error',
    title: '清空回收站',
    content: '将永久删除全部 23 个文件，此操作不可撤销。',
    confirmText: '全部删除',
    cancelText: '再想想',
  })
  lastResult.value = `confirm(error) → ${ok}`
}

async function runAlert() {
  await alert({
    type: 'info',
    title: '提示',
    content: '新版本已就绪，将在下次启动时自动安装。',
  })
  lastResult.value = 'alert → 已知悉'
}

function runLoading() {
  const close = loading('正在提交数据...')
  setTimeout(() => {
    close()
    toast.success('提交完成')
  }, 2000)
}

function runLoadingNoMask() {
  const close = loading({ message: '后台处理中，页面仍可滚动', mask: false })
  setTimeout(close, 2000)
}

function spamSame() {
  for (let i = 0; i < 5; i += 1) {
    toast.info('同样的提示只保留一条')
  }
}

function spamMixed() {
  for (let i = 1; i <= 6; i += 1) {
    toast.info(`第 ${i} 条消息`)
  }
}
</script>

<style lang="scss">
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
  margin-bottom: var(--cd-space-2, 8px);
}

.row > view {
  margin-right: var(--cd-space-2, 8px);
  margin-bottom: var(--cd-space-2, 8px);
}

.result {
  display: flex;
  align-items: center;
  margin-top: var(--cd-space-3, 12px);
  padding: var(--cd-space-3, 12px) var(--cd-space-4, 16px);
  background-color: var(--cd-bg-sunken, #f8fafc);
  border-radius: var(--cd-radius-md, 8px);
}

.result__label {
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-tertiary, #94a3b8);
  margin-right: var(--cd-space-3, 12px);
}

.result__value {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-primary, #0f172a);
}
</style>
