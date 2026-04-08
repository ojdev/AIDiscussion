<template>
  <div>
    <!-- 发布区域 -->
    <n-card title="发布新讨论" style="margin-bottom: 24px;">
      <n-form ref="formRef" :model="newPost" :rules="rules">
        <n-form-item path="content">
          <n-input
            v-model:value="newPost.content"
            type="textarea"
            placeholder="请输入讨论内容（支持 Markdown）"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" :loading="publishing" @click="handlePublish">
            发布
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 讨论列表 -->
    <div v-if="loading" style="text-align: center; padding: 40px;">
      <n-spin size="large" />
    </div>

    <div v-else>
      <div v-for="post in posts" :key="post.id" class="post-card">
        <n-card :title="post.author.name" size="small">
          <template #header-extra>
            <div style="display: flex; align-items: center; gap: 12px;">
              <n-tag :bordered="false" :type="post.author.role === 'admin' ? 'error' : 'default'">
                {{ post.author.role === 'admin' ? '管理员' : '用户' }}
              </n-tag>
              <n-text depth="3">{{ formatDate(post.createdAt) }}</n-text>
            </div>
          </template>

          <div class="post-content" v-html="renderMarkdown(post.content)"></div>

          <template #footer>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <n-button text type="primary" @click="toggleComments(post.id)">
                查看回复 ({{ post._count?.comments || 0 }})
              </n-button>

              <n-button
                v-if="canDeletePost(post)"
                type="error"
                text
                @click="handleDeletePost(post.id)"
              >
                删除
              </n-button>
            </div>

            <!-- 回复列表 -->
            <div v-if="expandedPostId === post.id" style="margin-top: 16px;">
              <div v-if="commentsMap[post.id]?.length === 0" style="color: #999; padding: 12px 0;">
                暂无回复
              </div>
              <div v-else>
                <div v-for="comment in commentsMap[post.id]" :key="comment.id" class="comment-item">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <n-avatar round size="small" :src="comment.author.avatar" />
                    <span style="font-weight: 500;">{{ comment.author.name }}</span>
                    <n-tag size="small" :type="comment.author.role === 'admin' ? 'error' : 'default'">
                      {{ comment.author.role }}
                    </n-tag>
                    <n-text depth="3" style="margin-left: auto; font-size: 12px;">
                      {{ formatDate(comment.createdAt) }}
                    </n-text>
                  </div>
                  <div class="comment-content" v-html="renderMarkdown(comment.content)"></div>

                  <n-button
                    v-if="canDeleteComment(comment)"
                    type="error"
                    text
                    size="tiny"
                    style="margin-top: 4px;"
                    @click="handleDeleteComment(comment.id)"
                  >
                    删除
                  </n-button>
                </div>

                <!-- 添加回复 -->
                <n-input
                  v-model:value="newComments[post.id]"
                  type="textarea"
                  placeholder="写下你的回复..."
                  :autosize="{ minRows: 2, maxRows: 4 }"
                  style="margin-top: 12px;"
                >
                  <template #action>
                    <n-button
                      size="small"
                      type="primary"
                      :loading="commenting[post.id]"
                      @click="handleAddComment(post.id)"
                    >
                      回复
                    </n-button>
                  </template>
                </n-input>
              </div>
            </div>
          </template>
        </n-card>
      </div>

      <div v-if="posts.length === 0 && !loading" style="text-align: center; color: #999; padding: 60px 0;">
        暂无讨论，快来发布第一条吧！
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { postsApi, commentsApi } from '@/api'
import type { FormInst } from 'naive-ui'

interface Post {
  id: number
  content: string
  createdAt: string
  author: {
    id: number
    name: string
    nickname?: string
    role: string
    avatar?: string
  }
  _count?: {
    comments: number
  }
}

interface Comment {
  id: number
  content: string
  createdAt: string
  author: {
    id: number
    name: string
    role: string
    avatar?: string
  }
}

const userStore = useUserStore()
const currentUser = computed(() => userStore.user)

const formRef = ref<FormInst>()
const loading = ref(false)
const publishing = ref(false)
const posts = ref<Post[]>([])
const expandedPostId = ref<number | null>(null)
const commentsMap = ref<Record<number, Comment[]>>({})
const newComments = ref<Record<number, string>>({})
const commenting = ref<Record<number, boolean>>({})

const newPost = reactive({
  content: ''
})

const rules = {
  content: {
    required: true,
    message: '请输入讨论内容',
    trigger: ['input', 'blur']
  }
}

const canDeletePost = (post: Post) => {
  return currentUser.value?.role === 'admin' || post.author.id === currentUser.value?.id
}

const canDeleteComment = (comment: Comment) => {
  return currentUser.value?.role === 'admin' || comment.author.id === currentUser.value?.id
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function renderMarkdown(text: string) {
  // 简单处理，实际应用可以使用 marked.js
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

async function loadPosts() {
  try {
    loading.value = true
    const res = await postsApi.getAll()
    if (res.success) {
      posts.value = res.data
    }
  } catch (error) {
    console.error('Failed to load posts:', error)
  } finally {
    loading.value = false
  }
}

async function handlePublish() {
  try {
    await formRef.value?.validate()
    publishing.value = true

    const res = await postsApi.create(newPost.content)
    if (res.success) {
      newPost.content = ''
      await loadPosts()
    }
  } catch (error: any) {
    console.error('Failed to publish:', error)
  } finally {
    publishing.value = false
  }
}

async function toggleComments(postId: number) {
  if (expandedPostId.value === postId) {
    expandedPostId.value = null
  } else {
    expandedPostId.value = postId
    await loadComments(postId)
  }
}

async function loadComments(postId: number) {
  try {
    const res = await commentsApi.getByPostId(postId)
    if (res.success) {
      commentsMap.value[postId] = res.data
    }
  } catch (error) {
    console.error('Failed to load comments:', error)
  }
}

async function handleAddComment(postId: number) {
  const content = newComments.value[postId]?.trim()
  if (!content) return

  commenting.value[postId] = true
  try {
    const res = await commentsApi.create(postId, content)
    if (res.success) {
      newComments.value[postId] = ''
      await loadComments(postId)
      await loadPosts() // 更新评论计数
    }
  } catch (error) {
    console.error('Failed to add comment:', error)
  } finally {
    commenting.value[postId] = false
  }
}

async function handleDeletePost(postId: number) {
  try {
    await postsApi.delete(postId)
    await loadPosts()
  } catch (error) {
    console.error('Failed to delete post:', error)
  }
}

async function handleDeleteComment(commentId: number) {
  try {
    await commentsApi.delete(commentId)
    const currentPostId = expandedPostId.value
    if (currentPostId) {
      await loadComments(currentPostId)
      await loadPosts()
    }
  } catch (error) {
    console.error('Failed to delete comment:', error)
  }
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.post-card {
  margin-bottom: 16px;
}
.comment-item {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 8px;
}
.comment-content {
  margin-top: 4px;
  font-size: 14px;
  line-height: 1.5;
}
.post-content {
  line-height: 1.6;
}
.post-content :deep(br) {
  display: block;
  content: "";
  margin-bottom: 0.5em;
}
</style>