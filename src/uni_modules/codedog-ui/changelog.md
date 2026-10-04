## 0.5.3（2026-10-04）

第七批：补上「Schema 驱动」这一层，并把几类会**让小程序直接编译中断**的写法固化进门禁；
同时修掉一个**会让 npm 使用者 H5 页面整页打不开**的构建缺陷；并按全库 80 个组件的
touch 绑定清单，把 4 个「桌面浏览器下完全不可用」的交互组件补齐。
组件总数 67 → 80。

### 新增组件（13 个）

- **cd-form-render** Schema 表单引擎。给一份字段描述数组和一个对象，自动渲染整张表单：
  内建 12 种控件（input / select / switch / checkbox / radio / date / time / slider /
  rate / stepper / upload / text），支持 `visible` / `disabled` 联动（布尔或 `(model) => boolean`）、
  栅格分列、默认值注入；校验直接复用 `cd-form` 那套规则体系，
  扩展自定义控件走 `widget` 作用域插槽。
  刻意**不用** `<component :is>` —— mp-weixin 编译器在编译期就拒绝动态组件
  （`X_DYNAMIC_COMPONENT_NOT_SUPPORTED`），改为「v-for 遍历 schema + 每条字段内 v-if 枚举控件」，
  四端统一，不在 H5 端单独走动态组件以免两端行为分叉

**通用（2 个）**

- **cd-typing** 打字机。逐字输出的流式文本，给 AI 回复与引导文案用。调度用 `setTimeout` 链而非 `setInterval`（切后台回来不会一次性补一大段），推进用索引而非字符串拼接（中途换文案不会新旧串味）
- **cd-watermark** 水印。纯 `text` 节点平铺，不用 canvas 生成背景图。画布放大倍数由旋转角算出来而不是硬写 1.5 —— 宽屏上能少铺近一半节点。整层 `pointer-events:none`，绝不会挡住底下的操作

**表单与录入（3 个）**

- **cd-color-picker** 颜色选择器。HSV 面板 + 色相条 + 透明度，纯 view 实现不用 canvas。输入与面板双向驱动，粘贴任意合法色值都能解析
- **cd-signature** 手写签名。笔画拼成 SVG 再以内联 data URI 交给背景图渲染（与 `cd-icon` 同一套路），不用 canvas 因此四端一致。已完成笔画与正在画的一笔分成两组节点，移动时只重建后者
- **cd-transfer** 穿梭框。左右两栏 + 搜索过滤 + 全选。禁用项不可移，`direction` 可调（窄屏自动竖排）

**数据展示（3 个）**

- **cd-qrcode** 二维码。编码核心自研零依赖（版本 1~10 / L M Q H / 字节模式），与 npm `qrcode` 包逐位比对通过。渲染是纯 view 节点且坐标全部取整，不会出现 1px 白缝
- **cd-tree** 树形控件。勾选走「向下全量 + 向上回算」两趟，父子联动带半选态；`checkStrictly` 打开时父子各算各的。扁平渲染而非嵌套递归，节点再多也不会爆栈
- **cd-descriptions** 描述列表。一份 `items` 渲染整张详情表，支持列数、跨列与横竖两种排布。比手写一堆 `cell` 少 80% 的模板代码

**导航（3 个）**

- **cd-navbar** 导航栏。状态栏留白由 `statusBar` 开关 × 实测高度决定，拿不到就退回 0；标题绝对居中，左右内容不等长也不偏心
- **cd-tabbar** 底部标签栏。支持徽标与小红点，`fixed` 时自动等高占位，`safeArea` 走小程序安全区。选中值可以是 `value` 也可以是下标
- **cd-index-bar** 字母索引栏。只做「手指落在第几个字母」，结果 emit 出去由业务用 `scroll-into-view` 自己跳 —— 锚点滚动要遍历业务列表的 `offsetTop`，组件既量不准也管不动。整条 `pointer-events:none`，只有字母本身可点

**反馈与浮层（1 个）**

- **cd-guide** 用户指引。分步遮罩引导。遮罩用 `box-shadow` 挖洞而不是四块挡板拼，圆角与位置动画都只需改一个节点；`placement` 支持 `auto`，目标下方空间不足自动翻到上方

### 修复

