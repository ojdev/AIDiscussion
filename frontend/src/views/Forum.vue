<template>
  <div>
    <!-- 搜索区域 -->
    <n-card title="搜索" style="margin-bottom: 24px;">
      <n-space>
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索帖子和评论..."
          clearable
          @keyup.enter="handleSearch"
          style="width: 300px;"
        >
          <template #prefix>
            <n-icon><SearchIcon /></n-icon>
          </template>
        </n-input>
        <n-button type="primary" :loading="searching" @click="handleSearch">
          搜索
        </n-button>
        <n-button v-if="hasSearched" @click="clearSearch">
          清除
        </n-button>
      </n-space>
    </n-card>

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

    <!-- 搜索结果显示 -->
    <div v-if="hasSearched" style="margin-bottom: 24px;">
      <n-card title="搜索结果">
        <div v-if="searchLoading" style="text-align: center; padding: 40px;">
          <n-spin size="large" />
        </div>
        <div v-else>
          <n-empty v-if="searchResults.length === 0" description="未找到相关结果" />
          <div v-else>
            <n-list hoverable clickable>
              <n-list-item v-for="item in searchResults" :key="`${item.type}-${item.id}`">
                <n-space vertical>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <n-tag :type="item.type === 'post' ? 'primary' : 'success'" :bordered="false">
                      {{ item.type === 'post' ? '帖子' : '评论' }}
                    </n-tag>
                    <n-text depth="3">{{ formatDate(item.createdAt) }}</n-text>
                    <n-space>
                      <n-avatar
                        round
                        size="small"
                        :src="item.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author.name}`"
                      />
                      <span>{{ item.author.name }}</span>
                      <n-tag v-if="item.author.nickname" type="info" :bordered="false" size="small">
                        {{ item.author.nickname }}
                      </n-tag>
                      <n-tag size="small" :type="item.author.role === 'admin' ? 'error' : 'default'">
                        {{ item.author.role }}
                      </n-tag>
                    </n-space>
                  </div>
                  <div class="search-content" v-html="renderMarkdown(item.content)"></div>
                  <n-button
                    v-if="item.type === 'comment'"
                    text
                    type="primary"
                    size="small"
                    @click="goToPost(item.postId)"
                  >
                    查看原帖子
                  </n-button>
                </n-space>
              </n-list-item>
            </n-list>
            <!-- 搜索分页 -->
            <div v-if="searchPagination.totalPages > 1" style="margin-top: 16px; display: flex; justify-content: center; gap: 8px;">
              <n-button
                :disabled="searchPagination.page === 1"
                @click="loadSearchPage(searchPagination.page - 1)"
              >
                上一页
              </n-button>
              <n-text depth="3">第 {{ searchPagination.page }} 页 / 共 {{ searchPagination.totalPages }} 页 ({{ searchPagination.total }} 条结果)</n-text>
              <n-button
                :disabled="searchPagination.page >= searchPagination.totalPages"
                @click="loadSearchPage(searchPagination.page + 1)"
              >
                下一页
              </n-button>
            </div>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 讨论列表分页控制 -->
    <div v-if="!hasSearched" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <n-text depth="3">共 {{ pagination.total }} 条讨论，当前第 {{ pagination.page }} / {{ pagination.totalPages }} 页</n-text>
      <n-space>
        <n-button
          :disabled="pagination.page === 1"
          @click="loadPage(pagination.page - 1)"
        >
          上一页
        </n-button>
        <n-button
          :disabled="pagination.page >= pagination.totalPages"
          @click="loadPage(pagination.page + 1)"
        >
          下一页
        </n-button>
      </n-space>
    </div>

    <!-- 讨论列表 -->
    <div v-if="loading" style="text-align: center; padding: 40px;">
      <n-spin size="large" />
    </div>

    <div v-else-if="!hasSearched">
      <div v-for="post in posts" :key="post.id" class="post-card">
        <n-card :title="post.author.name" size="small">
          <template #header-extra>
            <div style="display: flex; align-items: center; gap: 12px;">
              <n-tag v-if="post.author.nickname" type="info" :bordered="false" size="small">
                {{ post.author.nickname }}
              </n-tag>
              <n-tag :bordered="false" :type="post.author.role === 'admin' ? 'error' : 'default'">
                {{ post.author.role === 'admin' ? '管理员' : '用户' }}
              </n-tag>
              <n-text depth="3">{{ formatDate(post.createdAt) }}</n-text>
            </div>
          </template>

          <!-- 编辑模式 -->
          <div v-if="editingPostId === post.id">
            <n-input
              v-model:value="editingPostContent"
              type="textarea"
              placeholder="请输入讨论内容"
              :autosize="{ minRows: 3, maxRows: 6 }"
            />
            <div style="margin-top: 8px; display: flex; gap: 8px;">
              <n-button type="primary" size="small" :loading="savingPostId === post.id" @click="handleSavePost(post.id)">
                保存
              </n-button>
              <n-button size="small" @click="cancelEditPost">
                取消
              </n-button>
            </div>
          </div>

          <!-- 显示模式 -->
          <div v-else>
            <div class="post-content" v-html="renderMarkdown(post.content)"></div>
          </div>

          <template #footer>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <n-button text type="primary" @click="toggleComments(post.id)">
                查看回复 ({{ post._count?.comments || 0 }})
              </n-button>

              <div v-if="canEditPost(post)">
                <n-button
                  v-if="editingPostId !== post.id"
                  text
                  type="primary"
                  @click="startEditPost(post.id, post.content)"
                >
                  编辑
                </n-button>
              </div>

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
                  <!-- 头部：头像 + 用户信息 + 时间 -->
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <n-avatar
                      round
                      size="small"
                      :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.name}`"
                    />
                    <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
                      <span style="font-weight: 500;">{{ comment.author.name }}</span>
                      <n-tag v-if="comment.author.nickname" type="info" :bordered="false" size="small">
                        {{ comment.author.nickname }}
                      </n-tag>
                      <n-tag size="small" :type="comment.author.role === 'admin' ? 'error' : 'default'">
                        {{ comment.author.role }}
                      </n-tag>
                    </div>
                    <n-text depth="3" style="font-size: 12px;">
                      {{ formatDate(comment.createdAt) }}
                    </n-text>
                  </div>

                  <!-- 评论内容 -->
                  <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                    <div class="comment-content" v-html="renderMarkdown(comment.content)"></div>
                  </div>

                  <!-- 底部操作栏 -->
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <n-button
                      text
                      type="primary"
                      size="tiny"
                      @click="startReply(comment.id)"
                    >
                      回复
                    </n-button>
                    <n-button
                      v-if="canEditComment(comment)"
                      text
                      type="primary"
                      size="tiny"
                      @click="startEditComment(comment.id, comment.content)"
                    >
                      编辑
                    </n-button>
                    <n-button
                      v-if="canDeleteComment(comment)"
                      type="error"
                      text
                      size="tiny"
                      @click="handleDeleteComment(comment.id)"
                    >
                      删除
                    </n-button>
                  </div>

                  <!-- 嵌套回复输入框 (展开时) -->
                  <div v-if="replyingCommentId === comment.id" style="margin-top: 12px; margin-left: 24px;">
                    <n-input
                      v-model:value="newComments[comment.id]"
                      type="textarea"
                      placeholder="写下你的回复..."
                      :autosize="{ minRows: 2, maxRows: 4 }"
                    />
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                      <n-button type="primary" size="tiny" :loading="commenting[comment.id]" @click="handleAddComment(post.id, comment.id)">
                        发送
                      </n-button>
                      <n-button size="tiny" @click="cancelReplyComment">
                        取消
                      </n-button>
                    </div>
                  </div>
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
import { useMessage } from 'naive-ui'
import { postsApi, commentsApi, searchApi } from '@/api'
import { marked } from 'marked'
import { Search as SearchIcon } from '@vicons/ionicons5'
import type { FormInst } from 'naive-ui'

const message = useMessage()

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
    nickname?: string
    role: string
    avatar?: string
  }
  postId: number
}

interface SearchResult {
  type: 'post' | 'comment'
  id: number
  content: string
  author: {
    id: number
    name: string
    nickname?: string
    role: string
    avatar?: string
  }
  postId?: number
  createdAt: string
}

const userStore = useUserStore()
const currentUser = computed(() => userStore.user)

const formRef = ref<FormInst>()
const loading = ref(false)
const publishing = ref(false)
const posts = ref<Post[]>([])

// Pagination state for posts
const pagination = ref({
  page: 1,
  totalPages: 1,
  total: 0,
})

// Search state
const searchQuery = ref('')
const searching = ref(false)
const hasSearched = ref(false)
const searchLoading = ref(false)
const searchResults = ref<SearchResult[]>([])
const searchPagination = ref({
  page: 1,
  totalPages: 1,
  total: 0,
})

const expandedPostId = ref<number | null>(null)
const commentsMap = ref<Record<number, Comment[]>>({})
const newComments = ref<Record<number, string>>({})
const commenting = ref<Record<number, boolean>>({})
// 正在回复的评论ID（用于嵌套回复）
const replyingCommentId = ref<number | null>(null)

// Editing states
const editingPostId = ref<number | null>(null)
const editingPostContent = ref('')
const savingPostId = ref<number | null>(null)

const editingCommentId = ref<number | null>(null)
const editingCommentContent = ref('')
const savingCommentId = ref<number | null>(null)

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

const canEditPost = (post: Post) => {
  return currentUser.value?.role === 'admin' || post.author.id === currentUser.value?.id
}

const canDeleteComment = (comment: Comment) => {
  return currentUser.value?.role === 'admin' || comment.author.id === currentUser.value?.id
}

const canEditComment = (comment: Comment) => {
  return currentUser.value?.role === 'admin' || comment.author.id === currentUser.value?.id
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function renderMarkdown(text: string) {
  return marked(text)
}

// Load posts with pagination
async function loadPosts(page: number = pagination.value.page) {
  try {
    loading.value = true
    const res = await postsApi.getAll(page, 20)
    if (res.success) {
      posts.value = res.data as any[]
      if (res.pagination) {
        pagination.value = {
          page: res.pagination.page,
          totalPages: res.pagination.totalPages,
          total: res.pagination.total,
        }
      }
    }
  } catch (error) {
    console.error('Failed to load posts:', error)
  } finally {
    loading.value = false
  }
}

async function loadPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages) return
  pagination.value.page = page
  await loadPosts(page)
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function handlePublish() {
  try {
    await formRef.value?.validate()
    publishing.value = true

    const res = await postsApi.create(newPost.content)
    if (res.success) {
      newPost.content = ''
      await loadPosts(1) // Refresh to first page after creating new post
      message.success('发布成功')
    } else {
      message.error(res.error || '发布失败')
    }
  } catch (error: any) {
    console.error('Failed to publish:', error)
  } finally {
    publishing.value = false
  }
}

// 帖子编辑功能
function startEditPost(postId: number, content: string) {
  editingPostId.value = postId
  editingPostContent.value = content
}

function cancelEditPost() {
  editingPostId.value = null
  editingPostContent.value = ''
}

async function handleSavePost(postId: number) {
  if (!editingPostContent.value.trim()) {
    return
  }

  savingPostId.value = postId
  try {
    const res = await postsApi.update(postId, editingPostContent.value)
    if (res.success) {
      await loadPosts(pagination.value.page)
      cancelEditPost()
      message.success('更新成功')
    }
  } catch (error) {
    console.error('Failed to update post:', error)
    message.error('更新失败')
  } finally {
    savingPostId.value = null
  }
}

// 评论编辑功能
function startEditComment(commentId: number, content: string) {
  editingCommentId.value = commentId
  editingCommentContent.value = content
}

function cancelEditComment() {
  editingCommentId.value = null
  editingCommentContent.value = ''
}

async function handleSaveComment(commentId: number, postId: number) {
  if (!editingCommentContent.value.trim()) {
    return
  }

  savingCommentId.value = commentId
  try {
    const res = await commentsApi.update(commentId, editingCommentContent.value)
    if (res.success) {
      await loadComments(postId)
      await loadPosts(pagination.value.page)
      cancelEditComment()
      message.success('评论更新成功')
    }
  } catch (error) {
    console.error('Failed to update comment:', error)
    message.error('更新失败')
  } finally {
    savingCommentId.value = null
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
    if (res.success && res.data) {
      commentsMap.value[postId] = res.data
    }
  } catch (error) {
    console.error('Failed to load comments:', error)
  }
}

function startReply(commentId: number) {
  replyingCommentId.value = commentId
}

function cancelReplyComment() {
  replyingCommentId.value = null
}

async function handleAddComment(postId: number, parentId?: number) {
  // 确定使用哪个key：如果是嵌套回复，则用parentId作为key
  const key = parentId ?? postId
  const content = newComments.value[key]?.trim()
  if (!content) return

  commenting.value[key] = true
  try {
    const res = await commentsApi.create(postId, content, parentId)
    if (res.success) {
      newComments.value[key] = ''
      // 如果是嵌套回复，关闭回复框
      if (parentId) {
        replyingCommentId.value = null
      }
      await loadComments(postId)
      await loadPosts(pagination.value.page) // 更新评论计数
      message.success('回复成功')
    } else {
      message.error(res.error || '回复失败')
    }
  } catch (error) {
    console.error('Failed to add comment:', error)
  } finally {
    commenting.value[key] = false
  }
}

async function handleDeletePost(postId: number) {
  try {
    await postsApi.delete(postId)
    await loadPosts(pagination.value.page)
    message.success('删除成功')
  } catch (error: any) {
    message.error(error?.error || '删除失败')
  }
}

async function handleDeleteComment(commentId: number) {
  try {
    await commentsApi.delete(commentId)
    const currentPostId = expandedPostId.value
    if (currentPostId) {
      await loadComments(currentPostId)
      await loadPosts(pagination.value.page)
    }
    message.success('删除成功')
  } catch (error: any) {
    message.error(error?.error || '删除失败')
  }
}

// Search functionality
async function handleSearch() {
  const query = searchQuery.value.trim()
  if (!query) {
    message.warning('请输入搜索关键词')
    return
  }

  searching.value = true
  hasSearched.value = true
  searchPagination.value.page = 1 // Reset to first page
  await loadSearchResults(1)
}

async function loadSearchResults(page: number = 1) {
  const query = searchQuery.value.trim()
  if (!query) return

  searchLoading.value = true
  try {
    const res = await searchApi.search(query, 'all', page, 20)
    if (res.success) {
      searchResults.value = res.data as SearchResult[]
      if (res.pagination) {
        searchPagination.value = {
          page: res.pagination.page,
          totalPages: res.pagination.totalPages,
          total: res.pagination.total,
        }
      }
    }
  } catch (error) {
    console.error('Failed to search:', error)
    message.error('搜索失败')
  } finally {
    searchLoading.value = false
    searching.value = false
  }
}

async function loadSearchPage(page: number) {
  if (page < 1 || page > searchPagination.value.totalPages) return
  searchPagination.value.page = page
  await loadSearchResults(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearSearch() {
  searchQuery.value = ''
  hasSearched.value = false
  searchResults.value = []
  searchPagination.value = { page: 1, totalPages: 1, total: 0 }
}

function goToPost(postId: number | undefined) {
  if (postId === undefined) return
  // Navigate to post - for now just expand it
  expandedPostId.value = postId
  loadComments(postId)
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
.search-content {
  line-height: 1.6;
}
.search-content :deep(br) {
  display: block;
  content: "";
  margin-bottom: 0.5em;
}
</style>
