---
title: 更新日志
---

## 0.5.0（2026-10-01）

第五批：导航/列表/容器/展示工具类大补齐。新增 25 个组件目录（含 4 组父子组合）。
组件总数 37 → 62。双端（H5 + 微信小程序）构建与四象限截图核验均通过。

### 项目归属

本版本起正式写入：**长期维护团队 Codedog.tech**、**官方站点 https://ui.codedog.tech**、
**在线文档 https://doc.ui.codedog.tech**、**UI 作者 Penn.Gu**。
联系方式：源码仓库 <https://github.com/peen-gu/CodeDog-ui> ·
邮箱 codedog.tech@icloud.com · 微信 penngu777。
已同步到 `package.json`（author / homepage / repository / bugs / `_codedog`）、`LICENSE`、
包内 README 与文档站（canonical / OG / 社交链接 / 页脚）。

### 新增组件（25 个）

**容器与列表**
- **cd-cell / cd-cell-group** 单元格：`arrow` 三态（未传则跟随 `clickable`）；
  组内由 `.cd-cell + .cd-cell` 相邻选择器补分隔线，单元格自己不画线；`inset` 切通铺/卡片
- **cd-grid / cd-grid-item** 宫格：列宽 JS 预算下发 `--cd-grid-item-w`；
  外框画容器（上/左）、内线画格子（右/下），**零 nth-child**（小程序不支持）；
  item 支持角标 / 小红点 / showZero / url 跳转（navigateTo → switchTab 降级）

**折叠与导航**
- **cd-collapse / cd-collapse-item** 折叠面板：容器持状态，`accordion` 时 v-model 为单值、
  否则为数组；**实测高度动画**（`createSelectorQuery` 量 `.cd-collapse-item__body-inner`，
  以 `--cd-collapse-body-h` 下发）—— 固定 `max-height: 999px` 会让视觉动画无效
- **cd-steps / cd-step** 步骤条：序号由容器注册表派生（`uid` + `indexOf`），子项不接受业务传 index；
  连线着色按「左边那个步骤」算（前置线 `index <= current`、后置线 `index < current`），
  首尾用透明线占位撑住图标居中
- **cd-timeline / cd-timeline-item** 时间线：`reverse` 用 `flex-direction: column-reverse`
  （不反转数组），item 里再算 `isVisualFirst`；首尾引线换成透明 spacer
- **cd-breadcrumb / cd-breadcrumb-item** 面包屑：容器 `isLast(uid)` 判定末项
  （不可点、颜色更重）；`to` 跳转同 grid-item 降级策略

**表单与交互**
- **cd-slider** 滑杆：按下时缓存轨道矩形；触屏元素级 touch + H5 专属 document mousemove/mouseup；
  **先量化再钳制**；双滑块取最近并允许交错；已接 useField 校验链接线
- **cd-rate** 评分：半星用**像素级裁切**（底层未选中 + 上层已选中 `overflow:hidden`
  按 `value * (size + gap)` px 裁切）；size/gap 声明为 Number 以便同时下发 CSS 变量；已接 useField
- **cd-search-bar** 搜索框：已接 useField
- **cd-popconfirm** 气泡确认：复用 useFloating，带箭头与双形态
- **cd-action-sheet** 动作面板：复用 wd-popup + useWotScope；支持 disabled / danger / description
- **cd-fab** 悬浮按钮：可拖拽，H5 走 document 鼠标监听；`offset-right` 让位给同角的其他浮层

**展示与工具**
- **cd-result** 结果页、**cd-count-down** 倒计时（锚定结束时间戳 `endAt - Date.now()`，
  定时器只负责「多久看一眼」）、**cd-count-to** 数字滚动
  （插值与格式化分离，千分位在 format 阶段用 split/join 加 —— 避开 lookahead 正则在小程序引擎的差异）
- **cd-notice-bar** 通知栏：`padding-left:100%` + `translate3d(-100%,0,0)` 无缝循环，
  速度按字数估算（异步测量会首屏闪跳）
- **cd-image** 图片：loading/loaded/error 三态；uni `<image mode>` 与 CSS object-fit 的映射表
- **cd-backtop / cd-affix** 回到顶部与图钉：共用 usePageScroll；
  affix 用占位壳 + 固定内层（外层越过 offsetTop 后内层切 fixed 并抄 width/left，外层用 height 顶住）

### 新增基建

- **composables/use-page-scroll.js**：统一「H5 自动监听 window scroll」与
  「小程序必须由页面 `onPageScroll` 传入」的差异（rAF 节流）
