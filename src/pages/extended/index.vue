<template>
  <cd-config-provider :size="density">
    <view class="cd-page cd-page--desktop">
      <view class="cd-container">
        <!-- ================= 页头 ================= -->
        <view class="hero">
          <view class="hero__main">
            <text class="hero__title">扩展组件</text>
            <text class="hero__desc">
              typing · guide · navbar · tabbar · tree · descriptions · color-picker · transfer ·
              signature · qrcode · watermark · index-bar —— 12 个组件，覆盖 AI 交互、导航、
              中后台与端能力四个方向
            </text>
          </view>
          <view class="hero__actions">
            <cd-button size="small" @click="toggleDensity">
              {{ density === 'small' ? '默认密度' : '紧凑密度' }}
            </cd-button>
          </view>
        </view>

        <!-- ================= cd-typing ================= -->
        <cd-card
          class="section"
          title="cd-typing"
          desc="打字机 / 流式文本：AI 逐字回复、引导文案逐句出现。推进用索引而不是字符串拼接，中途换文案不会出现新旧串味；调度用 setTimeout 链而不是 setInterval，切后台回来不会一次性补一大段。"
        >
          <view class="chat">
            <view class="chat__row">
              <cd-avatar text="AI" size="small" />
              <view class="chat__bubble">
                <cd-typing :text="typingText" :speed="40" @finish="log('打字结束')" />
              </view>
            </view>

            <view class="chat__row">
              <cd-avatar text="AI" size="small" />
              <view class="chat__bubble">
                <cd-typing
                  :text="streamText"
                  :speed="30"
                  :chunk="3"
                  :cursor="false"
                  loop
                  :loop-delay="1200"
                />
              </view>
            </view>
          </view>

          <view class="row">
            <cd-button size="small" @click="restartTyping">重打第一句</cd-button>
            <cd-button size="small" @click="typingText = '换一句也能干净地从头打，不会和上一句串在一起。'">
              换文案
            </cd-button>
          </view>
        </cd-card>

        <!-- ================= cd-guide ================= -->
        <cd-card
          class="section"
          title="cd-guide"
          desc="用户指引：遮罩用 box-shadow 挖洞而不是四块挡板拼，圆角与位置动画都只需改一个节点。placement 支持 auto —— 目标下方空间不够会自动翻到上面。"
        >
          <view class="row">
            <cd-button class="guide-target" size="small" type="primary" @click="startGuide">
              开始引导（第一步指向我）
            </cd-button>
            <cd-button class="guide-target-2" size="small" @click="log('第二个目标被点击')">
              第二步目标
            </cd-button>
            <cd-button class="guide-target-3" size="small" plain @click="guideVisible = true">
              直接打开
            </cd-button>
          </view>

          <cd-guide
            v-model:visible="guideVisible"
            :steps="guideSteps"
            placement="auto"
            @finish="log('引导完成')"
            @skip="log('引导被跳过')"
          />
        </cd-card>

        <!-- ================= cd-navbar ================= -->
        <cd-card
          class="section"
          title="cd-navbar"
          desc="顶部导航栏：状态栏留白由 statusBar 开关 × 实测高度决定，拿不到就退回 0 —— 宁可贴顶也不要留一条莫名空白。标题用绝对居中，左右两侧内容不等长也不会偏心。"
        >
          <view class="stack">
            <view class="navbar-preview">
              <cd-navbar
                title="订单详情"
                subtitle="共 3 件商品"
                left-arrow
                left-text="返回"
                :fixed="false"
                :status-bar="false"
                @click-left="log('点了返回')"
              >
                <template #right>
                  <cd-icon name="more-horizontal" :size="20" />
                </template>
              </cd-navbar>
            </view>

            <view class="navbar-preview">
              <cd-navbar
                title="沉浸式导航栏：自己接管状态栏空间"
                left-arrow
                background="#2563eb"
                :fixed="false"
                :status-bar="true"
                :border="false"
                @click-left="log('点了返回')"
              />
            </view>
          </view>
        </cd-card>

        <!-- ================= cd-tabbar ================= -->
        <cd-card
          class="section"
          title="cd-tabbar"
          desc="底部标签栏：支持徽标与小红点，fixed 时自动等高占位，safeArea 走小程序安全区。选中值可以是 value 也可以是下标。"
        >
          <view class="row">
            <text class="result__label">当前</text>
            <text class="result__value">{{ tabbarActive }}</text>
          </view>

          <view class="tabbar-preview">
            <cd-tabbar
              v-model="tabbarActive"
              :items="tabbarItems"
              :fixed="false"
              :safe-area="false"
              @change="onTabbarChange"
            />
          </view>
        </cd-card>

        <!-- ================= cd-tree ================= -->
        <cd-card
          class="section"
          title="cd-tree"
          desc="树形控件：勾选走「向下全量 + 向上回算」两趟，父子联动带半选态；checkStrictly 打开时父子各算各的。扁平渲染而非嵌套递归，节点再多也不会爆栈。"
        >
          <view class="row">
            <cd-button size="small" @click="treeCheckable = !treeCheckable">
              {{ treeCheckable ? '关闭勾选' : '开启勾选' }}
            </cd-button>
            <cd-checkbox v-model="treeStrictly" label="父子不联动" />
          </view>

          <cd-tree
            class="tree-box"
            :data="treeData"
            :checkable="treeCheckable"
            :check-strictly="treeStrictly"
            :checked-keys="treeChecked"
            default-expand-all
            @check="onTreeCheck"
          >
            <template #empty>没有节点</template>
          </cd-tree>

          <view class="result">
            <text class="result__label">已勾选</text>
            <text class="result__value">{{ treeChecked.join('、') || '（空）' }}</text>
          </view>
        </cd-card>

        <!-- ================= cd-descriptions ================= -->
        <cd-card
          class="section"
          title="cd-descriptions"
          desc="描述列表：一份 items 渲染整张详情表，支持列数、跨列、横竖两种排布。比手写一堆 cell 少 80% 的模板代码。"
        >
          <cd-descriptions title="订单信息" :items="descItems" :column="2" border>
            <template #extra>
              <cd-tag type="success" label="已完成" />
            </template>
          </cd-descriptions>

          <cd-divider position="left">纵向排布</cd-divider>

          <cd-descriptions :items="descItems2" :column="3" direction="vertical" border />
        </cd-card>

        <!-- ================= cd-color-picker ================= -->
        <cd-card
          class="section"
          title="cd-color-picker"
          desc="颜色选择器：HSV 面板 + 色相条 + 透明度，纯 view 实现、不用 canvas。输入与面板双向驱动，粘贴任意合法色值都能解析。"
        >
          <view class="row row--baseline">
            <cd-color-picker v-model="pickedColor" :presets="colorPresets" />
            <view class="swatch" :style="`background-color:${pickedColor};`">
              <text class="swatch__text">{{ pickedColor }}</text>
            </view>
          </view>
        </cd-card>

        <!-- ================= cd-transfer ================= -->
        <cd-card
          class="section"
          title="cd-transfer"
          desc="穿梭框：左右两栏 + 搜索过滤 + 全选。禁用项不可移，方向可调（窄屏自动竖排）。"
        >
          <cd-transfer
            v-model="transferValue"
            :data="transferData"
            :titles="['待选角色', '已选角色']"
            :height="240"
            filterable
            @change="onTransferChange"
          />

          <view class="result">
            <text class="result__label">已选</text>
            <text class="result__value">{{ transferValue.join('、') || '（空）' }}</text>
          </view>
        </cd-card>

        <!-- ================= cd-signature ================= -->
        <cd-card
          class="section"
          title="cd-signature"
          desc="手写签名：笔画拼成 SVG 再以内联 data URI 交给背景图渲染（与 cd-icon 同一套路），不用 canvas 因此四端一致。已完成的笔画与正在画的一笔分成两组节点，移动时只重建后者。"
        >
          <cd-signature
            :height="160"
            confirm-text="确认签名"
            @confirm="log('签名已确认')"
            @clear="log('已清空')"
          />
        </cd-card>

        <!-- ================= cd-qrcode ================= -->
        <cd-card
          class="section"
          title="cd-qrcode"
          desc="二维码：编码核心自研零依赖（版本 1~10 / L M Q H / 字节模式），渲染是纯 view 节点，坐标全部取整因此不会出现 1px 白缝。静默区默认 4 格 —— 小于 4 部分扫码器认不出来。"
        >
          <view class="row row--gap">
            <view class="qr-box">
              <cd-qrcode value="https://ui.codedog.tech" :size="140" />
              <text class="qr-box__text">默认 M 档</text>
            </view>
            <view class="qr-box">
              <cd-qrcode value="CodeDogUI 跨四端组件库" :size="140" level="H" />
              <text class="qr-box__text">H 档带中文</text>
            </view>
            <view class="qr-box">
              <cd-qrcode value="https://doc.codedog.tech" :size="140" level="Q" :margin="2" />
              <text class="qr-box__text">静默区 2 格</text>
            </view>
          </view>

          <view class="row">
            <cd-qrcode
              :value="qrText"
              :size="120"
              level="H"
              @click="log('点击了二维码')"
            />
            <cd-input v-model="qrText" class="qr-input" placeholder="改内容试试" />
          </view>
        </cd-card>

        <!-- ================= cd-watermark ================= -->
        <cd-card
          class="section"
          title="cd-watermark"
          desc="水印：纯 text 节点平铺，不用 canvas 生成背景图。画布放大倍数由旋转角算出来（W·|cosθ|+H·|sinθ|），而不是硬写 1.5 —— 宽屏上能少铺近一半节点。整层 pointer-events:none，绝不会挡住底下的操作。"
        >
          <view class="watermark-box">
            <cd-watermark
              :content="['CodeDogUI', '内部资料']"
              :gap-x="110"
              :gap-y="70"
              :rotate="-22"
              :fixed="false"
            >
              <view class="watermark-box__inner">
                <text class="watermark-box__text">这块区域被水印覆盖，但下面的按钮照样能点。</text>
                <cd-button size="small" @click="log('水印没挡住点击')">点我试试</cd-button>
              </view>
            </cd-watermark>
          </view>
        </cd-card>

        <!-- ================= cd-index-bar ================= -->
        <cd-card
          class="section"
          title="cd-index-bar"
          desc="字母索引栏：只做「手指落在第几个字母」这一件事，把结果 emit 出去由业务用 scroll-into-view 自己跳 —— 锚点滚动要遍历业务列表的 offsetTop，组件既量不准也管不动。整条 pointer-events:none，只有字母本身可点。"
        >
          <view class="indexbar-box">
            <scroll-view class="indexbar-box__scroll" scroll-y :scroll-into-view="cityAnchor">
              <view v-for="group in cityGroups" :key="group.letter" :id="'city-' + group.letter">
                <text class="indexbar-box__letter">{{ group.letter }}</text>
                <view v-for="city in group.cities" :key="city" class="indexbar-box__city">
                  <text>{{ city }}</text>
                </view>
              </view>
            </scroll-view>

            <cd-index-bar
              :index-list="cityLetters"
              :fixed="false"
              @select="onIndexSelect"
            />
          </view>

          <view class="result">
            <text class="result__label">当前字母</text>
            <text class="result__value">{{ currentLetter || '（未选择）' }}</text>
          </view>
        </cd-card>
      </view>
    </view>
  </cd-config-provider>