| 项 | 问题 | 改法 |
|---|---|---|
| `service/index.js`（**高危**） | 命令式反馈服务对宿主组件用相对路径动态 `import('../components/…')`。包被 npm 装进业务工程后（模块位于 `node_modules/`），构建产出的模块地址是 `..-node_modules-codedog-ui-components-cd-toast-host-cd-toast-host.js` —— **既不是合法相对路径也不是合法裸包名**，浏览器报 `Failed to resolve module specifier`；该 chunk 还会被写进所在页面的依赖预载表，导致**整页加载失败**（uni H5 表现为「连接服务器超时，点击屏幕重试」）。源码仓库内开发时模块在 `src/uni_modules/` 下、路径合法，因此长期未被发现 | 宿主组件改为**静态导入**。代价是宿主随包入口进入业务产物；二者体量有限且反馈服务的宿主几乎人人用得到，取「一定能跑」。`playground/mp-preview` 已撤掉原先的 `manualChunks` 绕行方案，改由它充当 npm 消费者视角的回归判据 |
| `cd-col`（**高危**） | 小程序端栅格整体塌陷：12 个栅格实测宽度只有 16~20px，文字挤成竖排。根因是小程序会给自定义组件套一层宿主节点，`width: 33.33%` 写在内部根节点上、宿主却没有宽度，百分比解析成 0；H5 没有这层宿主所以看起来全对 | 该组件 `options` 加 `virtualHost: true`。只对这一处加 —— `virtualHost` 会丢弃父级写在组件标签上的 `class`/`style`，全库加会让 `<cd-card class="section">` 这类常见写法失效 |
| `cd-divider` / `cd-avatar` / `cd-badge` | 小程序端运行时报 `TypeError: i.default is not a function`。三处用 `slots.default() && slots.default().length` 判空，而小程序端 `slots.default` 存在但不是函数（H5 端是函数，故不报错） | 改为只判存在性 `!!slots.default`（与 wot-design-uni 全库 80 处写法一致）；外加全库扫描确认再无真实调用 |
| `cd-step` | 窄屏下标题与描述字号过大，文字挤到第二行 | 新增 `--m` 断点类，字号走 `--cd-step-title-font-size-m` / `--cd-step-desc-font-size-m` 令牌。不用 `@media` —— 实测 uni 构建链会丢掉组件样式块里的媒体查询 |
| `scripts/check-hard-rules.mjs` | 只扫组件目录，演示页里写了 WXSS 不支持的写法查不出来（曾导致微信小程序编译中断报 `error at token *`） | 扩展 `DEMO_DIRS`，演示页同样过跨端 CSS 硬约束 |
| `scripts/check-hard-rules.mjs` | 没有拦截动态组件 / `v-is` / `v-on="对象"` | 新增 3 条规则。三条都是 mp-weixin **编译期直接报错**，不是运行时降级：`<component is=""/> is not supported`、`v-is not supported`、`v-on="" is not supported` |
| `scripts/check-hard-rules.mjs` | 模板块没剥 HTML 注释，注释里的示例代码会被判违规 | 新增 `stripHtmlComments()`，只剥普通注释，保留 `<!-- #ifdef -->` 条件编译块内部继续检查 |
| `scripts/gen-component-docs.mjs` | 演示页源码混着 CRLF（navigation 页 421 行里 405 行是 CRLF），行尾被原样带进产物，文档出现 CRLF/LF 混排、diff 整片重写 | 新增 `writeLf()`，产物统一归一化成 LF |
| `scripts/gen-component-docs.mjs` | 分区块外层 `cd-card` 自带的 `<template #extra>` 没被剥掉，残留在片段开头，`isStandalone()` 据此误判「这是宿主插槽内容」而**整段丢弃**。后果：`cd-row / cd-col` 区块（唯一以 `#extra` 开头）被丢，row / col 失去唯一的权威用例，退化成展示 Input / Card 的切片 —— **线上文档 `docs/components/col.md`、`row.md` 可见** | `dedent()` 新增 `stripWrapperSlots()`，剥掉处于最小缩进层级（即卡片直接子节点）的 `<template #xxx>` 块；剥完为空则保留原样，仍交给 `isStandalone()` 按老规则拒掉，不产生空预览 |
| `scripts/gen-component-docs.mjs` | 演示片段选取只做 `slice(0, 2)`，兜底片段与点名片段抢位置：cd-progress 的第二个预览是站点 Hero（一排按钮与标签），cd-icon 两个预览内容完全相同，cd-button 第二个预览挂着整张必填表单（只因提交按钮是 cd-button） | 选取策略改为：**点名片段优先**（分区注释 / 卡片标题明确点名的才算），点名集合为空才回退兜底且**最多 1 条**；外加「组件只出现在别人插槽里」的片段一律不采用（`tagOutsideSlots()`）；相同代码去重
| `cd-signature` / `cd-color-picker` | 桌面浏览器**完全没法用**：组件只绑了 `touchstart/touchmove/touchend`，而桌面端没有 touch 事件 —— 签名板上画不出任何笔画，取色面板与色相条拖了没反应。DOM 结构与小程序端一致，「看」起来完全正常，只有真操作才暴露 | 补 `mousedown/mousemove/mouseup/mouseleave` 一套；触点读取改成「有 `touches` 用 `touches[0]`，否则用事件自身」（两者 `clientX/clientY` 字段名一致）。另加**按下标志位**：`move` 处理必须处于按下态才响应，否则鼠标只是从组件上划过就会被当成拖动 |
| `cd-index-bar` | 同上根因：桌面端只能单击单个字母，**沿索引栏拖动失效**（拖动才是索引栏最主要的操作方式） | 同上一套鼠标事件；`pointY()` 归一化触点；每次按下重新量一次列表顶边（页面滚动过也能算准，且不等异步回调，用缓存值避免形体差一格）。`onMove` 加按下守卫 —— 索引栏是通栏布局，鼠标日常会划过它，不守卫会带着业务列表乱跳 |
| `cd-image-preview` | 桌面端只能「打开 + 点空白关闭」，**拖动翻页 / 缩放 / 平移**三项全无 | `pointsOf()` 归一化触点（鼠标事件自身视作一个单指触点），一套手势同时服务触摸与鼠标；新增**滚轮缩放**（向上放大、向下缩小，按光标位置做焦点补偿，让光标下那一小片始终停在原处）。**注意**：滚轮**不能**写在模板的 `@wheel` 上 —— `uni-view` 不透传该事件，产物里 handler 在但事件永远不上来；改为 `window` 原生监听（`passive:false` 挡住背景滚动），`close()` 成对解绑 |
| `cd-guide` | H5 端高亮框整体偏移 44~50px（小程序端正常）。根因是 `boundingClientRect()` 在 H5 返回页面内容区坐标、少一条原生导航头高；先前 `.in(instance)` 的写法也不是主因 | 给根节点加本次实例唯一 class，量目标时先量自身根节点再取差值，**两端同坐标系求差即自动抵消**头部偏移；根节点还没上屏时按 40ms 重试 4 次。另修：气泡最小宽 240px 并夹取左边界（右侧目标时气泡过窄会把上一步/下一步按钮挤到换行）、箭头对准目标中心（原来写死 `left:50%`，目标不在中间时箭头指偏） |
| `cd-transfer` / 索引栏演示页 | `cd-transfer` 标题可换行，窄屏（面板约 130px）时两栏布局破版；演示页索引字母压住列表文字 | 标题 `white-space:nowrap` + 省略号；演示页列表容器补 `padding-right:28px` |
| `cd-tabs`（**页面级破版**） | 等宽模式下每项实占宽超出容器，四个标签就把 375 视口的页面撑到能横向滚动（实测每项右边界 445 / 441 > 375）。根因是 uni 的 `view` 默认 `content-box`，而等宽模式给的是 `width:25%` + 左右 12px padding —— content-box 下实占 = 25% + 24px | `.cd-tabs__item` 显式声明 `box-sizing: border-box`。**同类隐患已全库扫描**：百分比宽度 + 水平内边距的选择器共 11 处，其余 10 处或因父级是 flex 会被压缩、或实测不越界，本次未一并改动以免扩散影响面 |
| `.workbuddy/tmp/shot-all-h5.mjs` | 原先的破版审计只抽 14 页（12 个重点页 + 首页两页），**另外 68 个组件页从未进过发布门禁** —— `cd-tabs` 就是这样漏到今天的 | 新增全量审计脚本：主包 + 7 个子包共 **82 页**逐一重载测量，出现异常才落截图，正常页不产出文件；演示里故意指向不存在域名的 404 用例（`this-host-does-not-exist.invalid`）不计入报错。当前结论：**82 页，溢出 0 / 报错 0 / 白屏 0** |
| `.workbuddy/tmp/shot-preview-h5.mjs` | 全页截图脚本长期稳定报「溢出=4」（watermark 页 22），被当成排版问题查过好几轮 | 两条都是**假阳性**，且都补了注释说明成因：① uni-app H5 会在 `body` 末尾注入 4 个 `visibility:hidden`、飘在视口上方的 400×400 空壳节点 → 用 `checkVisibility()` 跳过不可见节点；② `.cd-watermark` 自身 `overflow:hidden`，里面的重复格子天然画到容器外 → 向上遍历祖先，被裁剪的子节点跳过。遍历**到 body 为止**：uni-app 给 `body` 挂的 `overflow-x:hidden` 会传播到视口，把它当裁剪祖先会把所有真破版判成安全（已加反向自检：注入 640px 元素仍报溢出=1，注入被 `overflow:hidden` 包住的 640px 子元素报 0） |

