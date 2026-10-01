---
title: 组件总览
---

# 组件总览

当前共 **62** 个组件，下表由源码自动生成（重跑gen-doc 刷新）。

## 基础设施

| 组件 | 说明 | Props | Events | Slots |
|---|---|---|---|---|
| [ConfigProvider 全局配置](/components/config-provider) | 所有页面的根节点。向下广播主题（亮/暗）、尺寸密度与圆角形态，并把 wot-design-uni… | 5 | 1 | 1 |
| [ToastHost 反馈宿主](/components/toast-host) | 命令式反馈服务在小程序端的渲染宿主。H5 端服务会自动挂载、无需手写；小程序必须在页面里放一次，… | 0 | 0 | 0 |

## 通用

| 组件 | 说明 | Props | Events | Slots |
|---|---|---|---|---|
| [Button 按钮](/components/button) | 自研而非二次封装：按钮没有遮罩、滚动锁、层级这些难点，自研能 100% 掌控设计语言。支持 5 … | 9 | 1 | 2 |
| [Icon 图标](/components/icon) | 内置 72 个 24×24 描边图标，CSS mask + data URI 实现，颜色跟随 c… | 6 | 1 | 0 |
| [Divider 分割线](/components/divider) | 水平/垂直双向、支持中间标题与虚线。用 border 画线，因此切换 dashed 只是换一个 … | 6 | 0 | 1 |

## 布局与容器

| 组件 | 说明 | Props | Events | Slots |
|---|---|---|---|---|
| [Row 行](/components/row) | 24 栅格的行容器，与 cd-col 配合使用。栅格宽度在编译期算成百分比，不赌小程序的 cal… | 6 | 0 | 1 |
| [Col 列](/components/col) | 24 栅格的列，支持 xs/sm/md/lg/xl 五档响应式 span 与 gutter 间距… | 4 | 0 | 1 |
| [Grid 宫格](/components/grid) | 等分宫格容器。列宽由 JS 预算成 `--cd-grid-item-w` 下发，边框采用「容器画… | 5 | 0 | 1 |
| [GridItem 宫格项](/components/grid-item) | 宫格中的一个单元格，支持图标、文字、角标（数字/红点）、showZero 与整格跳转（navig… | 10 | 1 | 4 |
| [Cell 单元格](/components/cell) | 一行一项的列表单元。arrow 是三态属性：不传时跟随 clickable——能点的格子才该有箭… | 12 | 1 | 6 |
| [CellGroup 单元格组](/components/cell-group) | 单元格容器，用相邻选择器统一补分隔线，支持 inset 卡片形态与分组标题。 | 4 | 0 | 3 |
| [Affix 图钉](/components/affix) | 页面滚动到指定位置后把内容钉住。实现是占位壳 + 固定内层：外层越过阈值后内层切 positio… | 4 | 1 | 1 |

## 表单与录入

