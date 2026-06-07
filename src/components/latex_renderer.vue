<template>
  <view class="latex-renderer">
    <!-- 使用 mp-html 渲染含 LaTeX 的内容 -->
    <!-- #ifdef H5 -->
    <view class="latex-content" v-html="renderedContent"></view>
    <!-- #endif -->
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

/** 预处理内容，将 LaTeX 标记转为可渲染格式 */
const renderedContent = computed<string>(() => {
  return wrapForRender(props.content)
})
</script>

<style scoped>
.latex-renderer {
  width: 100%;
  overflow: hidden;
}

.latex-content {
  font-size: var(--font-size-sm);
  line-height: 1.7;
  word-break: break-word;
  white-space: pre-wrap;
  color: var(--color-text-primary);
}

/* 行内 LaTeX */
:deep(.latex-inline) {
  font-family: 'KaTeX_Main', 'Times New Roman', serif;
  font-style: italic;
  color: var(--color-primary);
}

/* 块级 LaTeX */
:deep(.latex-block) {
  display: block;
  text-align: center;
  margin: var(--space-3) 0;
  padding: var(--space-2);
  background: var(--color-primary-soft);
  border-radius: var(--radius-sm);
  font-family: 'KaTeX_Main', 'Times New Roman', serif;
  overflow-x: auto;
}
</style>
