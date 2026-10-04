<template>
<view class="icon-grid">
  <view v-for="name in iconNames" :key="name" class="icon-cell">
    <cd-icon :name="name" :size="20" />
    <text class="icon-cell__name">{{ name }}</text>
  </view>
</view>
</template>

<script setup>
import { ICON_NAMES } from 'codedog-ui/components/cd-icon/icons.js'

const iconNames = ICON_NAMES
</script>
