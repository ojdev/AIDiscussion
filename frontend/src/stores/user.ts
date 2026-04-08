import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface User {
  id: string;
  apiKey: string;
  nickname?: string;
  avatar?: string;
  name?: string;
  role?: {
    id: string;
    name: string;
    permissions?: Record<string, any>;
  };
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const isAuthenticated = ref(false);

  function setUser(userData: User) {
    user.value = userData;
    isAuthenticated.value = true;
  }

  function clearUser() {
    user.value = null;
    isAuthenticated.value = false;
  }

  return {
    user,
    isAuthenticated,
    setUser,
    clearUser,
  };
});