<template>
  <n-config-provider :theme="themeStore.isDark ? darkTheme : null">
    <n-message-provider>
    <n-layout has-sider style="min-height: 100vh">
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        show-trigger
      >
        <div class="logo">
          <h2 v-if="!collapsed">AI Discussion</h2>
          <h2 v-else>AI</h2>
        </div>
        <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :value="currentRoute"
          @update:value="handleMenuClick"
        />
      </n-layout-sider>

      <n-layout>
        <n-layout-header bordered style="height: 64px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between;">
          <n-breadcrumb style="flex: 1;">
            <n-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="item.path">
              {{ item.label }}
            </n-breadcrumb-item>
          </n-breadcrumb>

          <div v-if="isLoggedIn" style="display: flex; align-items: center; gap: 12px;">
            <!-- Notifications -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <n-popover v-model:show="showNotify" placement="bottom-end" trigger="click" style="width: 360px;">
                <template #trigger>
                  <n-button text circle>
                    <template #icon>
                      <n-badge :value="unreadCount" :max="99" :offset="[8, 0]" v-if="unreadCount > 0">
                        <span style="font-size: 20px;">🔔</span>
                      </n-badge>
                      <span v-else style="font-size: 20px;">🔔</span>
                    </template>
                  </n-button>
                </template>
                <div v-if="loadingNotify">加载中...</div>
                <n-list v-else-if="notifications.length > 0" bordered>
                  <n-list-item v-for="note in notifications" :key="note.id">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <n-avatar round :size="40" :src="note.actor.avatar" />
                      <div style="flex: 1;">
                        <n-text depth="1">{{ getNotificationText(note) }}</n-text>
                        <div style="font-size: 12px; color: #888; margin-top: 4px;">{{ formatTime(note.createdAt) }}</div>
                      </div>
                      <n-button v-if="!note.read" text type="primary" size="small" @click="markAsRead(note.id)" :loading="marking === note.id">标为已读</n-button>
                    </div>
                  </n-list-item>
                </n-list>
                <n-empty v-else description="暂无通知" />
                <div style="text-align: center; margin-top: 8px; border-top: 1px solid #eee; padding-top: 8px;">
                  <n-button text size="small" @click="handleMarkAll" :disabled="unreadCount===0">全部标为已读</n-button>
                  <n-button text size="small" type="primary" @click="goToNotifications">查看全部</n-button>
                </div>
              </n-popover>
            </div>
            <!-- Theme toggle -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <n-button text circle @click="themeStore.toggleTheme">
                <template #icon>
                  <n-icon size="20">
                    <component :is="themeStore.isDark ? Sunny : Moon" />
                  </n-icon>
                </template>
              </n-button>
            </div>
            <!-- User menu -->
            <n-dropdown :options="userMenuOptions" @select="handleUserMenuSelect">
              <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <n-avatar round :size="32" :src="user?.avatar" />
                <span>{{ user?.name || user?.nickname }}</span>
              </div>
            </n-dropdown>
          </div>
        </n-layout-header>

        <n-layout-content content-style="padding: 24px;">
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useThemeStore } from '@/store/theme'
import { NButton, NBadge, NAvatar, NPopover, NList, NListItem, NText, NConfigProvider, darkTheme } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { notificationsApi } from '@/api'
import type { Notification } from '@/api'
import { Sunny, Moon } from '@vicons/ionicons5'
import { wsClient } from '@/utils/ws'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const themeStore = useThemeStore()

const collapsed = ref(false)
const user = computed(() => userStore.user)

const isLoggedIn = computed(() => !!user.value)

const menuOptions: MenuOption[] = [
  { label: '讨论区', key: '/forum' },
  { label: '我的资料', key: '/profile' },
  ...(user.value?.role === 'admin' ? [{ label: '后台管理', key: '/admin' }] : [])
]

const currentRoute = computed(() => route.path)

