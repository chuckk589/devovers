import { DateTimeZoneUtil } from '@/utils/date-timezone.util'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

interface TimeSlot {
  id: string
  date: string
  time: string
  displayTime: string
  isBooked: boolean
  isBlocked: boolean
  status: 'available' | 'booked' | 'blocked'
}

export interface CreateAppointmentData {
  serviceId: string
  customService?: string
  maintenanceInfo?: string
  carBrand?: string
  customCarBrand?: string
  carModel?: string
  carYear?: string
  licensePlate?: string
  appointmentDate: string
  timeSlot: string
  clientName?: string
  clientPhone?: string
  comment?: string
  telegramId?: number
}

export interface Appointment {
  id: string
  fancyID: string
  serviceId: string
  customService?: string
  maintenanceInfo?: string
  carBrand: string
  customCarBrand?: string
  carModel?: string
  carYear?: string
  licensePlate?: string
  appointmentDate: string
  timeSlot: string
  clientName?: string
  clientPhone?: string
  comment?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    telegramId: number
    username?: string
    firstName?: string
    lastName?: string
  }
}

export const useAppointmentsStore = defineStore('appointments', () => {
  // State
  const allSlots = ref<TimeSlot[]>([]) // Все загруженные слоты для всех дат
  const selectedDate = ref<Date | null>(null) // Выбранная дата
  const isLoadingSlots = ref(false)
  const error = ref<string | null>(null)

  // Computed: слоты для выбранной даты
  const availableSlots = computed(() => {
    const stringDate = `${selectedDate.value?.getFullYear()}-${String(selectedDate.value!.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.value?.getDate()).padStart(2, '0')}`
    if (!stringDate) return []
    return allSlots.value.filter(slot => slot.date === stringDate)
  })

  // Computed: доступность дат (дата -> количество доступных слотов)
  const dateAvailability = computed(() => {
    const availability = new Map<string, number>()
    allSlots.value.forEach(slot => {
      if (slot.status === 'available') {
        const count = availability.get(slot.date) || 0
        availability.set(slot.date, count + 1)
      }
    })
    return availability
  })

  // Actions
  async function loadAllAvailableSlots() {
    isLoadingSlots.value = true
    error.value = null

    try {
      const response = await fetch('/api/appointments/available-slots')

      if (!response.ok) {
        throw new Error('Ошибка загрузки слотов')
      }

      const data: TimeSlot[] = await response.json()
      allSlots.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при загрузке слотов'
      console.error('Ошибка загрузки слотов:', err)
      allSlots.value = []
    } finally {
      isLoadingSlots.value = false
    }
  }

  function setSelectedDate(date: Date) {
    selectedDate.value = date
  }

  function clearSlots() {
    allSlots.value = []
    selectedDate.value = null
    error.value = null
  }

  async function createAppointment(data: CreateAppointmentData) {
    error.value = null
    
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Ошибка при создании записи')
      }

      const appointment = await response.json()
      
      // Перезагружаем слоты после создания записи
      await loadAllAvailableSlots()
      
      return appointment
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при создании записи'
      console.error('Ошибка создания записи:', err)
      throw err
    }
  }

  const userAppointments = ref<Appointment[]>([])
  const isLoadingAppointments = ref(false)

  async function loadUserAppointments(telegramId: number) {
    isLoadingAppointments.value = true
    error.value = null

    try {
      const response = await fetch(`/api/appointments/by-telegram/${telegramId}`)

      if (!response.ok) {
        throw new Error('Ошибка загрузки заявок')
      }

      const data: Appointment[] = await response.json()
      userAppointments.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при загрузке заявок'
      console.error('Ошибка загрузки заявок:', err)
      userAppointments.value = []
    } finally {
      isLoadingAppointments.value = false
    }
  }

  // Для админ-панели: загрузка всех заявок
  const allAppointments = ref<Appointment[]>([])
  const isLoadingAllAppointments = ref(false)

  async function loadAllAppointments() {
    isLoadingAllAppointments.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      const token = authStore.token
      
      if (!token) {
        throw new Error('Токен авторизации не найден')
      }

      const response = await fetch(`/api/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Не удалось загрузить заявки')
      }

      const data: Appointment[] = await response.json()
      allAppointments.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка при загрузке заявок'
      console.error('Ошибка загрузки заявок:', err)
      allAppointments.value = []
    } finally {
      isLoadingAllAppointments.value = false
    }
  }

  async function cancelAppointment(appointmentId: string) {
    error.value = null

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Ошибка при отмене заявки')
      }

      const appointment = await response.json()
      return appointment
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при отмене заявки'
      console.error('Ошибка отмены заявки:', err)
      throw err
    }
  }

  async function updateAppointmentStatus(appointmentId: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') {
    error.value = null

    try {
      const authStore = useAuthStore()
      const token = authStore.token
      
      if (!token) {
        throw new Error('Токен авторизации не найден')
      }

      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Ошибка при изменении статуса')
      }

      const appointment = await response.json()
      
      // Обновляем заявку в списке
      const index = allAppointments.value.findIndex(a => a.id === appointmentId)
      if (index !== -1) {
        allAppointments.value[index] = appointment
      }
      
      return appointment
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при изменении статуса'
      console.error('Ошибка изменения статуса:', err)
      throw err
    }
  }

  return {
    // State
    allSlots,
    selectedDate,
    availableSlots,
    dateAvailability,
    isLoadingSlots,
    error,
    userAppointments,
    isLoadingAppointments,
    allAppointments,
    isLoadingAllAppointments,
    // Actions
    loadAllAvailableSlots,
    setSelectedDate,
    clearSlots,
    createAppointment,
    loadUserAppointments,
    cancelAppointment,
    loadAllAppointments,
    updateAppointmentStatus,
  }
})

