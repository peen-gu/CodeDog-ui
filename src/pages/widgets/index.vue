<template>
  <cd-config-provider :size="density">
    <view class="cd-page cd-page--desktop">
      <view class="cd-container">
        <!-- ================= 页头 ================= -->
        <view class="hero">
          <view class="hero__main">
            <text class="hero__title">交互与展示</text>
            <text class="hero__desc">
              slider · rate · search-bar · popconfirm · action-sheet · fab · result · count-down ·
              notice-bar · image · backtop · affix · count-to —— 13 个组件。
              页面右下角有一个可拖拽的悬浮按钮，向下滚动会出现回到顶部。
            </text>
          </view>
          <view class="hero__actions">
            <cd-button size="small" @click="toggleDensity">
              {{ density === 'small' ? '默认密度' : '紧凑密度' }}
            </cd-button>
          </view>
        </view>

        <!-- ================= 固钉 ================= -->
        <cd-affix :offset-top="12">
          <view class="affix-bar">
            <text class="affix-bar__text">cd-affix：向下滚动，我会钉在顶部（offset-top=12）</text>
            <cd-button size="small" type="primary" plain @click="log('固钉上的按钮')">操作</cd-button>
          </view>
        </cd-affix>

        <!-- ================= cd-notice-bar ================= -->
        <cd-card
          class="section"
          title="cd-notice-bar"
          desc="单条静态 / 单条跑马灯 / 多条纵向轮播，三种形态共用一个组件——真实产品里它们本来就是同一块位置的不同数据量。"
        >
          <view class="stack">
            <cd-notice-bar text="这是一条静态通知，超长内容会自动省略号截断，不会把布局撑破。" />

            <cd-notice-bar
              type="info"
              icon="bell"
              scrollable
              :speed="70"
              text="这是一条跑马灯通知：滚动速度按字数估算而不是等测量完成，代价是中英文混排时略快略慢，换来的是首屏一次成型、不闪跳。"
            />

            <cd-notice-bar type="warning" closable text="可关闭的通知，只抛事件，是否真的隐藏由业务决定。" @close="log('通知被关闭')" />

            <cd-notice-bar
              type="success"
              :text="['第一条公告：双端构建已通过。', '第二条公告：组件总数达到 62。', '第三条公告：许可声明已补齐。']"
              @change="onNoticeChange"
            />

            <cd-notice-bar
              type="danger"
              text="这一条允许换行，所以关掉了省略号，多行内容会完整显示出来。"
              wrapable
            />
          </view>
        </cd-card>

        <!-- ================= cd-search-bar ================= -->
        <cd-card class="section" title="cd-search-bar" desc="无边框药丸形容器 + 右侧动作位。点击右侧「取消」会清空并输出日志。">
          <view class="stack">
            <cd-search-bar v-model="keyword" placeholder="搜索组件 / 文档" @search="log(`搜索：${keyword}`)" />

            <cd-search-bar
              v-model="keyword2"
              shape="square"
              align="center"
              show-action
              action-text="取消"
              placeholder="输入后右侧出现清空按钮"
              @action="handleSearchAction"
            />

            <cd-search-bar v-model="keyword3" disabled placeholder="禁用状态" />
          </view>
        </cd-card>

        <!-- ================= cd-slider ================= -->
        <cd-card
          class="section"
          title="cd-slider"
          desc="按住轨道任意位置即可跳过去再拖。双滑块会自动选中离手指更近的那个，并允许交错；拖动过程逐帧汇报 input，松手才算一次 change（避免表单边拖边报错）。"
        >
          <view class="stack">
            <view>
              <text class="col-label">单值：{{ sliderValue }}（show-tooltip）</text>
              <cd-slider v-model="sliderValue" :step="1" show-tooltip />
            </view>

            <view>
              <text class="col-label">区间：{{ sliderRange[0] }} ~ {{ sliderRange[1] }}（step=10）</text>
              <cd-slider v-model="sliderRange" range :step="10" show-tooltip />
            </view>

            <view>
              <text class="col-label">禁用：{{ sliderDisabled }}</text>
              <cd-slider v-model="sliderDisabled" disabled />
            </view>

            <view class="log">
              <text class="log__text">change 事件只在松手时触发，拖动中只发 input。当前值：{{ sliderValue }}</text>
            </view>
          </view>
        </cd-card>

        <!-- ================= cd-rate ================= -->
        <cd-card
          class="section"
          title="cd-rate"
          desc="半星靠「精确像素裁切」而不是百分比——百分比是按容器宽度算的，容器里还有间隙，2.5/5 时 50% 不会落在第三颗星的正中间。"
        >
          <view class="stack">
            <view>
              <text class="col-label">整星 + 文案：{{ rate1 }} 分</text>
              <cd-rate v-model="rate1" show-text :texts="['很差', '较差', '一般', '较好', '很好']" />
            </view>

            <view>
              <text class="col-label">半星（allow-half）：{{ rate2 }} 分</text>
              <cd-rate v-model="rate2" allow-half show-text :texts="['很差', '较差', '一般', '较好', '很好']" />
            </view>

            <view>
              <text class="col-label">只读 / 大尺寸 / 10 颗</text>
              <cd-rate :model-value="7.5" allow-half readonly :size="26" :count="10" />
            </view>

            <view>
              <text class="col-label">禁用</text>
              <cd-rate :model-value="3" disabled />
            </view>
          </view>
        </cd-card>

        <!-- ================= cd-popconfirm ================= -->
        <cd-card
          class="section"
          title="cd-popconfirm"
          desc="贴着触发物的轻确认。与 cd-dialog 的分工：dialog 打断你，popconfirm 只回答你。危险操作刻意把确认做成实心红、取消做成白底描边，让误点永远落在更弱的那一侧。"
        >
          <view class="row">
            <cd-popconfirm title="确认提交？" message="提交后不可修改，请确认信息无误。" @confirm="log('已提交')">
              <template #reference>
                <cd-button size="small">普通确认（top）</cd-button>
              </template>
            </cd-popconfirm>

            <cd-popconfirm
              title="删除这条记录？"
              message="删除后无法恢复。"
              confirm-type="danger"
              icon="warning"
              @confirm="log('已删除')"
              @cancel="log('已取消')"
            >
              <template #reference>
                <cd-button size="small" type="danger" plain>危险操作</cd-button>
              </template>
            </cd-popconfirm>

            <cd-popconfirm
              title="右侧方位"
              message="placement=right，空间不足时也会自动翻转。"
              placement="right"
              :show-cancel="false"
              confirm-text="知道了"
            >
              <template #reference>
                <cd-button size="small">单按钮（right）</cd-button>
              </template>
            </cd-popconfirm>

            <cd-popconfirm
              v-model="popconfirmOpen"
              title="受控打开"
              message="这个气泡由外部的 v-model 驱动，用来验证受控模式。"
              confirm-type="warning"
              placement="bottom"
            >
              <template #reference>
                <cd-button size="small">v-model 受控</cd-button>
              </template>
            </cd-popconfirm>
          </view>
        </cd-card>

        <!-- ================= cd-action-sheet ================= -->
        <cd-card
          class="section"
          title="cd-action-sheet"
          desc="底部动作面板。取消与动作列表之间用一条「大间隙」而不是分隔线——这是 iOS 动作面板的经典语义：取消不属于任何动作。"
        >
          <view class="row">
            <cd-button size="small" @click="sheetVisible = true">打开动作面板</cd-button>
            <cd-button size="small" type="danger" plain @click="sheetDangerVisible = true">含危险项</cd-button>
          </view>

          <cd-action-sheet
            v-model="sheetVisible"
            title="选择操作"
            description="选择一个动作，或者取消"
            :actions="sheetActions"
            @select="onSheetSelect"
          />

          <cd-action-sheet
            v-model="sheetDangerVisible"
            title="确认要执行吗"
            :actions="sheetDangerActions"
            @select="onSheetSelect"
          >
            <template #header>
              <text class="sheet-header">这一份头部是自定义插槽，标题与描述都由业务书写</text>
            </template>
          </cd-action-sheet>
        </cd-card>

        <!-- ================= cd-result ================= -->
        <cd-card
          class="section"
          title="cd-result"
          desc="图标外面套一个浅色圆底，而不是直接放大图标——纯图标在大屏上会显得「飘」，浅色圆底给它一个明确的落点，语义色也有地方铺开。"
        >
          <view class="split">
            <view class="split__col">
              <cd-result
                type="success"
                title="提交成功"
                description="我们会在 1 个工作日内完成审核，结果将以站内信通知你。"
              >
                <template #extra>
                  <cd-button size="small" type="primary">返回首页</cd-button>
                  <cd-button size="small" plain>查看详情</cd-button>
                </template>
              </cd-result>
            </view>

            <view class="split__col">
              <cd-result
                type="error"
                title="支付失败"
                description="订单已关闭，请重新下单。如已扣款将于 1-3 个工作日原路退回。"
              >
                <template #extra>
                  <cd-button size="small" type="primary">重新支付</cd-button>
                </template>
              </cd-result>
            </view>
          </view>
        </cd-card>

        <!-- ================= cd-count-down ================= -->
        <cd-card
          class="section"
          title="cd-count-down"
          desc="内部锚定「结束时间戳」，每次 tick 都用 endAt - Date.now() 重算。定时器只负责「多久看一眼」，不负责累加时间——所以丢帧、后台节流都不会让显示变歪。"
        >
          <view class="row">
            <cd-button size="small" @click="startCountdown">开始</cd-button>
            <cd-button size="small" @click="pauseCountdown">暂停</cd-button>
            <cd-button size="small" @click="resetCountdown">重置（再给我 1 小时）</cd-button>
          </view>

          <view class="row">
            <cd-count-down ref="countdownRef" :time="3600 * 1000" :auto-start="false" format="HH:mm:ss" />
          </view>
          <view class="row">
            <cd-count-down :time="90061000" :auto-start="false" format="DD 天 HH:mm:ss" />
          </view>
          <view class="row">
            <cd-count-down :time="5000" format="ss.SSS" millisecond />
          </view>
        </cd-card>

        <!-- ================= cd-count-to ================= -->
        <cd-card class="section" title="cd-count-to" desc="数字滚动。内部只保存裸数字，千分位在格式化阶段才加——对带逗号的字符串做运算会得到 NaN。">
          <view class="stats">
            <view class="stat">
              <text class="stat__label">累计用户</text>
              <cd-count-to ref="countToRef" :end="128456" :duration="1600" />
            </view>
            <view class="stat">
              <text class="stat__label">营收（元）</text>
              <cd-count-to :end="9834210.5" :decimals="2" prefix="¥" :duration="2000" />
            </view>
            <view class="stat">
              <text class="stat__label">满意度</text>
              <cd-count-to :end="4.87" :decimals="2" suffix=" / 5" easing="easeInOut" />
            </view>
            <view class="stat">
              <text class="stat__label">线性缓动（对照）</text>
              <cd-count-to :end="100" easing="linear" suffix="%" />
            </view>
          </view>

          <view class="row">
            <cd-button size="small" @click="replayCountTo">重新播放（从当前值继续）</cd-button>
          </view>
        </cd-card>

        <!-- ================= cd-image ================= -->
        <cd-card
          class="section"
          title="cd-image"
          desc="三态管理才是它的价值：加载中给占位、失败给语义化兜底（而不是浏览器的碎图）。第一张是内联 SVG（保证任何环境下都能加载成功），后三张分别演示 404 / 空地址 / 非图片资源。"
        >
          <view class="img-row">
            <view v-for="(item, index) in imageCases" :key="index" class="img-case">
              <cd-image
                :src="item.src"
                :size="96"
                :fit="item.fit"
                :round="item.round"
                :preview="index === 0"
                :error-text="item.text"
                @load="setImageState(index, 'loaded')"
                @error="setImageState(index, 'error')"
              />
              <text class="img-case__label">{{ item.label }}</text>
              <text class="img-case__state" :class="`img-case__state--${imgStates[index] || 'loading'}`">
                {{ imgStates[index] || 'loading' }}
              </text>
            </view>
          </view>
        </cd-card>

        <!-- ================= 回到顶部 ================= -->
        <cd-card
          class="section"
          title="cd-backtop / cd-fab"
          desc="H5 上 backtop 自己监听 window 滚动；小程序端拿不到页面滚动，必须由页面的 onPageScroll 把 scroll-top 传进来。右下角的悬浮按钮可以拖着走。"
        >
          <view class="stack">
            <text class="body-text">
              向下滚动超过 360px，右下角会出现回到顶部按钮。悬浮按钮（cd-fab）可以按住拖动，
              用来解决「它刚好压住了列表最后一行」这种无解的场景。
            </text>

            <view class="filler" />

            <text class="col-label">下面是为了把页面撑长、方便验证滚动相关组件的占位内容</text>
            <view class="filler filler--sm" />
          </view>
        </cd-card>

        <cd-backtop :visibility-height="360" />

        <cd-fab icon="plus" text="新建" draggable :offset-right="88" @click="log('悬浮按钮被点击')" />
      </view>
    </view>
  </cd-config-provider>