### 其他

- **对外数字口径复核**（每个都写明计数器定义，保证日后能复现）：

  | 数字 | 值 | 怎么数出来的 |
  |---|---|---|
  | 组件 | **80** | `components/` 下 `cd-` 目录数（前一版对外文案仍写着 67 / 68 / 62 三种） |
  | 设计令牌 | **320** | 沿用 0.5.2 的定义：`styles/tokens.scss` 中 `--cd-*` 的**唯一定义名**（此前 319） |
  | 图标 | **73** | `cd-icon/icons.js` 的 `ICON_NAMES.length`（实跑导入取值，不用正则） |
  | 复用 `wot-design-uni` 的组件 | **5** | 模板里出现 `<wd-*` 的组件目录：`cd-select` / `cd-dialog` / `cd-drawer` / `cd-action-sheet` / `cd-config-provider`。对外文案此前写「8 个」，按任何口径都数不出来，本次一并订正 |

  本次新增的组件里有 12 个在 changelog 里从未登记过（只有肉眼可见的事实），一并补齐。

### 架构结论（实测，非查资料）

在 `playground/mp-preview` 建探针页构建 mp-weixin，读产物 wxml / js 反查编译器行为：

| 能力 | mp-weixin | 证据 |
|---|---|---|
| `<component :is>` | 编译期报错 | `X_DYNAMIC_COMPONENT_NOT_SUPPORTED` |
| `v-is` | 编译期报错 | `X_V_IS_NOT_SUPPORTED` |
| `v-on="{ click: fn }"` | 编译期报错 | `X_V_ON_NO_ARGUMENT` |
| `v-bind="propsObj"` | 可用 | 产物 `u-p="{{a}}"`，JS `e.p({...t})` |
| `v-for` + `v-bind="item.props"` | 可用 | 产物 JS `e.p({...l.props})` |
| 枚举 `v-if` / `v-else-if` | 可用 | 产物 `wx:if` / `wx:elif` / `wx:else` |
| 作用域插槽（含解构） | 可用 | 产物 `u-s="{{['suffix']}}"`，JS `e.w(...)` |

