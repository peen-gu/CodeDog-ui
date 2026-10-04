<template>
  <cd-config-provider :size="density">
    <view class="cd-page">
      <view class="cd-container">
        <!-- ================= 页头 ================= -->
        <view class="hero">
          <view class="hero__main">
            <text class="hero__title">展示与表单控件</text>
            <text class="hero__desc">
              tag · badge · avatar · divider · progress · loading · empty · skeleton · alert ·
              switch · checkbox · radio · stepper —— 15 个新组件，全部零外部依赖
            </text>
          </view>
          <view class="hero__actions">
            <cd-button size="small" @click="toggleDensity">
              {{ density === 'small' ? '默认密度' : '紧凑密度' }}
            </cd-button>
          </view>
        </view>

        <!-- ================= cd-tag ================= -->
        <cd-card class="section" title="cd-tag" desc="标签。type 只声明颜色，由 plain / filled 决定用法，因此加一种语义色只需两行。">
          <view class="row">
            <cd-tag label="默认" />
            <cd-tag type="primary" label="进行中" />
            <cd-tag type="success" label="已完成" />
            <cd-tag type="warning" label="待审核" />
            <cd-tag type="danger" label="已驳回" />
            <cd-tag type="info" label="已归档" />
          </view>

          <cd-divider position="left">浅底形态</cd-divider>

          <view class="row">
            <cd-tag plain type="primary" label="浅底" />
            <cd-tag plain type="success" label="浅底" />
            <cd-tag plain type="warning" label="浅底" />
            <cd-tag plain type="danger" label="浅底" />
          </view>

          <cd-divider position="left">尺寸 / 图标 / 可关闭 / 胶囊</cd-divider>

          <view class="row row--baseline">
            <cd-tag size="small" type="primary" label="小号" />
            <cd-tag size="default" type="primary" label="默认" />
            <cd-tag size="large" type="primary" label="大号" />
            <cd-tag type="primary" icon="tag" label="带图标" />
            <cd-tag round type="success" label="胶囊形" />
            <cd-tag
              v-for="(item, index) in closableTags"
              :key="item"
              type="info"
              label=""
              closable
              @close="removeTag(index)"
            >
              {{ item }}
            </cd-tag>
            <cd-tag type="danger" label="禁用" disabled closable />
          </view>
        </cd-card>

        <!-- ================= cd-badge ================= -->
        <cd-card class="section" title="cd-badge" desc="无插槽时是独立标签，有插槽时自动变成压住子元素右上角的角标。">
          <view class="row row--baseline">
            <cd-badge :value="5">
              <cd-button size="small">
                <template #icon><cd-icon name="bell" :size="16" /></template>
                通知
              </cd-button>
            </cd-badge>

            <cd-badge :value="128">
              <cd-avatar text="张三" :size="36" />
            </cd-badge>

            <cd-badge is-dot outlined>
              <cd-avatar icon="user" :size="36" />
            </cd-badge>

            <cd-badge value="NEW" type="success">
              <cd-button size="small">新功能</cd-button>
            </cd-badge>

            <cd-badge :value="0">
              <cd-button size="small">值为 0 不显示</cd-button>
            </cd-badge>

            <cd-badge :value="0" show-zero>
              <cd-button size="small">show-zero</cd-button>
            </cd-badge>

            <cd-badge :value="7" is-dot />
            <cd-badge :value="7" />
            <cd-badge :value="7" type="success" />
            <cd-badge :value="7" type="warning" />
            <cd-badge :value="7" type="info" />
          </view>
        </cd-card>

        <!-- ================= cd-avatar ================= -->
        <cd-card class="section" title="cd-avatar" desc="降级链：图片 → 插槽 → 图标 → 文字。图片加载失败会自动落到下一级，不出现破图。">
          <view class="row row--baseline">
            <cd-avatar icon="user" :size="28" />
            <cd-avatar icon="user" :size="40" />
            <cd-avatar icon="user" :size="56" />
            <cd-avatar text="张三" :size="40" />
            <cd-avatar text="欧阳修" :size="40" />
            <cd-avatar text="Michael" :size="40" />
            <cd-avatar text="李四" :size="40" shape="square" />
            <cd-avatar
              src="https://this-host-does-not-exist.invalid/x.png"
              text="降级"
              :size="40"
            />
          </view>
          <text class="body-text">
            左起第 8 个刻意给了一个不存在的图片地址，可以看到它自动降级成文字头像而不是显示破图。
          </text>
        </cd-card>

        <!-- ================= cd-divider ================= -->
        <cd-card class="section" title="cd-divider" desc="水平线支持带文字与左中右定位；垂直线可直接插在文字行内。">
          <cd-divider />

          <cd-divider>居中文字</cd-divider>

          <cd-divider position="left">左对齐</cd-divider>

          <cd-divider position="right" dashed>右对齐虚线</cd-divider>

          <view class="row row--baseline">
            <text class="body-text">文本</text>
            <cd-divider direction="vertical" />
            <text class="body-text">链接</text>
            <cd-divider direction="vertical" />
            <text class="body-text">更多</text>
          </view>
        </cd-card>

        <!-- ================= cd-progress ================= -->
        <cd-card class="section" title="cd-progress" desc="线形用两层 view 做百分比；环形用 conic-gradient + mask，不依赖 canvas。">
          <view class="stack">
            <cd-progress :percentage="30" />
            <cd-progress :percentage="65" status="success" />
            <cd-progress :percentage="80" status="warning" />
            <cd-progress :percentage="45" status="danger" />
            <cd-progress :percentage="60" status="active" />
            <cd-progress :percentage="100" text="已完成" />
          </view>

          <cd-divider position="left">粗条 + 文字内显</cd-divider>

          <view class="stack">
            <cd-progress :percentage="72" :stroke-width="22" text-inside text="72%" />
          </view>

          <cd-divider position="left">环形</cd-divider>

          <view class="row row--baseline">
            <cd-progress type="circle" :percentage="25" :size="72" :stroke-width="6" />
            <cd-progress type="circle" :percentage="68" :size="88" :stroke-width="8" status="success" />
            <cd-progress type="circle" :percentage="92" :size="104" :stroke-width="10" status="danger" />
            <cd-progress type="circle" :percentage="100" :size="88" :stroke-width="8" status="success" text="OK" />
          </view>
        </cd-card>

        <!-- ================= cd-loading ================= -->
        <cd-card class="section" title="cd-loading" desc="spinner 复用 cd-icon 的 loader + spin，不另写一套旋转动画。">
          <view class="row row--baseline">
            <cd-loading :size="20" />
            <cd-loading :size="28" text="加载中" />
            <cd-loading type="dots" :size="28" text="dots" />
            <cd-loading type="ring" :size="28" text="ring" />
            <cd-loading :size="20" color="#ef4444" />
          </view>

          <view class="row">
            <cd-button size="small" @click="fullscreenLoading = true">全屏加载</cd-button>
          </view>

          <cd-loading v-if="fullscreenLoading" fullscreen text="正在保存…" />
        </cd-card>

        <!-- ================= cd-empty ================= -->
        <cd-card class="section" title="cd-empty" desc="把「暂无数据 / 未找到 / 网络异常」固化成预设，避免同一产品里出现三种说法。">
          <view class="empty-grid">
            <view class="empty-grid__cell">
              <cd-empty size="small" />
            </view>
            <view class="empty-grid__cell">
              <cd-empty size="small" mode="search" />
            </view>
            <view class="empty-grid__cell">
              <cd-empty size="small" mode="network" />
            </view>
            <view class="empty-grid__cell">
              <cd-empty size="small" mode="permission" />
            </view>
          </view>

          <cd-empty
            mode="search"
            description="换个关键词试试，或者清空筛选条件重新查找"
          >
            <template #action>
              <cd-button type="primary" size="small">清空筛选</cd-button>
            </template>
          </cd-empty>
        </cd-card>

        <!-- ================= cd-skeleton ================= -->
        <cd-card class="section" title="cd-skeleton" desc="loading 为 false 时直接渲染默认插槽，业务不用写 v-if / v-else 两套结构。">
          <view class="row row--baseline">
            <cd-button size="small" @click="skeletonLoading = !skeletonLoading">
              {{ skeletonLoading ? '显示内容' : '显示骨架' }}
            </cd-button>
          </view>

          <cd-skeleton :loading="skeletonLoading" avatar :rows="3" :row-width="['100%', '92%', '64%']">
            <view class="loaded-block">
              <view class="row row--baseline">
                <cd-avatar text="王五" :size="40" />
                <text class="body-text">真实内容已经渲染出来了</text>
              </view>
            </view>
          </cd-skeleton>

          <cd-divider position="left">带图片块</cd-divider>

          <cd-skeleton image :image-height="120" :rows="2" />

          <cd-divider position="left">自定义模板</cd-divider>

          <cd-skeleton :loading="true">
            <template #template>
              <view class="row">
                <view class="custom-skeleton custom-skeleton--square" />
                <view class="custom-skeleton custom-skeleton--short" />
              </view>
            </template>
          </cd-skeleton>
        </cd-card>

        <!-- ================= cd-alert ================= -->
        <cd-card class="section" title="cd-alert" desc="与 cd-empty 的分工：empty 是整块区域没内容，alert 是针对当前上下文的一条说明。">
          <view class="stack">
            <cd-alert type="info" title="提示" description="这是一条普通的说明信息。" />
            <cd-alert type="success" title="已保存" description="改动已同步到云端。" />
            <cd-alert type="warning" title="额度将满" description="本月剩余额度不足 10%，请留意。" />
            <cd-alert type="danger" title="保存失败" description="网络请求超时，请重试。" closable @close="handleAlertClose" />
            <cd-alert type="info" description="只有描述、没有标题的紧凑形态。" />
            <cd-alert type="warning" outlined title="描边形态" description="白底 + 语义色描边，视觉更轻。" />
          </view>

          <cd-divider position="left">通铺 + 操作区</cd-divider>

          <cd-alert type="info" banner title="版本更新" description="v0.3.0 新增 15 个组件。">
            <template #action>
              <cd-button size="small" type="text">查看</cd-button>
            </template>
          </cd-alert>
        </cd-card>

        <!-- ================= 表单控件 ================= -->
        <cd-card class="section" title="cd-switch" desc="支持任意「一对值」而不只是布尔，避免业务在 v-model 后面挂一层转换。">
          <view class="stack">
            <view class="row row--baseline">
              <cd-switch v-model="switchBasic" />
              <text class="body-text">基础：{{ switchBasic }}</text>
            </view>

            <view class="row row--baseline">
              <cd-switch v-model="switchValue" active-value="ON" inactive-value="OFF" />
              <text class="body-text">一对字符串值：{{ switchValue }}</text>
            </view>

            <view class="row row--baseline">
              <cd-switch v-model="switchText" active-text="开启" inactive-text="关闭" />
              <text class="body-text">带文字</text>
            </view>

            <view class="row row--baseline">
              <cd-switch v-model="s1" size="small" />
              <cd-switch v-model="s2" size="default" />
              <cd-switch v-model="s3" size="large" />
              <text class="body-text">三档尺寸</text>
            </view>

            <view class="row row--baseline">
              <cd-switch :model-value="true" disabled />
              <cd-switch :model-value="true" loading />
              <cd-switch v-model="switchGuard" :before-change="confirmSwitch" />
              <text class="body-text">禁用 / 加载中 / beforeChange 拦截</text>
            </view>
          </view>
        </cd-card>

        <cd-card class="section" title="cd-checkbox" desc="独立用法 v-model 是布尔；组内用法由组持有数组，子项只声明自己的 value。">
          <view class="row row--baseline">
            <cd-checkbox v-model="singleCheck" label="独立勾选" />
            <cd-checkbox :model-value="false" indeterminate label="不确定态" />
            <cd-checkbox :model-value="true" disabled label="选中且禁用" />
            <cd-checkbox :model-value="false" disabled label="未选且禁用" />
          </view>

          <cd-divider position="left">多选组（横向 / 纵向）</cd-divider>

          <view class="row">
            <cd-checkbox-group v-model="hobbies">
              <cd-checkbox value="read" label="阅读" />
              <cd-checkbox value="code" label="编码" />
              <cd-checkbox value="run" label="跑步" />
              <cd-checkbox value="music" label="音乐" />
            </cd-checkbox-group>
          </view>

          <view class="row row--baseline">
            <text class="body-text">选中：{{ hobbies.join('、') || '（无）' }}</text>
          </view>

          <cd-checkbox-group v-model="cities" direction="vertical">
            <cd-checkbox value="bj" label="北京" />
            <cd-checkbox value="sh" label="上海" />
            <cd-checkbox value="gz" label="广州（禁用）" disabled />
          </cd-checkbox-group>

          <cd-divider position="left">上限 2 项 —— 选第 3 个时会触发 overlimit</cd-divider>

          <cd-checkbox-group v-model="limited" :max="2" @overlimit="handleOverlimit">
            <cd-checkbox value="a" label="选项 A" />
            <cd-checkbox value="b" label="选项 B" />
            <cd-checkbox value="c" label="选项 C" />
            <cd-checkbox value="d" label="选项 D" />
          </cd-checkbox-group>
          <text class="body-text">{{ limitTip }}</text>
        </cd-card>

        <cd-card class="section" title="cd-radio" desc="radio 形态是圆点 + 文字；button 形态是分段控件 —— 差异全在 CSS，DOM 只有一个类名不同。">
          <cd-radio-group v-model="plan">
            <cd-radio value="free" label="免费版" />
            <cd-radio value="pro" label="专业版" />
            <cd-radio value="team" label="团队版" />
          </cd-radio-group>

          <view class="row row--baseline">
            <text class="body-text">当前：{{ plan }}</text>
          </view>

          <cd-divider position="left">分段控件形态</cd-divider>

          <view class="row">
            <cd-radio-group v-model="range" variant="button" size="small">
              <cd-radio value="day" label="今日" />
              <cd-radio value="week" label="本周" />
              <cd-radio value="month" label="本月" />
              <cd-radio value="year" label="本年" />
            </cd-radio-group>
          </view>

          <view class="row row--baseline">
            <cd-radio-group v-model="size" variant="button">
              <cd-radio value="s" label="小" />
              <cd-radio value="m" label="中" />
              <cd-radio value="l" label="大" />
            </cd-radio-group>
          </view>

          <cd-radio-group v-model="channel" direction="vertical">
            <cd-radio value="sms" label="短信通知" />
            <cd-radio value="mail" label="邮件通知" />
            <cd-radio value="none" label="不接收（禁用）" disabled />
          </cd-radio-group>
        </cd-card>

        <cd-card class="section" title="cd-stepper" desc="按住不放会连加；撞到边界时按钮变灰并触发 overlimit，不会静默吞掉操作。">
          <view class="stack">
            <view class="row row--baseline">
              <cd-stepper v-model="count" />
              <text class="body-text">基础：{{ count }}（长按试连加）</text>
            </view>

            <view class="row row--baseline">
              <cd-stepper v-model="price" :step="0.5" :min="0" :max="10" />
              <text class="body-text">步长 0.5，自动推断小数位：{{ price }}</text>
            </view>

            <view class="row row--baseline">
              <cd-stepper v-model="qty" :min="1" :max="5" :editable="false" size="small" />
              <text class="body-text">小号 + 禁止手输 + 1~5</text>
            </view>

            <view class="row row--baseline">
              <cd-stepper v-model="big" size="large" :field-width="64" />
              <text class="body-text">大号</text>
            </view>

            <view class="row row--baseline">
              <cd-stepper :model-value="3" disabled />
              <text class="body-text">禁用（边界外按钮变灰）</text>
            </view>
          </view>
        </cd-card>

        <!-- ================= 表单校验联动 ================= -->
        <cd-card
          class="section"
          title="表单校验联动"
          desc="新控件全部通过 useField 接入 cd-form 的校验链：值变触发 change，失焦或操作结束触发 blur。"
        >
          <cd-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <cd-form-item prop="plan" label="套餐">
              <cd-radio-group v-model="form.plan" variant="button">
                <cd-radio value="free" label="免费版" />
                <cd-radio value="pro" label="专业版" />
              </cd-radio-group>
            </cd-form-item>

            <cd-form-item prop="hobbies" label="兴趣（至少选 2 项）">
              <cd-checkbox-group v-model="form.hobbies">
                <cd-checkbox value="read" label="阅读" />
                <cd-checkbox value="code" label="编码" />
                <cd-checkbox value="run" label="跑步" />
              </cd-checkbox-group>
            </cd-form-item>

            <cd-form-item prop="seat" label="席位数量（1~10）" help="超过 5 个席位需要联系销售">
              <cd-stepper v-model="form.seat" :min="1" :max="10" />
            </cd-form-item>

            <cd-form-item prop="notify" label="接收通知" help="关闭后将不再收到任何提醒">
              <cd-switch v-model="form.notify" />
            </cd-form-item>

            <cd-form-item prop="channel" label="通知渠道">
              <cd-radio-group v-model="form.channel">
                <cd-radio value="sms" label="短信" />
                <cd-radio value="mail" label="邮件" />
              </cd-radio-group>
            </cd-form-item>

            <view class="row">
              <cd-button type="primary" @click="handleSubmit">提交</cd-button>
              <cd-button @click="handleReset">重置</cd-button>
              <cd-button type="text" @click="handleClear">清除校验</cd-button>
            </view>
          </cd-form>

          <cd-alert
            v-if="submitResult"
            class="submit-result"
            :type="submitResult.type"
            :title="submitResult.title"
            :description="submitResult.desc"
          />
        </cd-card>

        <!-- ================= 禁用整个表单 ================= -->
        <cd-card
          class="section"
          title="整体禁用"
          desc="cd-form 的 disabled 会下发到所有字段 —— 这条链路此前对下拉框是不生效的，本版已修复。"
        >
          <view class="row">
            <cd-button size="small" @click="formDisabled = !formDisabled">
              {{ formDisabled ? '解除禁用' : '禁用下方表单' }}
            </cd-button>
          </view>

          <cd-form :model="disabledModel" :disabled="formDisabled" label-position="top">
            <cd-form-item prop="name" label="名称">
              <cd-input v-model="disabledModel.name" placeholder="输入框" />
            </cd-form-item>

            <cd-form-item prop="type" label="类型（下拉框）">
              <cd-select
                v-model="disabledModel.type"
                :options="typeOptions"
                placeholder="下拉框"
              />
            </cd-form-item>

            <cd-form-item prop="enabled" label="启用">
              <cd-switch v-model="disabledModel.enabled" />
            </cd-form-item>

            <cd-form-item prop="count" label="数量">
              <cd-stepper v-model="disabledModel.count" :min="0" />
            </cd-form-item>
          </cd-form>
        </cd-card>

        <!-- ================= cd-swiper ================= -->
        <cd-card class="section" title="cd-swiper" desc="轮播：底层是 uni 原生 swiper，桌面形态额外给一组左右翻页箭头。list 支持 { image, text } 对象，也支持直接传图片地址字符串。">
          <cd-swiper :list="swiperList" :height="220" autoplay circular @change="onSwiperChange" />
          <view class="result">
            <text class="result__label">当前第</text>
            <text class="result__value">{{ swiperIndex + 1 }} / {{ swiperList.length }} 张</text>
          </view>
        </cd-card>

        <!-- ================= cd-image-preview ================= -->
        <cd-card class="section" title="cd-image-preview" desc="图片预览：声明式用 v-model 控制开关，命令式直接 previewImage({ urls, current })。支持双指/滚轮缩放、长按保存、循环翻页。">
          <view class="row">
            <cd-button size="small" @click="previewVisible = true">声明式打开（第 1 张）</cd-button>
            <cd-button size="small" @click="openPreview">命令式打开（第 2 张）</cd-button>
          </view>

          <view class="row row--gap">
            <view v-for="(url, index) in previewUrls" :key="index" class="thumb" @click="openPreviewAt(index)">
              <image class="thumb__img" :src="url" mode="aspectFill" />
            </view>
          </view>

          <cd-image-preview v-model="previewVisible" :urls="previewUrls" :current="0" />
        </cd-card>

        <!-- ================= cd-form-render ================= -->
        <cd-card class="section" title="cd-form-render" desc="Schema 表单引擎：一份字段描述数组渲染整张表单。内建 12 种控件，支持显隐联动、禁用联动、栅格分列与默认值注入，校验直接复用 cd-form 的规则体系。">
          <view class="row">
            <cd-button size="small" type="primary" @click="submitSchema">提交校验</cd-button>
            <cd-button size="small" @click="resetSchema">重置</cd-button>
          </view>

          <!-- 模型用 ref({}) 声明。若写成 const reactive({}) 再 v-model 绑定，
               Vue 会编译出对 const 的赋值，运行时抛 Assignment to constant variable -->
          <cd-form-render
            ref="schemaRef"
            :model-value="schemaModel"
            :schema="schemaFields"
            :cols="2"
            :gutter="12"
            label-position="top"
          />

          <text class="hint">{{ schemaResult }}</text>
        </cd-card>
      </view>
    </view>
  </cd-config-provider>