</template>

<script setup>
import { ref } from 'vue'

const density = ref('default')

/* 搜索栏 */
const keyword = ref('')
const keyword2 = ref('二次封装')
const keyword3 = ref('')

/* 滑块 */
const sliderValue = ref(42)
const sliderRange = ref([20, 70])
const sliderDisabled = ref(30)

/* 评分 */
const rate1 = ref(4)
const rate2 = ref(3.5)

/* 气泡确认 */
const popconfirmOpen = ref(false)

/* 动作面板 */
const sheetVisible = ref(false)
const sheetDangerVisible = ref(false)
const sheetActions = ref([
  { name: 'share', label: '分享给好友', icon: 'link' },
  { name: 'copy', label: '复制链接', icon: 'copy', description: '复制后可粘贴到任意位置' },
  { name: 'download', label: '下载文件', icon: 'download', disabled: true },
])

const sheetDangerActions = ref([
  { name: 'archive', label: '归档', icon: 'folder' },
  { name: 'delete', label: '删除', icon: 'trash', danger: true, description: '删除后无法恢复' },
])

/* 倒计时 */
const countdownRef = ref(null)

/* 数字滚动 */
const countToRef = ref(null)

/* 图片三态演示。
   第一张用内联 SVG data URI：不依赖外网，任何环境下都能稳定演示「加载成功」，
   否则截图与离线环境里第一格永远在转圈，看不出 loaded 态长什么样。 */
