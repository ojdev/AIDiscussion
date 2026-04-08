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
  getAll() {
    return unwrap<any[]>(api.get('/users'))
  },
  getById(id: number) {
    return unwrap<any>(api.get(`/users/${id}`))
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
  getAll() {
    return unwrap<any[]>(api.get('/posts'))
  },
  getById(id: number) {
    return unwrap<any>(api.get(`/posts/${id}`))
  },
  create(content: string) {
    return unwrap<any>(api.post('/posts', { content }))
  },
  delete(id: number) {
    return unwrap<any>(api.delete(`/posts/${id}`))
  },
  update(id: number, content: string) {
    return unwrap<any>(api.put(`/posts/${id}`, { content }))
  }
}

export const commentsApi = {
  getByPostId(postId: number) {
    return unwrap<any[]>(api.get(`/posts/${postId}/comments`))
  },
  create(postId: number, content: string, parentId?: number) {
    return unwrap<any>(api.post(`/posts/${postId}/comments`, { content, parentId }))
  },
  delete(id: number) {
    return unwrap<any>(api.delete(`/comments/${id}`))
  },
  update(id: number, content: string) {
    return unwrap<any>(api.put(`/comments/${id}`, { content }))
  }
}

export default api
