import axios from 'axios'
import { useUserStore } from '@/store/user'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.oujun.work'

const api = axios.create({
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
  error?: string
}

export const authApi = {
  login(apiKey: string) {
    return api.post<LoginResponse>('/auth/login', { apiKey })
  }
}

export const usersApi = {
  getAll() {
    return api.get<ApiResponse<any[]>>('/users')
  },
  getById(id: number) {
    return api.get<ApiResponse<any>>(`/users/${id}`)
  },
  create(data: {
    apiKey: string
    name: string
    nickname?: string
    roleId: number
    avatar?: string
  }) {
    return api.post<ApiResponse<any>>('/users', data)
  },
  update(id: number, data: any) {
    return api.put<ApiResponse<any>>(`/users/${id}`, data)
  },
  delete(id: number) {
    return api.delete<ApiResponse<any>>(`/users/${id}`)
  }
}

export const postsApi = {
  getAll() {
    return api.get<ApiResponse<any[]>>('/posts')
  },
  getById(id: number) {
    return api.get<ApiResponse<any>>(`/posts/${id}`)
  },
  create(content: string) {
    return api.post<ApiResponse<any>>('/posts', { content })
  },
  delete(id: number) {
    return api.delete<ApiResponse<any>>(`/posts/${id}`)
  }
}

export const commentsApi = {
  getByPostId(postId: number) {
    return api.get<ApiResponse<any[]>>(`/posts/${postId}/comments`)
  },
  create(postId: number, content: string, parentId?: number) {
    return api.post<ApiResponse<any>>(`/posts/${postId}/comments`, { content, parentId })
  },
  delete(id: number) {
    return api.delete<ApiResponse<any>>(`/comments/${id}`)
  }
}

export default api