<script>
export default {
  onLaunch() {
    // 主题状态是懒初始化的，首次被组件读取时才落盘。
    // 这里不做任何事，只是保留钩子位，方便后续接入启动埋点。
  },
}
</script>

<style lang="scss">
/**
 * 全局样式：整个应用只需引入这一次。
 * 它会输出 CodeDogUI 的 CSS 变量挂载点与工具类。
 * 组件自身样式随组件走，无需重复引入。
 */
@import '@/uni_modules/codedog-ui/styles/index.scss';

/**
 * 页面基础样式。
 *
 * 注意这里刻意不做「全局 reset」（不写 * { box-sizing } 之类）——
 * 小程序 WXSS 不支持通配符选择器，而且组件库污染业务页面是最招人烦的行为。
 * 框架的约定是：所有组件的盒模型在组件自己的类名下显式声明（@include cd-reset）。
 * 这里只约束 page 本身。
 */
page {
  background-color: var(--cd-bg-page, #f8fafc);
  color: var(--cd-text-primary, #0f172a);
  font-family: var(--cd-font-family, sans-serif);
  font-size: var(--cd-font-size-base, 14px);
  line-height: var(--cd-line-height-base, 1.5);
  -webkit-font-smoothing: antialiased;
}

/* H5 端让页面背景跟随主题，避免暗色下出现白边 */
/* #ifdef H5 */
html,
body {
  background-color: var(--cd-bg-page, #f8fafc);
}
/* #endif */
</style>