</template>

<script setup>
/**
 * 展示与表单控件演示页。
 * 覆盖第二批 15 个组件，以及它们与 cd-form 的校验联动。
 */
import { computed, reactive, ref } from 'vue'
import { previewImage } from '@/uni_modules/codedog-ui'

/* ---------------- 密度 ---------------- */
const density = ref('default')
function toggleDensity() {
  density.value = density.value === 'small' ? 'default' : 'small'
}

/* ---------------- 标签 ---------------- */
const closableTags = ref(['可关闭 A', '可关闭 B', '可关闭 C'])
function removeTag(index) {
  closableTags.value.splice(index, 1)
}

/* ---------------- 加载 ---------------- */
const fullscreenLoading = ref(false)

/* ---------------- 骨架屏 ---------------- */
const skeletonLoading = ref(true)

/* ---------------- 提示条 ---------------- */
function handleAlertClose() {
  uni.showToast({ title: '触发了 close 事件', icon: 'none' })
}

/* ---------------- 开关 ---------------- */
const switchBasic = ref(true)
const switchValue = ref('ON')
const switchText = ref(false)
const s1 = ref(true)
const s2 = ref(false)
const s3 = ref(true)
const switchGuard = ref(false)

/** 演示 beforeChange：取消返回 false，开关不会先动再弹回 */
function confirmSwitch(next) {
  return new Promise((resolve) => {
    uni.showModal({
      title: '确认切换',
      content: `确定要切换到 ${next} 吗？`,
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false),
    })
  })
}

