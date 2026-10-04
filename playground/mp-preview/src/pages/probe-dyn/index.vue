<!--
  动态绑定能力探针（架构验证资产，已刻意不注册进 pages.json，不参与小程序质检）

  目的：判定「Schema 表单引擎」能否用数据驱动渲染。结论（2026-10-03 实测，uni 5.26 / vue3 / mp-weixin）：

  | 能力                          | mp-weixin | 证据                                        |
  |-------------------------------|-----------|---------------------------------------------|
  | <component :is="Comp">        | ❌ 编译期报错 | X_DYNAMIC_COMPONENT_NOT_SUPPORTED           |
  | v-is                          | ❌ 编译期报错 | X_V_IS_NOT_SUPPORTED                        |
  | v-on="{ click: fn }"          | ❌ 编译期报错 | X_V_ON_NO_ARGUMENT                          |
  | v-bind="propsObj"             | ✅         | 产物 u-p="{{a}}"，JS: e.p({...t})            |
  | v-bind:[dynKey]="val"         | ✅         | 产物 JS: e.p({label:..., [n.value||""]:r})   |
  | v-for + v-bind="item.props"   | ✅         | 产物 JS: e.p({...l.props})                   |
  | 枚举 v-if / v-else-if / else  | ✅         | 产物 wx:if / wx:elif / wx:else               |
  | 作用域插槽（含解构）           | ✅         | 产物 u-s="{{['suffix']}}"，JS: e.w(...)      |

  → 表单引擎路线定为：v-for 遍历 schema + 每个字段内部「枚举 v-if」选控件 + v-bind="field.props" 传参。
    事件名必须静态写死（v-on 对象不可用），通过字段索引在 handler 内分发。

  验证产物：dist/build/mp-weixin/pages/probe-dyn/index.{wxml,js}（需临时注册进 pages.json 后 build:mp-weixin 复现）
-->
<template>
  <view class="page">
    <view class="block">
      <text class="title">A. v-bind="对象" 数据驱动 props</text>
      <probe-field v-bind="aProps" />
    </view>

    <view class="block">
      <text class="title">B. @click 静态事件（v-on 对象已确认不支持）</text>
      <probe-field v-bind="bProps" @click="onB" />
    </view>

    <view class="block">
      <text class="title">C. v-bind:[动态名]="值"</text>
      <probe-field :label="'C-静态label'" v-bind:[dynKey]="dynVal" />
    </view>

    <view class="block">
      <text class="title">D. v-for + v-bind="item.props"（表单引擎核心形态）</text>
      <probe-field v-for="(f, i) in fields" :key="i" v-bind="f.props" />
    </view>

    <view class="block">
      <text class="title">E. 枚举 v-if（component :is 的替代方案）</text>
      <probe-field v-if="kind === 'text'" label="E-text" value="文本型" />
      <cd-button v-else-if="kind === 'btn'">E-button</cd-button>
      <view v-else class="ph">
        <text class="ph-t">E-其他</text>
      </view>
      <button class="btn" @click="cycle">切换 kind（当前 {{ kind }}）</button>
    </view>

    <view class="block">
      <text class="title">F. 作用域插槽透传（插槽名动态）</text>
      <probe-field label="F" value="带后缀">
        <template #suffix="{ info }">
          <text class="sfx">后缀:{{ info }}</text>
        </template>
      </probe-field>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import ProbeField from './probe-field.vue'

const aProps = reactive({ label: 'A-label', value: 'A-value', placeholder: 'A-ph' })

let n = 0
const bProps = reactive({ label: 'B-点击我', value: String(n) })
function onB() {
  n += 1
  bProps.value = String(n)
}

const dynKey = ref('value')
const dynVal = ref('C-动态值')

const fields = ref([
  { props: { label: 'D-姓名', value: '张三' } },
  { props: { label: 'D-手机', value: '13800000000' } },
  { props: { label: 'D-禁用', value: '不可编辑', disabled: true } }
])

const kinds = ['text', 'btn', 'other']
let ki = 0
const kind = ref(kinds[0])
function cycle() {
  ki = (ki + 1) % kinds.length
  kind.value = kinds[ki]
}
</script>

<style scoped>
.page {
  padding: 12px;
}
.block {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.title {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #111827;
}
.btn {
  margin-top: 8px;
  font-size: 13px;
}
.ph {
  padding: 8px 10px;
  background: #f3f4f6;
  border-radius: 6px;
}
.ph-t {
  font-size: 12px;
  color: #374151;
}
.sfx {
  font-size: 12px;
  color: #b45309;
  margin-left: 8px;
}
</style>
