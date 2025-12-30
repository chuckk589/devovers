import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface LoginCredentials {
  username: string
  password: string
}

interface User {
  id: string
  username: string
  email?: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const currentUser = computed(() => user.value)

  // Actions
  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Ошибка авторизации')
      }

      const data = await response.json()
      
      token.value = data.token
      user.value = data.user

      console.log(data)
      // Сохраняем токен в localStorage
      localStorage.setItem('auth_token', data.token)
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при авторизации'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    
    try {
      await fetch(`/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }).catch(() => {
        // Игнорируем ошибки при логауте
      })
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      isLoading.value = false
      
      // Перенаправление на страницу логина происходит в компоненте
    }
  }

  async function checkAuth() {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        const response = await fetch(`/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          token.value = storedToken
          user.value = data.user || JSON.parse(storedUser)
        } else {
          // Токен недействителен
          clearAuth()
        }
      } catch (err) {
        clearAuth()
      }
    }
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  }

  // Инициализация при создании store (только загрузка из localStorage)
  const storedToken = localStorage.getItem('auth_token')
  const storedUser = localStorage.getItem('user')
  
  if (storedToken && storedUser) {
    token.value = storedToken
    try {
      user.value = JSON.parse(storedUser)
    } catch {
      user.value = null
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    currentUser,
    // Actions
    login,
    logout,
    checkAuth,
    clearAuth,
  }
})

