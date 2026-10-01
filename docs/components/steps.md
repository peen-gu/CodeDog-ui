---
title: Steps 步骤条
---

# Steps 步骤条

<div class="cd-api-tag">`steps` · 导航</div>

横向/纵向流程指引。序号由容器注册表派生——子项不接受业务传 index，避免增删步骤时序号错位。容器用普通数组存 uid（不上 ref，防止 Proxy 破坏引用比对）配合 version ref 建立响应式依赖。

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
| `current` | Number | `0` | — | 当前步骤，从 0 开始 |
| `status` | String | `'process'` | — | 当前步骤的状态：process / finish / error |
| `direction` | String | `'horizontal'` | — | horizontal / vertical |
| `align` | String | `'center'` | — | 水平方向的标题对齐：center（移动端）/ start（PC 后台） |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

无

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `default` | — | 默认插槽 |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 序号是「位置」而不是「属性」，所以只能由容器统计出来。
- 这里用「注册表 + 版本号」而不是让业务传 index： 业务多写一个 :index 就多一处能写错的地方， 而步骤顺序在模板里本来就是天然的。
- 注册表刻意用普通数组（不是 ref 数组）： 被 Proxy 包过的数组会让 indexOf 的引用比对失效 —— 这个坑在 cd-form 的字段注册表那一批已经踩过一次了。
- 因此另设一个 version 变量，谁读它谁就建立了响应式依赖。

## 关联

[cd-step](/components/step)
