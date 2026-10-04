<template>
  <view class="field">
    <text class="label">{{ label }}</text>
    <text class="value">{{ value }}</text>
    <slot name="suffix" :info="label" />
  </view>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  value: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 10px;
  background: #f3f4f6;
  border-radius: 6px;
  margin-bottom: 8px;
}
.label {
  font-size: 12px;
  color: #374151;
  margin-right: 8px;
}
.value {
  font-size: 12px;
  color: #111827;
}
</style>
