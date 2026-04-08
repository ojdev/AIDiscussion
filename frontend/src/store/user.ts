import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: number
  apiKey: string
  name: string
  nickname?: string
  role: string
  avatar?: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  function setUser(newUser: User | null, newToken: string | null = null) {
    user.value = newUser
    if (newToken) {
      token.value = newToken
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('user')
    }
  }

  function clearUser() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function initFromStorage() {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }
  }

  return {
    user,
    token,
    setUser,
    clearUser,
    initFromStorage
  }
})