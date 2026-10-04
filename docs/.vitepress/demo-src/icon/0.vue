<template>
<view class="icon-grid">
  <view v-for="name in iconNames" :key="name" class="icon-cell">
    <cd-icon :name="name" :size="20" />
    <text class="icon-cell__name">{{ name }}</text>
  </view>
</view>
</template>

<script setup>
import { ICON_NAMES } from '../../../../src/uni_modules/codedog-ui/components/cd-icon/icons'

const iconNames = ICON_NAMES
</script>
