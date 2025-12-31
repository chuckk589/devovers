<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useScheduleConfigStore } from '../stores/schedule-config'
import { useAppointmentsStore } from '../stores/appointments'
import { useBlockedSlotsStore } from '../stores/blocked-slots'

const router = useRouter()

const scheduleConfigStore = useScheduleConfigStore()
const appointmentsStore = useAppointmentsStore()
const blockedSlotsStore = useBlockedSlotsStore()

const slotInterval = ref<number>(2)
const startTime = ref<string>('10:00')
const endTime = ref<string>('18:00')
const lunchStart = ref<string>('13:00')
const lunchEnd = ref<string>('14:00')
const hasLunchBreak = ref<boolean>(true)
const availableDaysRange = ref<number>(14)
const timezone = ref<string>('Europe/Moscow')

const workingDays = ref<number[]>([1, 2, 3, 4, 5])
const selectedRange = ref<{ start: string, end: string }>({ start: '', end: '' })
// Синхронизируем локальные значения с store
watch(() => scheduleConfigStore.config, (config) => {
  if (config) {
    slotInterval.value = config.slotInterval
    startTime.value = config.startTime
    endTime.value = config.endTime
    hasLunchBreak.value = config.hasLunchBreak
    lunchStart.value = config.lunchStart || '13:00'
    lunchEnd.value = config.lunchEnd || '14:00'
    workingDays.value = config.workingDays || [1, 2, 3, 4, 5]
    availableDaysRange.value = config.availableDaysRange || 14
    timezone.value = config.timezone || 'Europe/Moscow'
  }
}, { immediate: true })

onMounted(() => {
  scheduleConfigStore.loadConfig()
})

const loadMonth = async ({ start, end }: { start: { date: string }, end: { date: string } }) => {
  selectedRange.value = { start: start.date, end: end.date }
  await Promise.all([
    appointmentsStore.loadAllAppointments(start.date, end.date),
    blockedSlotsStore.loadBlockedSlots(start.date, end.date)
  ])
}

// Фокус календаря (текущая дата)
const focus = ref(new Date().toISOString().split('T')[0])

// Маппинг статусов на цвета
const statusColorMap: Record<string, string> = {
  pending: 'warning',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'error',
}

// Маппинг статусов на русские названия
const statusMap: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждена',
  completed: 'Завершена',
  cancelled: 'Отменена',
}

// Маппинг услуг на русские названия
const serviceMap: Record<string, string> = {
  maintenance: 'ТО',
  diagnostics: 'Диагностика',
  suspension: 'Ходовая',
  'tire-service': 'Шиномонтаж',
  bodywork: 'Кузов',
  other: 'Другое',
}

// Получаем название услуги
const getServiceName = (appointment: any) => {
  if (appointment.customService) {
    return appointment.customService
  }
  return serviceMap[appointment.serviceId] || appointment.serviceId
}

// Получаем имя клиента
const getClientName = (appointment: any) => {
  if (appointment.user) {
    const user = appointment.user
    return user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || `ID: ${user.telegramId}`
  }
  return appointment.clientName || 'Без имени'
}

// Преобразуем заявки в формат events для v-calendar (каждая заявка - отдельное событие)
const calendarEvents = computed(() => {
  const events: Array<{
    name: string
    start: string
    end: string
    color: string
    timed?: boolean
    appointmentId?: string
    appointment?: any // Сохраняем полную информацию о заявке
    isBlocked?: boolean
  }> = []

  // Добавляем заявки
  appointmentsStore.allAppointments.forEach((appointment) => {
    // Фильтруем отмененные заявки
    if (appointment.status === 'cancelled') {
      return
    }

    if (appointment.appointmentDate) {
      if (appointment.appointmentDate) {
        const serviceName = getServiceName(appointment)
        const color = statusColorMap[appointment.status] || 'primary'
        const timeSlot = appointment.timeSlot.split(':')
        // Формируем краткую информацию о заявке (только время и услуга)
        const eventName = `${timeSlot[0]}:${timeSlot[1]} - ${serviceName}`

        events.push({
          name: eventName,
          start: appointment.appointmentDate,
          end: appointment.appointmentDate,
          color: color,
          timed: false,
          appointmentId: appointment.id,
          appointment: appointment, // Сохраняем полную информацию для hover
        })
      }
    }
  })

  // Группируем заблокированные слоты по дате для отображения
  for (const blockedSlot of blockedSlotsStore.blockedSlots) {
    const timeSlot = blockedSlot.timeSlot.split(':')
    events.push({
      name: `🚫 ${timeSlot[0]}:${timeSlot[1]}`,
      start: blockedSlot.date,
      end: blockedSlot.date,
      color: 'error',
      timed: false,
      isBlocked: true,
    })
  }

  return events
})