</template>

<script setup>
/**
 * 扩展组件演示页
 * ---------------------------------------------------------------
 * 覆盖 0.5.4 新增的 12 个组件。
 * 每个分区都用 `<!-- ================= cd-xxx ================= -->` 点名 ——
 * scripts/gen-component-docs.mjs 靠这行注释（与卡片标题）把片段挂到对应组件页，
 * 不点名的片段只能当兜底，最多取 1 条。
 */
import { computed, ref } from 'vue'

/* ---------------- 密度 ---------------- */
const density = ref('default')
function toggleDensity() {
  density.value = density.value === 'small' ? 'default' : 'small'
}

function log(msg) {
  uni.showToast({ title: String(msg), icon: 'none' })
}

/* ---------------- cd-typing ---------------- */
const typingText = ref('你好，我是一条会逐字出现的回复。')
const streamText = ref('流式推送模式：每次推进 3 个字符，更像真实的分块返回。')
function restartTyping() {
  typingText.value = '你好，我是一条会逐字出现的回复。'
}

/* ---------------- cd-guide ---------------- */
const guideVisible = ref(false)
const guideSteps = [
  {
    target: '.guide-target',
    title: '从这里开始',
    content: '引导会先把这一块高亮出来，其余区域压暗。点遮罩可以跳过。',
  },
  {
    target: '.guide-target-2',
    title: '第二步',
    content: 'placement 为 auto 时，若目标下方空间不足会自动翻到上方。',
    shape: 'rect',
  },
  {
    target: '.guide-target-3',
    title: '最后一步',
    content: '高亮框默认是圆角矩形，shape 传 circle 就变成正圆，长按目标也能圈住。',
    shape: 'circle',
  },
]
function startGuide() {
  guideVisible.value = true
}

