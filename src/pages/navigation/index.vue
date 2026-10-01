<template>
  <cd-config-provider :size="density">
    <view class="cd-page cd-page--desktop">
      <view class="cd-container">
        <!-- ================= 页头 ================= -->
        <view class="hero">
          <view class="hero__main">
            <text class="hero__title">结构与导航</text>
            <text class="hero__desc">
              cell · cell-group · grid · grid-item · collapse · steps · step · timeline · breadcrumb
              —— 9 个组件。这一批的共同点是「序号与首尾由容器统计」，
              组件不靠业务传 index，全靠一套注册表机制。
            </text>
          </view>
          <view class="hero__actions">
            <cd-button size="small" @click="toggleDensity">
              {{ density === 'small' ? '默认密度' : '紧凑密度' }}
            </cd-button>
          </view>
        </view>

        <!-- ================= cd-cell / cd-cell-group ================= -->
        <cd-card
          class="section"
          title="cd-cell / cd-cell-group"
          desc="通铺形态与卡片形态。分组后分隔线由容器统一画在两格交界处，所以最后一格下面永远不会多出一条孤线。"
        >
          <view class="split">
            <view class="split__col">
              <text class="col-label">inset=false（通铺）</text>
              <cd-cell-group title="账号设置">
                <cd-cell title="头像" value="已上传" clickable @click="log('头像')" />
                <cd-cell title="昵称" value="CodeDog" clickable />
                <cd-cell icon="bell" title="消息通知" arrow label="接收订单与系统通知" />
                <cd-cell title="账号 ID" value="cd_8f3a21" :arrow="false" />
              </cd-cell-group>
            </view>

            <view class="split__col">
              <text class="col-label">inset=true（卡片）</text>
              <cd-cell-group inset title="订单">
                <cd-cell title="待付款" value="2" clickable />
                <cd-cell title="待发货" value="1" clickable />
                <cd-cell title="售后中" value="0" :arrow="false" />
              </cd-cell-group>
            </view>
          </view>

          <cd-divider position="left">独立使用 / 必填 / 禁用 / 长值</cd-divider>

          <cd-cell-group inset>
            <cd-cell title="手机号" required value="138****8888" clickable />
            <cd-cell title="这是很长的标题文案用来验证右侧值区不会被挤没" value="右侧值" />
            <cd-cell
              icon="lock"
              title="登录密码"
              label="建议 8 位以上，包含字母与数字"
              required
              clickable
            />
            <cd-cell title="已停用的项" value="不可点" disabled clickable />
          </cd-cell-group>

          <cd-divider position="left">右侧自由内容（默认插槽）</cd-divider>

          <cd-cell-group inset>
            <cd-cell title="默认插槽塞任意内容">
              <cd-tag type="success" size="small" label="已通过" />
              <cd-tag type="info" size="small" label="V2" />
            </cd-cell>
            <cd-cell title="带操作按钮" :arrow="false">
              <cd-button size="small" type="primary" plain>去处理</cd-button>
            </cd-cell>
          </cd-cell-group>
        </cd-card>

        <!-- ================= cd-grid ================= -->
        <cd-card
          class="section"
          title="cd-grid / cd-grid-item"
          desc="列宽由容器算好百分比下发（不写 calc 除法），边框外框画在容器、内线画在格子上，全程不依赖 nth-child。"
        >
          <view class="stack">
            <view>
              <text class="col-label">columns=4（默认，带网格线）</text>
              <cd-grid :columns="4">
                <cd-grid-item icon="home" text="首页" url="/pages/index/index" />
                <cd-grid-item icon="chart" text="报表" :badge="5" />
                <cd-grid-item icon="file" text="文档" is-dot :badge="1" />
                <cd-grid-item icon="setting" text="设置" />
                <cd-grid-item icon="users" text="成员" :badge="128" />
                <cd-grid-item icon="bell" text="通知" :badge="0" />
                <cd-grid-item icon="star" text="收藏" />
                <cd-grid-item icon="lock" text="禁用项" disabled />
              </cd-grid>
            </view>

            <view>
              <text class="col-label">columns=3 / border=false</text>
              <cd-grid :columns="3" :border="false">
                <cd-grid-item icon="cloud" text="云盘" />
                <cd-grid-item icon="image" text="相册" />
                <cd-grid-item icon="mail" text="邮件" :badge="9" />
              </cd-grid>
            </view>

            <view>
              <text class="col-label">columns=5（图标色跟随主色）</text>
              <cd-grid :columns="5">
                <cd-grid-item icon="tag" text="标签" />
                <cd-grid-item icon="award" text="勋章" />
                <cd-grid-item icon="globe" text="站点" />
                <cd-grid-item icon="shield" text="安全" />
                <cd-grid-item icon="more-horizontal" text="更多" />
              </cd-grid>
            </view>
          </view>
        </cd-card>

        <!-- ================= cd-collapse ================= -->
        <cd-card
          class="section"
          title="cd-collapse / cd-collapse-item"
          desc="展开动画用的是「实测内容高度」。如果用一个固定的大数字（比如 999px）当 max-height，动画在视觉上等于没做——内容只有几十像素时，前 90% 的时间都在假装生长。"
        >
          <view class="split">
            <view class="split__col">
              <text class="col-label">普通模式（可多开）</text>
              <cd-collapse v-model="collapseNormal">
                <cd-collapse-item name="a" title="什么是二次封装" icon="help" value="推荐阅读">
                  不改上游源码，只覆盖它的设计变量与关键结构，
                  把「平台差异」和「设计语言」两件事收敛到框架内部。
                </cd-collapse-item>
                <cd-collapse-item name="b" title="为什么不直接用 rpx">
                  小程序用它没问题，但 H5 大屏上 rpx 会在约 960px 处封顶，
                  于是 PC 端只能看到一块被裁掉的窄屏。
                </cd-collapse-item>
                <cd-collapse-item name="c" title="这一项是禁用的" disabled>
                  禁用项依然会渲染，只是头部不响应点击。
                </cd-collapse-item>
              </cd-collapse>
            </view>

            <view class="split__col">
              <text class="col-label">手风琴（accordion，单值 v-model）</text>
              <cd-collapse v-model="collapseAccordion" accordion>
                <cd-collapse-item name="1" title="第一步：选择路线" value="已完成">
                  路线 B：基于成熟的 uni-app 组件库做二次封装，
                  把精力放在双形态与主题系统上，而不是重造轮子。
                </cd-collapse-item>
                <cd-collapse-item name="2" title="第二步：补全组件" value="进行中">
                  从 6 个骨架组件补到 60+，覆盖容器、导航、表单、反馈、展示五类。
                </cd-collapse-item>
                <cd-collapse-item name="3" title="第三步：发布">
                  以 uni_modules 为主、npm 为辅双发布，附上完整的许可声明。
                </cd-collapse-item>
              </cd-collapse>

              <view class="log">
                <text class="log__text">当前展开：{{ collapseAccordion || '（全部收起）' }}</text>
              </view>
            </view>
          </view>
        </cd-card>

        <!-- ================= cd-steps ================= -->
        <cd-card
          class="section"
          title="cd-steps / cd-step"
          desc="序号由容器统计下发。连线的着色按「左边那个步骤」算，所以最后一步的前置线已经变蓝、后置线还是灰的——这个一格的差值是最容易写错的地方。"
        >
          <view class="row">
            <cd-button size="small" @click="stepCurrent = Math.max(0, stepCurrent - 1)">上一步</cd-button>
            <cd-button size="small" type="primary" @click="stepCurrent = Math.min(4, stepCurrent + 1)">
              下一步（{{ stepCurrent + 1 }}/5）
            </cd-button>
            <cd-button size="small" @click="stepStatus = stepStatus === 'error' ? 'process' : 'error'">
              {{ stepStatus === 'error' ? '恢复正常' : '模拟报错' }}
            </cd-button>
          </view>

          <cd-divider position="left">align=center（默认，移动端）</cd-divider>
          <cd-steps :current="stepCurrent" :status="stepStatus">
            <cd-step title="提交申请" description="填写基本信息" />
            <cd-step title="资料审核" description="预计 1 个工作日" />
            <cd-step title="签署合同" description="电子签" />
            <cd-step title="开通服务" description="自动开通" />
            <cd-step title="完成" />
          </cd-steps>

          <cd-divider position="left">align=start（PC 后台）</cd-divider>
          <cd-steps :current="2" align="start">
            <cd-step title="创建任务" description="2026-10-01 09:12" />
            <cd-step title="数据采集" description="共 12.8 万条" />
            <cd-step title="模型训练" description="进行中 42%" />
            <cd-step title="结果输出" />
          </cd-steps>

          <cd-divider position="left">vertical</cd-divider>
          <cd-steps :current="stepCurrent" :status="stepStatus" direction="vertical">
            <cd-step title="提交申请" description="填写基本信息" />
            <cd-step title="资料审核" description="预计 1 个工作日" />
            <cd-step title="签署合同" />
            <cd-step title="开通服务" />
          </cd-steps>
        </cd-card>

        <!-- ================= cd-timeline ================= -->
        <cd-card
          class="section"
          title="cd-timeline / cd-timeline-item"
          desc="圆点三种形态由属性组合决定：有 icon 是实心圆 + 白图标，hollow 是空心圈，都没有就是实心小点。reverse 走 column-reverse，同时把首尾引线对调。"
        >
          <view class="row">
            <cd-button size="small" @click="timelineReverse = !timelineReverse">
              reverse: {{ timelineReverse ? 'true' : 'false' }}
            </cd-button>
          </view>

          <view class="split">
            <view class="split__col">
              <text class="col-label">默认（实心点 + 语义色）</text>
              <cd-timeline :reverse="timelineReverse">
                <cd-timeline-item timestamp="2026-10-01 16:52" type="success" icon="check">
                  <text class="tl-title">构建通过</text>
                  <text class="tl-text">h5 与 mp-weixin 双端产物均生成成功。</text>
                </cd-timeline-item>
                <cd-timeline-item timestamp="2026-10-01 15:40" type="primary" icon="edit">
                  <text class="tl-title">第五批组件提交</text>
                  <text class="tl-text">新增 25 个组件，组件总数达到 62。</text>
                </cd-timeline-item>
                <cd-timeline-item timestamp="2026-10-01 11:02" type="warning" icon="warning">
                  <text class="tl-title">发现一个真 bug</text>
                  <text class="tl-text">折叠面板展开态读到了旧值，已修复。</text>
                </cd-timeline-item>
                <cd-timeline-item timestamp="2026-10-01 09:00" type="info">
                  <text class="tl-title">开始工作</text>
                </cd-timeline-item>
              </cd-timeline>
            </view>

            <view class="split__col">
              <text class="col-label">空心 / 大号 / 无时间戳</text>
              <cd-timeline>
                <cd-timeline-item timestamp="待处理" hollow>等待人工确认</cd-timeline-item>
                <cd-timeline-item timestamp="处理中" hollow size="large" type="warning">
                  正在同步数据
                </cd-timeline-item>
                <cd-timeline-item timestamp="已完成" type="success" size="large" icon="check">
                  全部同步完成
                </cd-timeline-item>
                <cd-timeline-item hide-timestamp type="danger" icon="close">
                  这一项隐藏了时间戳，只有内容
                </cd-timeline-item>
              </cd-timeline>
            </view>
          </view>
        </cd-card>

        <!-- ================= cd-breadcrumb ================= -->
        <cd-card
          class="section"
          title="cd-breadcrumb / cd-breadcrumb-item"
          desc="最后一项自动变成「当前位置」：不可点、颜色更重。这不是靠业务传 disabled——让面包屑的最后一项可点是一个很常见的交互陷阱。"
        >
          <cd-breadcrumb>
            <cd-breadcrumb-item to="/pages/index/index">首页</cd-breadcrumb-item>
            <cd-breadcrumb-item>组件库</cd-breadcrumb-item>
            <cd-breadcrumb-item>导航</cd-breadcrumb-item>
            <cd-breadcrumb-item>面包屑</cd-breadcrumb-item>
          </cd-breadcrumb>

          <cd-divider position="left">图标分隔符 / 长路径自动换行</cd-divider>

          <cd-breadcrumb separator-icon="chevron-right">
            <cd-breadcrumb-item>工作台</cd-breadcrumb-item>
            <cd-breadcrumb-item>数据中心</cd-breadcrumb-item>
            <cd-breadcrumb-item>华东区</cd-breadcrumb-item>
            <cd-breadcrumb-item>订单明细</cd-breadcrumb-item>
          </cd-breadcrumb>
        </cd-card>
      </view>
    </view>
  </cd-config-provider>