/* ---------------- 复选 / 单选 ---------------- */
const singleCheck = ref(true)
const hobbies = ref(['read', 'code'])
const cities = ref(['bj'])
const limited = ref(['a'])
const limitTip = ref('')

function handleOverlimit(payload) {
  limitTip.value = `已达上限 ${payload.limit} 项，无法继续选择`
}

const plan = ref('pro')
const range = ref('week')
const size = ref('m')
const channel = ref('sms')

/* ---------------- 步进器 ---------------- */
const count = ref(3)
const price = ref(1.5)
const qty = ref(1)
const big = ref(12)

/* ---------------- 表单校验 ---------------- */
const formRef = ref(null)

const form = reactive({
  plan: 'pro',
  hobbies: ['read'],
  seat: 3,
  notify: true,
  channel: 'sms',
})

const rules = {
  plan: [{ required: true, message: '请选择套餐' }],
  hobbies: [
    {
      validator: (value) =>
        Array.isArray(value) && value.length >= 2 ? true : '请至少选择 2 项兴趣',
      trigger: 'change',
    },
  ],
  seat: [
    {
      validator: (value) => (value >= 3 && value <= 8 ? true : '席位数量需要在 3~8 之间'),
      trigger: 'change',
    },
  ],
  channel: [{ required: true, message: '请选择通知渠道', trigger: 'change' }],
}

