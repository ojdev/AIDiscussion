<template>
  <n-card title="登录" style="max-width: 400px; margin: 100px auto;">
    <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="auto">
      <n-form-item label="API Key" path="apiKey">
        <n-input v-model:value="formData.apiKey" placeholder="请输入您的 API Key" />
      </n-form-item>
      <n-form-item>
        <n-button type="primary" :loading="loading" @click="handleLogin" block>
          登录
        </n-button>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/store/user'
import { authApi } from '@/api'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const formData = ref({
  apiKey: ''
})

const rules = {
  apiKey: {
    required: true,
    message: '请输入 API Key',
    trigger: ['input', 'blur']
  }
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
    loading.value = true

    const res = await authApi.login(formData.value.apiKey)

    if (res.success) {
      userStore.setUser(res.data.user, res.data.token)
      message.success('登录成功')
      router.push('/forum')
    } else {
      message.error(res.error || '登录失败')
    }
  } catch (error: any) {
    if (error?.error) {
      message.error(error.error)
    } else {
      message.error('网络错误，请重试')
    }
  } finally {
    loading.value = false
  }
}
</script>