- **utils/raf.js**：rAF 在小程序不保证存在，`typeof requestAnimationFrame === 'function'` 判定，
  缺失时降级 16ms setTimeout
- **constants.js** 新增 5 个 context key：
  `CD_CELL_GROUP_KEY` / `CD_COLLAPSE_KEY` / `CD_STEPS_KEY` / `CD_TIMELINE_KEY` / `CD_BREADCRUMB_KEY`
- **icons.js filled 能力**：`FILLED_ICONS` 集合 + `buildSvg(inner, filled)`
  （切 `fill="#000" stroke="none"`）；`star-fill` 为**自研几何**
  （外接圆 9.6 / 内接圆 4.0 十点计算），与 Feather/Lucide 无字节重合
- **tokens.scss** 新增约 30 组 L3 令牌（cell/grid/collapse/step/timeline/breadcrumb/textarea/
  slider/rate/search/notice/result/countdown/action/image/backtop/fab），暗色 mixin 同步补齐

### 修复

- **⭐ 浮层族全部未定位（v0.4.0 真 bug，本批截图核验发现）**：
  `cd-tooltip` / `cd-popover` / `cd-dropdown` / `cd-date-picker` / `cd-time-picker` /
  `cd-popconfirm` 的模板引用了 `panelStyle` / `arrowStyle` / `uid`，但 `<script setup>`
  从未从 `floating` 里解构出来 —— 模板里的标识符会落到 `_ctx`（也就是 undefined），
  面板 `position:fixed` 却没有 left/top，掉回文档流原位、箭头被裁。
  表现是「功能能用，位置不对」，肉眼极难察觉。**六处统一补解构**
- **cd-collapse-item 的 change 事件取值错误**：原写 `emit('change', !open.value)`，
  切换后 computed 已更新读到的是新值；改为先取 `const next = !open.value` 再 emit
- **cd-count-down 在 setup 阶段同步 start()**：autoStart 场景改为 `onMounted(start)`
- **cd-rate 三处自查**：`voidIcon` 默认由 `'star-fill'` 改 `'star'`
  （灰色实心星看起来「像已选但坏了」）；text 槽位漏渲染；移除未使用的 useSlots
- **cd-image 两处自查**：加载中转图标改用 cd-icon 自带的 `spin` prop
  （跨组件传 class 不可靠）；默认尺寸由 `300rpx` 改 `160px`（禁纯 rpx 约定）
- **cd-popconfirm 宽度**：computed 不能直接进 useFloating 的 customStyle
  （会被拼成 `[object Object]`），改为独立 widthStyle 与 panelStyle 拼接

### 已知限制与踩坑

- **`<slot v-bind="obj">` 小程序编译器不支持**（报 `v-bind="parts" is not supported`）。
  作用域插槽必须逐项展开（`:total` `:days` `:hours` …）
- Edge headless `--screenshot` **相对路径写不出**（headless=new 报找不到路径），必须传绝对路径
- uni build 清空 `dist` 的方式在批量删除阈值为 50 的环境下会被拦截，
  构建前需先把旧 `assets` 目录挪开
- cd-collapse 的高度动画依赖 `createSelectorQuery`，首帧未展开时拿不到真实高度

## 0.4.0（2026-10-01）

第四批：命令式反馈服务（0 → 1）+ 浮层族与录入控件。新增 7 个组件 + 1 个宿主 + 1 套服务。
组件总数 29 → 37。

### 命令式反馈服务（本批核心）

`import { toast, confirm, alert, loading } from 'codedog-ui'` —— 一行调用，不再需要在页面里挂组件。

- **service/state.js**：模块级响应式单例（跨端、不依赖组件实例）
- **H5 零配置挂载**：首次调用时动态 import 宿主组件（独立 chunk）并挂到 body。
  成立前提已用探针在真实产物里验证：`view` 编译成字符串标签 `uni-view`，
  不依赖全局组件注册，`createApp` 可以直接渲染 uni 标签
- **小程序端**：页面放置 `<cd-toast-host />` 用品牌样式；未放置时自动降级
  `uni.showToast / showModal / showLoading`，API 语义一致
- **confirm/alert 复用 cd-dialog**：Promise 化，双形态（PC 居中模态 / 移动底部抽屉）、Esc、图标语义齐全
- **toast 细节**：同文案去重续时（连点保存不堆三条「保存成功」）、上限 3 条丢最旧、
  position 默认 auto（PC 顶部 / 移动中部）、文案超两行截断
- **loading**：返回 close 句柄；重复调用只更新文案；层级在 toast 之下（临时信息可透过遮罩被看到）
- **后到模态把先到的按取消结算** —— 悬挂的 Promise 比被顶掉更糟