const submitResult = ref(null)

async function handleSubmit() {
  submitResult.value = null
  const passed = await formRef.value.validate()

  if (passed) {
    submitResult.value = {
      type: 'success',
      title: '校验通过',
      desc: `提交数据：${JSON.stringify(form)}`,
    }
    return
  }

  submitResult.value = {
    type: 'danger',
    title: '校验未通过',
    desc: '已自动滚动到第一个出错的字段，请修正后重试。',
  }
}

function handleReset() {
  formRef.value.resetFields()
  submitResult.value = null
}

function handleClear() {
  formRef.value.clearValidate()
  submitResult.value = null
}

/* ---------------- 整体禁用 ---------------- */
const formDisabled = ref(false)
const disabledModel = reactive({
  name: '示例名称',
  type: 'a',
  enabled: true,
  count: 2,
})

const typeOptions = [
  { label: '类型 A', value: 'a' },
  { label: '类型 B', value: 'b' },
  { label: '类型 C', value: 'c' },
]

/* 用于页头展示新增组件数量 */
const newComponentCount = computed(() => 15)

/* ---------------- 轮播 / 图片预览 ----------------
 * 演示图用内联 SVG（data URI）生成 —— 不依赖任何外链，
 * 断网、内网、小程序校验域名没配时都能正常渲染。 */
