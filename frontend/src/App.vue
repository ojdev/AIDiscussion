<template>
  <n-config-provider>
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
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { NIcon, NButton } from 'naive-ui'
import type { MenuOption } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const collapsed = ref(false)
const user = computed(() => userStore.user)

const isLoggedIn = computed(() => !!user.value)

const menuOptions: MenuOption[] = [
  {
    label: '讨论区',
    key: '/forum',
    icon: renderIcon('chatbubble-ellipses-outline')
  },
  ...(user.value?.role === 'admin'
    ? [{
        label: '后台管理',
        key: '/admin',
        icon: renderIcon('settings-outline')
      }]
    : []
  )
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

function renderIcon(iconName: string) {
  return () => h(NIcon, null, { default: () => iconName })
}

function handleMenuClick(key: string) {
  router.push(key)
}

const userMenuOptions = [
  {
    label: '退出登录',
    key: 'logout',
    icon: renderIcon('log-out-outline')
  }
]

function handleUserMenuSelect(key: string) {
  if (key === 'logout') {
    userStore.clearUser()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }
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