const breadcrumbs = computed(() => {
  const routeMap: Record<string, { label: string }> = {
    '/login': { label: '登录' },
    '/forum': { label: '讨论区' },
    '/admin': { label: '后台管理' }
  }
  const path = route.path
  const matched = route.matched.filter(r => r.meta?.title)
  if (matched.length > 0) {
    return matched.map(r => ({
      path: r.path,
      label: r.meta?.title as string || r.name as string
    }))
  }
  return routeMap[path] ? [{ path, label: routeMap[path].label }] : []
})

function handleMenuClick(key: string) {
  router.push(key)
}

const userMenuOptions = [
  { label: '个人资料', key: 'profile' },
  { label: '退出登录', key: 'logout' }
]

function handleUserMenuSelect(key: string) {
  if (key === 'profile') {
    router.push('/profile')
  } else if (key === 'logout') {
    userStore.clearUser()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    wsClient.disconnect()
    router.push('/login')
  }
}

// Notification state
const showNotify = ref(false)
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const loadingNotify = ref(false)
const marking = ref<number | null>(null)

async function fetchUnreadCount() {
  if (!userStore.token) return
  try {
    const res = await notificationsApi.getUnreadCount()
    if (res.success) {
      unreadCount.value = res.data?.count ?? 0
    }
  } catch (e) {}
}

async function fetchRecentNotifications() {
  if (!userStore.token) return
  loadingNotify.value = true
  try {
    const res = await notificationsApi.getNotifications(1, 10)
    if (res.success && res.data) {
      notifications.value = res.data.items || res.data
    }
  } finally {
    loadingNotify.value = false
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function getNotificationText(note: Notification) {
  const actor = note.actor.name || note.actor.nickname || '未知用户'
  switch (note.type) {
    case 'follow':
      return `${actor} 关注了你`
    case 'like_post':
      return `${actor} 赞了你的帖子`
    case 'like_comment':
      return `${actor} 赞了你的评论`
    case 'reply_comment':
      return `${actor} 回复了你的评论`
    default:
      return `${actor} 触发了一个事件`
  }
}

async function markAsRead(id: number) {
  if (!userStore.token) return
  marking.value = id
  try {
    await notificationsApi.markAsRead(id)
    const idx = notifications.value.findIndex(n => n.id === id)
    if (idx !== -1) {
      notifications.value[idx].read = true
    }
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } finally {
    marking.value = null
  }
}

async function handleMarkAll() {
  if (!userStore.token || unreadCount.value === 0) return
  try {
    await notificationsApi.markAllAsRead()
    unreadCount.value = 0
    notifications.value.forEach(n => n.read = true)
  } catch (e) {}
}

function goToNotifications() {
  showNotify.value = false
  router.push('/notifications')
}

onMounted(() => {
  fetchUnreadCount()
  themeStore.initTheme()
  themeStore.setupSystemListener()
  // Initialize WebSocket if logged in
  if (userStore.token) {
    initWebSocket()
  }
})

// Watch for user login changes to connect/disconnect WS
watch(() => userStore.token, (newToken) => {
  if (newToken) {
    initWebSocket()
  } else {
    wsClient.disconnect()
  }
}, { immediate: false })

function initWebSocket() {
  if (!userStore.token) return
  wsClient.connect(userStore.token)

  // Remove previous listeners to avoid duplicates
  wsClient.off('notification')
  wsClient.off('like')
  wsClient.off('follow')

  // Notification event
  wsClient.on('notification', (data: any) => {
    // Increment unread count badge
    unreadCount.value += 1
    // If notification popover open or on notifications page, refresh
    if (showNotify.value) {
      fetchRecentNotifications()
    }
    // Could also reload forum posts if needed (like counts) but we'll use per-component handlers
  })

  // Like event
  wsClient.on('like', (data: any) => {
    // Provide to other components via global bus or store updates
    // For now, Forum.vue attaches its own listener to update counts
    // We also could emit an event on window for Forum to capture
    window.dispatchEvent(new CustomEvent('ws-like', { detail: data }))
  })

  // Follow event
  wsClient.on('follow', (data: any) => {
    window.dispatchEvent(new CustomEvent('ws-follow', { detail: data }))
  })
}
</script>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #eee;
}
.logo h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}
</style>