</template>

<script setup>
import { ref } from 'vue'

const density = ref('default')
const collapseNormal = ref(['a'])
const collapseAccordion = ref('2')
const stepCurrent = ref(2)
const stepStatus = ref('process')
const timelineReverse = ref(false)

function toggleDensity() {
  density.value = density.value === 'small' ? 'default' : 'small'
}

function log(message) {
  uni.showToast({ title: `点击：${message}`, icon: 'none' })
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

.stack > * {
  margin-bottom: var(--cd-space-5, 20px);
}

/* 两栏对照：窄屏堆叠，宽屏并排 */
.split {
  display: flex;
  flex-wrap: wrap;
}

.split__col {
  box-sizing: border-box;
  flex: 1 1 320px;
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

.log {
  margin-top: var(--cd-space-2, 8px);
  padding: var(--cd-space-2, 8px) var(--cd-space-3, 12px);
  background-color: var(--cd-bg-sunken, #f1f5f9);
  border-radius: var(--cd-radius-sm, 4px);
}

.log__text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
}

.tl-title {
  display: block;
  margin-bottom: 2px;
  font-size: var(--cd-font-size-base, 14px);
  font-weight: var(--cd-font-weight-medium, 500);
  color: var(--cd-text-primary, #0f172a);
}

.tl-text {
  display: block;
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  line-height: 1.6;
}
</style>
