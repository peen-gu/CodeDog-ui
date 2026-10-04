<template>
  <view class="site">
    <!-- ================= 顶部导航 ================= -->
    <view class="site-nav">
      <view class="site-nav__inner">
        <view class="site-nav__brand">
          <view class="site-nav__logo">
            <cd-icon name="grid" :size="18" />
          </view>
          <text class="site-nav__name">CodeDogUI</text>
          <cd-tag type="info" size="small" plain round>v0.5.0</cd-tag>
        </view>

        <view v-if="!isMobile" class="site-nav__links">
          <cd-button type="text" size="small" @click="open(DOC)">文档中心</cd-button>
          <cd-button type="text" size="small" @click="goDemo">组件演示</cd-button>
          <cd-button type="text" size="small" @click="open(REPO)">GitHub</cd-button>
          <cd-button type="text" size="small" @click="open(NPM)">npm</cd-button>
        </view>

        <view class="site-nav__actions">
          <cd-button size="small" plain round @click="toggleTheme">
            <template #icon>
              <cd-icon :name="isDark ? 'star-fill' : 'star'" :size="14" />
            </template>
            {{ isDark ? '暗色' : '亮色' }}
          </cd-button>
        </view>
      </view>
    </view>

    <!-- ================= Hero ================= -->
    <view class="hero">
      <cd-row :gutter="28">
        <cd-col :span="isPC ? 13 : 24">
          <cd-tag type="primary" size="small" plain round icon="check">已在 npm 上线</cd-tag>
          <text class="hero__title">一套 Vue3 代码</text>
          <text class="hero__title hero__title--accent">跑通四种终端形态</text>
          <text class="hero__desc">
            H5 移动端、H5 PC 浏览器、微信小程序、Electron 桌面。
            不是把移动端拉伸铺满屏幕，而是同一个组件在手机与 PC 上呈现各自的交互形态——
            选择器在手机是底部面板、在 PC 是下拉面板；弹窗在手机是底部抽屉、在 PC 是居中模态。
          </text>

          <view class="hero__actions">
            <cd-button type="primary" size="large" @click="open(DOC)">快速开始</cd-button>
            <cd-button size="large" plain @click="goDemo">浏览组件</cd-button>
          </view>

          <view class="hero__install">
            <cd-icon name="copy" :size="14" />
            <text class="hero__install-text">npm i codedog-ui</text>
            <cd-button type="text" size="small" @click="copyInstall">复制</cd-button>
          </view>
        </cd-col>

        <cd-col :span="isPC ? 11 : 24">
          <cd-card shadow title="组件预览" desc="全部元素取自 CodeDogUI 自身">
            <template #extra>
              <cd-badge value="68" />
            </template>

            <view class="preview">
              <view class="preview__row">
                <cd-button type="primary" size="small">主操作</cd-button>
                <cd-button size="small" plain>次级</cd-button>
                <cd-button type="danger" size="small" round>危险</cd-button>
              </view>

              <view class="preview__row">
                <cd-tag type="primary" size="small" round>primary</cd-tag>
                <cd-tag type="success" size="small" round>success</cd-tag>
                <cd-tag type="warning" size="small" round>warning</cd-tag>
                <cd-tag type="info" size="small" plain round>info</cd-tag>
              </view>

              <view class="preview__row preview__row--between">
                <cd-switch v-model="demoSwitch" />
                <cd-progress :percentage="72" />
              </view>

              <view class="preview__row">
                <cd-input v-model="demoText" placeholder="cd-input 输入中…" />
              </view>
            </view>

            <template #footer>
              <text class="preview__foot">切换右上角「亮色 / 暗色」，所有元素随令牌即时变化</text>
            </template>
          </cd-card>
        </cd-col>
      </cd-row>
    </view>

    <!-- ================= 数据条 ================= -->
    <view class="stats">
      <cd-row :gutter="16">
        <cd-col v-for="item in stats" :key="item.label" :span="isPC ? 6 : 12">
          <view class="stat">
            <text class="stat__value">{{ item.value }}</text>
            <text class="stat__label">{{ item.label }}</text>
          </view>
        </cd-col>
      </cd-row>
    </view>

    <!-- ================= 特性 ================= -->
    <view class="section">
      <view class="section__head">
        <text class="section__title">为跨端而设计，不是为某个端妥协</text>
        <text class="section__desc">每一条设计都对应一个真实的平台约束，而不是风格偏好。</text>
      </view>

      <cd-grid :columns="isPC ? 3 : 1" border :item-min-height="132">
        <cd-grid-item
          v-for="f in features"
          :key="f.title"
          :icon="f.icon"
          :text="f.title"
        >
          <template #default>
            <text class="feature__desc">{{ f.desc }}</text>
          </template>
        </cd-grid-item>
      </cd-grid>
    </view>

    <!-- ================= 组件总览 ================= -->
    <view class="section">
      <view class="section__head">
        <text class="section__title">68 个组件，七类分组</text>
        <text class="section__desc">双形态、通用、表单、反馈、导航——自下而上逐级依赖，改动只从上往下传导。</text>
      </view>

      <cd-tabs v-model="activeLayer" type="card" :tabs="layerTabs" class="section__tabs" />

      <cd-table :columns="columns" :data="filteredLayers" row-key="name" stripe />
    </view>

    <!-- ================= 快速开始 ================= -->
    <view class="section">
      <view class="section__head">
        <text class="section__title">三步接入</text>
        <text class="section__desc">uni-app 项目安装即用，组件由 easycom 自动按需引入。</text>
      </view>

      <cd-steps :current="3" status="success">
        <cd-step title="安装" description="npm i codedog-ui" icon="download" />
        <cd-step title="配置 easycom" description="^cd-(.*) → codedog-ui/components/cd-$1/cd-$1.vue" icon="setting" />
        <cd-step title="直接使用" description="模板里写 <cd-button /> 即可" icon="check" />
      </cd-steps>

      <cd-row :gutter="20" class="section__gap">
        <cd-col :span="isPC ? 12 : 24">
          <cd-card title="pages.json" desc="easycom 配置" compact>
            <text class="cd-code code-block">{{ easycomSnippet }}</text>
          </cd-card>
        </cd-col>
        <cd-col :span="isPC ? 12 : 24">
          <cd-card title="App.vue" desc="引入样式" compact>
            <text class="cd-code code-block">{{ styleSnippet }}</text>
          </cd-card>
        </cd-col>
      </cd-row>
    </view>

    <!-- ================= 常见问题 ================= -->
    <view class="section">
      <view class="section__head">
        <text class="section__title">常见问题</text>
      </view>

      <cd-collapse v-model="activeFaq" accordion>
        <cd-collapse-item
          v-for="item in faqs"
          :key="item.name"
          :name="item.name"
          :title="item.title"
        >
          <text class="faq__answer">{{ item.answer }}</text>
        </cd-collapse-item>
      </cd-collapse>
    </view>

    <!-- ================= 版本记录 ================= -->
    <view class="section">
      <view class="section__head">
        <text class="section__title">版本进展</text>
      </view>

      <cd-timeline>
        <cd-timeline-item
          v-for="v in milestones"
          :key="v.title"
          :timestamp="v.timestamp"
          :type="v.type"
          :icon="v.icon"
        >
          <text class="milestone__title">{{ v.title }}</text>
          <text class="milestone__desc">{{ v.desc }}</text>
        </cd-timeline-item>
      </cd-timeline>
    </view>

    <!-- ================= 页脚 ================= -->
    <view class="footer">
      <cd-divider />

      <cd-row :gutter="24">
        <cd-col :span="isPC ? 8 : 24">
          <view class="footer__col">
            <text class="footer__label">CodeDogUI</text>
            <text class="footer__text">面向 uni-app 的跨端 UI 框架</text>
            <text class="footer__text">MIT · Copyright (c) 2026 Codedog.tech</text>
          </view>
        </cd-col>
        <cd-col :span="isPC ? 8 : 24">
          <view class="footer__col">
            <text class="footer__label">资源</text>
            <cd-button type="text" size="small" @click="open(DOC)">文档中心</cd-button>
            <cd-button type="text" size="small" @click="open(NPM)">npm 包</cd-button>
            <cd-button type="text" size="small" @click="open(REPO)">源码仓库</cd-button>
          </view>
        </cd-col>
        <cd-col :span="isPC ? 8 : 24">
          <view class="footer__col">
            <text class="footer__label">联系</text>
            <text class="footer__text">邮箱 codedog.tech@icloud.com</text>
            <text class="footer__text">微信 penngu777</text>
            <text class="footer__text">维护团队 Codedog.tech</text>
          </view>
        </cd-col>
      </cd-row>

      <text class="footer__copy">UI 作者 Penn.Gu · {{ SITE }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useBreakpoint, useTheme } from '@/uni_modules/codedog-ui'

