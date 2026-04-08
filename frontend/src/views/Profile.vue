<template>
  <n-card title="个人资料" style="max-width: 800px; margin: 24px auto;">
    <n-tabs type="line" animated>
      <!-- 我的资料 (编辑) -->
      <n-tab-pane name="my-profile" tab="我的资料">
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
            </n-space>
          </n-descriptions-item>
        </n-descriptions>
      </n-tab-pane>
    </n-tabs>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/store/user'
import { usersApi } from '@/api'
import type { FormInst } from 'naive-ui'

const message = useMessage()
const userStore = useUserStore()

const formRef = ref<FormInst>()
const saving = ref(false)

const profile = reactive({
  id: 0,
  name: '',
  nickname: '',
  avatar: '',
  role: '',
  createdAt: '',
  stats: { postCount: 0, commentCount: 0 }
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

async function loadProfile() {
  try {
    const res = await usersApi.getMe()
    if (res.success && res.data) {
      Object.assign(profile, res.data)
    } else {
      message.error('加载资料失败')
    }
  } catch (error: any) {
    message.error(error?.error || '网络错误')
  }
}

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
    } else {
      message.error(res.error || '保存失败')
    }
  } catch (error: any) {
    message.error(error?.error || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.n-statistic {
  display: inline-block;
  margin-right: 24px;
}
</style>