### 新增组件

- **cd-drawer** 四向抽屉：auto 时移动端从底部、PC 从右侧；title/footer 插槽、Esc、beforeClose
  - 坑：wd-popup 的 --right/--left 只拉高定位壳，内层必须显式 `height:100%`，否则塌成内容高
- **cd-tooltip** 文字气泡：PC hover（进/出都带延迟，防鼠标轨迹误闪）/ 移动长按 + 点击
- **cd-popover** 内容气泡：点击触发、面板内点击不关闭、Esc、v-model 外部受控
- **cd-dropdown** 动作菜单：与 cd-select 语义分离（命令 vs 表单值）；
  PC hover/click 可配 + 键盘导航（↑↓/Enter/Esc）；分组标题、分割线、危险色、禁用
- **cd-date-picker** 日期：**移动端走系统原生滚轮、PC 端自研日历面板**（min/max、今天/清除、越界禁用）
  - 自研滚轮要处理 scroll-top 回环、惯性结束判定、逐平台差异；原生控件在移动端本来就是正确设计
- **cd-time-picker** 时间：移动端原生、PC 双列（时/分）；刻意不做秒
- **cd-upload** 上传：受控优先（列表真值在 modelValue）、`customRequest` 接管自定义接口、
  图片卡片/文件列表两形态、进度/重试/超限/超大回调、预览；小程序选文件走 `chooseMessageFile`
  - 刻意不做拖拽（小程序无 drag 事件体系）

### 新增基建

- **use-floating** 浮层定位内核（tooltip/popover/dropdown/picker 四类共用）：
  - 两段式定位：先隐藏渲染再测量（浮层自身尺寸只有渲染出来才知道）
  - 空间不足自动反向翻转 + 视口钳制
  - 滚动/resize 做 **rAF 节流的静默跟随重定位**而不是关闭 —— 气泡跟着触发物走，长列表滚动不闪烁
  - 刻意不用 wd-popup：气泡不遮罩、不锁滚动、不传送（传送丢主题作用域还破坏测量）
- **utils/date.js** 纯函数日期工具（全部可单测）；'YYYY-MM-DD' 显式分段解析避开 iOS 时区歧义
- **层级令牌**：`--cd-z-modal: 2400` / `--cd-z-loading: 2900`（toast 3000 沿用）
- **SERVICE_Z** JS 常量：cd-dialog 的 zIndex prop 是 Number，CSS var() 传不进去

### 修复

- **cd-date-picker / cd-time-picker 双状态源 bug（自查发现）**：
  本地 open 与 floating.open 并存，滚动自动收起只改 floating 那份 → 面板残留。
  统一为 floating.open 单一状态源
- **use-floating 滚动误杀（截图实测发现）**：最初设计是「滚动即关闭」，
  uni-app H5 路由导航的归位滚动会立刻把浮层关掉 → 改为跟随重定位

### 已知取舍

- 气泡类浮层基于 position:fixed：祖先带 transform 时定位会偏（弹窗类走 root-portal 不受影响）
- cd-date-picker 的范围选择（range）未做：单选+范围会让面板状态机翻倍，等真实场景
- cd-upload 不做拖拽：小程序无 drag 事件体系

## 0.3.0（2026-10-01）

第三批：补齐展示层、状态层与表单控件层。新增 15 个组件。

### 新增组件（15 个）

**展示**
- **cd-tag** 标签：6 种语义色 × 实心/浅底两形态、3 档尺寸、图标、可关闭、胶囊
  - type 只声明颜色（`--cd-tag-main` / `--cd-tag-soft`），形态决定用法 → 加语义色只需两行
- **cd-badge** 徽标：无插槽为独立标签，有插槽自动变成压住子元素右上角的角标
  - 数字按 max 裁剪为 `max+`；值为 0 默认不展示；小圆点、描边形态
- **cd-avatar** 头像：降级链 图片 → 插槽 → 图标 → 文字，图片失败自动落级不出现破图
  - 无显式底色时按内容生成**稳定**哈希色（同一名字永远同色）
  - 文字取字策略中西文不同：中文取后两字（欧阳修→阳修），西文取前两字母
- **cd-divider** 分割线：水平/垂直、带文字、左中右定位、虚线

**状态**
- **cd-progress** 进度条：线形（含条纹流动的 active 态、条内文字）+ 环形
  - 环形用 conic-gradient + mask 挖圆心，**不用 canvas**（避开小程序 canvas-id/层级/绘制时机）
  - 也刻意不用「两个半圆旋转」方案（需四层 DOM 且 0/50/100% 要特判）
  - mask 的支持要求本框架已在承担（cd-icon 全靠 mask），未引入新兼容风险
