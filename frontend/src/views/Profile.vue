<template>
  <div>
    <n-card title="个人资料" style="max-width: 800px; margin: 24px auto;">
      <n-tabs type="line" animated>
        <!-- 我的资料 (编辑) -->
        <n-tab-pane v-if="isMyProfile" name="my-profile" tab="我的资料">
          <n-form ref="formRef" :model="profile" :rules="rules" label-placement="left" label-width="auto">
            <n-form-item label="用户名" path="name">
              <n-input v-model:value="profile.name" disabled />
            </n-form-item>
            <n-form-item label="昵称" path="nickname">
              <n-input v-model:value="profile.nickname" placeholder="请输入昵称" />
            </n-form-item>
            <n-form-item label="头像 URL" path="avatar">
              <n-input v-model:value="profile.avatar" placeholder="请输入头像链接" />
            </n-form-item>
            <n-form-item label="角色">
              <n-tag :type="profile.role === 'admin' ? 'error' : 'default'">{{ profile.role }}</n-tag>
            </n-form-item>
            <n-form-item label="加入时间">
              <n-text depth="3">{{ formatDate(profile.createdAt) }}</n-text>
            </n-form-item>
            <n-form-item label="统计数据">
              <n-space>
                <n-statistic label="帖子" :value="profile.stats?.postCount || 0" />
                <n-statistic label="评论" :value="profile.stats?.commentCount || 0" />
                <n-statistic label="关注" :value="profile.stats?.followingCount || 0" style="cursor: pointer;" @click="showFollowingDrawer = true" />
                <n-statistic label="粉丝" :value="profile.stats?.followerCount || 0" style="cursor: pointer;" @click="showFollowersDrawer = true" />
              </n-space>
            </n-form-item>
            <n-form-item>
              <n-button type="primary" :loading="saving" @click="handleSave">
                保存修改
              </n-button>
            </n-form-item>
          </n-form>
        </n-tab-pane>

        <!-- 公开资料 (只读预览) -->
        <n-tab-pane name="public-profile" tab="公开资料">
          <!-- 关注按钮和计数 -->
          <div v-if="!isMyProfile && isLoggedIn" style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
            <n-button :loading="followingLoading" @click="handleToggleFollow" :type="isFollowing ? 'default' : 'primary'">
              {{ isFollowing ? '取消关注' : '关注' }}
            </n-button>
            <n-space align="center">
              <n-text depth="3">关注了</n-text>
              <n-text depth="3" style="cursor: pointer; color: #2080f0;" @click="showFollowingDrawer = true">
                {{ profile.stats?.followingCount || 0 }}
              </n-text>
              <n-text depth="3">粉丝</n-text>
              <n-text depth="3" style="cursor: pointer; color: #2080f0;" @click="showFollowersDrawer = true">
                {{ profile.stats?.followerCount || 0 }}
              </n-text>
            </n-space>
          </div>

          <n-descriptions bordered :column="1">
            <n-descriptions-item label="用户名">
              {{ profile.name }}
            </n-descriptions-item>
            <n-descriptions-item label="昵称">
              {{ profile.nickname || '-' }}
            </n-descriptions-item>
            <n-descriptions-item label="头像">
              <n-avatar v-if="profile.avatar" :src="profile.avatar" :size="64" />
              <span v-else>-</span>
            </n-descriptions-item>
            <n-descriptions-item label="角色">
              <n-tag :type="profile.role === 'admin' ? 'error' : 'default'">{{ profile.role }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="加入时间">
              {{ formatDate(profile.createdAt) }}
            </n-descriptions-item>
            <n-descriptions-item label="统计数据">
              <n-space>
                <n-statistic label="帖子" :value="profile.stats?.postCount || 0" />
                <n-statistic label="评论" :value="profile.stats?.commentCount || 0" />
                <n-statistic label="关注" :value="profile.stats?.followingCount || 0" />
                <n-statistic label="粉丝" :value="profile.stats?.followerCount || 0" />
              </n-space>
            </n-descriptions-item>
          </n-descriptions>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- Drawers for Following/Followers -->
    <n-drawer v-model:show="showFollowingDrawer" title="关注列表" placement="right" :width="400">
      <div v-if="followingLoadingList" style="text-align: center; padding: 40px;">
        <n-spin size="large" />
      </div>
      <n-list v-else hoverable clickable :data="followingList">
        <template #default="{ item: user }">
          <n-list-item>
            <n-space align="center">
              <n-avatar round size="medium" :src="user.avatar" />
              <div>
                <div>{{ user.name }}</div>
                <n-tag size="small" :type="user.role === 'admin' ? 'error' : 'default'">{{ user.role }}</n-tag>
              </div>
            </n-space>
          </n-list-item>
        </template>
        <template #fallback>
          <n-empty description="暂未关注任何人" />
        </template>
      </n-list>
    </n-drawer>

    <n-drawer v-model:show="showFollowersDrawer" title="粉丝列表" placement="right" :width="400">
      <div v-if="followersLoadingList" style="text-align: center; padding: 40px;">
        <n-spin size="large" />
      </div>
      <n-list v-else hoverable clickable :data="followersList">
        <template #default="{ item: user }">
          <n-list-item>
            <n-space align="center">
              <n-avatar round size="medium" :src="user.avatar" />
              <div>
                <div>{{ user.name }}</div>
                <n-tag size="small" :type="user.role === 'admin' ? 'error' : 'default'">{{ user.role }}</n-tag>
              </div>
            </n-space>
          </n-list-item>
        </template>
        <template #fallback>
          <n-empty description="暂无粉丝" />
        </template>
      </n-list>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useMessage, type FormInst } from 'naive-ui'
