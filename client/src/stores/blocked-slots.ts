import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export interface BlockedSlot {
  id: string
  date: string
  timeSlot: string
  createdAt: string
  updatedAt: string
}

export interface CreateBlockedSlotDto {
  date: string
  timeSlot?: string
}

export const useBlockedSlotsStore = defineStore('blockedSlots', () => {
  const blockedSlots = ref<BlockedSlot[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadBlockedSlots(start?: string, end?: string) {
    isLoading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      const token = authStore.token
      
      if (!token) {
        throw new Error('Токен авторизации не найден')
      }

      const url = new URL('/api/blocked-slots', window.location.origin)
      if (start && end) {
        url.searchParams.append('start', start)
        url.searchParams.append('end', end)
      } else if (start) {
        url.searchParams.append('date', start)
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки заблокированных слотов')
      }

      const data: BlockedSlot[] = await response.json()
      blockedSlots.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при загрузке заблокированных слотов'
      console.error('Ошибка загрузки заблокированных слотов:', err)
      blockedSlots.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Проверка, заблокирован ли конкретный слот
  function isSlotBlocked(date: string, timeSlot: string): boolean {
    const timeSlotWithSeconds = timeSlot + ':00'
    return blockedSlots.value.some(slot => slot.date === date && slot.timeSlot === timeSlotWithSeconds)
  }

  // Получить заблокированный слот по дате и времени
  function getBlockedSlot(date: string, timeSlot: string): BlockedSlot | null {
    const timeSlotWithSeconds = timeSlot + ':00'
    return blockedSlots.value.find(slot => slot.date === date && slot.timeSlot === timeSlotWithSeconds) || null
  }

  async function createBlockedSlot(dto: CreateBlockedSlotDto) {
    error.value = null

    try {
      const authStore = useAuthStore()
      const token = authStore.token
      
      if (!token) {
        throw new Error('Токен авторизации не найден')
      }

      const response = await fetch('/api/blocked-slots', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Ошибка при создании блокировки')
      }

      const blockedSlot: BlockedSlot = await response.json()
      
      // Добавляем в список
      blockedSlots.value.push(blockedSlot)
      
      return blockedSlot
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при создании блокировки'
      console.error('Ошибка создания блокировки:', err)
      throw err
    }
  }

  async function deleteBlockedSlot(id: string) {
    error.value = null

    try {
      const authStore = useAuthStore()
      const token = authStore.token
      
      if (!token) {
        throw new Error('Токен авторизации не найден')
      }

      const response = await fetch(`/api/blocked-slots/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Ошибка при удалении блокировки')
      }

      // Удаляем из списка
      const index = blockedSlots.value.findIndex(slot => slot.id === id)
      if (index !== -1) {
        blockedSlots.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при удалении блокировки'
      console.error('Ошибка удаления блокировки:', err)
      throw err
    }
  }

  return {
    // State
    blockedSlots,
    isLoading,
    error,
    // Methods
    loadBlockedSlots,
    isSlotBlocked,
    getBlockedSlot,
    createBlockedSlot,
    deleteBlockedSlot,
  }
})