const DEMO_SVG =
  'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D\'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg\'%20viewBox%3D\'0%200%20120%20120\'%3E%3Cdefs%3E%3ClinearGradient%20id%3D\'g\'%20x1%3D\'0\'%20y1%3D\'0\'%20x2%3D\'1\'%20y2%3D\'1\'%3E%3Cstop%20offset%3D\'0\'%20stop-color%3D\'%233b76f6\'%2F%3E%3Cstop%20offset%3D\'1\'%20stop-color%3D\'%2393bafd\'%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D\'120\'%20height%3D\'120\'%20rx%3D\'20\'%20fill%3D\'url(%23g)\'%2F%3E%3Ccircle%20cx%3D\'46\'%20cy%3D\'52\'%20r%3D\'13\'%20fill%3D\'none\'%20stroke%3D\'%23fff\'%20stroke-width%3D\'5\'%2F%3E%3Ccircle%20cx%3D\'74\'%20cy%3D\'52\'%20r%3D\'13\'%20fill%3D\'none\'%20stroke%3D\'%23fff\'%20stroke-width%3D\'5\'%2F%3E%3Cpath%20d%3D\'M34%2084c8%2010%2044%2010%2052%200\'%20fill%3D\'none\'%20stroke%3D\'%23fff\'%20stroke-width%3D\'5\'%20stroke-linecap%3D\'round\'%2F%3E%3C%2Fsvg%3E'