// Обработчик клика на событие в календаре
const handleEventClick = (nativeEvent: any, { event }: { event: any }) => {
  if (event.appointment) {
    router.push({ name: 'admin-appointments', query: { id: event.appointment.id } })
  }
}

// Управление временными слотами
const selectedDate = ref<string>('')
const isLoadingSlots = ref(false)

// Обработчик клика на день в календаре
const handleDayClick = async (nativeEvent: any, { date }: { date: any }) => {
  selectedDate.value = date
}

// Переключить блокировку слота
const toggleSlotBlock = async (timeSlot: string) => {
  if (!selectedDate.value) return
  
  const isBlocked = blockedSlotsStore.isSlotBlocked(selectedDate.value, timeSlot)
  
  try {
    if (isBlocked) {
      // Разблокировать
      const blockedSlot = blockedSlotsStore.getBlockedSlot(selectedDate.value, timeSlot)
      if (blockedSlot) {
        await blockedSlotsStore.deleteBlockedSlot(blockedSlot.id)
      }
    } else {
      // Заблокировать - добавляем секунды для формата времени (HH:MM:SS)
   
      await blockedSlotsStore.createBlockedSlot({
        date: selectedDate.value,
        timeSlot,
      })
    }
    
   
    await blockedSlotsStore.loadBlockedSlots(selectedRange.value.start, selectedRange.value.end)
  } catch (error) {
    console.error('Ошибка при изменении блокировки слота:', error)
    alert('Ошибка при изменении блокировки слота')
  }
}

// Computed маппинг информации о заявках (оптимизация для tooltip)
const appointmentsInfoMap = computed(() => {
  const infoMap: Record<string, {
    timeSlot: string
    serviceName: string
    clientName: string
    clientPhone?: string
    carDetails: string
    licensePlate?: string
    statusName: string
    comment?: string
  }> = {}

  appointmentsStore.allAppointments.forEach((appointment) => {
    if (!appointment) return

    const clientName = getClientName(appointment)
    const statusName = statusMap[appointment.status] || appointment.status
    const carInfo = appointment.customCarBrand || appointment.carBrand
    const carDetails = [
      carInfo,
      appointment.carModel,
      appointment.carYear,
    ].filter(Boolean).join(' ')

    infoMap[appointment.id] = {
      timeSlot: appointment.timeSlot,
      serviceName: getServiceName(appointment),
      clientName,
      clientPhone: appointment.clientPhone,
      carDetails,
      licensePlate: appointment.licensePlate,
      statusName,
      comment: appointment.comment,
    }
  })

  return infoMap
})

// Функция для получения информации о заявке (использует computed маппинг)
const getAppointmentInfo = (appointment: any) => {
  if (!appointment || !appointment.id) return null
  return appointmentsInfoMap.value[appointment.id] || null
}

const dayOptions = [
  { value: 0, label: 'Воскресенье' },
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
]

const timezoneOptions = [
  { value: 'Europe/Moscow', label: 'Москва (Europe/Moscow)' },
  { value: 'Europe/Kiev', label: 'Киев (Europe/Kiev)' },
  { value: 'Europe/Minsk', label: 'Минск (Europe/Minsk)' },
  { value: 'Asia/Almaty', label: 'Алматы (Asia/Almaty)' },
  { value: 'Asia/Tashkent', label: 'Ташкент (Asia/Tashkent)' },
  { value: 'UTC', label: 'UTC' },
]