const SITE = 'https://ui.codedog.tech'
const DOC = 'https://doc.ui.codedog.tech'
const REPO = 'https://github.com/peen-gu/CodeDog-ui'
const NPM = 'https://www.npmjs.com/package/codedog-ui'
const INSTALL = 'npm i codedog-ui'

const { isPC, isMobile } = useBreakpoint()
const { isDark, toggle: toggleThemeMode } = useTheme()

const demoSwitch = ref(true)
const demoText = ref('')
const activeLayer = ref('all')
const activeFaq = ref('q1')

const toggleTheme = () => toggleThemeMode()

/* ---------------- 外链：H5 直接打开，其余端复制链接 ---------------- */
const open = (url) => {
  // #ifdef H5
  window.open(url, '_blank')
  // #endif
  // #ifndef H5
  uni.setClipboardData({
    data: url,
    success: () => uni.showToast({ title: '链接已复制', icon: 'none' }),
  })
  // #endif
}

const copyInstall = () => {
  uni.setClipboardData({
    data: INSTALL,
    success: () => uni.showToast({ title: '已复制安装命令', icon: 'none' }),
  })
}

const goDemo = () => {
  uni.navigateTo({ url: '/pages/index/index' })
}

/* ---------------- 数据 ---------------- */
const stats = [
  { value: '68', label: '组件总数' },
  { value: '9', label: '组合组件（provide/inject）' },
  { value: '4', label: '覆盖终端形态' },
  { value: 'MIT', label: '开源许可' },
]

