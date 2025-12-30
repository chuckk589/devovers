import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

interface ScheduleConfig {
  id: string
  slotInterval: number
  startTime: string
  endTime: string
  hasLunchBreak: boolean
  lunchStart: string | null
  lunchEnd: string | null
  workingDays: number[]
  availableDaysRange: number
  timezone: string
  createdAt: string
  updatedAt: string
}

export const useScheduleConfigStore = defineStore('scheduleConfig', () => {
  const authStore = useAuthStore()

  // State
  const config = ref<ScheduleConfig | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function loadConfig() {
    if (!authStore.token) {
      error.value = 'Необходима авторизация'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/api/schedule-config', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки конфигурации')
      }

      const data = await response.json()
      config.value = {
        ...data,
        workingDays: data.workingDays.map(Number)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при загрузке конфигурации'
      console.error('Ошибка загрузки конфигурации:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function updateConfig(updateData: {
    slotInterval?: number
    startTime?: string
    endTime?: string
    hasLunchBreak?: boolean
    lunchStart?: string | null
    lunchEnd?: string | null
    workingDays?: number[]
    availableDaysRange?: number
    timezone?: string
  }) {
    if (!authStore.token) {
      error.value = 'Необходима авторизация'
      return
    }

    isSaving.value = true
    error.value = null

    try {
      const response = await fetch('/api/schedule-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Ошибка сохранения конфигурации')
      }

      const data = await response.json()
      config.value = {
        ...data,
        workingDays: typeof data.workingDays === 'string'
          ? data.workingDays.split(',').map(Number)
          : data.workingDays.map(Number),
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при сохранении конфигурации'
      console.error('Ошибка сохранения конфигурации:', err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  function clearConfig() {
    config.value = null
    error.value = null
  }

  return {
    // State
    config,
    isLoading,
    isSaving,
    error,
    // Actions
    loadConfig,
    updateConfig,
    clearConfig,
  }
})

