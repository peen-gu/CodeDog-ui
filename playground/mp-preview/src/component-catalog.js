/**
 * component-catalog.js —— 演示应用的组件目录
 * -------------------------------------------------------------------------------
 * ⚠️ 本文件由 scripts/gen-mp-preview-pages.mjs 生成，手改会被覆盖。
 * 数据源：scripts/component-meta.json（分类 / 中文名 / 描述 / 关联组件）
 */
export const categories = [
  {
    "id": "infrastructure",
    "title": "基础设施",
    "icon": "grid",
    "items": [
      "config-provider",
      "toast-host"
    ]
  },
  {
    "id": "general",
    "title": "通用",
    "icon": "tag",
    "items": [
      "button",
      "icon",
      "divider",
      "typing",
      "watermark"
    ]
  },
  {
    "id": "layout",
    "title": "布局与容器",
    "icon": "menu",
    "items": [
      "row",
      "col",
      "grid",
      "grid-item",
      "cell",
      "cell-group",
      "affix"
    ]
  },
  {
    "id": "form",
    "title": "表单与录入",
    "icon": "edit",
    "items": [
      "form",
      "form-item",
      "form-render",
      "input",
      "search-bar",
      "select",
      "checkbox",
      "checkbox-group",
      "radio",
      "radio-group",
      "switch",
      "slider",
      "rate",
      "stepper",
      "upload",
      "date-picker",
      "time-picker",
      "calendar",
      "picker",
      "cascader",
      "color-picker",
      "transfer",
      "signature"
    ]
  },
  {
    "id": "data",
    "title": "数据展示",
    "icon": "chart",
    "items": [
      "avatar",
      "badge",
      "card",
      "table",
      "tag",
      "progress",
      "collapse",
      "collapse-item",
      "timeline",
      "timeline-item",
      "image",
      "image-preview",
      "swiper",
      "count-down",
      "count-to",
      "empty",
      "skeleton",
      "result",
      "tree",
      "descriptions",
      "qrcode"
    ]
  },
  {
    "id": "navigation",
    "title": "导航",
    "icon": "location",
    "items": [
      "tabs",
      "pagination",
      "steps",
      "step",
      "breadcrumb",
      "breadcrumb-item",
      "dropdown",
      "fab",
      "backtop",
      "navbar",
      "tabbar",
      "index-bar"
    ]
  },
  {
    "id": "feedback",
    "title": "反馈与浮层",
    "icon": "bell",
    "items": [
      "alert",
      "dialog",
      "drawer",
      "loading",
      "notice-bar",
      "action-sheet",
      "popconfirm",
      "popover",
      "tooltip",
      "guide"
    ]
  }
]

