<template>
  <view class="unified-page">
    <!-- 顶部导航栏 -->
    <view class="unified-navbar">
      <!-- 仅在对话视图显示历史按钮 -->
      <view class="navbar-left" @tap="showHistory = true">
        <svg
          v-if="activeView === 'chat'"
          class="navbar-icon-svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
        >
          <path fill-rule="evenodd" clip-rule="evenodd" d="M2 6C2 5.44772 2.44772 5 3 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H3C2.44772 7 2 6.55228 2 6ZM2 12C2 11.4477 2.44772 11 3 11H15C15.5523 11 16 11.4477 16 12C16 12.5523 15.5523 13 15 13H3C2.44772 13 2 12.5523 2 12ZM2 18C2 17.4477 2.44772 17 3 17H17C17.5523 17 18 17.4477 18 18C18 18.5523 17.5523 19 17 19H3C2.44772 19 2 18.5523 2 18Z" fill="var(--dayq-icon-secondary)"/>
        </svg>
      </view>

      <page-switcher />

      <view class="navbar-right"></view>
    </view>

    <!-- ===== 对话视图 ===== -->
    <view class="chat-view" :class="{ hidden: activeView !== 'chat' }">
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

      <!-- 功能按钮区 + 底部输入区 -->
      <view class="chat-bottom-area">
        <action-buttons
          :can-summarize="canSummarize"
          :can-plot="canPlot"
          @summary="handleSummary"
          @send-to-geo-gebra="handleSendToGeoGebra"
        />

        <chat-input
          :disabled="isLoading"
          @send="handleSend"
        />
      </view>

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
        v-if="showSummary"
        :visible="showSummary"
        :content="summaryContent"
        @close="showSummary = false"
      />
    </view>

    <!-- ===== GeoGebra 视图 ===== -->
    <view class="geo-view" :class="{ hidden: activeView !== 'geo' }">
      <view class="geogebra-container">
        <geogebra-webview ref="geoWebviewRef" :expression="pendingExpression" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from '../../stores/chat_store'
import { useGeogebraStore } from '../../stores/geogebra_store'
import ChatMessage from '../../components/chat_message.vue'
import ChatInput from '../../components/chat_input.vue'
import ActionButtons from '../../components/action_buttons.vue'
import HistoryDrawer from '../../components/history_drawer.vue'
import SummaryPanel from '../../components/summary_panel.vue'
import PageSwitcher from '../../components/page_switcher.vue'
import GeogebraWebview from '../../components/geogebra_webview.vue'

const LOG_PREFIX = '[UnifiedPage]'

const chatStore = useChatStore()
const geogebraStore = useGeogebraStore()

// ── 共享状态 ──
const activeView = computed(() => geogebraStore.activeView)
const pendingExpression = computed(() => geogebraStore.pendingExpression)

// ── 对话相关状态 ──
const showHistory = ref<boolean>(false)
const showSummary = ref<boolean>(false)
const summaryContent = ref<string>('')
const scrollTop = ref<number>(0)
const scrollIntoView = ref<string>('')

const activeChat = computed(() => chatStore.activeChat)
const isLoading = computed(() => chatStore.isLoading)
const canPlot = computed(() => chatStore.canPlot)
const canSummarize = computed(() => chatStore.canSummarize)

// ── GeoGebra 相关 ──
const geoWebviewRef = ref<InstanceType<typeof GeogebraWebview> | null>(null)

// ── 初始化 ──
chatStore.loadChats()
if (!chatStore.activeChat && chatStore.chatList.length > 0) {
  chatStore.switchChat(chatStore.chatList[0].id)
}

// ── 视图切换处理 ──
watch(activeView, (newView, oldView) => {
  console.log(`${LOG_PREFIX} 视图切换：${oldView} → ${newView}`)

  if (newView === 'geo') {
    // 切换到 GeoGebra：v-show 模式下 iframe 未卸载，直接尝试绘图
    nextTick(() => {
      if (geoWebviewRef.value) {
        console.log(`${LOG_PREFIX} 触发 GeoGebraWebview 重绘检查`)
        geoWebviewRef.value.resetState()
      }
    })
  }
})

// ── 对话操作方法 ──

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
  () => { scrollToBottom() },
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

<style>
/* 非 scoped 确保 v-show 的 hidden 类生效 */
.hidden {
  display: none !important;
}
</style>

<style scoped>
.unified-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-page);
  overflow: hidden;
}

/* ── 导航栏 ── */
.unified-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-soft);
  height: 48px;
  flex-shrink: 0;
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

.navbar-icon-svg {
  flex-shrink: 0;
  cursor: pointer;
}

/* ── 对话视图 ── */
.chat-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  min-height: 0;
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

.chat-bottom-area {
  flex-shrink: 0;
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-border-soft);
}

/* ── GeoGebra 视图 ── */
.geo-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.geogebra-container {
  flex: 1;
  overflow: hidden;
}
</style>
