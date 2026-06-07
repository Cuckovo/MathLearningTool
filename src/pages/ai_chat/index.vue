<template>
  <view class="ai-chat-page">
    <!-- 顶部导航栏 -->
    <view class="chat-navbar">
      <view class="navbar-left" @tap="showHistory = true">
        <text class="navbar-icon">🕐</text>
      </view>
      <text class="navbar-title">高数函数图像解题工具</text>
      <view class="navbar-right"></view>
    </view>

    <!-- 消息列表 -->
    <scroll-view
      class="chat-messages"
      scroll-y
      :scroll-top="scrollTop"
      :scroll-into-view="scrollIntoView"
      :scroll-with-animation="true"
    >
      <view v-if="!activeChat || activeChat.messages.length === 0" class="empty-state">
        <text class="empty-state__icon">📐</text>
        <text>输入高等数学问题，AI 将为你解题</text>
      </view>

      <view v-else class="messages-container">
        <view
          v-for="(msg, index) in activeChat.messages"
          :key="index"
          :id="`msg-${index}`"
        >
          <chat-message :message="msg" />
        </view>

        <view v-if="isLoading" class="loading-indicator">
          <view class="loading-spinner"></view>
          <text class="loading-text">AI 正在思考...</text>
        </view>
      </view>
    </scroll-view>

    <!-- 功能按钮区 -->
    <action-buttons
      :can-summarize="canSummarize"
      :can-plot="canPlot"
      @summary="handleSummary"
      @send-to-geo-gebra="handleSendToGeoGebra"
    />

    <!-- 底部输入区 -->
    <chat-input
      :disabled="isLoading"
      @send="handleSend"
    />

    <!-- 历史记录抽屉 -->
    <history-drawer
      :visible="showHistory"
      @close="showHistory = false"
      @select="handleSelectChat"
      @delete="handleDeleteChat"
      @export="handleExport"
    />

    <!-- 总结面板 -->
    <summary-panel
      :visible="showSummary"
      :content="summaryContent"
      @close="showSummary = false"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useChatStore } from '../../stores/chat_store'
import ChatMessage from '../../components/chat_message.vue'
import ChatInput from '../../components/chat_input.vue'
import ActionButtons from '../../components/action_buttons.vue'
import HistoryDrawer from '../../components/history_drawer.vue'
import SummaryPanel from '../../components/summary_panel.vue'

const chatStore = useChatStore()

const showHistory = ref<boolean>(false)
const showSummary = ref<boolean>(false)
const summaryContent = ref<string>('')
const scrollTop = ref<number>(0)
const scrollIntoView = ref<string>('')

const activeChat = computed(() => chatStore.activeChat)
const isLoading = computed(() => chatStore.isLoading)
const canPlot = computed(() => chatStore.canPlot)
const canSummarize = computed(() => chatStore.canSummarize)

onShow(() => {
  chatStore.loadChats()
  // 如果没有活跃聊天且有聊天列表，自动选中最新
  if (!chatStore.activeChat && chatStore.chatList.length > 0) {
    chatStore.switchChat(chatStore.chatList[0].id)
  }
})

/** 滚动到底部 */
function scrollToBottom(): void {
  nextTick(() => {
    if (chatStore.activeChat && chatStore.activeChat.messages.length > 0) {
      scrollIntoView.value = `msg-${chatStore.activeChat.messages.length - 1}`
    }
    scrollTop.value = scrollTop.value + 1
  })
}

// 监听消息变化自动滚动
watch(
  () => chatStore.activeChat?.messages?.length,
  () => {
    scrollToBottom()
  },
)

/** 发送消息 */
async function handleSend(content: string): Promise<void> {
  await chatStore.sendMessage(content)
  scrollToBottom()
}

/** 请求总结 */
async function handleSummary(): Promise<void> {
  const summary = await chatStore.requestSummary()
  summaryContent.value = summary
  showSummary.value = true
}

/** 发送到 GeoGebra */
function handleSendToGeoGebra(): void {
  chatStore.sendToGeoGebra()
}

/** 选择聊天 */
function handleSelectChat(id: string): void {
  chatStore.switchChat(id)
  showHistory.value = false
  scrollToBottom()
}

/** 删除聊天 */
function handleDeleteChat(id: string): void {
  chatStore.deleteChat(id)
}

/** 导出聊天 */
function handleExport(): void {
  const data = chatStore.exportChats()
  // #ifdef H5
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'chats_export.json'
  a.click()
  URL.revokeObjectURL(url)
  // #endif
  // #ifndef H5
  uni.setClipboardData({
    data,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    },
  })
  // #endif
}
</script>

<style scoped>
.ai-chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-page);
}

.chat-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-soft);
  height: 48px;
}

.navbar-left,
.navbar-right {
  width: 40px;
  display: flex;
  align-items: center;
}

.navbar-icon {
  font-size: 20px;
  cursor: pointer;
}

.navbar-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.loading-text {
  color: var(--color-text-tertiary);
}
</style>
