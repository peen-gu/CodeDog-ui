import DefaultTheme from 'vitepress/theme'
import './cd-tokens.scss'
import './custom.css'
import './demo-support.css'
import { installUniShim } from './uni-shim.js'
import CdDemo from './CdDemo.vue'

/**
 * 组件库里有 5 个组件直接复用了 wot-design-uni 的浮层：
 *   cd-dialog / cd-drawer / cd-action-sheet → wd-popup
 *   cd-select（移动端形态）                → wd-action-sheet
 *   cd-config-provider                     → wd-config-provider
 *
 * 在 uni-app 项目里它们靠 pages.json 的 easycom 规则 `^wd-(.*)` 解析，
 * 但文档站没有 easycom —— 不注册的话 Vue 会把 <wd-popup> 当成未知元素
 * 退化渲染，槽内容照常显示出来，于是弹层内容平铺在文档页面上，
 * dialog / action-sheet / select 三个组件的预览就变成了错的样子。
 */
import WdPopup from 'wot-design-uni/components/wd-popup/wd-popup.vue'
import WdActionSheet from 'wot-design-uni/components/wd-action-sheet/wd-action-sheet.vue'
import WdConfigProvider from 'wot-design-uni/components/wd-config-provider/wd-config-provider.vue'

/**
 * 文档站里使用 CodeDogUI 自己的组件（实时预览）。
 *
 * 全量注册 62 个 cd-* 组件（eager）：组件都是无全局副作用的 SFC，
 * Vite 会按 chunk 拆分；注册后 demo 源码里的 <cd-button> 等
 * kebab-case 标签可以直接解析，等价于 uni-app 里 easycom 的效果。
 */
const componentMods = import.meta.glob(
  '../../../src/uni_modules/codedog-ui/components/cd-*/cd-*.vue',
  { eager: true },
)

/**
 * uni-app 基础标签 view / text 的浏览器呈现：
 * 由 config.mjs 的 isCustomElement 在编译期声明为自定义元素，
 * custom.css 的 :where(view/:where(text) 负责块级/行内兜底。
 * 这里不再注册同名组件 —— Vue 编译器对小写无连字符标签不会查注册表。
 */

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    /* 浏览器端 uni.* API（SSR 无 window，shim 内部自行判断） */
    installUniShim()

    app.component('CdDemo', CdDemo)

    /* wot-design-uni 浮层：与 uni-app 里 easycom 的 `^wd-(.*)` 等价 */
    app.component('wd-popup', WdPopup)
    app.component('wd-action-sheet', WdActionSheet)
    app.component('wd-config-provider', WdConfigProvider)

    for (const [path, mod] of Object.entries(componentMods)) {
      const m = path.match(/cd-([\w-]+)\/cd-[\w-]+\.vue$/)
      if (!m) continue
      app.component(`cd-${m[1]}`, mod.default)
      /* cd-button → CdButton（各段首字母大写，含第一段） */
      const pascal = m[1]
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('')
      app.component(`Cd${pascal}`, mod.default)
    }
  },
}