/* ---------------- cd-tabbar ---------------- */
const tabbarActive = ref('home')
const tabbarItems = [
  { value: 'home', text: '首页', icon: 'home' },
  { value: 'order', text: '订单', icon: 'list', badge: '6' },
  { value: 'message', text: '消息', icon: 'bell', dot: true },
  { value: 'mine', text: '我的', icon: 'user' },
]

/* ---------------- cd-tree ---------------- */
const treeCheckable = ref(true)
const treeStrictly = ref(false)
const treeChecked = ref(['11'])
const treeData = [
  {
    id: '1',
    label: '研发中心',
    children: [
      { id: '11', label: '前端组' },
      { id: '12', label: '后端组' },
      {
        id: '13',
        label: '测试组',
        children: [
          { id: '131', label: '自动化测试' },
          { id: '132', label: '性能测试', disabled: true },
        ],
      },
    ],
  },
  {
    id: '2',
    label: '产品设计',
    children: [
      { id: '21', label: '交互设计' },
      { id: '22', label: '视觉设计' },
    ],
  },
  { id: '3', label: '市场部' },
]
function onTreeCheck(payload) {
  treeChecked.value = payload.checkedKeys || []
}

function onTabbarChange(payload) {
  log('切换到 ' + payload.value)
}

/* ---------------- cd-descriptions ---------------- */
const descItems = [
  { label: '订单号', value: '20261004-8837' },
  { label: '下单时间', value: '2026-10-04 14:22' },
  { label: '客户', value: 'CodeDog 科技' },
  { label: '金额', value: '¥ 12,800.00' },
  { label: '收货地址', value: '杭州市余杭区未来科技城海创园 5 号楼', span: 2 },
]
const descItems2 = [
  { label: '联系人', value: '顾鹏' },
  { label: '电话', value: '138-0013-8000' },
  { label: '状态', value: '已签收' },
]