const features = [
  { icon: 'globe', title: '一套代码四端运行', desc: 'H5 移动 / H5 PC / 微信小程序 / Electron，跨端差异在组件内部消化。' },
  { icon: 'maximize', title: '双形态组件', desc: '同一个组件在手机与 PC 上呈现各自的交互形态，而非响应式拉伸。' },
  { icon: 'sliders', title: '三层设计令牌', desc: '原始值 → 语义层 → 组件层，改一处不引发雪崩，运行期可切亮暗。' },
  { icon: 'shield', title: '零全局污染', desc: '不使用标签选择器、通配符与全局 reset，小程序端同样安全。' },
  { icon: 'grid', title: 'easycom 自动引入', desc: '模板里直接写 <cd-button />，未使用的组件不进入产物。' },
  { icon: 'star-fill', title: '内置 73 个图标', desc: 'CSS mask + 内联 SVG，零网络请求、零字体文件，颜色跟随文字。' },
]

const layerTabs = [
  { label: '全部', name: 'all' },
  { label: '通用与布局', name: 'core' },
  { label: '表单与录入', name: 'form' },
  { label: '数据展示', name: 'data' },
  { label: '反馈与浮层', name: 'feedback' },
  { label: '结构与导航', name: 'nav' },
]

const layers = [
  { name: 'cd-button', group: 'core', desc: '主/次/危险三态，plain、round、block 组合，含 icon 插槽' },
  { name: 'cd-icon', group: 'core', desc: '73 个内置图标，mask 渲染，颜色跟随 currentColor' },
  { name: 'cd-row / cd-col', group: 'core', desc: '24 栅格，响应式 span，宽度编译期算成百分比' },
  { name: 'cd-card', group: 'core', desc: 'header / extra / footer 插槽，密度可调' },
  { name: 'cd-form / cd-form-item', group: 'form', desc: 'provide/inject 组合，useField 接入统一校验链' },
  { name: 'cd-input', group: 'form', desc: '清除、密码可见、字数统计、前后缀插槽' },
  { name: 'cd-switch', group: 'form', desc: '支持任意一对值，不只布尔' },
  { name: 'cd-checkbox / radio', group: 'form', desc: '独立与组内双用法，校验由组统一触发' },
  { name: 'cd-select / date-picker', group: 'form', desc: '双形态：手机底部面板，PC 下拉面板' },
  { name: 'cd-picker', group: 'form', desc: '通用多列选择器，草稿态与提交态分离，级联改上游自动截断下游' },
  { name: 'cd-cascader', group: 'form', desc: '级联选择，面板多列并排一眼看全路径，fieldNames 做字段映射' },
  { name: 'cd-calendar', group: 'form', desc: '常驻日历面板，single / multiple / range 三模式，marks 打点' },
  { name: 'cd-table', group: 'data', desc: '手机上自动降级为卡片列表' },
  { name: 'cd-progress', group: 'data', desc: '线形与环形，不用 canvas' },
  { name: 'cd-timeline / steps', group: 'data', desc: '组合式结构，父子通过上下文通信' },
  { name: 'cd-swiper', group: 'data', desc: '轮播，底层用 uni 原生 swiper，桌面形态补左右翻页箭头' },
  { name: 'cd-image-preview', group: 'data', desc: '图片预览，手势翻页 + 双指/滚轮缩放，支持命令式调用' },
  { name: 'cd-dialog / drawer', group: 'feedback', desc: '复用 wot 浮层能力，主题走桥接层' },
  { name: 'toast / confirm', group: 'feedback', desc: '命令式服务调用，免写 v-model' },
  { name: 'cd-tabs', group: 'nav', desc: 'line / card 双视觉，badge 与横向滚动' },
  { name: 'cd-grid', group: 'nav', desc: '宫格容器，配合 cd-grid-item 使用' },
]