const generatedSlots = computed(() => {
  const slots: string[] = []
  const startParts = startTime.value.split(':')
  const endParts = endTime.value.split(':')
  const lunchStartParts = lunchStart.value.split(':')
  const lunchEndParts = lunchEnd.value.split(':')

  if (!startParts[0] || !startParts[1] || !endParts[0] || !endParts[1]) {
    return slots
  }

  const startHour = Number(startParts[0])
  const startMin = Number(startParts[1])
  const endHour = Number(endParts[0])
  const endMin = Number(endParts[1])
  const lunchStartHour = lunchStartParts[0] ? Number(lunchStartParts[0]) : 13
  const lunchStartMin = lunchStartParts[1] ? Number(lunchStartParts[1]) : 0
  const lunchEndHour = lunchEndParts[0] ? Number(lunchEndParts[0]) : 14
  const lunchEndMin = lunchEndParts[1] ? Number(lunchEndParts[1]) : 0

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  const lunchStartMinutes = lunchStartHour * 60 + lunchStartMin
  const lunchEndMinutes = lunchEndHour * 60 + lunchEndMin
  const intervalMinutes = slotInterval.value * 60

  let currentMinutes = startMinutes

  while (currentMinutes < endMinutes) {
    if (hasLunchBreak.value && currentMinutes >= lunchStartMinutes && currentMinutes < lunchEndMinutes) {
      currentMinutes = lunchEndMinutes
      continue
    }

    const hours = Math.floor(currentMinutes / 60)
    const minutes = currentMinutes % 60
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    slots.push(timeString)

    currentMinutes += intervalMinutes
  }

  return slots
})

const saveSettings = async () => {
  try {
    await scheduleConfigStore.updateConfig({
      slotInterval: slotInterval.value,
      startTime: startTime.value,
      endTime: endTime.value,
      lunchStart: hasLunchBreak.value ? lunchStart.value : null,
      lunchEnd: hasLunchBreak.value ? lunchEnd.value : null,
      hasLunchBreak: hasLunchBreak.value,
      workingDays: workingDays.value,
      availableDaysRange: availableDaysRange.value,
      timezone: timezone.value,
    })
    alert('Настройки успешно сохранены')
  } catch (error) {
    alert('Ошибка при сохранении настроек')
  }
}


</script>