- **cd-loading** 加载：spinner（复用 cd-icon 的 loader + spin）/ dots / ring + 全屏遮罩
- **cd-empty** 空状态：固化 default/search/network/error/permission 五种预设，避免文案不一致
- **cd-skeleton** 骨架屏：扫光动画（非呼吸闪烁）、头像/图片/标题行、自定义模板插槽
  - 最后一行默认收窄到 60% —— 真实段落最后一行几乎不会是满行
  - **暗色主题下显式重定义块色**：亮色是「比背景深」，暗色必须反过来「比背景浅」
- **cd-alert** 提示条：4 种语义、标题/描述、可关闭、描边、通铺 banner、操作区

**表单控件**（全部经 `useField()` 接入 cd-form 校验链）
- **cd-switch** 开关：支持任意一对值（ON/OFF、1/0），不只布尔；beforeChange 支持 async
- **cd-checkbox / cd-checkbox-group**：独立（布尔）与组内（数组）双用法；不确定态；min/max 上限
- **cd-radio / cd-radio-group**：radio 与 button（分段控件）两形态，差异全在 CSS
- **cd-stepper** 步进器：按住连加、边界钳制并触发 overlimit、手动输入、小数位自动推断

### 新增 composables

- **useField()** 表单字段接线：notifyChange / notifyBlur / formDisabled 三件套。
  自定义控件只需注入它就能接入校验链，不再各自重复 inject 逻辑。

### 修复

- **`<cd-form disabled>` 对下拉框不生效**：cd-select 此前只读 props.disabled，
  而表单禁用信息在字段上下文的 disabled 里。cd-input 原本就读了，行为不一致。
  现两者统一走 useField 的 formDisabled。
- cd-input / cd-select 迁移到 useField()，注入逻辑收敛到一处。

### 设计决策记录

- **cd-tag 的尺寸类名带 `size-` 前缀**（`cd-tag--size-default`）。
  type 与 size 都有 'default' 取值，若都用 `cd-tag--default` 会同名冲突：
  「default 类型 + large 尺寸」会同时命中两条同特异性规则，高度取决于书写顺序。
  cd-button 现存的 `cd-button--default` 是同类隐患，因 default 尺寸恰好没有规则而侥幸无害。
- **cd-switch 的按压反馈缩放轨道而非滑块**：滑块的 transform 已被定位占用
  （translate(x, -50%)），再叠加 scale 会互相覆盖，需为每种尺寸×状态各写一条完整 transform。
- **cd-avatar 的字号只在尺寸可解析为 px 时下发**：`calc(25% * 0.4)` 中百分比
  在 font-size 上指父级字号而非头像高度，会算出无关的值。
- **cd-stepper 用「按下」而非「点击」触发**：同时绑 @click 与长按会在松手时多跳一格。
  同时绑 touchstart 与 mousedown（PC 无 touch 事件），用 pressing 标志防移动端重复触发。
- **cd-stepper 手动输入不即时提交**：输 15 会先经过 1，即时钳制会让用户永远输不进目标值。

### 验证

- `build:h5` 与 `build:mp-weixin` 双端通过；showcase 页 23 个组件全部被 easycom 正确解析
- Edge 无头截图 + Pillow 切段细读：PC（1440）与移动（420）两端、亮暗两主题逐节核对
- 暗色下骨架屏块色正确（比卡片背景浅），验证了暗色覆盖的必要性

## 0.2.1（2026-10-01）

开源合规补齐。无 API 变更、无行为变更。

### 新增

- **`LICENSE`** MIT 许可
- **`THIRD-PARTY-NOTICES.md`** 完整第三方许可声明
  - Feather Icons（MIT, Cole Bemis）与 Lucide（ISC）原文
  - 列明 `icons.js` 中图标几何数据的衍生来源
  - 记录产物内含 wot-design-uni 代码所触发的 MIT 署名义务
- README 新增「许可与合规」章节，含发布前检查清单与 CI 门禁命令

### 变更

- `cd-icon/icons.js` 头部补充第三方许可声明注释（发行时勿删）

### 说明

- 图标几何数据衍生自 Feather / Lucide 一事此前未署名，本次补齐。
  MIT 与 ISC 均允许商用与再分发，**唯一的硬性义务是保留版权与许可声明**，
  补齐后该项风险即告消除。
- 本框架未使用任何字体文件，无字体授权问题。

## 0.2.0（2026-10-01）

补齐通用组件层，图标体系完全去外部依赖。

### 新增

