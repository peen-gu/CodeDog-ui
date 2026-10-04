<template>
  <view class="cd-upload" :class="rootClass">
    <!-- ==================== 触发区 ==================== -->
    <view
      v-if="canAdd"
      class="cd-upload__trigger"
      :class="triggerClass"
      @click="choose"
    >
      <slot name="trigger">
        <template v-if="listType === 'picture-card'">
          <view class="cd-upload__plus">
            <view class="cd-upload__plus-bar cd-upload__plus-bar--a" />
            <view class="cd-upload__plus-bar cd-upload__plus-bar--b" />
          </view>
          <text class="cd-upload__trigger-text">上传{{ accept === 'image' ? '图片' : '文件' }}</text>
        </template>
        <template v-else>
          <cd-button type="default" size="small" :disabled="isDisabled">
            选择文件
          </cd-button>
        </template>
      </slot>
    </view>

    <!-- ==================== 图片卡片列表 ==================== -->
    <view v-if="listType === 'picture-card' && files.length" class="cd-upload__cards">
      <view v-for="(item, index) in files" :key="item.key" class="cd-upload__card">
        <image
          v-if="isImage(item)"
          class="cd-upload__thumb"
          :src="item.url"
          mode="aspectFill"
          @click="preview(index)"
        />
        <view v-else class="cd-upload__thumb cd-upload__thumb--file" @click="preview(index)">
          <text class="cd-upload__file-ext">{{ extOf(item.name) }}</text>
        </view>

        <!-- 上传中：进度遮罩 -->
        <view v-if="item.status === 'uploading'" class="cd-upload__mask">
          <text class="cd-upload__mask-text">{{ item.percent }}%</text>
        </view>

        <!-- 失败：点卡片重试 -->
        <view v-if="item.status === 'error'" class="cd-upload__mask cd-upload__mask--error" @click="retry(index)">
          <text class="cd-upload__mask-text">点击重试</text>
        </view>

        <view v-if="!isDisabled" class="cd-upload__remove" @click.stop="remove(index)">
          <view class="cd-upload__remove-bar cd-upload__remove-bar--a" />
          <view class="cd-upload__remove-bar cd-upload__remove-bar--b" />
        </view>
      </view>
    </view>

    <!-- ==================== 文件列表 ==================== -->
    <view v-if="listType === 'list' && files.length" class="cd-upload__list">
      <view v-for="(item, index) in files" :key="item.key" class="cd-upload__row">
        <cd-icon class="cd-upload__row-icon" :name="isImage(item) ? 'image' : 'file'" :size="15" />
        <text class="cd-upload__row-name" @click="preview(index)">{{ item.name || item.url }}</text>
        <text v-if="item.status === 'uploading'" class="cd-upload__row-state cd-upload__row-state--doing">
          {{ item.percent }}%
        </text>
        <text v-else-if="item.status === 'error'" class="cd-upload__row-state cd-upload__row-state--error" @click="retry(index)">
          重试
        </text>
        <view v-if="!isDisabled" class="cd-upload__row-remove" @click="remove(index)">
          <view class="cd-upload__remove-bar cd-upload__remove-bar--a" />
          <view class="cd-upload__remove-bar cd-upload__remove-bar--b" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * cd-upload —— 上传
 * ---------------------------------------------------------------
 * 受控与非受控之间选了「受控优先」：文件列表的真值在 modelValue 里，
 * 组件内部只负责「选文件 → 上传 → 回报状态」。这样已上传列表可以直接
 * 从服务端数据回填，也方便业务在做自己的接口（带 token、带签名）时
 * 用 customRequest 接管上传动作本身。
 *
 * 两种上传通道：
 *   默认    → uni.uploadFile 直传 action
 *   自定义  → 传 customRequest，业务拿到文件与三个回调自己处理
 *
 * 刻意不做拖拽：小程序端没有 drag 事件体系，为 H5 单独维护一套
 * 拖拽命中与高亮逻辑，投入产出比不划算，等真实场景出现再加。
 */
import { computed } from 'vue'
import { useField } from '../../composables/use-field'
import CdButton from '../cd-button/cd-button.vue'
import CdIcon from '../cd-icon/cd-icon.vue'

defineOptions({
  name: 'cd-upload',
  options: {
    addGlobalClass: true,
  },
})

