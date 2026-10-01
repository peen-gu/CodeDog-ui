<template>
  <cd-config-provider>
    <view class="layout">
      <!-- ---------- 侧边栏：仅桌面形态渲染 ---------- -->
      <view v-if="isPC" class="sidebar">
        <view class="sidebar__brand">
          <view class="sidebar__logo" />
          <text class="sidebar__name">CodeDogUI</text>
        </view>
        <view
          v-for="item in navItems"
          :key="item.key"
          class="sidebar__item"
          :class="{ 'sidebar__item--active': activeNav === item.key }"
          @click="activeNav = item.key"
        >
          <text class="sidebar__item-text">{{ item.label }}</text>
        </view>
      </view>

      <!-- ---------- 主内容区 ---------- -->
      <view class="main">
        <view class="topbar">
          <view class="topbar__title">
            <text class="topbar__heading">{{ navTitle }}</text>
            <text class="topbar__sub">共 {{ filtered.length }} 条记录 · 当前 {{ shapeLabel }}</text>
          </view>

          <view class="topbar__filters">
            <view class="topbar__filter">
              <cd-select v-model="statusFilter" :options="statusFilterOptions" placeholder="全部状态" clearable />
            </view>
            <cd-button type="primary" size="small" @click="handleCreate">新建</cd-button>
          </view>
        </view>

        <view class="content">
          <cd-table
            :columns="columns"
            :data="pagedData"
            row-key="id"
            @row-click="handleRowClick"
          />

          <view class="content__footer">
            <cd-pagination
              v-model:current="current"
              v-model:page-size="pageSize"
              :total="filtered.length"
            />
          </view>
        </view>
      </view>
    </view>

    <cd-dialog
      v-model="detailVisible"
      :title="detailTitle"
      :content="detailContent"
      :show-cancel="false"
      confirm-text="知道了"
      @confirm="detailVisible = false"
    />
  </cd-config-provider>
</template>

<script setup>
/**
 * PC 布局示例页。
 *
 * 这个页面演示的是「同一个页面文件在三端的不同呈现」：
 *   PC   → 左侧固定侧边栏 + 顶部工具栏 + 多列表格 + 完整分页
 *   移动 → 侧边栏整个消失（v-if="isPC"），工具栏纵向堆叠，表格自动降级为卡片
 *
 * 注意侧边栏用的是 v-if 而不是 CSS 隐藏：
 * 在移动端它根本不需要被渲染，省掉一半的节点与样式计算；
 * 而「表格 → 卡片」这种结构完全不同、无法靠 CSS 切换的部分，
 * 则交给 cd-table 内部处理。
 */
import { computed, ref, watch } from 'vue'
import { useDevice } from '@/uni_modules/codedog-ui'

const { isPC } = useDevice()

const navItems = [
  { key: 'projects', label: '项目列表' },
  { key: 'deliveries', label: '交付记录' },
  { key: 'settings', label: '项目设置' },
]
const activeNav = ref('projects')
const navTitle = computed(() => navItems.find((item) => item.key === activeNav.value)?.label || '')

const shapeLabel = computed(() => (isPC.value ? '桌面形态' : '移动形态'))

/* -------------------- 数据 -------------------- */

const STATUS_MAP = {
  running: { text: '进行中', color: 'primary' },
  success: { text: '已完成', color: 'success' },
  warning: { text: '有风险', color: 'warning' },
  failed: { text: '已失败', color: 'danger' },
}

const OWNERS = ['林一', '周颖', '陈默', '赵宪', '孙澜']
const NAMES = [
  'medical-ai-assistant',
  'medicalai-sdk',
  'codedog-ui',
  'icon-library',
  'medical-courier',
  'rag-server',
  'pcdn-monitor',
  'ollama-bridge',
  'template-market',
  'docs-site',
]

const rawData = Array.from({ length: 23 }, (_, index) => {
  const statusKeys = Object.keys(STATUS_MAP)
  return {
    id: `R${String(index + 1).padStart(3, '0')}`,
    name: `${NAMES[index % NAMES.length]}-${index + 1}`,
    status: statusKeys[index % statusKeys.length],
    owner: OWNERS[index % OWNERS.length],
    updatedAt: `2026-09-${String((index % 28) + 1).padStart(2, '0')}`,
    size: `${(index * 7.3 + 12).toFixed(1)} MB`,
  }
})

/* -------------------- 列定义 -------------------- */

/**
 * 列定义是双形态共用的：
 * cd-table 在桌面端按列渲染表格，在移动端把第一列升格为卡片标题、
 * 其余列变成「标签 / 值」行。所以不需要为两端写两套列配置。
 */
const columns = [
  { key: 'name', title: '项目名称', ellipsis: true },
  { key: 'status', title: '状态', width: 100, formatter: (row) => STATUS_MAP[row.status].text },
  { key: 'owner', title: '负责人', width: 100 },
  { key: 'updatedAt', title: '更新时间', width: 120 },
  { key: 'size', title: '体积', width: 100, align: 'right' },
]