import { useUserStore } from '@/store/user'
import { usersApi } from '@/api'
import { useRoute } from 'vue-router'

const message = useMessage()
const userStore = useUserStore()
const route = useRoute()

const currentUser = computed(() => userStore.user)
const isLoggedIn = computed(() => !!currentUser.value)

const formRef = ref<FormInst>()
const saving = ref(false)

// 关注相关状态
const isFollowing = ref(false)
const followingLoading = ref(false)
const followingList = ref<any[]>([])
const followersList = ref<any[]>([])
const followingLoadingList = ref(false)
const followersLoadingList = ref(false)
const showFollowingDrawer = ref(false)
const showFollowersDrawer = ref(false)

const profile = reactive({
  id: 0,
  name: '',
  nickname: '',
  avatar: '',
  role: '',
  createdAt: '',
  stats: { postCount: 0, commentCount: 0, followingCount: 0, followerCount: 0 }
})

const rules = {
  nickname: {
    required: false,
    message: '请输入昵称',
    trigger: ['input', 'blur']
  },
  avatar: {
    required: false,
    message: '请输入头像 URL',
    trigger: ['input', 'blur']
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadProfile(userId?: number) {
  try {
    // 重置关注状态当查看他人资料
    if (userId) {
      isFollowing.value = false
    }

    let res
    if (userId) {
      res = await usersApi.getById(userId)
    } else {
      res = await usersApi.getMe()
    }
    if (res.success && res.data) {
      Object.assign(profile, res.data)
      // 如果是查看他人资料且已登录，检查关注状态
      if (userId && isLoggedIn.value) {
        await checkFollowingStatus(userId)
      }
    } else {
      message.error('加载资料失败')
    }
  } catch (error: any) {
    message.error(error?.error || '网络错误')
  }
}

async function checkFollowingStatus(targetUserId: number) {
  try {
    const { followsApi } = await import('@/api')
    const res = await followsApi.checkIsFollowing(targetUserId)
    if (res.success) {
      isFollowing.value = res.data?.isFollowing ?? false
    } else {
      isFollowing.value = false
    }
  } catch (error) {
    isFollowing.value = false
  }
}

async function handleToggleFollow() {
  if (!profile.id) return
  followingLoading.value = true
  try {
    const { followsApi } = await import('@/api')
    const result = await followsApi.toggleFollow(profile.id)
    if (result.success && result.data) {
      isFollowing.value = result.data.following
      profile.stats.followingCount = result.data.followingCount
      profile.stats.followerCount = result.data.followerCount
      message.success(isFollowing.value ? '已关注' : '已取消关注')
    } else {
      message.error(result.error || '操作失败')
    }
  } catch (error: any) {
    message.error(error?.error || '网络错误')
  } finally {
    followingLoading.value = false
  }
}

// 加载关注/粉丝列表（延迟加载）
async function loadFollowingList() {
  if (!profile.id) return
  followingLoadingList.value = true
  try {
    const { followsApi } = await import('@/api')
    const res = await followsApi.getFollowing(profile.id)
    if (res.success) {
      followingList.value = res.data ?? []
    } else {
      message.error(res.error || '加载关注列表失败')
    }
  } catch (error: any) {
    console.error('Failed to load following list:', error)
  } finally {
    followingLoadingList.value = false
  }
}

async function loadFollowersList() {
  if (!profile.id) return
  followersLoadingList.value = true
  try {
    const { followsApi } = await import('@/api')
    const res = await followsApi.getFollowers(profile.id)
    if (res.success) {
      followersList.value = res.data ?? []
    } else {
      message.error(res.error || '加载粉丝列表失败')
    }
  } catch (error: any) {
    console.error('Failed to load followers list:', error)
  } finally {
    followersLoadingList.value = false
  }
}

// 监听抽屉打开，加载数据
watch(showFollowingDrawer, async (val) => {
  if (val && followingList.value.length === 0) {
    await loadFollowingList()
  }
})
watch(showFollowersDrawer, async (val) => {
  if (val && followersList.value.length === 0) {
    await loadFollowersList()
  }
})

async function handleSave() {
  try {
    await formRef.value?.validate()
    saving.value = true

    const res = await usersApi.updateMe({
      nickname: profile.nickname || undefined,
      avatar: profile.avatar || undefined
    })

    if (res.success && res.data) {
      message.success('保存成功')
      // Update user store
      userStore.setUser(res.data, userStore.token!)
      // Refresh profile data
      Object.assign(profile, res.data)
    } else {
      message.error(res.error || '保存失败')
    }
  } catch (error: any) {
    message.error(error?.error || '保存失败')
  } finally {
    saving.value = false
  }
}

// Determine if this is the current user's own profile
const isMyProfile = computed(() => {
  const routeId = route.params.id
  if (!routeId) return true
  const viewedId = parseInt(routeId as string, 10)
  return viewedId === userStore.user?.id
})

// Determine which user ID to load
const profileUserId = computed(() => {
  const id = route.params.id
  return id ? parseInt(id as string, 10) : undefined
})

onMounted(() => {
  loadProfile(profileUserId.value)
})
</script>

<style scoped>
.n-statistic {
  display: inline-block;
  margin-right: 24px;
}
</style>
