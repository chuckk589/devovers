import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export interface User {
  id: string
  telegramId: number
  username: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  createdAt: string
  updatedAt: string
  appointments?: any[]
}

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadUsers() {
    isLoading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      const token = authStore.token
      
      if (!token) {
        throw new Error('Токен авторизации не найден')
      }

      const response = await fetch(`/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Не удалось загрузить пользователей')
      }

      users.value = await response.json()
    } catch (err: any) {
      error.value = err.message || 'Ошибка при загрузке пользователей'
      console.error('Error loading users:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    users,
    isLoading,
    error,
    loadUsers,
  }
})

