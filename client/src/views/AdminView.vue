<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useScheduleConfigStore } from '../stores/schedule-config'

const router = useRouter()

const scheduleConfigStore = useScheduleConfigStore()

const slotInterval = ref<number>(2)
const startTime = ref<string>('10:00')
const endTime = ref<string>('18:00')
const lunchStart = ref<string>('13:00')
const lunchEnd = ref<string>('14:00')
const hasLunchBreak = ref<boolean>(true)
const availableDaysRange = ref<number>(14)
const timezone = ref<string>('Europe/Moscow')

const workingDays = ref<number[]>([1, 2, 3, 4, 5])

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
              <v-btn
                color="primary"
                variant="elevated"
                @click="router.push({ name: 'admin-questions' })"
              >
                <v-icon start>mdi-comment-question</v-icon>
                Вопросы пользователей
              </v-btn>
              <v-btn
                color="primary"
                variant="elevated"
                @click="router.push({ name: 'admin-users' })"
              >
                <v-icon start>mdi-account-group</v-icon>
                Пользователи
              </v-btn>
              <v-btn
                color="primary"
                variant="elevated"
                @click="router.push({ name: 'admin-appointments' })"
              >
                <v-icon start>mdi-calendar-check</v-icon>
                Заявки
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-card class="settings-card">
            <v-card-title>Настройки временных окон</v-card-title>
            <v-card-text>
              <v-text-field
                v-model.number="slotInterval"
                label="Интервал между слотами (часы)"
                type="number"
                min="1"
                max="8"
                variant="outlined"
                class="mb-4"
              ></v-text-field>

              <v-text-field
                v-model.number="availableDaysRange"
                label="Диапазон доступных дат (дни)"
                type="number"
                min="1"
                max="365"
                variant="outlined"
                class="mb-4"
                persistent-hint
              ></v-text-field>

              <v-row>
                <v-col cols="6">
                  <v-text-field
                    v-model="startTime"
                    label="Начало работы"
                    type="time"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="endTime"
                    label="Окончание работы"
                    type="time"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-checkbox
                v-model="hasLunchBreak"
                label="Обеденный перерыв"
                class="mt-4"
              ></v-checkbox>

              <v-row v-if="hasLunchBreak">
                <v-col cols="6">
                  <v-text-field
                    v-model="lunchStart"
                    label="Начало обеда"
                    type="time"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="lunchEnd"
                    label="Конец обеда"
                    type="time"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>

              <v-select
                v-model="timezone"
                :items="timezoneOptions"
                label="Часовой пояс"
                variant="outlined"
                class="mb-4"
                persistent-hint
                :item-title="item => item.label"
                hint="Часовой пояс для бизнес-логики (не зависит от часового пояса сервера)"
              ></v-select>

              <v-divider class="my-4"></v-divider>

              <div class="mb-2">
                <strong>Рабочие дни:</strong>
              </div>
              <div class="working-days-group">
                <v-checkbox
                  v-for="day in dayOptions"
                  :key="day.value"
                  v-model="workingDays"
                  :value="day.value"
                  :label="day.label"
                  hide-details
                  density="compact"
                ></v-checkbox>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="preview-card">
            <v-card-title>Предпросмотр слотов</v-card-title>
            <v-card-text>
              <div class="slot-preview">
                <div
                  v-for="(slot, index) in generatedSlots"
                  :key="index"
                  class="slot-item"
                >
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
          <v-btn
            color="primary"
            size="large"
            @click="saveSettings"
            :loading="scheduleConfigStore.isSaving"
            :disabled="scheduleConfigStore.isSaving || scheduleConfigStore.isLoading"
          >
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
.calendar-card {
  height: 100%;
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

