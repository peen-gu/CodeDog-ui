<template>
  <cd-config-provider :size="density">
    <view class="cd-page">
      <view class="cd-container">
        <!-- ================= 页头 ================= -->
        <view class="hero">
          <view class="hero__main">
            <text class="hero__title">反馈与录入</text>
            <text class="hero__desc">
              drawer · tooltip · popover · dropdown · date/time picker · upload —— 浮层族共用一套定位内核，选择器双形态走「移动原生 + PC 自研」策略
            </text>
          </view>
          <view class="hero__actions">
            <cd-button size="small" @click="toggleDensity">
              {{ density === 'small' ? '默认密度' : '紧凑密度' }}
            </cd-button>
          </view>
        </view>

        <!-- ================= cd-drawer ================= -->
        <cd-card class="section" title="cd-drawer" desc="四向抽屉。auto：移动端从底部滑入、PC 从右侧滑入。与 dialog 的分工：drawer 承载工作区，dialog 承载决策。">
          <view class="row">
            <cd-button size="small" @click="openDrawer('auto')">auto（默认）</cd-button>
            <cd-button size="small" @click="openDrawer('left')">左侧</cd-button>
            <cd-button size="small" @click="openDrawer('top')">顶部</cd-button>
            <cd-button size="small" @click="openDrawer('right')">右侧（宽 400）</cd-button>
          </view>
        </cd-card>

        <!-- ================= cd-tooltip / cd-popover ================= -->
        <cd-card class="section" title="cd-tooltip / cd-popover" desc="tooltip：PC hover、移动长按；popover：点击触发，可承载任意内容，面板内点击不会关闭。">
          <view class="row">
            <cd-tooltip content="这是一段提示文字，PC 悬停 / 移动长按都能唤出">
              <cd-button size="small">悬停或长按我（top）</cd-button>
            </cd-tooltip>
            <cd-tooltip content="右侧方位" placement="right">
              <cd-button size="small">placement: right</cd-button>
            </cd-tooltip>
            <cd-tooltip content="底部方位" placement="bottom">
              <cd-button size="small">placement: bottom</cd-button>
            </cd-tooltip>
          </view>
          <view class="row">
            <cd-popover v-model="popoverVisible" title="确认发布" placement="bottom">
              <template #reference>
                <cd-button size="small" type="primary">点击弹出 popover</cd-button>
              </template>
              <view class="popover-demo">
                <text class="popover-demo__text">发布后所有人可见，确定继续吗？</text>
                <view class="popover-demo__actions">
                  <cd-button size="small" @click="popoverVisible = false">取消</cd-button>
                  <cd-button size="small" type="primary" @click="onPopoverOk">发布</cd-button>
                </view>
              </view>
            </cd-popover>
          </view>
        </cd-card>

        <!-- ================= cd-dropdown ================= -->
        <cd-card class="section" title="cd-dropdown" desc="动作菜单：每项是一条命令。PC 支持 hover 触发与键盘导航（↑↓ / Enter / Esc）。">
          <view class="row">
            <cd-dropdown
              :options="menuOptions"
              trigger="click"
              placeholder="操作"
              @select="onMenuSelect"
            />
            <cd-dropdown
              :options="menuOptions"
              trigger="hover"
              placement="bottom-end"
              placeholder="hover 触发"
              @select="onMenuSelect"
            />
            <text v-if="menuResult" class="muted">最近选择：{{ menuResult }}</text>
          </view>
        </cd-card>

        <!-- ================= 日期 / 时间 ================= -->
        <cd-card class="section" title="cd-date-picker / cd-time-picker" desc="双形态策略：移动端走系统原生滚轮（手感与无障碍都是系统级的），PC 端自研日历面板与双列时间面板。">
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
        </cd-card>

        <!-- ================= cd-upload ================= -->
        <cd-card class="section" title="cd-upload" desc="受控上传：列表真值在 modelValue 里，可用服务端数据直接回填；自定义接口用 customRequest 接管。此演示无上传接口，选中即标记成功。">
          <view class="grid2">
            <view class="grid2__item">
              <text class="field-label">图片卡片（最多 4 张）</text>
              <cd-upload v-model="images" accept="image" :max-count="4" multiple />
            </view>
            <view class="grid2__item">
              <text class="field-label">文件列表（单文件 ≤ 5MB）</text>
              <cd-upload v-model="docs" accept="file" list-type="list" :max-size="5" />
            </view>
          </view>
        </cd-card>

        <!-- ================= cd-picker ================= -->
        <cd-card class="section" title="cd-picker" desc="通用多列选择器：columns 传「列数组的数组」是独立多列，加 cascade 后传树即为级联。点「确定」才落到 modelValue，取消不污染外部值。">
          <view class="grid2">
            <view class="grid2__item">
              <text class="field-label">独立两列（品牌 / 车系）</text>
              <cd-button size="small" @click="flatPickerVisible = true">{{ flatPickerText }}</cd-button>
            </view>
            <view class="grid2__item">
              <text class="field-label">级联三列（省 / 市 / 区）</text>
              <cd-button size="small" @click="areaPickerVisible = true">{{ areaPickerText }}</cd-button>
            </view>
          </view>

          <cd-picker
            v-model="flatPickerValue"
            v-model:visible="flatPickerVisible"
            :columns="brandColumns"
            title="选择车系"
          />
          <cd-picker
            v-model="areaPickerValue"
            v-model:visible="areaPickerVisible"
            :columns="areaTree"
            cascade
            title="选择地区"
          />
        </cd-card>

        <!-- ================= cd-cascader ================= -->
        <cd-card class="section" title="cd-cascader" desc="级联选择：点选即提交，没有确定按钮。check-strictly 打开后父级也能选；emit-path 关掉则只回传末级值。">
          <view class="grid2">
            <view class="grid2__item">
              <text class="field-label">只能选到叶子</text>
              <cd-cascader v-model="cascaderValue" :options="areaTree" placeholder="请选择地区" clearable />
            </view>
            <view class="grid2__item">
              <text class="field-label">任意层级可选（check-strictly）</text>
              <cd-cascader v-model="cascaderStrictValue" :options="areaTree" check-strictly placeholder="省 / 市 / 区 都能停" />
            </view>
          </view>
          <view class="result">
            <text class="result__label">当前值</text>
            <text class="result__value">{{ cascaderValue.join(' / ') || '—' }}　｜　{{ cascaderStrictValue.join(' / ') || '—' }}</text>
          </view>
        </cd-card>

        <!-- ================= cd-calendar ================= -->
        <cd-card class="section" title="cd-calendar" desc="常驻日历面板：single / multiple / range 三种模式。marks 支持打点与底部小字，formatter 可拦截单个格子的文案与可选性。">
          <view class="grid2">
            <view class="grid2__item">
              <text class="field-label">单选（带打点）</text>
              <cd-calendar v-model="calendarDate" :marks="calendarMarks" :show-confirm="false" />
            </view>
            <view class="grid2__item">
              <text class="field-label">区间选择（最长 7 天）</text>
              <cd-calendar v-model="calendarRange" mode="range" :max-range="7" />
            </view>
          </view>
          <view class="result">
            <text class="result__label">当前值</text>
            <text class="result__value">{{ calendarDate || '—' }}　｜　{{ calendarRange.join(' ~ ') || '—' }}</text>
          </view>
        </cd-card>

        <!-- ================= cd-drawer 实体 ================= -->
        <cd-drawer v-model="drawerVisible" :position="drawer" :size="drawer === 'right' ? 400 : ''" :title="drawerTitle">
          <view class="drawer-demo">
            <text class="drawer-demo__text">
              这是一个{{ drawer === 'auto' ? '自动' : drawer }}方向抽屉。body 独立滚动，内容超出时在这里滚。
            </text>
            <cd-button size="small" @click="drawerVisible = false">关闭</cd-button>
          </view>
        </cd-drawer>
      </view>
    </view>
  </cd-config-provider>
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
}

.row > view {
  margin-right: var(--cd-space-2, 8px);
  margin-bottom: var(--cd-space-2, 8px);
}

.muted {
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-tertiary, #94a3b8);
}

.grid2 {
  display: flex;
  flex-wrap: wrap;
}

.grid2__item {
  flex: 1 1 260px;
  min-width: 0;
  margin-right: var(--cd-space-4, 16px);
  margin-bottom: var(--cd-space-3, 12px);
}

.field-label {
  display: block;
  margin-bottom: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
}

.popover-demo {
  max-width: 240px;
}

.popover-demo__text {
  display: block;
  font-size: var(--cd-font-size-sm, 12px);
  line-height: 1.6;
  color: var(--cd-text-regular, #334155);
}

.popover-demo__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--cd-space-3, 12px);
}

.popover-demo__actions > view {
  margin-left: var(--cd-space-2, 8px);
}

.result {
  display: flex;
  align-items: center;
  margin-top: var(--cd-space-2, 8px);
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

.drawer-demo__text {
  display: block;
  margin-bottom: var(--cd-space-4, 16px);
  font-size: var(--cd-font-size-sm, 12px);
  line-height: 1.6;
  color: var(--cd-text-regular, #334155);
}
</style>