export const components = [
  {
    "name": "config-provider",
    "title": "ConfigProvider 全局配置"
  },
  {
    "name": "toast-host",
    "title": "ToastHost 反馈宿主"
  },
  {
    "name": "button",
    "title": "Button 按钮"
  },
  {
    "name": "icon",
    "title": "Icon 图标"
  },
  {
    "name": "divider",
    "title": "Divider 分割线"
  },
  {
    "name": "typing",
    "title": "Typing 打字机"
  },
  {
    "name": "watermark",
    "title": "Watermark 水印"
  },
  {
    "name": "row",
    "title": "Row 行"
  },
  {
    "name": "col",
    "title": "Col 列"
  },
  {
    "name": "grid",
    "title": "Grid 宫格"
  },
  {
    "name": "grid-item",
    "title": "GridItem 宫格项"
  },
  {
    "name": "cell",
    "title": "Cell 单元格"
  },
  {
    "name": "cell-group",
    "title": "CellGroup 单元格组"
  },
  {
    "name": "affix",
    "title": "Affix 图钉"
  },
  {
    "name": "form",
    "title": "Form 表单"
  },
  {
    "name": "form-item",
    "title": "FormItem 表单项"
  },
  {
    "name": "form-render",
    "title": "FormRender Schema 表单引擎"
  },
  {
    "name": "input",
    "title": "Input 输入框"
  },
  {
    "name": "search-bar",
    "title": "SearchBar 搜索框"
  },
  {
    "name": "select",
    "title": "Select 选择器"
  },
  {
    "name": "checkbox",
    "title": "Checkbox 复选框"
  },
  {
    "name": "checkbox-group",
    "title": "CheckboxGroup 复选框组"
  },
  {
    "name": "radio",
    "title": "Radio 单选框"
  },
  {
    "name": "radio-group",
    "title": "RadioGroup 单选组"
  },
  {
    "name": "switch",
    "title": "Switch 开关"
  },
  {
    "name": "slider",
    "title": "Slider 滑块"
  },
  {
    "name": "rate",
    "title": "Rate 评分"
  },
  {
    "name": "stepper",
    "title": "Stepper 步进器"
  },
  {
    "name": "upload",
    "title": "Upload 上传"
  },
  {
    "name": "date-picker",
    "title": "DatePicker 日期选择"
  },
  {
    "name": "time-picker",
    "title": "TimePicker 时间选择"
  },
  {
    "name": "calendar",
    "title": "Calendar 日历"
  },
  {
    "name": "picker",
    "title": "Picker 多列选择器"
  },
  {
    "name": "cascader",
    "title": "Cascader 级联选择"
  },
  {
    "name": "color-picker",
    "title": "ColorPicker 颜色选择器"
  },
  {
    "name": "transfer",
    "title": "Transfer 穿梭框"
  },
  {
    "name": "signature",
    "title": "Signature 手写签名"
  },
  {
    "name": "avatar",
    "title": "Avatar 头像"
  },
  {
    "name": "badge",
    "title": "Badge 徽标"
  },
  {
    "name": "card",
    "title": "Card 卡片"
  },
  {
    "name": "table",
    "title": "Table 表格"
  },
  {
    "name": "tag",
    "title": "Tag 标签"
  },
  {
    "name": "progress",
    "title": "Progress 进度条"
  },
  {
    "name": "collapse",
    "title": "Collapse 折叠面板"
  },
  {
    "name": "collapse-item",
    "title": "CollapseItem 折叠项"
  },
  {
    "name": "timeline",
    "title": "Timeline 时间线"
  },
  {
    "name": "timeline-item",
    "title": "TimelineItem 时间线项"
  },
  {
    "name": "image",
    "title": "Image 图片"
  },
  {
    "name": "image-preview",
    "title": "ImagePreview 图片预览"
  },
  {
    "name": "swiper",
    "title": "Swiper 轮播"
  },
  {
    "name": "count-down",
    "title": "CountDown 倒计时"
  },
  {
    "name": "count-to",
    "title": "CountTo 数字滚动"
  },
  {
    "name": "empty",
    "title": "Empty 空状态"
  },
  {
    "name": "skeleton",
    "title": "Skeleton 骨架屏"
  },
  {
    "name": "result",
    "title": "Result 结果页"
  },
  {
    "name": "tree",
    "title": "Tree 树形控件"
  },
  {
    "name": "descriptions",
    "title": "Descriptions 描述列表"
  },
  {
    "name": "qrcode",
    "title": "Qrcode 二维码"
  },
  {
    "name": "tabs",
    "title": "Tabs 标签页"
  },
  {
    "name": "pagination",
    "title": "Pagination 分页"
  },
  {
    "name": "steps",
    "title": "Steps 步骤条"
  },
  {
    "name": "step",
    "title": "Step 步骤"
  },
  {
    "name": "breadcrumb",
    "title": "Breadcrumb 面包屑"
  },
  {
    "name": "breadcrumb-item",
    "title": "BreadcrumbItem 面包屑项"
  },
  {
    "name": "dropdown",
    "title": "Dropdown 下拉菜单"
  },
  {
    "name": "fab",
    "title": "Fab 悬浮按钮"
  },
  {
    "name": "backtop",
    "title": "BackTop 回到顶部"
  },
  {
    "name": "navbar",
    "title": "Navbar 导航栏"
  },
  {
    "name": "tabbar",
    "title": "Tabbar 底部标签栏"
  },
  {
    "name": "index-bar",
    "title": "IndexBar 字母索引栏"
  },
  {
    "name": "alert",
    "title": "Alert 提示条"
  },
  {
    "name": "dialog",
    "title": "Dialog 对话框"
  },
  {
    "name": "drawer",
    "title": "Drawer 抽屉"
  },
  {
    "name": "loading",
    "title": "Loading 加载"
  },
  {
    "name": "notice-bar",
    "title": "NoticeBar 通知栏"
  },
  {
    "name": "action-sheet",
    "title": "ActionSheet 动作面板"
  },
  {
    "name": "popconfirm",
    "title": "PopConfirm 气泡确认"
  },
  {
    "name": "popover",
    "title": "Popover 气泡卡片"
  },
  {
    "name": "tooltip",
    "title": "Tooltip 文字提示"
  },
  {
    "name": "guide",
    "title": "Guide 用户指引"
  }
]

export const total = 80
