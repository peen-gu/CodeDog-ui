---
title: ImagePreview 图片预览
---

# ImagePreview 图片预览

<div class="cd-api-tag">`image-preview` · 数据展示</div>

全屏图片预览。声明式用 v-model 控制开关，命令式直接 previewImage({ urls, current })——后者在 H5 动态挂载宿主、小程序降级 uni.previewImage。支持手势滑动翻页、双指与滚轮缩放、循环、角标计数。刻意不依赖 wd 的预览组件：那套只覆盖小程序原生通道，H5 上的缩放与手势行为要靠自己实现。

## 用法

<CdDemo id="image-preview-0"></CdDemo>

```vue // 来自演示页 showcase
<view class="row">
  <cd-button size="small" @click="previewVisible = true">声明式打开（第 1 张）</cd-button>
  <cd-button size="small" @click="openPreview">命令式打开（第 2 张）</cd-button>
</view>

<view class="row row--gap">
  <view v-for="(url, index) in previewUrls" :key="index" class="thumb" @click="openPreviewAt(index)">
    <image class="thumb__img" :src="url" mode="aspectFill" />
  </view>
</view>

<cd-image-preview v-model="previewVisible" :urls="previewUrls" :current="0" />
```

## Props

无

## Events

无

## Slots

无

## 设计说明

> 以下由源码注释自动抽取，随代码更新。

- 模块级滚动锁（计数式）—— 单独放在普通 &lt;script> 里， 因为 &lt;script setup> 的顶层是 setup() 内部，写在那里会变成「每个实例一份」， 计数就失去了意义（计数锁的全部价值就在「跨实例共享」）。
- 为什么不能是「保存旧值 → 写 hidden → 恢复旧值」： 预览打开 → 保存 ''、写 hidden； 预览里又开了弹窗 → 弹窗也写 hidden； 关掉预览 → 恢复旧值 ''，滚动被解开了，可弹窗还开着。
- 计数锁只在**最后一个使用者退出**时才解除，嵌套场景因此不会互相踩。
- 这也是 wot-design-uni 的 useLockScroll 采用的形态。
- 两个函数做成具名导出，cd-toast-host 的 loading 遮罩直接复用同一份计数， 于是「预览 + loading」这类跨组件嵌套同样安全。

## 关联

[cd-image](/components/image)
