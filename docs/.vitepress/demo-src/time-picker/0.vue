<template>
<view class="grid2">
  <view class="grid2__item">
    <text class="field-label">日期（限 2026 年）</text>
    <cd-date-picker
      v-model="form.date"
      min="2026-01-01"
      max="2026-12-31"
      placeholder="请选择日期"
    />
  </view>
  <view class="grid2__item">
    <text class="field-label">时间</text>
    <cd-time-picker v-model="form.time" placeholder="请选择时间" />
  </view>
</view>
<view class="result">
  <text class="result__label">当前值</text>
  <text class="result__value">{{ form.date || '—' }} {{ form.time || '' }}</text>
</view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { toast } from '@/uni_modules/codedog-ui'

const density = ref('default')

function toggleDensity() {
  density.value = density.value === 'small' ? 'default' : 'small'
}

/* ---------- drawer ---------- */
const drawer = ref('auto')
const drawerVisible = ref(false)
/**
 * 点击即开抽屉。不能只改 direction：direction 初始值就是 'auto'，
 * 再点「auto（默认）」是同值赋值，watch(direction) 不触发，抽屉永远弹不出来。
 * 显式置 visible，方向值照旧供 :position 使用。
 */
function openDrawer(p) {
  drawer.value = p
  drawerVisible.value = true
}

/* watch 联动而不是在按钮上写两个动作，模板保持纯声明 */
watch(drawer, () => {
  drawerVisible.value = true
})

const drawerTitle = computed(() => {
  const map = { auto: '自动方向抽屉', left: '左侧抽屉', right: '右侧抽屉', top: '顶部抽屉' }
  return map[drawer.value] || '抽屉'
})

/* ---------- popover ---------- */
const popoverVisible = ref(false)

function onPopoverOk() {
  popoverVisible.value = false
  toast.success('已发布')
}

/* ---------- dropdown ---------- */
const menuResult = ref('')

const menuOptions = [
  { label: '编辑', value: 'edit', icon: 'edit' },
  { label: '复制', value: 'copy', icon: 'copy' },
  { label: '导出', value: 'export', icon: 'download', divided: true },
  { label: '删除', value: 'delete', icon: 'trash', danger: true },
]

function onMenuSelect(item) {
  menuResult.value = item.label
  if (item.value === 'delete') {
    toast.warning('这是一个危险操作演示')
    return
  }
  toast.success(`已选择「${item.label}」`)
}

/* ---------- 日期 / 时间 ---------- */
const form = ref({ date: '', time: '' })

/* ---------- upload ----------
 * 预置回填两条，展示「已有内容」的真实形态：
 * 空列表只能看到一个 + 号，看不出图片卡片和文件列表长什么样 */
const INLINE_SVG_LOGO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="20" fill="#3b82f6"/><circle cx="38" cy="42" r="10" fill="#fff"/><circle cx="62" cy="42" r="10" fill="#fff"/><path d="M32 62q16 12 32 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/></svg>'
  )
const images = ref([
  { url: INLINE_SVG_LOGO, name: 'brand-logo.svg', status: 'success' },
])
const docs = ref([
  { url: '', name: '接入对接说明-v3.pdf', status: 'success' },
])

/* ---------- picker / cascader ---------- */
const brandColumns = [
  [
    { label: '宝马', value: 'bmw' },
    { label: '奔驰', value: 'benz' },
    { label: '奥迪', value: 'audi' },
    { label: '丰田', value: 'toyota' },
  ],
  [
    { label: '1 系', value: 's1' },
    { label: '3 系', value: 's3' },
    { label: '5 系', value: 's5' },
    { label: '7 系', value: 's7' },
  ],
]

const areaTree = [
  {
    label: '浙江省',
    value: 'zj',
    children: [
      {
        label: '杭州市',
        value: 'hz',
        children: [
          { label: '西湖区', value: 'xh' },
          { label: '拱墅区', value: 'gs' },
          { label: '滨江区', value: 'bj' },
        ],
      },
      {
        label: '宁波市',
        value: 'nb',
        children: [
          { label: '海曙区', value: 'hs' },
          { label: '鄞州区', value: 'yz' },
        ],
      },
    ],
  },
  {
    label: '江苏省',
    value: 'js',
    children: [
      {
        label: '南京市',
        value: 'nj',
        children: [
          { label: '玄武区', value: 'xw' },
          { label: '鼓楼区', value: 'gl' },
        ],
      },
      {
        label: '苏州市',
        value: 'sz',
        children: [
          { label: '姑苏区', value: 'gsu' },
          { label: '工业园区', value: 'sip' },
        ],
      },
    ],
  },
]

const flatPickerVisible = ref(false)
const flatPickerValue = ref(['bmw', 's3'])

const areaPickerVisible = ref(false)
const areaPickerValue = ref(['zj', 'hz', 'xh'])

/**
 * 值数组 → 文案路径。
 * 两种数据形态的「第 i 列从哪来」不一样，必须分开取：
 *   级联（树）  ：第 i 列是「第 i-1 列选中节点的 children」
 *   非级联（列数组的数组）：第 i 列就是 source[i]
 * —— 混在一起写会让第一列拿到的还是「列」而不是「节点」，于是整条路径都是空的。
 */
function pathLabels(values, source, cascade) {
  const out = []
  let level = cascade ? source : source[0] || []
  for (let i = 0; i < values.length; i += 1) {
    const hit = level.find((node) => node.value === values[i])
    if (!hit) break
    out.push(hit.label)
    level = cascade ? hit.children || [] : source[i + 1] || []
  }
  return out
}

const flatPickerText = computed(() => pathLabels(flatPickerValue.value, brandColumns, false).join(' / ') || '未选择')
const areaPickerText = computed(() => pathLabels(areaPickerValue.value, areaTree, true).join(' / ') || '未选择')

const cascaderValue = ref(['zj', 'hz', 'xh'])
const cascaderStrictValue = ref(['js', 'sz'])

/* ---------- calendar ---------- */
const calendarDate = ref('')
const calendarRange = ref([])
const calendarMarks = [
  { date: '2026-10-01', text: '国庆', type: 'text' },
  { date: '2026-10-15', type: 'dot' },
  { date: '2026-10-23', type: 'dot' },
]
</script>