const imageCases = ref([
  { src: DEMO_SVG, fit: 'cover', round: false, label: '内联 SVG', text: '' },
  { src: 'https://this-host-does-not-exist.invalid/a.png', fit: 'cover', round: false, label: '404', text: '加载失败' },
  { src: '', fit: 'cover', round: true, label: '空地址', text: '空地址' },
  { src: 'data:text/plain;charset=utf-8,not-an-image', fit: 'cover', round: false, label: '非图片', text: '非图片' },
])

const imgStates = ref({})

function setImageState(index, state) {
  imgStates.value = { ...imgStates.value, [index]: state }
}

function toggleDensity() {
  density.value = density.value === 'small' ? 'default' : 'small'
}

function log(message) {
  uni.showToast({ title: message, icon: 'none' })
}

function onNoticeChange(index) {
  // eslint-disable-next-line no-console
  console.log('[CodeDogUI] 公告切换到第', index + 1, '条')
}

function handleSearchAction() {
  keyword2.value = ''
  log('已取消搜索')
}

function onSheetSelect(item) {
  log(`选择了：${item.label}`)
}

function startCountdown() {
  if (countdownRef.value) countdownRef.value.start()
}

function pauseCountdown() {
  if (countdownRef.value) countdownRef.value.pause()
}

function resetCountdown() {
  if (countdownRef.value) countdownRef.value.reset(3600 * 1000)
}

