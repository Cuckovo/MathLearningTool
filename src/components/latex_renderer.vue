<template>
  <view class="latex-renderer">
    <!-- H5 端: 用 v-html 渲染 KaTeX 输出的 HTML -->
    <!-- #ifdef H5 -->
    <view class="latex-content" v-html="renderedContent"></view>
    <!-- #endif -->
    <!-- 小程序端: 用 mp-html 渲染 -->
    <!-- #ifndef H5 -->
    <mp-html :content="renderedContent" />
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { wrapForRender } from '../services/latex_parser'

const props = defineProps<{
  content: string
}>()

/** 预处理内容，将 LaTeX 标记转为 KaTeX 渲染后的 HTML */
const renderedContent = computed<string>(() => {
  return wrapForRender(props.content)
})
</script>

<style scoped>
/* 导入 KaTeX CSS */
@import 'katex/dist/katex.min.css';

.latex-renderer {
  width: 100%;
  overflow: hidden;
}

.latex-content {
  font-size: var(--font-size-sm);
  line-height: 1.8;
  word-break: break-word;
  white-space: pre-wrap;
  color: var(--color-text-primary);
}

/* KaTeX 公式块级间距 */
.latex-content :deep(.katex-display) {
  margin: var(--space-3) 0;
  overflow-x: auto;
  overflow-y: hidden;
}

/* KaTeX 行内公式颜色微调 */
.latex-content :deep(.katex) {
  color: var(--color-text-primary);
}

/* 大公式可横向滚动 */
.latex-content :deep(.katex-display > .katex) {
  max-width: 100%;
}

/* 降级回退样式 */
.latex-content :deep(.latex-block-fallback),
.latex-content :deep(.latex-inline-fallback) {
  font-family: 'KaTeX_Main', 'Times New Roman', serif;
  font-style: italic;
  color: var(--color-primary);
}

/* 加粗 Markdown */
.latex-content :deep(strong) {
  font-weight: 700;
}
</style>
