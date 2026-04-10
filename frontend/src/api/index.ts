import axios, { AxiosInstance } from 'axios'
import { useUserStore } from '@/store/user'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.oujun.work'

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.clearUser()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface LoginRequest {
  apiKey: string
}

export interface LoginResponse {
  success: boolean
  data: {
    user: {
      id: number
      apiKey: string
      name: string
      nickname?: string
      role: string
      avatar?: string
    }
    token: string
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

// Helper function to cast responses to unwrapped type
function unwrap<T>(promise: Promise<any>): Promise<ApiResponse<T>> {
  return promise as Promise<ApiResponse<T>>
}

export const authApi = {
  login(apiKey: string) {
    return unwrap<LoginResponse['data']>(api.post('/auth/login', { apiKey }))
  }
}

export const usersApi = {
  getAll(page: number = 1, limit: number = 50) {
    return unwrap<any>(api.get('/users', { params: { page, limit } }))
  },
  getById(id: number) {
    return unwrap<any>(api.get(`/users/${id}`))
  },
  getMe() {
    return unwrap<any>(api.get('/users/me'))
  },
  updateMe(data: { nickname?: string; avatar?: string }) {
    return unwrap<any>(api.put('/users/me', data))
  },
  create(data: {
    apiKey: string
    name: string
    nickname?: string
    roleId: number
    avatar?: string
  }) {
    return unwrap<any>(api.post('/users', data))
  },
  update(id: number, data: any) {
    return unwrap<any>(api.put(`/users/${id}`, data))
  },
  delete(id: number) {
    return unwrap<any>(api.delete(`/users/${id}`))
  }
}

export const postsApi = {
  getAll(page: number = 1, limit: number = 20, tagId?: number, followingOnly?: boolean) {
    const params: any = { page, limit }
    if (tagId !== undefined) params.tagId = tagId
    if (followingOnly) params.followingOnly = followingOnly
    return unwrap<any>(api.get('/posts', { params }))
  },
  getById(id: number) {
    return unwrap<any>(api.get(`/posts/${id}`))
  },
  create(content: string, tagIds?: number[]) {
    return unwrap<any>(api.post('/posts', { content, tagIds }))
  },
  delete(id: number) {
    return unwrap<any>(api.delete(`/posts/${id}`))
  },
  update(id: number, content: string, tagIds?: number[]) {
    return unwrap<any>(api.put(`/posts/${id}`, { content, tagIds }))
  },
  like(id: number) {
    return unwrap<{ liked: boolean; count: number }>(api.post(`/posts/${id}/like`, {}))
  }
}

export const tagsApi = {
  getAll() {
    return unwrap<any[]>(api.get('/tags'))
  },
  create(name: string, color?: string) {
    return unwrap<any>(api.post('/tags', { name, color }))
  },
  delete(id: number) {
    return unwrap<any>(api.delete(`/tags/${id}`))
  }
}

export const commentsApi = {
  getByPostId(postId: number) {
    return unwrap<any[]>(api.get(`/posts/${postId}/comments`))
  },
  create(postId: number, content: string, parentId?: number, tagIds?: number[]) {
    return unwrap<any>(api.post(`/posts/${postId}/comments`, { content, parentId, tagIds }))
  },
  delete(id: number) {
    return unwrap<any>(api.delete(`/comments/${id}`))
  },
  update(id: number, content: string) {
    return unwrap<any>(api.put(`/comments/${id}`, { content }))
  },
  like(id: number) {
    return unwrap<{ liked: boolean; count: number }>(api.post(`/comments/${id}/like`, {}))
  }
}

export const searchApi = {
  search(query: string, type: 'post' | 'comment' | 'all' = 'all', page: number = 1, limit: number = 20) {
    return unwrap<any>(api.post('/search', { query, type, page, limit }))
  }
}

export const followsApi = {
  toggleFollow(userId: number) {
    return unwrap<{ following: boolean; followingCount: number; followerCount: number }>(api.post(`/users/${userId}/follow`, {}))
  },
  getFollowing(userId: number) {
    return unwrap<Array<{ id: number; name: string; nickname?: string; avatar?: string }>>(api.get(`/users/${userId}/following`))
  },
  getFollowers(userId: number) {
    return unwrap<Array<{ id: number; name: string; nickname?: string; avatar?: string }>>(api.get(`/users/${userId}/followers`))
  },
  checkIsFollowing(userId: number) {
    return unwrap<{ isFollowing: boolean }>(api.get(`/users/${userId}/is-following`))
  }
}

export interface Notification {
  id: number
  userId: number
  type: 'follow' | 'like_post' | 'like_comment' | 'reply_comment'
  actorId: number
  actor: {
    id: number
    name: string
    nickname?: string
    avatar?: string
  }
  targetId?: number
  read: boolean
  createdAt: string
}

export const notificationsApi = {
  getNotifications(page: number = 1, limit: number = 20) {
    return unwrap<any>(api.get('/notifications', { params: { page, limit } }))
  },
  markAsRead(notificationId: number) {
    return unwrap<any>(api.post(`/notifications/${notificationId}/read`, {}))
  },
  markAllAsRead() {
    return unwrap<any>(api.post('/notifications/read-all', {}))
  },
  getUnreadCount() {
    return unwrap<{ count: number }>(api.get('/notifications/unread-count'))
  }
}

export default api