/* ---------------- cd-color-picker ---------------- */
const pickedColor = ref('#2563eb')
const colorPresets = [
  '#2563eb',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#0f172a',
]

/* ---------------- cd-transfer ---------------- */
const transferValue = ref(['dev', 'design'])
function onTransferChange(payload) {
  log((payload.direction === 'right' ? '移入' : '移出') + ' ' + payload.keys.length + ' 项')
}
const transferData = [
  { key: 'dev', label: '研发' },
  { key: 'design', label: '设计' },
  { key: 'pm', label: '产品' },
  { key: 'qa', label: '测试' },
  { key: 'ops', label: '运维' },
  { key: 'sales', label: '销售', disabled: true },
  { key: 'hr', label: '人力资源' },
]

/* ---------------- cd-qrcode ---------------- */
const qrText = ref('https://ui.codedog.tech/components/qrcode.html')

/* ---------------- cd-index-bar ---------------- */
const cityGroups = [
  { letter: 'A', cities: ['安庆', '鞍山'] },
  { letter: 'B', cities: ['北京', '包头'] },
  { letter: 'C', cities: ['成都', '长沙'] },
  { letter: 'D', cities: ['大连', '东莞'] },
  { letter: 'H', cities: ['杭州', '合肥'] },
  { letter: 'N', cities: ['南京', '宁波'] },
  { letter: 'S', cities: ['上海', '深圳'] },
  { letter: 'W', cities: ['武汉', '无锡'] },
  { letter: 'Z', cities: ['郑州', '中山'] },
]
const cityLetters = computed(() => cityGroups.map((g) => g.letter))
const cityAnchor = ref('')
const currentLetter = ref('')
function onIndexSelect(payload) {
  currentLetter.value = payload.value
  cityAnchor.value = 'city-' + payload.value
}
</script>

