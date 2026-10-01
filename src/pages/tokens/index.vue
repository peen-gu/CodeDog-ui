<template>
  <cd-config-provider>
    <view class="cd-page cd-page--desktop">
      <view class="cd-container">
        <view class="head">
          <text class="head__title">设计变量 Design Tokens</text>
          <text class="head__desc">
            三层令牌：原始令牌 → 语义令牌 → 组件令牌。全部以 CSS 变量承载，
            因此切换亮暗主题不需要重新编译。下面的色块直接引用变量本身渲染，
            你在页面上看到的就是变量当前的真实取值。
          </text>
        </view>

        <!-- ---------- 原始令牌：色阶 ---------- -->
        <view class="cd-panel section">
          <text class="cd-panel__title">第 1 层 · 原始令牌</text>
          <text class="cd-panel__desc">只被语义层引用。业务代码不应直接使用这一层。</text>

          <view v-for="ramp in ramps" :key="ramp.name" class="ramp">
            <text class="ramp__name">{{ ramp.name }}</text>
            <view class="ramp__bar">
              <view
                v-for="step in ramp.steps"
                :key="step"
                class="ramp__cell"
                :style="`background-color: var(--cd-${ramp.name}-${step});`"
              >
                <text class="ramp__cell-text">{{ step }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- ---------- 语义令牌 ---------- -->
        <view class="cd-panel section">
          <text class="cd-panel__title">第 2 层 · 语义令牌</text>
          <text class="cd-panel__desc">业务代码与组件都只应该消费这一层。换品牌色时只改这一层。</text>

          <view class="grid">
            <view v-for="token in semanticColors" :key="token.name" class="grid__item">
              <view class="grid__swatch" :style="`background-color: var(--cd-${token.name});`" />
              <text class="grid__name">--cd-{{ token.name }}</text>
              <text class="grid__note">{{ token.note }}</text>
            </view>
          </view>
        </view>

        <!-- ---------- 文本色 ---------- -->
        <view class="cd-panel section">
          <text class="cd-panel__title">文本层级</text>
          <view v-for="t in textTokens" :key="t.name" class="line">
            <text class="line__sample" :style="`color: var(--cd-${t.name});`">{{ t.sample }}</text>
            <text class="line__name">--cd-{{ t.name }}</text>
          </view>
        </view>

        <!-- ---------- 间距 ---------- -->
        <view class="cd-panel section">
          <text class="cd-panel__title">间距标尺（4px 基准）</text>
          <text class="cd-panel__desc">单位是 px 不是 rpx —— 这是框架最核心的约定之一。</text>
          <view v-for="n in spacingSteps" :key="n" class="space-row">
            <text class="space-row__name">--cd-space-{{ n }}</text>
            <view class="space-row__track">
              <view class="space-row__bar" :style="`width: var(--cd-space-${n});`" />
            </view>
          </view>
        </view>

        <!-- ---------- 字号 ---------- -->
        <view class="cd-panel section">
          <text class="cd-panel__title">字号阶梯</text>
          <view v-for="f in fontSteps" :key="f" class="font-row">
            <text class="font-row__sample" :style="`font-size: var(--cd-font-size-${f});`">CodeDog 示例</text>
            <text class="font-row__name">--cd-font-size-{{ f }}</text>
          </view>
        </view>

        <!-- ---------- 圆角与阴影 ---------- -->
        <view class="cd-panel section">
          <text class="cd-panel__title">圆角与阴影</text>
          <view class="grid">
            <view v-for="r in radiusSteps" :key="r" class="grid__item">
              <view class="radius-demo" :style="`border-radius: var(--cd-radius-${r});`" />
              <text class="grid__name">--cd-radius-{{ r }}</text>
            </view>
          </view>
          <view class="shadow-row">
            <view v-for="s in shadowSteps" :key="s" class="shadow-demo" :style="`box-shadow: var(--cd-shadow-${s});`">
              <text class="shadow-demo__name">{{ s }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </cd-config-provider>
</template>

<script setup>
/**
 * 设计变量展示页。
 *
 * 注意这里的色块不是把十六进制值写在 JS 里，而是直接 `background: var(--cd-x)`：
 * 这样页面展示的就是变量的当前真实取值 —— 切暗色主题时色块会跟着变，
 * 一旦某个变量名写错，色块会立刻显形（透明），相当于自带一次校验。
 */
const ramps = [
  { name: 'brand', steps: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'neutral', steps: [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
]

const semanticColors = [
  { name: 'color-primary', note: '主色 / 品牌' },
  { name: 'color-primary-hover', note: '主色悬停' },
  { name: 'color-primary-soft', note: '主色浅底' },
  { name: 'color-success', note: '成功' },
  { name: 'color-warning', note: '警告' },
  { name: 'color-danger', note: '危险' },
  { name: 'color-info', note: '中性信息' },
  { name: 'bg-page', note: '页面底色' },
  { name: 'bg-container', note: '容器底色' },
  { name: 'bg-sunken', note: '下沉底色' },
  { name: 'border-color', note: '常规描边' },
  { name: 'border-color-strong', note: '强调描边' },
]

const textTokens = [
  { name: 'text-primary', sample: '主要文字 · 标题与关键信息' },
  { name: 'text-regular', sample: '常规文字 · 正文内容' },
  { name: 'text-secondary', sample: '次要文字 · 说明与辅助' },
  { name: 'text-placeholder', sample: '占位文字 · 输入提示' },
  { name: 'text-disabled', sample: '禁用文字 · 不可操作' },
]

const spacingSteps = [1, 2, 3, 4, 5, 6, 8, 10, 12]
const fontSteps = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl']
const radiusSteps = ['sm', 'md', 'lg', 'xl', 'round']
const shadowSteps = ['sm', 'md', 'lg']
</script>

<style lang="scss" scoped>
.head {
  padding: var(--cd-space-5, 20px);
  margin-bottom: var(--cd-space-4, 16px);
  background-color: var(--cd-bg-container, #ffffff);
  border: 1px solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-lg, 12px);
}

.head__title {
  display: block;
  font-size: var(--cd-font-size-xl, 20px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-primary, #0f172a);
}

.head__desc {
  display: block;
  margin-top: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-secondary, #64748b);
  line-height: 1.7;
}

.section {
  margin-bottom: var(--cd-space-4, 16px);
}

/* 色阶 */
.ramp {
  margin-top: var(--cd-space-3, 12px);
}

.ramp__name {
  display: block;
  margin-bottom: var(--cd-space-1, 4px);
  font-family: var(--cd-font-family-mono, monospace);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-secondary, #64748b);
}

.ramp__bar {
  display: flex;
  border-radius: var(--cd-radius-md, 8px);
  overflow: hidden;
}

.ramp__cell {
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: center;
  height: 44px;
  padding-bottom: 4px;
}

.ramp__cell-text {
  font-size: 9px;
  color: var(--cd-text-secondary, #64748b);
  mix-blend-mode: difference;
  opacity: 0.75;
}

/* 网格 */
.grid {
  display: flex;
  flex-wrap: wrap;
  margin-top: var(--cd-space-3, 12px);
}

.grid__item {
  box-sizing: border-box;
  width: 100%;
  padding: var(--cd-space-2, 8px);
  margin-bottom: var(--cd-space-2, 8px);
}

@media (min-width: 576px) {
  .grid__item {
    width: 25%;
  }
}

.grid__swatch {
  height: 40px;
  border: 1px solid var(--cd-border-color, #e2e8f0);
  border-radius: var(--cd-radius-md, 8px);
}

.grid__name {
  display: block;
  margin-top: var(--cd-space-1, 4px);
  font-family: var(--cd-font-family-mono, monospace);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-regular, #334155);
  word-break: break-all;
}

.grid__note {
  display: block;
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-placeholder, #94a3b8);
}

/* 文本层级 */
.line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: var(--cd-space-2, 8px) 0;
  border-bottom: 1px solid var(--cd-border-color-light, #f1f5f9);
}

.line__sample {
  font-size: var(--cd-font-size-base, 14px);
}

.line__name {
  font-family: var(--cd-font-family-mono, monospace);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-placeholder, #94a3b8);
}

/* 间距 */
.space-row {
  display: flex;
  align-items: center;
  margin-top: var(--cd-space-2, 8px);
}

.space-row__name {
  width: 120px;
  flex-shrink: 0;
  font-family: var(--cd-font-family-mono, monospace);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-secondary, #64748b);
}

.space-row__track {
  flex: 1;
  min-width: 0;
}

.space-row__bar {
  height: 12px;
  background-color: var(--cd-color-primary, #3b76f6);
  border-radius: var(--cd-radius-sm, 4px);
}

/* 字号 */
.font-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: var(--cd-space-2, 8px) 0;
  border-bottom: 1px solid var(--cd-border-color-light, #f1f5f9);
}

.font-row__sample {
  color: var(--cd-text-primary, #0f172a);
}

.font-row__name {
  font-family: var(--cd-font-family-mono, monospace);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-placeholder, #94a3b8);
}

/* 圆角 */
.radius-demo {
  height: 40px;
  background-color: var(--cd-color-primary-soft, #eff5ff);
  border: 1px solid var(--cd-color-primary-border, #bfd6fe);
}

/* 阴影 */
.shadow-row {
  display: flex;
  flex-wrap: wrap;
  margin-top: var(--cd-space-4, 16px);
}

.shadow-demo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 56px;
  margin: 0 var(--cd-space-4, 16px) var(--cd-space-4, 16px) 0;
  background-color: var(--cd-bg-elevated, #ffffff);
  border-radius: var(--cd-radius-lg, 12px);
}

.shadow-demo__name {
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-secondary, #64748b);
}
</style>