function gradientImage(title, from, to) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="960" height="540" fill="url(#g)"/>` +
    `<text x="480" y="290" font-size="72" fill="#ffffff" text-anchor="middle" font-family="sans-serif">${title}</text>` +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const swiperList = [
  { image: gradientImage('第一屏', '#3b76f6', '#7c3aed'), text: '蓝紫渐变' },
  { image: gradientImage('第二屏', '#0ea5e9', '#10b981'), text: '青绿渐变' },
  { image: gradientImage('第三屏', '#f59e0b', '#ef4444'), text: '橙红渐变' },
]

const swiperIndex = ref(0)
function onSwiperChange(index) {
  swiperIndex.value = index
}

const previewUrls = [
  gradientImage('图一', '#3b76f6', '#1e293b'),
  gradientImage('图二', '#10b981', '#0f766e'),
  gradientImage('图三', '#f59e0b', '#b45309'),
]

const previewVisible = ref(false)

function openPreview() {
  previewImage({ urls: previewUrls, current: 1 })
}

function openPreviewAt(index) {
  previewImage({ urls: previewUrls, current: index })
}

/* ---------------- Schema 表单引擎 ---------------- */

const schemaRef = ref(null)
const schemaResult = ref('未校验')

/*
 * 用 ref 而不是 reactive：组件是「原地改传入对象」的，同时 emit update:modelValue。
 * 若模型是 `const x = reactive({})` 再 v-model 绑定，Vue 编译出的是 `x = $event`，
 * 而 const 不能赋值 —— 运行时会抛 TypeError: Assignment to constant variable。
 * 这里用 ref + :model-value，两条路都避开。
 */
const schemaModel = ref({
  name: '',
  phone: '',
  city: '',
  level: 'normal',
  birthday: '',
  progress: 30,
  count: 1,
  notify: false,
  channel: 'sms',
})

const schemaFields = [
  {
    prop: 'name',
    label: '姓名',
    widget: 'input',
    required: true,
    props: { placeholder: '请输入姓名', clearable: true },
    rules: [{ required: true, message: '姓名不能为空' }],
  },
  {
    prop: 'phone',
    label: '手机号',
    widget: 'input',
    props: { type: 'number', maxlength: 11, placeholder: '请输入手机号' },
    rules: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }],
  },
  {
    prop: 'city',
    label: '城市',
    widget: 'select',
    props: {
      placeholder: '请选择城市',
      options: [
        { label: '北京', value: 'bj' },
        { label: '上海', value: 'sh' },
        { label: '广州', value: 'gz' },
      ],
    },
  },
  {
    prop: 'level',
    label: '会员等级',
    widget: 'radio',
    defaultValue: 'normal',
    props: {
      options: [
        { label: '普通', value: 'normal' },
        { label: '黄金', value: 'gold' },
      ],
    },
  },
  { prop: 'birthday', label: '生日', widget: 'date' },
  {
    prop: 'progress',
    label: '完成度',
    widget: 'slider',
    defaultValue: 30,
    props: { min: 0, max: 100, step: 5 },
  },
  {
    prop: 'count',
    label: '席位',
    widget: 'stepper',
    defaultValue: 1,
    props: { min: 1, max: 20 },
  },
  {
    prop: 'notify',
    label: '接收通知',
    widget: 'switch',
    defaultValue: false,
  },
  {
    /* 只有打开「接收通知」才渲染这一项 —— 隐藏字段不会注册校验规则 */
    prop: 'channel',
    label: '通知渠道',
    widget: 'select',
    span: 2,
    visible: (m) => !!m.notify,
    props: {
      options: [
        { label: '短信', value: 'sms' },
        { label: '邮件', value: 'mail' },
      ],
    },
  },
]

async function submitSchema() {
  const ok = await schemaRef.value.validate()
  schemaResult.value = ok ? '校验通过' : '校验未通过，见字段下方红字'
}

function resetSchema() {
  schemaRef.value.resetFields()
  schemaResult.value = '已重置'
}
</script>

<script>
export default {
  name: 'PageShowcase',
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
  align-items: flex-start;
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

/* 一行里混排图标、标签、文字时需要基线对齐才不会参差 */
.row--baseline {
  align-items: center;
}

.stack {
  display: flex;
  flex-direction: column;
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

.body-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  line-height: 1.7;
}

/* ---------------- 空状态网格 ---------------- */
.empty-grid {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: var(--cd-space-4, 16px);
}

.empty-grid__cell {
  box-sizing: border-box;
  width: 50%;
  border: 1px solid var(--cd-border-color-light, #f1f5f9);
  border-radius: var(--cd-radius-md, 8px);
  margin-bottom: var(--cd-space-2, 8px);
}

@media (min-width: 768px) {
  .empty-grid__cell {
    width: 25%;
  }
}

/* ---------------- 骨架屏自定义模板 ---------------- */
.custom-skeleton {
  background-color: var(--cd-skeleton-bg, #f1f5f9);
  border-radius: var(--cd-radius-sm, 4px);
}

.custom-skeleton--square {
  width: 80px;
  height: 80px;
  margin-right: var(--cd-space-3, 12px);
}

.custom-skeleton--short {
  width: 160px;
  height: 20px;
}

.loaded-block {
  padding: var(--cd-space-3, 12px) 0;
}

.submit-result {
  margin-top: var(--cd-space-4, 16px);
}

/* ---------------- 轮播 / 图片预览 ---------------- */
.result {
  display: flex;
  align-items: center;
  margin-top: var(--cd-space-3, 12px);
  padding: var(--cd-space-3, 12px) var(--cd-space-4, 16px);
  background-color: var(--cd-bg-sunken, #f8fafc);
  border-radius: var(--cd-radius-md, 8px);
}

.result__label {
  flex-shrink: 0;
  margin-right: var(--cd-space-3, 12px);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-tertiary, #94a3b8);
}

.result__value {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-primary, #0f172a);
}

.row--gap {
  margin-top: var(--cd-space-3, 12px);
}

.thumb {
  width: 72px;
  height: 54px;
  border-radius: var(--cd-radius-sm, 4px);
  overflow: hidden;
  cursor: pointer;
}

.thumb__img {
  width: 100%;
  height: 100%;
}

.hint {
  display: block;
  margin-top: var(--cd-space-3, 12px);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-tertiary, #94a3b8);
}
</style>