同一份含 `<component :is>` 的代码 `build:h5` 通过 —— 该限制是 mp 编译器专属，不是全平台限制。

## 0.5.2（2026-10-02）

第六批：补上「选择链路」与「图集」两块，并把一轮全库审查里查出的问题一并修掉。
组件总数 62 → 67。

### 新增组件（5 个）

- **cd-calendar** 日历面板。常驻形态（不是弹层），single / multiple / range 三种模式；
  `marks` 支持打点与底部小字，`formatter` 可拦截单个格子的文案与可选性。
  与 `cd-date-picker` 的分工：后者是「点一下选完就走」的录入控件，
  前者是「要一直看着月份做安排」的展示面板
- **cd-picker** 通用多列选择器。`cascade` 显式区分「列数组的数组」与「树」两种数据形态；
  选中态与提交态分离（点确定才落到 `modelValue`）；级联时改动上游会截断下游，
  不会留下「江苏 / 西湖区」这种不存在的组合。列用 `scroll-view` 受控定位而非原生
  `picker-view` —— 后者在 H5 与小程序上的手感与样式差异过大且几乎不可控
- **cd-cascader** 级联选择。表单字段形态，点选即提交（没有确定按钮）；
  面板多列并排而不是一级一屏，一眼能看到完整路径；
  `fieldNames` 做字段映射（后端字段名叫 `areaName` / `subList` 也不用先转换数据）；
  `checkStrictly` 控制父级是否可选，`emitPath` 决定回传整条路径还是末级值