const columns = [
  { key: 'name', title: '组件', width: isPC.value ? 200 : 140 },
  { key: 'group', title: '分类', width: 100, formatter: (row) => groupLabel(row.group) },
  { key: 'desc', title: '关键设计' },
]

const filteredLayers = computed(() =>
  activeLayer.value === 'all' ? layers : layers.filter((i) => i.group === activeLayer.value),
)

function groupLabel(g) {
  const hit = layerTabs.find((t) => t.name === g)
  return hit ? hit.label : g
}

const easycomSnippet = `{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^cd-(.*)": "codedog-ui/components/cd-$1/cd-$1.vue"
    }
  }
}`

const styleSnippet = `/* App.vue */
@import 'codedog-ui/styles';

/* 或 uni_modules 形态 */
@import '@/uni_modules/codedog-ui/styles/index.scss';`

const faqs = [
  {
    name: 'q1',
    title: '这套库和响应式布局的方案有什么本质区别？',
    answer:
      '响应式是把同一套视觉按断点缩放；CodeDogUI 的双形态是让组件在 PC 上换一种交互模型：选择器从手机的底部动作面板变成 PC 的下拉面板，弹窗从底部抽屉变成居中模态，表格在手机上降级为卡片列表。',
  },
  {
    name: 'q2',
    title: '为什么 rpx 几乎不被使用？',
    answer:
      'rpx 在 H5 端有约 960px 的封顶，大屏会被截断。正式地上去，所以框架统一走 px + CSS 变量 + 断点的策略，由适配层而不是屏幕单位来承担缩放。',
  },
  {
    name: 'q3',
    title: '为什么全部是 Flex 与 class，没有标签选择器？',
    answer:
      '微信小程序的 WXSS 不支持标签选择器与通配符选择器，任何针对 view / text 的直接写法在小程序端都会失效。所以全库只有类选择器，并做好 + 相邻兄弟与后代选择器。',
  },
  {
    name: 'q4',
    title: 'npm 包形态能做条件编译吗？',
    answer:
      '可以。uni-app 对 node_modules 内的包同样执行条件编译，实测 H5 与微信小程序双端产物均正确，小程序打包结果里不会出现 H5 分支代码。',
  },
]

const milestones = [
  { timestamp: '2026-10-02', type: 'success', icon: 'check', title: 'v0.5.2 · 组件补到 67 个', desc: '新增日历、选择器、级联、轮播、图片预览；修掉 6 项致命项，第二轮全库复查 59 项全部落地' },
  { timestamp: '2026-10-01', type: 'primary', icon: 'home', title: 'v0.5.1 · 官网与文档中心改版', desc: '两个站点改用 CodeDogUI 自绘视觉，补上站点打包与部署脚本' },
  { timestamp: '2026-10-01', type: 'success', icon: 'check', title: 'v0.5.0 · 发布到 npm', desc: 'codedog-ui 正式上线（当时 62 个组件），MIT 许可' },
  { timestamp: '2026-10-01', type: 'primary', icon: 'grid', title: '第五批 25 个组件', desc: '导航、容器与工具类全部补齐' },
  { timestamp: '2026-10-01', type: 'primary', icon: 'file', title: '配置文档中心上线', desc: '上线时 62 个组件页 + 9 篇指南，自动生成 API 表格' },
  { timestamp: '规划中', type: 'info', icon: 'cloud', title: 'Trusted Publishing 自动发版', desc: 'GitHub Actions OIDC，仓库不再保存任何 token' },
]
</script>

