---
title: Step 步骤
---

# Step 步骤

<div class="cd-api-tag">`step` · 导航</div>

单个步骤节点。连线配色按「左边那一步」计算：前置线 index <= current、后置线 index < current，首尾再用透明线占位撑住图标居中。

## 用法

```vue // 来自演示页 navigation
<view class="row">
  <cd-button size="small" @click="stepCurrent = Math.max(0, stepCurrent - 1)">上一步</cd-button>
  <cd-button size="small" type="primary" @click="stepCurrent = Math.min(4, stepCurrent + 1)">
    下一步（{{ stepCurrent + 1 }}/5）
  </cd-button>
  <cd-button size="small" @click="stepStatus = stepStatus === 'error' ? 'process' : 'error'">
    {{ stepStatus === 'error' ? '恢复正常' : '模拟报错' }}
  </cd-button>
</view>

<cd-divider position="left">align=center（默认，移动端）</cd-divider>
<cd-steps :current="stepCurrent" :status="stepStatus">
  <cd-step title="提交申请" description="填写基本信息" />
  <cd-step title="资料审核" description="预计 1 个工作日" />
  <cd-step title="签署合同" description="电子签" />
  <cd-step title="开通服务" description="自动开通" />
  <cd-step title="完成" />
</cd-steps>

<cd-divider position="left">align=start（PC 后台）</cd-divider>
<cd-steps :current="2" align="start">
  <cd-step title="创建任务" description="2026-10-01 09:12" />
  <cd-step title="数据采集" description="共 12.8 万条" />
  <cd-step title="模型训练" description="进行中 42%" />
  <cd-step title="结果输出" />
</cd-steps>

<cd-divider position="left">vertical</cd-divider>
<cd-steps :current="stepCurrent" :status="stepStatus" direction="vertical">
  <cd-step title="提交申请" description="填写基本信息" />
  <cd-step title="资料审核" description="预计 1 个工作日" />
  <cd-step title="签署合同" />
  <cd-step title="开通服务" />
</cd-steps>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `title` | String | `''` | — | — |
| `description` | String | `''` | — | — |
| `icon` | String | `''` | — | 自定义图标，覆盖数字 |
| `status` | String | `''` | — | 单独覆盖本步骤状态：wait / process / finish / error |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

无

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `icon` | — | — |
| `title` | — | — |
| `description` | — | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 状态推导：先按「与 current 的相对位置」定基调（已完成 / 进行中 / 未开始）， 再允许单项覆盖 —— 这样业务不需要为「第 3 步报错了」去重算所有前序步骤的样式。
- 连线的着色有个容易写错的地方：一条连线属于「两个步骤之间」， 它的颜色应该由**左边那个步骤**决定，所以： 前置线（来自 i-1）→ 看 index &lt;= current 后置线（去往 i+1）→ 看 index &lt;  current 两个条件差了一格，这正是「最后一步的前置线已经变蓝、后置线还是灰的」的原因。

## 关联

[cd-steps](/components/steps)