- **cd-swiper** 轮播。底层是 uni 原生 `swiper`（手感与惯性由端上保证），
  上层统一指示点样式并给桌面形态补一组左右翻页箭头；
  `list` 既接受 `{ image, text }` 也接受纯图片地址；
  页面切到后台时自动暂停自动播放
- **cd-image-preview** 图片预览。声明式用 `v-model` 开关，
  命令式直接 `previewImage({ urls, current })`（H5 动态挂载宿主、小程序降级
  `uni.previewImage`）；手势滑动翻页、双指与滚轮缩放、循环与角标计数

### 修复

**致命项（6 项）**

| 项 | 问题 | 改法 |
|---|---|---|
| `cd-form-item` | id 用模块级 `let uid = 0`，被编译进 `setup()` 体内，每实例重置 → 同页面多个表单项 id 撞车 | 改用 `getCurrentInstance().uid` |
| `cd-form-item` | 校验回调过期时仍 `return true`，把上一次的失败结果当成通过 | 过期分支改为 `return validateState.value !== 'error'` |
| `cd-form` | `validate` 无防重入，并发调用时后一次会打断前一次 | 引入 `enqueue` 串行链，`validate` / `validateField` 排队执行 |
| `service/state.js` | toast 宿主卸载后 `hostReady` 不复原，多个宿主时会误判为「无宿主」 | 新增 `acquireHost` / `releaseHost` 引用计数 |
| `service/index.js` | loading 的两条通道（原生 / 宿主）互相不匹配，会出现「关不掉」 | 记录 `loadingChannel`，关闭时按显示时那条通道配对 |
| `utils/date.js` | 日期正则没锚到末尾且不支持可选时间部分，`'2024-05-06 13:45'` 被解析成 00:00 | 正则锚末尾并支持可选时分秒 |

**严重项（13 项）**

- `cd-card` 根节点漏绑 `@click`，`clickable` 传了也不触发
- `cd-loading` 的 spinner 漏传 `spin`，转圈动画不动
- `cd-avatar` 换 `src` 后不重置 `hasError`，第二次加载失败会一直显示占位
- `cd-tag` 关闭叉号漏 `.stop`，一次点击同时触发 `close` 与 `click`
- `cd-popover` / `cd-dropdown` / `cd-popconfirm` / `cd-tooltip` 的 shield 漏 `.stop`，点击穿透到下层
- `use-floating` 面板测量用错作用域（`usePageScope=true`），小程序端恒测不到面板尺寸，气泡位置必偏；
  且 `degraded` 一旦置 true 再也不复位，一次测量失败会让之后每次都走降级定位
- Esc 关闭没有层级概念，多层浮层叠开时按一次全关 —— 新增 `composables/use-esc-stack.js`，
  dialog / drawer / dropdown 统一走层级栈，Esc 只关最上面一层
- `cd-tabs` 的 uid 同致命项第 1 条，改用 `instance.uid`；另补对 `props.tabs` 与
  `props.tabs.length` 的 watch，数据是异步回来时指示器会重测
- `cd-steps` / `cd-timeline` / `cd-breadcrumb` 的子项注册顺序按「挂载顺序」而非「模板顺序」，
  动态插入子项会错位 —— 新增 `utils/slot-order.js`，在 mounted 与 updated 后按 slot 的 vnode 顺序校正
- `index.js` 的注入键只导出了 8 个，`index.d.ts` 上写着的另外 7 个运行时是 `undefined`
  （类型不报错、一跑就炸），已全部补齐

**第二轮系统复查（59 项）**

全库按「不同场景 / 不同环境下可能产生的 bug」做了完整一轮：端差异、表单内、数据边界、
异步、并发时序、动态增减子项、暗色主题、内存泄漏、令牌完整性。由三路并行修完，
并做了源码抽查 —— 抽查发现「自报已修」不等于已修，因此逐条核对落点。