<style lang="scss" scoped>
.site {
  min-height: 100vh;
  background: var(--cd-bg-page, #f8fafc);
  color: var(--cd-text-primary, #0f172a);
}

/* ---------------- 顶部导航 ---------------- */
.site-nav {
  position: sticky;
  top: 0;
  z-index: var(--cd-z-sticky, 100);
  background: var(--cd-bg-container, #fff);
  border-bottom: 1px solid var(--cd-border-color-light, #e2e8f0);
}

.site-nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1180px;
  margin: 0 auto;
  padding: 14px 24px;
}

.site-nav__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.site-nav__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--cd-radius-md, 8px);
  background: var(--cd-color-primary, #3b76f6);
  color: var(--cd-text-inverse, #fff);
}

.site-nav__name {
  font-size: 17px;
  font-weight: var(--cd-font-weight-semibold, 600);
  letter-spacing: 0.2px;
}

.site-nav__links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.site-nav__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ---------------- Hero ---------------- */
.hero {
  max-width: 1180px;
  margin: 0 auto;
  padding: 72px 24px 40px;
}

.hero__title {
  display: block;
  margin-top: 18px;
  font-size: clamp(30px, 5vw, 50px);
  font-weight: var(--cd-font-weight-semibold, 600);
  line-height: 1.18;
  letter-spacing: -0.5px;
}

.hero__title--accent {
  margin-top: 4px;
  color: var(--cd-color-primary, #3b76f6);
}

.hero__desc {
  display: block;
  margin-top: 18px;
  max-width: 620px;
  font-size: 15px;
  line-height: 1.9;
  color: var(--cd-text-secondary, #64748b);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.hero__install {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 22px;
  padding: 8px 8px 8px 14px;
  border: 1px solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-md, 8px);
  background: var(--cd-bg-sunken, #f1f5f9);
  width: fit-content;
}

.hero__install-text {
  font-family: var(--cd-font-family-mono, monospace);
  font-size: 13px;
  color: var(--cd-text-regular, #334155);
}

/* ---------------- 预览卡 ---------------- */
.preview {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.preview__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.preview__row--between {
  gap: 16px;
}

.preview__foot {
  font-size: 12px;
  color: var(--cd-text-secondary, #64748b);
}

/* ---------------- 数据条 ---------------- */
.stats {
  max-width: 1180px;
  margin: 0 auto;
  padding: 8px 24px 40px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  border-radius: var(--cd-radius-lg, 12px);
  background: var(--cd-bg-container, #fff);
  border: 1px solid var(--cd-border-color-light, #e2e8f0);
}

.stat__value {
  font-size: 26px;
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-color-primary, #3b76f6);
}

.stat__label {
  font-size: 13px;
  color: var(--cd-text-secondary, #64748b);
}

/* ---------------- 通用区块 ---------------- */
.section {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 24px;
}

.section__head {
  margin-bottom: 20px;
}

.section__title {
  display: block;
  font-size: clamp(21px, 3vw, 27px);
  font-weight: var(--cd-font-weight-semibold, 600);
}

.section__desc {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--cd-text-secondary, #64748b);
}

.section__tabs {
  margin-bottom: 16px;
}

.section__gap {
  margin-top: 24px;
}

.feature__desc {
  font-size: 13px;
  line-height: 1.7;
  color: var(--cd-text-secondary, #64748b);
}

.code-block {
  display: block;
  white-space: pre-wrap;
  font-size: 12px;
  line-height: 1.85;
  color: var(--cd-text-regular, #334155);
}

.faq__answer {
  font-size: 13px;
  line-height: 1.9;
  color: var(--cd-text-secondary, #64748b);
}

.milestone__title {
  display: block;
  font-size: 15px;
  font-weight: var(--cd-font-weight-medium, 500);
}

.milestone__desc {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--cd-text-secondary, #64748b);
}

/* ---------------- 页脚 ---------------- */
.footer {
  max-width: 1180px;
  margin: 0 auto;
  padding: 20px 24px 48px;
}

.footer__col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.footer__label {
  font-size: 14px;
  font-weight: var(--cd-font-weight-semibold, 600);
  margin-bottom: 4px;
}

.footer__text {
  font-size: 13px;
  line-height: 1.8;
  color: var(--cd-text-secondary, #64748b);
}

.footer__copy {
  display: block;
  margin-top: 24px;
  font-size: 12px;
  color: var(--cd-text-placeholder, #94a3b8);
}
</style>
