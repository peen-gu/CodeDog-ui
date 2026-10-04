<script setup>
/**
 * CdDemo —— 组件文档的实时预览容器
 * ---------------------------------------------------------------
 * 由 gen-component-docs.mjs 生成的每个组件页引用：
 *
 *   <CdDemo id="button-0" />
 *
 * id 对应 demo-src/registry.mjs 里的懒加载条目（源码抽自演示页，
 * 与 npm 包同一份组件源码）。渲染策略：
 *
 *   - defineAsyncComponent：SSR 阶段不加载 demo 模块，避免任何
 *     uni.* 全局变量在 Node 里被求值；
 *   - ClientOnly：客户端挂载后才渲染， hydration 前显示占位；
 *   - 组件颜色全部来自 var(--cd-*)，站内切换暗色时预览自动跟随。
 */
import { computed, defineAsyncComponent, ref } from 'vue'
import { demos } from './demo-registry.mjs'

const props = defineProps({
  /** registry 键：`<组件名>-<序号>`，如 button-0 */
  id: { type: String, required: true },
})

const loader = computed(() => demos[props.id])
const failed = ref(false)

const Comp = computed(() => {
  if (!loader.value) return null
  return defineAsyncComponent({
    loader: async () => {
      try {
        const mod = await loader.value()
        return mod.default
      } catch (err) {
        console.error(`[CdDemo] 加载 ${props.id} 失败:`, err)
        failed.value = true
        return { render: () => null }
      }
    },
    delay: 0,
  })
})
</script>

<template>
  <div v-if="loader" class="cd-preview-wrap">
    <div class="cd-preview-head">
      <span class="cd-preview-dot" />
      <span class="cd-preview-label">实时预览 · 真实组件</span>
    </div>
    <div class="cd-preview cd-host">
      <ClientOnly>
        <component :is="Comp" v-if="Comp && !failed" />
        <template #fallback>
          <span class="cd-preview-loading">组件加载中…</span>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
/**
 * 预览容器样式 —— 刻意写在组件里而不是 custom.css
 * ---------------------------------------------------------------
 * 这两个类历史上一直只有模板引用、没有任何 CSS 定义，
 * 于是预览区是一个无边框、无背景、无内边距的裸盒子，组件直接贴在正文里，
 * 看不出「这是一个独立的预览画布」。这里补齐，视觉语言照抄 custom.css 的 .cd-demo。
 *
 * `.cd-preview` 上的 `transform: translateZ(0)` 是功能性的，不是装饰：
 * ---------------------------------------------------------------
 * cd-fab / cd-backtop / cd-affix / cd-toast-host 的根元素是 `position: fixed`。
 * 浏览器只对 { transform | filter | contain:paint | will-change } 不为 none 的祖先
 * 建立包含块 —— 没有它，预览里的悬浮球会脱离预览框、钉在浏览器视口右下角
 * （实测：注入前 cd-fab 位于 x=1166 y=804，预览框在 x=336 y=406 w=624 h=76）。
 * 加上之后 fixed 后代改为相对预览框定位，预览框才真正扮演「一个小视口」的角色。
 *
 * 不用 `contain: paint`：它会裁掉溢出内容，抽屉/弹层会被切。
 * transform 只建立包含块，不裁剪。
 */
.cd-preview-wrap {
  margin: 20px 0;
  border: 1px solid var(--vp-c-border);
  border-radius: var(--vp-c-radius);
  background: var(--vp-c-bg-elv);
}

.cd-preview-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  border-bottom: 1px solid var(--vp-c-border);
  border-radius: var(--vp-c-radius) var(--vp-c-radius) 0 0;
  background: var(--vp-c-bg-alt);
}

.cd-preview-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
}

.cd-preview-label {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.cd-preview {
  /* fixed 后代（fab / backtop / affix / toast-host）相对本框定位，见上方注释 */
  transform: translateZ(0);
  /* 悬浮类组件默认 bottom 偏移 32px + 自身 48px 高，低于 132 会被顶出框外 */
  min-height: 132px;
  padding: 20px;
}

.cd-preview-loading {
  font-size: 13px;
  color: var(--vp-c-text-3);
}
</style>
