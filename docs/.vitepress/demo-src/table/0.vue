<template>
<cd-table
  :columns="columns"
  :data="pagedData"
  row-key="id"
  @row-click="handleRowClick"
/>
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