| 组件 | 说明 | Props | Events | Slots |
|---|---|---|---|---|
| [Form 表单](/components/form) | 表单容器，向下广播 rules、label 布局与整表禁用。validate() 返回 bool… | 11 | 2 | 1 |
| [FormItem 表单项](/components/form-item) | 单个字段的上下文提供者：向下给控件传 value/disabled，向上回报 blur/chan… | 11 | 0 | 1 |
| [Input 输入框](/components/input) | 支持清除按钮、密码可见切换、字数统计与前后缀插槽；type="textarea" 时切换为多行形… | 20 | 7 | 2 |
| [SearchBar 搜索框](/components/search-bar) | 无边框药丸形搜索容器，右侧可挂动作位（取消/搜索）。已接入 useField 校验链。 | 15 | 7 | 2 |
| [Select 选择器](/components/select) | 移动端呈现底部动作面板、PC 呈现下拉面板。复用 wd-action-sheet 内核并做主题桥… | 10 | 5 | 0 |
| [Checkbox 复选框](/components/checkbox) | 独立使用时绑定布尔值，放进 cd-checkbox-group 后绑定数组的成员。校验由组统一触… | 8 | 2 | 1 |
| [CheckboxGroup 复选框组](/components/checkbox-group) | 多选容器，支持 button 分段控件形态。差异全在 CSS，圆点用 display:none … | 8 | 3 | 1 |
| [Radio 单选框](/components/radio) | 配合 cd-radio-group 使用，支持 radio 与 button（分段控件）两种形态… | 8 | 2 | 1 |
| [RadioGroup 单选组](/components/radio-group) | 单选容器，统一触发 change 并向下广播选中态与禁用。 | 7 | 2 | 1 |
| [Switch 开关](/components/switch) | 两种状态之间的即时切换，支持加载态与自定义选中/未选中文案。已接入表单校验。 | 13 | 3 | 0 |
| [Slider 滑块](/components/slider) | 支持单选与范围双滑块。按下时缓存轨道矩形避免每次取反算时读取；量化顺序是「先量化再钳制」；双滑块… | 10 | 3 | 0 |
| [Rate 评分](/components/rate) | 支持半星，实现方式是双层叠加 + 像素级裁切：上层已选中层按 value*(size+gap) … | 14 | 2 | 1 |
| [Stepper 步进器](/components/stepper) | 按住连加、边界钳制并抛出 overlimit。同时绑 touchstart 与 mousedow… | 13 | 5 | 0 |
| [Upload 上传](/components/upload) | 受控优先——列表真值在 modelValue，可用 customRequest 完全接管上传接口… | 14 | 8 | 1 |
| [DatePicker 日期选择](/components/date-picker) | 移动端走系统原生滚轮、PC 端自研日历面板——自研滚轮要处理 scroll-top 回环与惯性判… | 10 | 3 | 0 |
| [TimePicker 时间选择](/components/time-picker) | 移动端原生、PC 双列（时/分）。刻意不做秒。 | 9 | 3 | 0 |

## 数据展示

| 组件 | 说明 | Props | Events | Slots |
|---|---|---|---|---|
| [Avatar 头像](/components/avatar) | 图片 → 插槽 → 图标 → 文字的降级链，任何一级失败都不会出现破图。无底色时用稳定哈希生成背… | 10 | 2 | 1 |
| [Badge 徽标](/components/badge) | 无插槽时是独立标签，有插槽时自动变成角标。支持数字封顶（99+）与小红点形态。 | 9 | 1 | 1 |
| [Card 卡片](/components/card) | 通用容器，提供 header / extra / footer 插槽与 hoverable。刻意… | 9 | 1 | 4 |
| [Table 表格](/components/table) | PC 端多列数据表，移动端自动降级为卡片列表（首列升格为卡片标题）。未实现虚拟滚动与列宽拖拽，大… | 9 | 1 | 0 |
| [Tag 标签](/components/tag) | type 只声明颜色、形态决定用法，因此新增语义色只需两行 CSS。尺寸类名统一带 size- … | 10 | 2 | 1 |
| [Progress 进度条](/components/progress) | 线形与环形两种形态。环形用 conic-gradient + mask 实现，刻意不用 canv… | 13 | 0 | 1 |
| [Collapse 折叠面板](/components/collapse) | 容器持有展开状态，accordion 模式下 v-model 为单值、否则为数组。 | 5 | 2 | 1 |
| [CollapseItem 折叠项](/components/collapse-item) | 高度动画走实测道路：用 createSelectorQuery 量取内容真实高度后以 CSS 变… | 8 | 1 | 5 |
| [Timeline 时间线](/components/timeline) | 按时间顺序展示事件流。reverse 通过 flex-direction: column-rev… | 3 | 0 | 1 |
| [TimelineItem 时间线项](/components/timeline-item) | 单个时间节点，支持实心/空心/大号圆点与自定义 dot 插槽。首尾的引线会被替换为透明占位。 | 9 | 0 | 3 |
| [Image 图片](/components/image) | 统一封装 loading / loaded / error 三态，并内置 uni 的 image… | 15 | 3 | 2 |
| [CountDown 倒计时](/components/count-down) | 锚定结束时间戳而非递减计数：每次都重算 endAt - Date.now()，定时器只负责「多久… | 6 | 2 | 1 |
| [CountTo 数字滚动](/components/count-to) | 数字从起始值缓动到目标值。内部只存裸数字，千分位在格式化阶段用 split/join 添加——避… | 11 | 3 | 1 |
| [Empty 空状态](/components/empty) | 固化了 5 种高频空状态预设（无数据/无搜索结果/加载失败/无网络/无权限），避免每次业务方各写… | 7 | 0 | 3 |
| [Skeleton 骨架屏](/components/skeleton) | 加载占位，最后一行默认收窄 60% 让轮廓更像真实文本。暗色下必须显式重定义块色——亮色比背景深… | 11 | 0 | 1 |
| [Result 结果页](/components/result) | 操作结果反馈页，内置成功/失败预设，提供 icon、title、desc、extra、actio… | 7 | 0 | 5 |