/* -------------------- 筛选与分页 -------------------- */

const statusFilter = ref('')
const statusFilterOptions = Object.keys(STATUS_MAP).map((key) => ({
  label: STATUS_MAP[key].text,
  value: key,
}))

const filtered = computed(() =>
  statusFilter.value ? rawData.filter((row) => row.status === statusFilter.value) : rawData
)

const current = ref(1)
const pageSize = ref(10)

// 筛选条件变化后当前页可能越界，重置到第 1 页
watch(statusFilter, () => {
  current.value = 1
})

const pagedData = computed(() => {
  const start = (current.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

/* -------------------- 交互 -------------------- */

const detailVisible = ref(false)
const detailTitle = ref('')
const detailContent = ref('')

function handleRowClick({ row }) {
  detailTitle.value = row.name
  detailContent.value = `负责人：${row.owner}｜状态：${STATUS_MAP[row.status].text}｜更新时间：${row.updatedAt}｜体积：${row.size}`
  detailVisible.value = true
}

function handleCreate() {
  uni.showToast({ title: '演示环境，未接入后端', icon: 'none' })
}
</script>

<style lang="scss" scoped>
/**
 * PC 布局的关键点：整页用 flex 撑满视口高度，让侧边栏与内容区各自滚动，
 * 而不是让整个页面滚 —— 后者在宽屏上会让侧边栏跟着滑走。
 * 移动端则退化成普通的纵向堆叠，由页面自身滚动。
 */
.layout {
  display: flex;
  box-sizing: border-box;
  min-height: 100vh;
  background-color: var(--cd-bg-page, #f8fafc);
}

/* ---------- 侧边栏 ---------- */
.sidebar {
  flex: 0 0 220px;
  box-sizing: border-box;
  padding: var(--cd-space-5, 20px) var(--cd-space-3, 12px);
  background-color: var(--cd-bg-container, #ffffff);
  border-right: 1px solid var(--cd-border-color, #e2e8f0);
}

.sidebar__brand {
  display: flex;
  align-items: center;
  padding: 0 var(--cd-space-2, 8px) var(--cd-space-5, 20px);
}

.sidebar__logo {
  width: 22px;
  height: 22px;
  margin-right: var(--cd-space-2, 8px);
  background-color: var(--cd-color-primary, #3b76f6);
  border-radius: var(--cd-radius-sm, 4px);
}

.sidebar__name {
  font-size: var(--cd-font-size-md, 16px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #0f172a);
}

.sidebar__item {
  padding: var(--cd-space-2, 8px) var(--cd-space-3, 12px);
  margin-bottom: var(--cd-space-1, 4px);
  border-radius: var(--cd-radius-md, 8px);
  cursor: pointer;
}

.sidebar__item-text {
  font-size: var(--cd-font-size-base, 14px);
  color: var(--cd-text-regular, #334155);
}

.sidebar__item--active {
  background-color: var(--cd-color-primary-soft, #eff5ff);
}

.sidebar__item--active .sidebar__item-text {
  color: var(--cd-color-primary, #3b76f6);
  font-weight: var(--cd-font-weight-medium, 500);
}

/* ---------- 主内容区 ---------- */
.main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  display: flex;
  flex-direction: column;
  padding: var(--cd-space-4, 16px);
  background-color: var(--cd-bg-container, #ffffff);
  border-bottom: 1px solid var(--cd-border-color, #e2e8f0);
}

.topbar__title {
  margin-bottom: var(--cd-space-3, 12px);
}

.topbar__heading {
  display: block;
  font-size: var(--cd-font-size-lg, 18px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #0f172a);
}

.topbar__sub {
  display: block;
  margin-top: 2px;
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
}

.topbar__filters {
  display: flex;
  align-items: center;
}

.topbar__filter {
  flex: 1;
  min-width: 0;
  margin-right: var(--cd-space-3, 12px);
}

/* 宽屏下工具栏变成一行：标题左、筛选右 —— 这是 PC 端密度优势的体现 */
@media (min-width: 1024px) {
  .topbar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: var(--cd-space-4, 16px) var(--cd-space-6, 24px);
  }

  .topbar__title {
    margin-bottom: 0;
  }

  .topbar__filter {
    flex: 0 0 200px;
  }
}

.content {
  flex: 1;
  min-width: 0;
  padding: var(--cd-space-4, 16px);
}

@media (min-width: 1024px) {
  .content {
    padding: var(--cd-space-6, 24px);
  }
}

.content__footer {
  margin-top: var(--cd-space-4, 16px);
}

@media (max-width: 767px) {
  .content__footer {
    padding-bottom: var(--cd-space-6, 24px);
  }
}
</style>