function replayCountTo() {
  /* 重播走 start()（从 start 重新滚到 end）；
     restart() 则是「从当前显示值继续滚到 end」，适合刷新数据时不要从 0 重来 */
  if (countToRef.value) countToRef.value.start()
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

/* .row 不用通配符 >*：WXSS 不支持。小程序端 <view>/<text> 编译成原标签，H5 端编译成 uni-view / uni-text，两端标签都列 */
.row > view,
.row > uni-view,
.row > text,
.row > uni-text,
.row > button,
.row > uni-button {
  margin: 0 var(--cd-space-2, 8px) var(--cd-space-2, 8px) 0;
}

/* .stack 不用通配符 >*：WXSS 不支持。小程序端 <view>/<text> 编译成原标签，H5 端编译成 uni-view / uni-text，两端标签都列 */
.stack > view,
.stack > uni-view,
.stack > text,
.stack > uni-text,
.stack > button,
.stack > uni-button {
  margin-bottom: var(--cd-space-2, 8px);
}

.split {
  display: flex;
  flex-wrap: wrap;
}

.split__col {
  box-sizing: border-box;
  flex: 1 1 300px;
  min-width: 0;
  margin-right: var(--cd-space-4, 16px);
  margin-bottom: var(--cd-space-3, 12px);
}

.col-label {
  display: block;
  margin-bottom: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-placeholder, #94a3b8);
}

.img-row {
  display: flex;
  flex-wrap: wrap;
}

.img-case {
  box-sizing: border-box;
  width: 132px;
  margin-right: var(--cd-space-3, 12px);
  margin-bottom: var(--cd-space-3, 12px);
}

.img-case__label {
  display: block;
  margin-top: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-secondary, #64748b);
}

.img-case__state {
  display: block;
  font-size: var(--cd-font-size-xs, 11px);
  line-height: 1.4;
  color: var(--cd-text-placeholder, #94a3b8);
}

.img-case__state--loaded {
  color: var(--cd-color-success, #22c55e);
}

.img-case__state--error {
  color: var(--cd-color-danger, #ef4444);
}

.body-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  line-height: 1.7;
}

.log {
  padding: var(--cd-space-2, 8px) var(--cd-space-3, 12px);
  background-color: var(--cd-bg-sunken, #f1f5f9);
  border-radius: var(--cd-radius-sm, 4px);
}

.log__text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
}

.affix-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--cd-space-3, 12px) var(--cd-space-4, 16px);
  margin-bottom: var(--cd-space-4, 16px);
  background-color: var(--cd-bg-elevated, #ffffff);
  border: 1px solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-md, 8px);
  box-shadow: var(--cd-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
}

.affix-bar__text {
  flex: 1;
  min-width: 0;
  margin-right: var(--cd-space-3, 12px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-regular, #334155);
}

.sheet-header {
  display: block;
  padding-bottom: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  text-align: center;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: var(--cd-space-4, 16px);
}

.stat {
  flex: 1 1 200px;
  min-width: 0;
  box-sizing: border-box;
  padding: var(--cd-space-4, 16px);
  margin-right: var(--cd-space-3, 12px);
  margin-bottom: var(--cd-space-3, 12px);
  background-color: var(--cd-bg-sunken, #f8fafc);
  border-radius: var(--cd-radius-md, 8px);
}

.stat__label {
  display: block;
  margin-bottom: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-placeholder, #94a3b8);
}

.filler {
  height: 240px;
  background: repeating-linear-gradient(
    135deg,
    var(--cd-bg-sunken, #f1f5f9),
    var(--cd-bg-sunken, #f1f5f9) 10px,
    transparent 10px,
    transparent 20px
  );
  border-radius: var(--cd-radius-md, 8px);
}

.filler--sm {
  height: 480px;
}
</style>