const props = defineProps({
  /**
   * 文件列表。支持三种元素：url 字符串 / { url } / 完整记录
   * { url, name?, status?: 'success'|'uploading'|'error', percent? }
   */
  modelValue: {
    type: Array,
    default: () => [],
  },
  /** 'image' | 'file' */
  accept: {
    type: String,
    default: 'image',
  },
  /** 上传接口地址（与 customRequest 二选一） */
  action: {
    type: String,
    default: '',
  },
  /** uni.uploadFile 的文件字段名 */
  name: {
    type: String,
    default: 'file',
  },
  formData: {
    type: Object,
    default: () => ({}),
  },
  header: {
    type: Object,
    default: () => ({}),
  },
  /** 自定义上传。签名：({ file, onProgress, onSuccess, onError }) */
  customRequest: {
    type: Function,
    default: null,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  /** 最多几个文件，0 表示不限制 */
  maxCount: {
    type: Number,
    default: 0,
  },
  /** 单文件大小上限（MB），0 表示不限制 */
  maxSize: {
    type: Number,
    default: 0,
  },
  /** 'picture-card' | 'list' */
  listType: {
    type: String,
    default: 'picture-card',
  },
  /**
   * 选完文件是否立即上传。false 时为「先选后传」，
   * 业务在提交表单时自己调用接口。
   */
  autoUpload: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
  customClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'update:modelValue',
  'change',
  'success',
  'fail',
  'progress',
  'remove',
  'exceed',
  'oversize',
])

const { field, formDisabled, notifyChange, notifyBlur } = useField()

const isDisabled = computed(() => props.disabled || formDisabled.value)

/* -------------------- 文件记录归一化 -------------------- */

/**
 * key 一律由 url 推导，**绝不用自增种子**。
 *
 * 早先这里在 normalize 里做 keySeed++，而 normalize 是被 computed 调用的 ——
 * 于是「读一次 files」就顺手改了组件状态：字符串数组回填时，任何一次
 * patchAt 都会让所有卡片的 :key 整体变一遍，列表 DOM 全量重建、图片重新
 * 加载，小程序端表现为持续闪烁。computed 必须是纯函数。
 *
 * 用 url 做 key 还顺带满足「同一个文件的 key 永远不变」：
 * 上传中途删掉前面的文件，后面文件的 key 不受影响。
 */
function normalize(raw) {
  if (typeof raw === 'string') {
    return { key: `cdu-${raw}`, url: raw, name: raw.split('/').pop() || '', status: 'success', percent: 100 }
  }
  const record = { ...(raw || {}) }
  if (!record.key) record.key = `cdu-${record.url || ''}`
  record.status = record.status || 'success'
  record.percent = Number.isFinite(record.percent) ? record.percent : 100
  return record
}

const files = computed(() => {
  const list = (props.modelValue || []).map(normalize)
  /*
   * 兜底重复 url（同一个文件被选了两次）：key 撞车会让 Vue 报重复 key
   * 并可能错配 DOM，所以这里按出现顺序补一个序号后缀。
   * 计数只在这份局部 map 里，不碰组件状态，computed 依然是纯函数。
   */
  const seen = {}
  return list.map((item) => {
    seen[item.key] = (seen[item.key] || 0) + 1
    return seen[item.key] > 1 ? { ...item, key: `${item.key}@${seen[item.key]}` } : item
  })
})

const canAdd = computed(() => {
  if (isDisabled.value) return false
  if (props.maxCount > 0 && files.value.length >= props.maxCount) return false
  return true
})

const rootClass = computed(() =>
  [
    /* listType 必须落到类名上：CSS 里的 .cd-upload--list 全靠它命中，
       漏了的话 list-type="list" 时触发区仍是 84×84 的虚线方块 */
    `cd-upload--${props.listType}`,
    isDisabled.value ? 'cd-upload--disabled' : '',
    hasError.value ? 'cd-upload--error' : '',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
)

const triggerClass = computed(() => (isDisabled.value ? 'cd-upload__trigger--disabled' : ''))

const hasError = computed(() => props.error || !!(field && field.validateState && field.validateState.value === 'error'))

function isImage(item) {
  if (props.accept === 'image') return true
  return /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(item.url || '')
}

function extOf(name) {
  if (!name) return '文件'
  const m = name.match(/\.([a-z0-9]+)$/i)
  return (m ? m[1] : '文件').toUpperCase().slice(0, 5)
}

/* -------------------- 选择 -------------------- */

function choose() {
  if (isDisabled.value || !canAdd.value) return
  const remain = props.maxCount > 0 ? props.maxCount - files.value.length : props.multiple ? 9 : 1
  const count = props.multiple ? Math.max(1, remain) : 1

  const onPicked = (paths, tempFiles) => {
    handlePicked(paths || [], tempFiles || [])
  }

  if (props.accept === 'image') {
    uni.chooseImage({
      count,
      success: (res) => onPicked(res.tempFilePaths, res.tempFiles),
      fail: () => {},
    })
    return
  }

  /* #ifdef MP-WEIXIN */
  uni.chooseMessageFile({
    count,
    type: 'file',
    success: (res) => {
      const paths = (res.tempFiles || []).map((f) => f.path)
      onPicked(paths, res.tempFiles || [])
    },
    fail: () => {},
  })
  /* #endif */
  /* #ifndef MP-WEIXIN */
  uni.chooseFile({
    count,
    success: (res) => onPicked(res.tempFilePaths, res.tempFiles),
    fail: () => {},
  })
  /* #endif */
}

function handlePicked(paths, tempFiles) {
  const adding = []
  paths.forEach((path, i) => {
    const meta = tempFiles[i] || {}
    const sizeMB = (meta.size || 0) / 1024 / 1024
    if (props.maxSize > 0 && sizeMB > props.maxSize) {
      emit('oversize', { path, sizeMB })
      return
    }
    adding.push({
      key: `cdup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: path,
      name: meta.name || path.split('/').pop() || '',
      status: 'uploading',
      percent: 0,
    })
  })

  if (!adding.length) return

  const room = props.maxCount > 0 ? props.maxCount - files.value.length : adding.length
  if (room <= 0) {
    emit('exceed', { maxCount: props.maxCount })
    return
  }
  const accepted = adding.slice(0, room)
  if (adding.length > accepted.length) {
    emit('exceed', { maxCount: props.maxCount })
  }

  const next = [...files.value, ...accepted]
  emitValue(next)

  if (props.autoUpload) {
    accepted.forEach((item) => upload(item))
  }
}

/* -------------------- 上传 -------------------- */

function emitValue(list) {
  emit('update:modelValue', list)
  emit('change', list)
  notifyChange(list)
}

/**
 * 按 key 定位，不按 index。
 * 进度回调是异步的：上传途中用户删掉了前面的某个文件，
 * 按下标写就会把进度写到另一个文件上 —— key 是唯一稳定的锚点。
 */
function patchAt(key, patch) {
  const list = files.value.map((item) => (item.key === key ? { ...item, ...patch } : item))
  emitValue(list)
  return list
}

function upload(item) {
  const key = item.key

  if (props.customRequest) {
    props.customRequest({
      file: item,
      onProgress: (percent) => {
        patchAt(key, { percent: Math.round(percent), status: 'uploading' })
        emit('progress', { file: item, percent })
      },
      onSuccess: (res) => {
        patchAt(key, { status: 'success', percent: 100 })
        emit('success', { file: item, res })
        notifyChange(files.value)
      },
      onError: (err) => {
        patchAt(key, { status: 'error', percent: 0 })
        emit('fail', { file: item, error: err })
      },
    })
    return
  }

  if (!props.action) {
    /* 没有 action 也没有 customRequest：把条目标记为成功即可。
       「先选后传」由业务在 submit 时自己处理，这里不假装上传过 */
    patchAt(key, { status: 'success', percent: 100 })
    return
  }

  const task = uni.uploadFile({
    url: props.action,
    filePath: item.url,
    name: props.name,
    formData: props.formData,
    header: props.header,
    success: (res) => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        patchAt(key, { status: 'success', percent: 100, response: res.data })
        emit('success', { file: item, res })
      } else {
        patchAt(key, { status: 'error', percent: 0, response: res.data })
        emit('fail', { file: item, res })
      }
      notifyChange(files.value)
    },
    fail: (err) => {
      patchAt(key, { status: 'error', percent: 0 })
      emit('fail', { file: item, error: err })
    },
  })

  if (task && task.onProgressUpdate) {
    task.onProgressUpdate((res) => {
      patchAt(key, { percent: res.progress, status: 'uploading' })
      emit('progress', { file: item, percent: res.progress })
    })
  }
}

function retry(index) {
  const item = files.value[index]
  if (!item || item.status !== 'error') return
  patchAt(item.key, { status: 'uploading', percent: 0 })
  upload({ ...item })
}

/* -------------------- 移除与预览 -------------------- */

function remove(index) {
  const item = files.value[index]
  if (!item) return
  const list = files.value.filter((_, i) => i !== index)
  emitValue(list)
  emit('remove', item)
  notifyChange(list)
}

function preview(index) {
  const item = files.value[index]
  if (!item) return
  if (isImage(item)) {
    const urls = files.value.filter((f) => isImage(f) && f.status === 'success').map((f) => f.url)
    uni.previewImage({ urls, current: item.url })
  }
}
</script>

<style lang="scss">
@import '../../styles/scss-tokens.scss';

/**
 * 颜色命名约定：本组件私有的颜色令牌统一 --cd-upload-* 前缀，
 * 一律写成 var(--x, 兜底原色) —— 业务不传变量时视觉与此前完全一致。
 * 共用语义色（--cd-color-danger 等）走库级令牌，不另起名字。
 */

.cd-upload {
  @include cd-reset;
  display: block;
}

/* ==================== 触发区 ==================== */

.cd-upload__trigger {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: var(--cd-upload-card, 84px);
  height: var(--cd-upload-card, 84px);
  background-color: var(--cd-bg-sunken, #f8fafc);
  border: var(--cd-border-width, 1px) dashed var(--cd-border-color-strong, #cbd5e1);
  border-radius: var(--cd-radius-lg, 12px);
  cursor: pointer;
  transition: border-color var(--cd-duration-fast, 150ms) ease, background-color var(--cd-duration-fast, 150ms) ease;
}

@include cd-hover {
  .cd-upload__trigger:hover {
    border-color: var(--cd-color-primary, #3b76f6);
    background-color: var(--cd-color-primary-soft, #eff5ff);
  }
}

.cd-upload__trigger--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.cd-upload__plus {
  position: relative;
  width: 18px;
  height: 18px;
}

.cd-upload__plus-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  background-color: var(--cd-text-tertiary, #94a3b8);
  border-radius: 2px;
}

.cd-upload__plus-bar--a {
  width: 14px;
  height: 1.5px;
  margin: -0.75px 0 0 -7px;
}

.cd-upload__plus-bar--b {
  width: 1.5px;
  height: 14px;
  margin: -7px 0 0 -0.75px;
}

.cd-upload__trigger-text {
  margin-top: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-xs, 11px);
  color: var(--cd-text-secondary, #64748b);
}

/* 列表形态下触发区退化为一个按钮 */
.cd-upload--list .cd-upload__trigger,
.cd-upload__trigger--inline {
  width: auto;
  height: auto;
  border: none;
  background: transparent;
}

/* ==================== 图片卡片列表 ==================== */

.cd-upload__cards {
  display: flex;
  flex-wrap: wrap;
  margin-top: var(--cd-space-3, 12px);
}

.cd-upload__card {
  position: relative;
  width: var(--cd-upload-card, 84px);
  height: var(--cd-upload-card, 84px);
  margin-right: var(--cd-space-2, 8px);
  margin-bottom: var(--cd-space-2, 8px);
  border-radius: var(--cd-radius-lg, 12px);
  overflow: hidden;
  background-color: var(--cd-bg-sunken, #f1f5f9);
}

.cd-upload__thumb {
  width: 100%;
  height: 100%;
  display: block;
}

.cd-upload__thumb--file {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cd-upload__file-ext {
  font-size: var(--cd-font-size-xs, 11px);
  font-weight: var(--cd-font-weight-semibold, 600);
  color: var(--cd-text-secondary, #64748b);
}

/* 上传中 / 失败的遮罩 */
.cd-upload__mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--cd-upload-mask-bg, rgba(15, 23, 42, 0.55));
}

.cd-upload__mask--error {
  background-color: var(--cd-upload-mask-error-bg, rgba(239, 68, 68, 0.72));
}

.cd-upload__mask-text {
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-upload-mask-color, #ffffff);
}

.cd-upload__remove {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--cd-upload-remove-bg, rgba(15, 23, 42, 0.6));
  border-bottom-left-radius: var(--cd-radius-md, 8px);
  cursor: pointer;
}

.cd-upload__remove-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 1.5px;
  margin-top: -0.75px;
  margin-left: -4px;
  background-color: var(--cd-upload-remove-bar, #ffffff);
  border-radius: 2px;
}

.cd-upload__remove-bar--a {
  transform: rotate(45deg);
}

.cd-upload__remove-bar--b {
  transform: rotate(-45deg);
}

/* ==================== 文件列表 ==================== */

.cd-upload__list {
  margin-top: var(--cd-space-3, 12px);
}

.cd-upload__row {
  display: flex;
  align-items: center;
  padding: var(--cd-space-2, 8px) var(--cd-space-3, 12px);
  background-color: var(--cd-bg-sunken, #f8fafc);
  border-radius: var(--cd-radius-md, 8px);
}

.cd-upload__row + .cd-upload__row {
  margin-top: var(--cd-space-2, 8px);
}

.cd-upload__row-icon {
  flex-shrink: 0;
  margin-right: var(--cd-space-2, 8px);
  color: var(--cd-text-tertiary, #94a3b8);
}

.cd-upload__row-name {
  flex: 1;
  min-width: 0;
  font-size: var(--cd-font-size-sm, 12px);
  color: var(--cd-text-regular, #334155);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.cd-upload__row-state {
  flex-shrink: 0;
  margin-left: var(--cd-space-2, 8px);
  font-size: var(--cd-font-size-xs, 11px);
}

.cd-upload__row-state--doing {
  color: var(--cd-color-primary, #3b76f6);
}

.cd-upload__row-state--error {
  color: var(--cd-color-danger, #ef4444);
  cursor: pointer;
}

.cd-upload__row-remove {
  position: relative;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin-left: var(--cd-space-2, 8px);
  border-radius: 50%;
  cursor: pointer;
}

.cd-upload__row-remove:hover {
  background-color: var(--cd-bg-active, rgba(15, 23, 42, 0.08));
}
</style>