<template>
  <div class="admin-view">
    <v-container>
      <v-row>
        <v-col cols="12">
          <div class="admin-header">
            <h1 class="admin-title">Панель администратора</h1>
            <div class="d-flex" style="gap: 8px;">
              <v-btn color="primary" variant="elevated" @click="router.push({ name: 'admin-questions' })">
                <v-icon start>mdi-comment-question</v-icon>
                Вопросы пользователей
              </v-btn>
              <v-btn color="primary" variant="elevated" @click="router.push({ name: 'admin-users' })">
                <v-icon start>mdi-account-group</v-icon>
                Пользователи
              </v-btn>
              <v-btn color="primary" variant="elevated" @click="router.push({ name: 'admin-appointments' })">
                <v-icon start>mdi-calendar-check</v-icon>
                Заявки
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card class="calendar-card mb-4">
            <v-card-title>Календарь заявок</v-card-title>
            <v-card-text>
              <v-calendar v-model="focus" :events="calendarEvents" first-day-of-week="1" @change="loadMonth" 
                class="appointments-calendar" @click:event="handleEventClick" @click:day="handleDayClick">
                <template #event="{ event }">
                  <v-tooltip v-if="event.appointment" interactive location="right"
                    content-class="appointment-tooltip-wrapper">
                    <template #activator="{ props }">
                      <div v-bind="props" class="calendar-event-content">
                        {{ event.name }}
                      </div>
                    </template>
                    <div class="appointment-tooltip-content">
                      <div class="tooltip-header">
                        {{ getAppointmentInfo(event.appointment)?.timeSlot }} - {{
                          getAppointmentInfo(event.appointment)?.serviceName }}
                      </div>
                      <div class="tooltip-row">
                        <strong>Клиент:</strong> {{ getAppointmentInfo(event.appointment)?.clientName }}
                      </div>
                      <div v-if="getAppointmentInfo(event.appointment)?.clientPhone" class="tooltip-row">
                        <strong>Телефон:</strong> {{ getAppointmentInfo(event.appointment)?.clientPhone }}
                      </div>
                      <div v-if="getAppointmentInfo(event.appointment)?.carDetails" class="tooltip-row">
                        <strong>Автомобиль:</strong> {{ getAppointmentInfo(event.appointment)?.carDetails }}
                      </div>
                      <div v-if="getAppointmentInfo(event.appointment)?.licensePlate" class="tooltip-row">
                        <strong>Гос. номер:</strong> {{ getAppointmentInfo(event.appointment)?.licensePlate }}
                      </div>
                      <div class="tooltip-row">
                        <strong>Статус:</strong> {{ getAppointmentInfo(event.appointment)?.statusName }}
                      </div>
                      <div v-if="getAppointmentInfo(event.appointment)?.comment" class="tooltip-comment">
                        {{ getAppointmentInfo(event.appointment)?.comment }}
                      </div>
                    </div>
                  </v-tooltip>
                  <div v-else-if="event.isBlocked" class="calendar-event-content blocked-slot-event">
                    {{ event.name }}
                  </div>
                  <div v-else class="calendar-event-content">
                    {{ event.name }}
                  </div>
                </template>
              </v-calendar>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <!-- Блок управления временными слотами -->
      <v-row v-if="selectedDate">
        <v-col cols="12">
          <v-card class="slots-management-card">
            <v-card-title class="slots-card-title">
              <span>Управление временными слотами</span>
              <span class="selected-date-text">{{ new Date(selectedDate).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              }) }}</span>
            </v-card-title>
            <v-card-text class="slots-card-content">
              <div v-if="isLoadingSlots" class="text-center py-4">
                <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
                <div class="mt-2 text-caption">Загрузка...</div>
              </div>

              <div v-else>
                <div class="time-slots-grid-compact">
                  <div
                    v-for="slot in generatedSlots"
                    :key="slot"
                    class="time-slot-btn-compact"
                    :class="{
                      'slot-blocked': blockedSlotsStore.isSlotBlocked(selectedDate, slot),
                      'slot-available': !blockedSlotsStore.isSlotBlocked(selectedDate, slot)
                    }"
                    @click="toggleSlotBlock(slot)"
                  >
                    <div class="slot-time-compact">{{ slot }}</div>
                    <div class="slot-status-compact">
                      {{ blockedSlotsStore.isSlotBlocked(selectedDate, slot) ? '🚫' : '✓' }}
                    </div>
                  </div>
                </div>
                <div v-if="generatedSlots.length === 0" class="text-center text-grey py-2 text-caption">
                  Нет доступных слотов
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="6">
          <v-card class="settings-card">
            <v-card-title>Настройки временных окон</v-card-title>
            <v-card-text>
              <v-text-field v-model.number="slotInterval" label="Интервал между слотами (часы)" type="number" min="1"
                max="8" variant="outlined" class="mb-4"></v-text-field>

              <v-text-field v-model.number="availableDaysRange" label="Диапазон доступных дат (дни)" type="number"
                min="1" max="365" variant="outlined" class="mb-4" persistent-hint></v-text-field>

              <v-row>
                <v-col cols="6">
                  <v-text-field v-model="startTime" label="Начало работы" type="time" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="endTime" label="Окончание работы" type="time"
                    variant="outlined"></v-text-field>
                </v-col>
              </v-row>

              <v-checkbox v-model="hasLunchBreak" label="Обеденный перерыв" class="mt-4"></v-checkbox>

              <v-row v-if="hasLunchBreak">
                <v-col cols="6">
                  <v-text-field v-model="lunchStart" label="Начало обеда" type="time" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="lunchEnd" label="Конец обеда" type="time" variant="outlined"></v-text-field>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>

              <v-select v-model="timezone" :items="timezoneOptions" label="Часовой пояс" variant="outlined" class="mb-4"
                persistent-hint :item-title="item => item.label"
                hint="Часовой пояс для бизнес-логики (не зависит от часового пояса сервера)"></v-select>

              <v-divider class="my-4"></v-divider>

              <div class="mb-2">
                <strong>Рабочие дни:</strong>
              </div>
              <div class="working-days-group">
                <v-checkbox v-for="day in dayOptions" :key="day.value" v-model="workingDays" :value="day.value"
                  :label="day.label" hide-details density="compact"></v-checkbox>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="preview-card">
            <v-card-title>Предпросмотр слотов</v-card-title>
            <v-card-text>
              <div class="slot-preview">
                <div v-for="(slot, index) in generatedSlots" :key="index" class="slot-item">
                  {{ slot }}
                </div>
              </div>
              <div v-if="generatedSlots.length === 0" class="text-center text-grey mt-4">
                Нет доступных слотов с текущими настройками
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" class="text-right">
          <v-btn color="primary" size="large" @click="saveSettings" :loading="scheduleConfigStore.isSaving"
            :disabled="scheduleConfigStore.isSaving || scheduleConfigStore.isLoading">
            Сохранить настройки
          </v-btn>
        </v-col>
      </v-row>


    </v-container>
  </div>
