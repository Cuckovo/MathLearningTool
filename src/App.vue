<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAppStore } from './stores/app_store'

onLaunch(() => {
  const appStore = useAppStore()
  appStore.checkInitState()

  if (!appStore.isInitialized) {
    uni.redirectTo({ url: '/pages/init/api_key_init' })
  }
})
</script>

<template>
  <view class="app">
    <page />
  </view>
</template>

<style>
@import './assets/styles/HYPERGRYPH-Skland-Theme.css';
@import './assets/styles/global.css';
</style>