| 组 | 条数 | 覆盖 |
|---|---|---|
| 表单 | 26 | date-picker / time-picker 的 `isDisabled`、select 的 `unbindKeyboard`、stepper 的 blur 顺序、upload 的 key 与 autoUpload、switch 的 pending 锁、slider 的 min>max 与 NaN、picker 的 scrollTops 归零、cascader 的 options watch、calendar 的 useField 与 weekStart、8 个组件的 error 态 |
| 浮层与主题 | 16 | use-floating 的右侧翻转与超高面板、popover / popconfirm / image-preview 走 useEscLayer、action-sheet 可滚、config-provider 受控回写、toast-host 的 touchmove、dialog / drawer 的 Esc 入栈时机、暗色令牌补齐 |
| 展示导航与基础 | 17 | count-down 的异步 time、collapse 的 name 唯一化、swiper 非循环回跳、pagination 的页码窗口算法、table 的单元格省略号、fab 的监听泄漏、tabs 的空数组指示器、pagination 的 current 越界、progress 的低百分比降级、affix 的 rafId、col 的 0~24 钳制、row 的负 gutter |

**第二轮单列的三条（自报已修但实际未修 / 只改了代码没跑）**

- **`utils/slot-order.js` 原来的修复根本没生效**。`slots.default()` 每次新建 vnode、
  `.component` 恒为 `null`，`ordered` 恒空 → 一次都没重排过；改读 `instance.subTree` 后
  又因为 uni 的 `<view>` 是组件 vnode（`children` 是 slot 函数）仍取不到 uid；
  且只靠 `onUpdated` 触发也不行 —— 插槽稳定且 props 未变时 Vue 不更新父容器，`onUpdated` 不触发。
  现改为：遍历遇到组件节点下钻 `component.subTree`，触发点放到子项 `register` / `unregister`
  的 `nextTick`，并把三处重复逻辑收敛为 `createOrderRegistry()`
- **`cd-badge`** `value` 为数字字符串时不走 `max` 裁剪、不受 `showZero` 约束（`'200'` 显示成 `200`）。
  现归一化 `numericValue`，`max` 另做有限性校验（`max` 传 `NaN` 不会显示成 `NaN+`）
- **`cd-count-down`** `format` 会吃掉字面字母（`'Days: D'` → `'5ay12:'`）。现改为逐字符扫描器，
  并引入 `[...]` 字面段约定：`[Ends in] HH:mm:ss`

### 其他

- 补 `passwordMixed` 的类型声明，导出面「运行时 vs 类型声明」双向差集归零（74 / 74）
- 修掉两处跨端硬约束违规：`cd-form-item` 与 `cd-table` 用了小程序 WXSS 支持不可靠的
  `:last-child`，改为相邻兄弟选择器 `A + B`
- 图标 72 → 73 个；组件 62 → 67 个
- **数字口径修正**：设计令牌此前记为 342 / 348，按任何口径都复现不出来。
  现按统一口径重测并写明定义 —— `styles/tokens.scss` 中 `--cd-*` 的唯一定义名 **319** 个，
  暗色段覆盖其中 64 个（暗色无独有令牌）

### 本版本的验证边界

- 已实测：67 个组件逐个以最小可用配置在真实 Chromium 里挂载一次（控制台 error 0 / warning 0）；
  H5 演示站 10 条路由 × 移动端 390 / PC 1440 共 20 个页面全渲染无报错；
  动态子项序号 6 条断言；Node 单测 30 条（slot-order 5 / badge 12 / count-down 13）
- **未实测**：小程序真机、Electron / App 端、`use-floating` 的 MP 跟随、
  以及并发时序类（`validate` 防重入、多层浮层 Esc）—— 这几项只有代码级修正

## 0.5.1（2026-10-01）

文档修订，无代码变更。

- README 末尾的联系方式区改写：**有问题直接找我们** —— 按场景把反馈渠道分流为
  Bug / 咨询 / 商务 / 微信四条路径，降低反馈门槛
- 联系方式统一收效到一处：官网 <https://ui.codedog.tech> · Issues · 邮箱 codedog.tech@icloud.com · 微信 penngu777

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