- **cd-icon** 自研矢量图标（72 个）
  - CSS mask + data URI SVG，零字体、零外链、零网络请求
  - 不复用 wd-icon 的原因：其在小程序端的 @font-face 指向 `at.alicdn.com`，需配域名白名单且弱网首屏闪空
  - 颜色跟随 `currentColor`，默认 1em 自动匹配所在文字字号
  - mask 长属性双前缀（标准 + -webkit-），规避简写重置 image 的坑
- **cd-input** 输入框
  - text / number / digit / idcard / password / textarea
  - clearable、字数统计、前后缀图标与插槽、尺寸、对齐
  - placeholder 颜色走 `placeholder-class`（原生组件解析不了 `var()`）
  - 密码态同时下发 `type` 与 `password`，两端各取所需
- **cd-card** 结构化卡片：header / extra / footer 插槽、hoverable、紧凑密度
- **cd-row / cd-col** 24 栅格
  - gutter 支持 `[水平, 垂直]`，负外扩与半间距在 JS 算好下发，不在 CSS 里做 calc 除法
  - col 宽度在编译期算成百分比（250 条静态规则），不赌小程序的 calc 求值
  - 响应式 span 用媒体查询类而非 JS 监听，首屏无布局跳动
- **cd-tabs** 标签页：line / card 两种视觉、badge、scrollable、sticky
  - 等宽模式指示器纯百分比定位，零测量；scrollable 才用 createSelectorQuery，失败降级
- **cd-form / cd-form-item** 表单校验
  - 规则支持 required / min / max / len / pattern / enum / 异步 validator
  - blur 与 change 双触发；change 采用「显式声明才逐字校验，否则仅纠错时复检」策略
  - 自增序号丢弃过期校验结果，规避异步规则后发先至
  - `validate()` 返回 boolean 而非 reject；失败时自动滚动到第一个出错项
  - 自定义控件回调 `onFieldBlur` / `onFieldChange` 即可接入，无需继承
- **utils/validate.js** 校验内核与常用正则（手机号 / 邮箱 / 身份证 / 金额等）
- **演示页** `pages/components/index.vue` 覆盖全部新组件

### 修复

- `cd-select` 接入表单校验链：选中值触发 change、面板关闭触发 blur，报错时触发区变红
- 输入框密码切换图标误渲染在所有类型上（缺少 `isPassword` 条件）

### 变更

- 工具类 `.cd-card` 更名为 `.cd-panel`，`cd-card` 类名让位给同名组件，避免两套 padding 叠加

## 0.1.0（2026-10-01）

首个骨架版本，确立三层架构与三端构建链路。

### 新增

- **设计变量层**
  - 三层令牌结构：原始令牌 → 语义令牌 → 组件令牌
  - 全部以 CSS 变量形式输出，支持运行期亮暗切换，无需重新编译
  - 双挂载点（`page` + `.cd-root`），兼顾全局兜底与作用域隔离
  - 所有组件一律写 `var(--cd-x, 兜底值)`，零 Provider 也能正确渲染
  - 单位统一为 `px`，不使用 `rpx`，从根上规避 PC 宽屏下的尺寸失控

- **平台适配层**
  - `usePlatform` 终端探测，编译期条件编译优先、运行时兜底
  - `useBreakpoint` 单例断点监听，组件数量与 resize 监听器数量解耦
  - `isPC` 三重判定（H5 平台 + 桌面断点 + 精确指针），避免误判
  - `useTheme` 主题状态单例，H5 端额外同步 `<html>` 类名
  - `useWotScope` 为被传送出 Provider 的弹层重建主题作用域

- **双形态组件**
  - `cd-config-provider` 品牌主题注入 + 尺寸密度统一
  - `cd-button` 单形态基准组件
  - `cd-dialog` 移动底部抽屉 / PC 居中模态，支持 Esc 与 beforeClose 拦截
  - `cd-select` 移动动作面板 / PC 下拉面板，支持键盘导航
  - `cd-table` 移动卡片列表 / PC 多列表格
  - `cd-pagination` 移动简化翻页 / PC 完整页码

- **主题桥接**
  - 将 CodeDogUI 令牌映射为 wot-design-uni 的 `--wot-*` 变量
  - 不改动上游一行代码、不重新编译其 SCSS，即可统一视觉

### 已知限制

- 弹层使用 `root-portal` 传送到 body，需自带主题作用域；若在子树内强制局部主题，该子树内的弹层不会跟随
- 表格未实现虚拟滚动与列宽拖拽，大数据量场景需自行接入
- 微信小程序建议使用 WebView 渲染；Skyline 引擎对 CSS 变量支持不完整