<style lang="scss">
.cd-page {
  min-height: 100vh;
  padding: 24px 0 64px;
}

.cd-container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 20px;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.hero__main {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.hero__title {
  font-size: 26px;
  font-weight: 600;
  color: #0f172a;
}

.hero__desc {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.7;
  color: #64748b;
}

.section {
  margin-bottom: 16px;
}

.row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}

.row--baseline {
  align-items: baseline;
}

.row--gap {
  gap: 16px;
}

.stack {
  display: flex;
  flex-direction: column;
}

.result {
  display: flex;
  align-items: center;
  margin-top: 12px;
}

.result__label {
  margin-right: 8px;
  font-size: 12px;
  color: #64748b;
}

.result__value {
  font-size: 13px;
  color: #0f172a;
}

/* ---------------- 打字机 ---------------- */
.chat {
  display: flex;
  flex-direction: column;
}

.chat__row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.chat__bubble {
  max-width: 560px;
  margin-left: 8px;
  padding: 10px 14px;
  background-color: #f1f5f9;
  border-radius: 12px;
}

/* ---------------- 导航栏 / 标签栏 ---------------- */
.navbar-preview {
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.tabbar-preview {
  margin-top: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

/* ---------------- 树 ---------------- */
.tree-box {
  max-height: 280px;
  margin-top: 12px;
  overflow: auto;
}

/* ---------------- 颜色 ---------------- */
.swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  margin-left: 16px;
  border-radius: 8px;
}

.swatch__text {
  font-size: 11px;
  color: #ffffff;
}

/* ---------------- 二维码 ---------------- */
.qr-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-box__text {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.qr-input {
  width: 220px;
  margin-left: 16px;
}

/* ---------------- 水印 ---------------- */
.watermark-box {
  position: relative;
  height: 180px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.watermark-box__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.watermark-box__text {
  margin-bottom: 12px;
  font-size: 13px;
  color: #334155;
}

/* ---------------- 索引栏 ---------------- */
.indexbar-box {
  position: relative;
  height: 260px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.indexbar-box__scroll {
  height: 100%;
  /* 给右侧索引栏留出位置，否则字母会压在列表文字上 */
  padding-right: 28px;
}

.indexbar-box__letter {
  display: block;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  background-color: #f1f5f9;
}

.indexbar-box__city {
  display: block;
  padding: 8px 12px;
  font-size: 14px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}
</style>
