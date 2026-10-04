---
title: Tree 树形控件
---

# Tree 树形控件

<div class="cd-api-tag">`tree` · 数据展示</div>

勾选走「向下全量 + 向上回算」两趟，父子联动带半选态；checkStrictly 打开时父子各算各的。扁平渲染而非嵌套递归，节点再多也不会爆栈。

## 用法

<CdDemo id="tree-0"></CdDemo>

```vue // 来自演示页 extended
<view class="row">
  <cd-button size="small" @click="treeCheckable = !treeCheckable">
    {{ treeCheckable ? '关闭勾选' : '开启勾选' }}
  </cd-button>
  <cd-checkbox v-model="treeStrictly" label="父子不联动" />
</view>

<cd-tree
  class="tree-box"
  :data="treeData"
  :checkable="treeCheckable"
  :check-strictly="treeStrictly"
  :checked-keys="treeChecked"
  default-expand-all
  @check="onTreeCheck"
>
  <template #empty>没有节点</template>
</cd-tree>

<view class="result">
  <text class="result__label">已勾选</text>
  <text class="result__value">{{ treeChecked.join('、') || '（空）' }}</text>
</view>
```

## Props

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | Array | `() => []` | — | 树数据 |
| `nodeKey` | String | `'id'` | — | 节点唯一标识字段名 |
| `labelKey` | String | `'label'` | — | 显示文案字段名 |
| `childrenKey` | String | `'children'` | — | 子节点字段名 |
| `disabledKey` | String | `'disabled'` | — | 禁用字段名 |
| `checkable` | Boolean | `false` | — | 是否显示复选框 |
| `checkStrictly` | Boolean | `false` | — | 父子勾选互不相干 |
| `defaultExpandAll` | Boolean | `false` | — | 默认展开全部 |
| `indent` | Number | `16` | — | 每层缩进 |
| `selectable` | Boolean | `true` | — | 点文字是否选中（单选高亮） |
| `emptyText` | String | `'暂无数据'` | — | — |
| `checkedKeys` | Array | `() => []` | — | 已勾选的 key 数组 |
| `expandedKeys` | Array | `() => []` | — | 已展开的 key 数组 |
| `customClass` | String | `''` | — | — |
| `customStyle` | String | `''` | — | — |

## Events

| 事件名 | 说明 |
|---|---|
| `update:checkedKeys` | — |
| `update:expandedKeys` | — |
| `check` | — |
| `expand` | — |
| `select` | 选中某一项 |

## Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| `empty` | — | — |
| `node` | `node` / `level` / `expanded` | — |

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- **不做递归渲染**，这是本组件唯一重要的实现决策。
- 两条路摆在面前： A. 组件在自己的模板里引用自己（按 name 自引用）； B. 把树在 script 里摊平成一层可见节点数组，模板只 v-for 一层。
- 选 B，理由是可验证的硬约束，不是口味： - mp-weixin 编译器对 `&lt;component :is>` 直接报错 X_DYNAMIC_COMPONENT_NOT_SUPPORTED（本仓库 cd-form-render 已踩过）； - 自引用递归在小程序端的层深上限没有公开承诺，深树有风险； - 摊平之后「谁可见」只是一次 JS 遍历，顺手把过滤 / 排序 / 层级限制了做进去， 模板层面反而更简单。
- 勾选联动走「向下全量 + 向上回算」两趟： 向下：勾选/取消时把整棵子树写入或剔除； 向上：从被点节点一路走到根，子节点全勾则自己也勾，否则清掉并把沿途标半选。
- `checkStrictly` 打开时跳过两趟，父子各算各的（业务常见诉求，别替他们删）。

## 关联

[cd-checkbox](/components/checkbox) · [cd-checkbox-group](/components/checkbox-group)