## 导航

| 组件 | 说明 | Props | Events | Slots |
|---|---|---|---|---|
| [Tabs 标签页](/components/tabs) | line / card 两种视觉，支持 badge 与横向滚动。等宽模式的指示器用纯百分比定位（… | 7 | 3 | 1 |
| [Pagination 分页](/components/pagination) | 移动端只显示上一页/下一页，PC 显示完整页码。页码数量恒定，翻到末尾不会忽然变窄导致按钮跳动。 | 10 | 3 | 0 |
| [Steps 步骤条](/components/steps) | 横向/纵向流程指引。序号由容器注册表派生——子项不接受业务传 index，避免增删步骤时序号错位… | 6 | 0 | 1 |
| [Step 步骤](/components/step) | 单个步骤节点。连线配色按「左边那一步」计算：前置线 index <= current、后置线 i… | 6 | 0 | 3 |
| [Breadcrumb 面包屑](/components/breadcrumb) | 层级位置导航。容器判定最后一项并让它不可点击、颜色更重。 | 4 | 0 | 1 |
| [BreadcrumbItem 面包屑项](/components/breadcrumb-item) | 面包屑中的一环，to 属性跳转走 navigateTo，失败自动降级 switchTab。 | 4 | 1 | 2 |
| [Dropdown 下拉菜单](/components/dropdown) | 命令型动作菜单，与 cd-select 的表单语义刻意分离。PC 端支持 hover/click… | 6 | 2 | 1 |
| [Fab 悬浮按钮](/components/fab) | 可拖拽的悬浮操作按钮。H5 通过 document 监听鼠标实现拖拽，小程序用 touch 事件… | 13 | 3 | 1 |
| [BackTop 回到顶部](/components/backtop) | 滚动超过 visibility-height 后出现的回顶按钮，与 cd-affix 共用 us… | 12 | 1 | 1 |

## 反馈与浮层

| 组件 | 说明 | Props | Events | Slots |
|---|---|---|---|---|
| [Alert 提示条](/components/alert) | 静态区域里的常驻提示。四种语义色、支持描边、通铺 banner 与右侧操作区。 | 11 | 2 | 4 |
| [Dialog 对话框](/components/dialog) | 双形态弹窗：移动端从底部升起成抽屉、PC 居中模态。复用 wd-popup 内核，支持 Esc … | 16 | 5 | 3 |
| [Drawer 抽屉](/components/drawer) | 四向抽屉，auto 模式下移动端从底部、PC 从右侧。左右方向时内层必须显式给 height:1… | 10 | 3 | 3 |
| [Loading 加载](/components/loading) | 加载指示器，spinner 形态复用 cd-icon 的 loader 图标加旋转动画。 | 9 | 0 | 1 |
| [NoticeBar 通知栏](/components/notice-bar) | 滚动通告。跑马灯用 padding-left:100% + translate3d(-100%)… | 12 | 3 | 2 |
| [ActionSheet 动作面板](/components/action-sheet) | 移动端底部动作面板，支持 disabled / danger / description 三种行… | 11 | 5 | 3 |
| [PopConfirm 气泡确认](/components/popconfirm) | 轻量二次确认气泡，复用 useFloating 定位内核。宽度要用独立的 computed 拼到… | 13 | 5 | 3 |
| [Popover 气泡卡片](/components/popover) | 可承载任意内容的气泡。面板内点击不自动关闭，支持 Esc 与 v-model 外部受控。 | 7 | 3 | 2 |
| [Tooltip 文字提示](/components/tooltip) | 纯文字气泡。PC 端 hover 触发且进出都带延迟（防鼠标轨迹穿越时闪烁），移动端长按或点击触… | 7 | 1 | 2 |
