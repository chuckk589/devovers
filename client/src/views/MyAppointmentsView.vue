<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppointmentsStore } from '../stores/appointments'
import { useTelegramStore } from '../stores/telegram'

const router = useRouter()
const appointmentsStore = useAppointmentsStore()
const telegramStore = useTelegramStore()

const cancellingId = ref<string | null>(null)

const handleCancelAppointment = async (appointmentId: string) => {
  if (!confirm('Вы уверены, что хотите отменить эту заявку?')) {
    return
  }

  cancellingId.value = appointmentId
  try {
    await appointmentsStore.cancelAppointment(appointmentId)
    // Перезагружаем список заявок
    if (telegramStore.userId) {
      await appointmentsStore.loadUserAppointments(telegramStore.userId)
    }
  } catch (error) {
    console.error('Ошибка при отмене заявки:', error)
    alert('Не удалось отменить заявку. Попробуйте позже.')
  } finally {
    cancellingId.value = null
  }
}

// Форматирование даты для отображения
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  }
  return date.toLocaleDateString('ru-RU', options)
}

// Получение статуса на русском
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'Ожидает подтверждения',
    confirmed: 'Подтверждена',
    completed: 'Завершена',
    cancelled: 'Отменена'
  }
  return statusMap[status] || status
}

// Получение цвета статуса
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    confirmed: 'info',
    completed: 'success',
    cancelled: 'error'
  }
  return colorMap[status] || 'default'
}

// Получение названия услуги
const getServiceLabel = (appointment: any) => {
  if (appointment.customService) {
    return appointment.customService
  }
  const serviceMap: Record<string, string> = {
    maintenance: 'Техническое обслуживание (ТО)',
    diagnostics: 'Диагностика',
    suspension: 'Ремонт ходовой',
    'tire-service': 'Шиномонтаж',
    bodywork: 'Кузовные работы',
    other: 'Другое'
  }
  return serviceMap[appointment.serviceId] || appointment.serviceId
}

onMounted(async () => {
  if (telegramStore.userId) {
    await appointmentsStore.loadUserAppointments(telegramStore.userId)
  }
})
</script>

<template>
  <div class="my-appointments-view">
    <div class="header">
      <v-btn
        icon
        variant="text"
        @click="router.push({ name: 'home' })"
        class="back-button"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <h1 class="title">Мои записи</h1>
    </div>

    <div class="content">
      <div v-if="appointmentsStore.isLoadingAppointments" class="loading">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <div class="loading-text">Загрузка записей...</div>
      </div>

      <div v-else-if="appointmentsStore.error" class="error-message">
        <v-alert type="error" variant="tonal" density="compact">
          {{ appointmentsStore.error }}
        </v-alert>
      </div>

      <div v-else-if="appointmentsStore.userAppointments.length === 0" class="empty-state">
        <v-icon size="64" color="grey-lighten-1">mdi-calendar-remove</v-icon>
        <div class="empty-title">У вас нет записей</div>
        <div class="empty-subtitle">Запишитесь на услугу, чтобы увидеть их здесь</div>
        <v-btn
          color="primary"
          variant="elevated"
          @click="router.push({ name: 'booking' })"
          class="mt-4"
        >
          Записаться на услугу
        </v-btn>
      </div>

      <div v-else class="appointments-list">
        <v-card
          v-for="appointment in appointmentsStore.userAppointments"
          :key="appointment.id"
          class="appointment-card"
          elevation="2"
        >
          <v-card-title class="appointment-header">
            <div class="appointment-id">{{ appointment.fancyID }}</div>
            <v-chip
              :color="getStatusColor(appointment.status)"
              size="small"
              variant="flat"
            >
              {{ getStatusLabel(appointment.status) }}
            </v-chip>
          </v-card-title>

          <v-card-text>
            <div class="appointment-info">
              <div class="info-row">
                <v-icon size="20" color="primary">mdi-wrench</v-icon>
                <span class="info-label">Услуга:</span>
                <span class="info-value">{{ getServiceLabel(appointment) }}</span>
              </div>

              <div v-if="appointment.maintenanceInfo" class="info-row">
                <v-icon size="20" color="primary">mdi-information</v-icon>
                <span class="info-label">Доп. информация:</span>
                <span class="info-value">{{ appointment.maintenanceInfo }}</span>
              </div>

              <div class="info-row">
                <v-icon size="20" color="primary">mdi-calendar</v-icon>
                <span class="info-label">Дата:</span>
                <span class="info-value">{{ formatDate(appointment.appointmentDate) }}</span>
              </div>

              <div class="info-row">
                <v-icon size="20" color="primary">mdi-clock-outline</v-icon>
                <span class="info-label">Время:</span>
                <span class="info-value">{{ appointment.timeSlot }}</span>
              </div>

              <div class="info-row">
                <v-icon size="20" color="primary">mdi-car</v-icon>
                <span class="info-label">Автомобиль:</span>
                <span class="info-value">
                  {{ appointment.customCarBrand || appointment.carBrand }}
                  <span v-if="appointment.carModel"> {{ appointment.carModel }}</span>
                  <span v-if="appointment.carYear"> ({{ appointment.carYear }})</span>
                </span>
              </div>

              <div v-if="appointment.licensePlate" class="info-row">
                <v-icon size="20" color="primary">mdi-license</v-icon>
                <span class="info-label">Госномер:</span>
                <span class="info-value">{{ appointment.licensePlate }}</span>
              </div>

              <div v-if="appointment.comment" class="info-row">
                <v-icon size="20" color="primary">mdi-comment-text</v-icon>
                <span class="info-label">Комментарий:</span>
                <span class="info-value">{{ appointment.comment }}</span>
              </div>
            </div>
          </v-card-text>

          <v-card-actions v-if="appointment.status !== 'cancelled' && appointment.status !== 'completed'">
            <v-spacer></v-spacer>
            <v-btn
              color="error"
              variant="outlined"
              @click="handleCancelAppointment(appointment.id)"
              :loading="cancellingId === appointment.id"
              :disabled="cancellingId !== null"
            >
              <v-icon start>mdi-cancel</v-icon>
              Отменить заявку
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.my-appointments-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  padding: 16px;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-top: 16px;
}

.back-button {
  color: #424242;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #424242;
  margin: 0;
}

.content {
  max-width: 800px;
  margin: 0 auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  gap: 16px;
}

.loading-text {
  font-size: 16px;
  color: #757575;
}

.error-message {
  margin-bottom: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  text-align: center;
  gap: 16px;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #424242;
}

.empty-subtitle {
  font-size: 14px;
  color: #757575;
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.appointment-card {
  border-radius: 12px;
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.appointment-id {
  font-size: 18px;
  font-weight: 600;
  color: #1976d2;
  font-family: 'Courier New', monospace;
}

.appointment-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.info-label {
  font-weight: 500;
  color: #757575;
  min-width: 120px;
  font-size: 14px;
}

.info-value {
  color: #424242;
  font-size: 14px;
  flex: 1;
  word-break: break-word;
}

@media (max-width: 600px) {
  .title {
    font-size: 24px;
  }

  .appointment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .info-label {
    min-width: 100px;
    font-size: 13px;
  }

  .info-value {
    font-size: 13px;
  }
}
</style>

