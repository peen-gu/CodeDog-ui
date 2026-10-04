import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { uniConditionalCompile } from './ifdef-plugin.mjs'

const dir = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(dir, '../../src')

/* 组件清单由 scripts/gen-component-docs.mjs 生成，这里只负责渲染成侧边栏 */
const data = JSON.parse(fs.readFileSync(path.join(dir, 'data/components.json'), 'utf-8'))

/* 站点（Lucide globe）与邮箱（Lucide mail）图标，内联成 socialLinks 的自定义 svg；
   VitePress 只内置 discord/facebook/github/instagram/linkedin/mastodon/npm/slack/twitter/x/youtube */
const SITE_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
  'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
  '<circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' +
  '<path d="M2 12h20"/></svg>'

const MAIL_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
  'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect width="20" height="16" x="2" y="4" rx="2"/>' +
  '<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>'

const componentsSidebar = [
  { text: '开始', items: [{ text: '组件总览', link: '/components/' }] },
  ...data.categories.map((c) => ({
    text: `${c.title} · ${c.items.length}`,
    items: c.items.map((i) => ({ text: i.title, link: `/components/${i.name}` })),
  })),
]

export default defineConfig({
  title: 'CodeDogUI',
  description: '面向 uni-app 的跨端 UI 框架：一套 Vue3 代码，同时覆盖 H5 移动端、H5 PC、微信小程序与 Electron 桌面。由 Codedog.tech 长期维护，UI 作者 Penn.Gu。',
  lang: 'zh-CN',
  cleanUrls: true,
  ignoreDeadLinks: true,

  /* 部署在 https://doc.ui.codedog.tech，canonical 与 OG 都以它为基准 */
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#4c8dff' }],
    ['meta', { name: 'author', content: 'Penn.Gu' }],
    ['link', { rel: 'canonical', href: 'https://doc.ui.codedog.tech/' }],
    ['meta', { property: 'og:title', content: 'CodeDogUI — 一套代码，两端各自的形态' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://doc.ui.codedog.tech/' }],
    ['meta', { property: 'og:site_name', content: 'CodeDogUI' }],
  ],

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/', activeMatch: '/guide/' },
      { text: `组件 ${data.total}`, link: '/components/', activeMatch: '/components/' },
      { text: '更新日志', link: '/changelog' },
      { text: '官方站点 ↗', link: 'https://ui.codedog.tech' },
    ],

    socialLinks: [
      {
        icon: { svg: SITE_ICON_SVG },
        link: 'https://ui.codedog.tech',
        ariaLabel: '官方站点 ui.codedog.tech',
      },
      { icon: 'github', link: 'https://github.com/peen-gu/CodeDog-ui' },
      {
        icon: { svg: MAIL_ICON_SVG },
        link: 'mailto:codedog.tech@icloud.com',
        ariaLabel: '邮件联系 Codedog.tech',
      },
      { icon: 'npm', link: 'https://www.npmjs.com/package/codedog-ui' },
    ],

    editLink: {
      pattern: 'https://github.com/peen-gu/CodeDog-ui/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '这是什么', link: '/guide/' },
            { text: '快速开始', link: '/guide/quick-start' },
          ],
        },
        {
          text: '核心机制',
          items: [
            { text: '三层架构', link: '/guide/architecture' },
            { text: '设计令牌', link: '/guide/tokens' },
            { text: '亮暗主题与桥接', link: '/guide/theming' },
            { text: '双形态组件', link: '/guide/dual-mode' },
          ],
        },
        {
          text: '实战',
          items: [
            { text: '跨端约束清单', link: '/guide/cross-platform' },
            { text: '命令式反馈服务', link: '/guide/service' },
            { text: '表单校验', link: '/guide/form' },
          ],
        },
      ],
      '/components/': componentsSidebar,
      '/': componentsSidebar,
    },

    search: {
      provider: 'local',
    },

    outline: [2, 3],

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    lastUpdatedText: '最后更新',

    footer: {
      message: 'MIT 许可发布 · 由 <a href="https://codedog.tech" target="_blank" rel="noreferrer">Codedog.tech</a> 长期维护 · UI 作者 Penn.Gu · 图标衍生自 Feather 与 Lucide，已保留署名',
      copyright:
        'Copyright © 2026 Codedog.tech · <a href="https://ui.codedog.tech">官方站点</a> · <a href="https://doc.ui.codedog.tech">在线文档</a>',
    },
  },

  /* demo 源码里的 uni-app 基础标签 view / text：编译为自定义元素，
     浏览器按未知元素渲染，custom.css 里 :where(view) 兜底块级/行内。
     必须在编译期声明 —— Vue 对小写无连字符的未知标签默认按原生元素输出，
     全局注册组件不会被查询。 */
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === 'view' || tag === 'text',
      },
    },
  },

  /* 组件数随版本变化，把这个 page 的静态构建期错误放宽 */
  vite: {
    server: { port: 5210 },
    resolve: {
      alias: {
        /* demo 源码带过来的是演示页的 import：@/uni_modules/... */
        '@': SRC,
      },
    },
    plugins: [uniConditionalCompile()],
  },
})