</template>

<style scoped>
.admin-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  padding: 24px 0;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.admin-title {
  font-size: 32px;
  font-weight: 600;
  color: #424242;
  margin: 0;
}

.settings-card,
.preview-card,
.calendar-card,
.slots-management-card {
  margin-bottom: 24px;
}

.appointments-calendar {
  width: 100%;
}

/* Стили для событий в календаре */
.appointments-calendar :deep(.v-calendar-event) {
  font-size: 12px;
  padding: 2px 6px;
  margin: 1px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.appointments-calendar :deep(.v-calendar-event:hover) {
  opacity: 0.8;
  transform: translateX(2px);
}

/* Улучшаем читаемость текста событий */
.appointments-calendar :deep(.v-calendar-event__name) {
  font-weight: 500;
  line-height: 1.4;
}

.calendar-event-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.blocked-slot-event {
  opacity: 0.9;
  font-weight: 600;
  font-size: 11px;
}

/* Стили для tooltip с информацией о заявке */
:deep(.appointment-tooltip-wrapper) {
  background-color: #ffffff !important;
  color: #212121 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid #e0e0e0 !important;
}

.appointment-tooltip-content {
  max-width: 300px;
  text-align: left;
  font-size: 13px;
  line-height: 1.6;
  background-color: #ffffff;
  color: #212121;
  padding: 12px;
}

.tooltip-header {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  color: #1976d2;
}

.tooltip-row {
  margin-bottom: 4px;
}

.tooltip-comment {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-style: italic;
  color: #666;
}

.tooltip-link {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;
}

.tooltip-link:hover {
  color: #1565c0;
}

.slot-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.slot-item {
  padding: 8px 12px;
  background: #e3f2fd;
  border: 1px solid #64b5f6;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
  color: #1976d2;
}

.calendar-picker {
  max-width: 100%;
}

.selected-date-info {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.selected-date-info p {
  margin: 8px 0;
}

.working-days-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slots-display {
  margin-top: 16px;
}

.slots-title {
  margin-bottom: 12px;
  font-size: 16px;
}

.loading-slots,
.no-slots {
  text-align: center;
  padding: 16px;
  color: #757575;
}

.time-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.time-slot-btn {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  position: relative;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &.slot-available {
    border-color: #81c784;

    &:hover {
      border-color: #4caf50;
      background: #f1f8f4;
    }
  }

  &.slot-booked {
    background: #ffebee;
    border-color: #e57373;
    color: #c62828;
    cursor: not-allowed;
    opacity: 0.8;
  }

  &.slot-blocked {
    background: #fff3e0;
    border-color: #ffb74d;
    color: #e65100;

    &:hover {
      background: #ffe0b2;
      border-color: #ff9800;
    }
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.slot-time {
  font-size: 16px;
  font-weight: 600;
}

.slot-status {
  font-size: 13px;
  opacity: 0.9;
  font-weight: 500;
}

.slot-action-hint {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  font-style: italic;
}

/* Компактные стили для блока управления слотами */
.time-slots-grid-compact {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.time-slot-btn-compact {
  padding: 8px 4px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
  position: relative;
}

.time-slot-btn-compact:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.time-slot-btn-compact.slot-available {
  border-color: #81c784;
  background: #f1f8f4;
}

.time-slot-btn-compact.slot-available:hover {
  border-color: #4caf50;
  background: #e8f5e9;
}

.time-slot-btn-compact.slot-blocked {
  background: #fff3e0;
  border-color: #ffb74d;
  color: #e65100;
}

.time-slot-btn-compact.slot-blocked:hover {
  background: #ffe0b2;
  border-color: #ff9800;
}

.time-slot-btn-compact:disabled {
  cursor: not-allowed;
}

.slot-time-compact {
  font-size: 14px;
  font-weight: 600;
}

.slot-status-compact {
  font-size: 16px;
  line-height: 1;
}

.slots-management-card {
  margin-bottom: 16px;
}

.slots-card-title {
  padding: 12px 16px !important;
  font-size: 16px !important;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selected-date-text {
  font-size: 13px;
  font-weight: 400;
  color: #666;
}

.slots-card-content {
  padding: 12px 16px !important;
}

@media (max-width: 960px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-title {
    font-size: 24px;
  }

  .slot-preview {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .time-slots-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .time-slot-btn {
    min-height: 90px;
    padding: 10px;
  }
}
</style>
