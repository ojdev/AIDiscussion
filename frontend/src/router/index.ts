import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/forum',
    name: 'Forum',
    component: () => import('@/views/Forum.vue'),
    meta: { requiresAuth: true, title: '讨论区' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true, title: '个人资料' }
  },
  {
    path: '/profile/:id',
    name: 'PublicProfile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '用户资料' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin/UserMgmt.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, title: '后台管理' }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/Notifications.vue'),
    meta: { requiresAuth: true, title: '通知中心' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Route guards
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // Ensure user store is initialized
  if (!userStore.user && userStore.token) {
    userStore.initFromStorage()
  }

  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else if (to.meta.requiresAdmin) {
    if (userStore.user?.role !== 'admin') {
      next('/forum')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router