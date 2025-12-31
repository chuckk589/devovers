<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppointmentsStore } from '../stores/appointments'
import { useTelegramStore } from '../stores/telegram'

interface ServiceCategory {
    id: string
    label: string
    type?: 'maintenance' | 'other'
}

interface TimeSlot {
    id: string
    time: string
    displayTime: string
    isBooked: boolean
    isBlocked: boolean
    status: 'available' | 'booked' | 'blocked'
}

const appointmentsStore = useAppointmentsStore()
const telegramStore = useTelegramStore()

const router = useRouter()
const currentStep = ref(0)
const totalSteps = 7
const dateTimeStep = ref(0) // 0 - календарь, 1 - слоты
const step1ValidationAttempted = ref(false) // Флаг попытки валидации первого шага

// Form data
const formData = ref({
    service: '',
    customService: '',
    maintenanceInfo: '',
    date: '',
    time: '',
    name: '',
    phone: '',
    comment: '',
    carBrand: '',
    carModel: '',
    carYear: '',
    licensePlate: '',
})

const serviceCategories: ServiceCategory[] = [
    { id: 'maintenance', label: 'Техническое обслуживание (ТО)', type: 'maintenance' },
    { id: 'diagnostics', label: 'Диагностика' },
    { id: 'suspension', label: 'Ремонт ходовой' },
    { id: 'other', label: 'Другое', type: 'other' },
]


// Refs for radio button labels
const radioRefs = ref<Record<string, HTMLElement>>({})

const setRadioRef = (categoryId: string, el: HTMLElement | null) => {
    if (el) {
        radioRefs.value[categoryId] = el
    }
}

// Watch for service changes and scroll to selected radio
watch(() => formData.value.service, async (newService) => {
    if (newService && radioRefs.value[newService]) {
        await nextTick()
        radioRefs.value[newService].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        })
    }
})

const next = () => {
    // Валидация перед переходом на следующий шаг
    if (currentStep.value === 0) {
        step1ValidationAttempted.value = true
        if (!isStep1Valid.value) {
            return // Не переходим, если первый шаг невалиден
        }
    }
    if (currentStep.value < totalSteps - 1) {
        currentStep.value++
    }
}

const prev = () => {
    // Если мы на шаге с датой/временем и на шаге со слотами, сначала вернуться к календарю
    if (currentStep.value === 2 && dateTimeStep.value === 1) {
        dateTimeStep.value = 0
        return
    }
    if (currentStep.value > 0) {
        currentStep.value--
    }
    else {
        router.push({ name: 'home' })
    }
}

const isFirstStep = computed(() => currentStep.value === 0)
const isLastStep = computed(() => currentStep.value === totalSteps - 1)

// Проверка, можно ли перейти на следующий шаг
const isNextButtonDisabled = computed(() => {
    // Шаг 0: должен быть выбран пункт и, если "Другое", указана услуга
    if (currentStep.value === 0) {
        return !isStep1Valid.value
    }

    // Шаг 2: дата и время должны быть выбраны
    if (currentStep.value === 2) {
        if (dateTimeStep.value === 0 || !formData.value.date) {
            return true
        }
        if (dateTimeStep.value === 1 && !formData.value.time) {
            return true
        }
    }

    // Шаг 3: марка и модель автомобиля обязательны
    if (currentStep.value === 3) {
        if (!formData.value.carBrand || formData.value.carBrand.trim().length === 0) {
            return true
        }
        if (!formData.value.carModel || formData.value.carModel.trim().length === 0) {
            return true
        }
    }

    // Шаг 4: телефон обязателен
    if (currentStep.value === 4) {
        return !formData.value.phone || formData.value.phone.trim().length === 0
    }

    return false
})

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const createdAppointmentFancyID = ref<string | null>(null)

const handleSubmit = async () => {
    if (!isStep1Valid.value) {
        step1ValidationAttempted.value = true
        return
    }

    isSubmitting.value = true
    submitError.value = null

    try {
        // Формируем данные для отправки
        const appointmentData = {
            serviceId: formData.value.service,
            customService: formData.value.service === 'other' ? formData.value.customService : undefined,
            maintenanceInfo: formData.value.maintenanceInfo || undefined,
            carBrand: formData.value.carBrand || 'Unknown',
            carModel: formData.value.carModel || undefined,
            carYear: formData.value.carYear || undefined,
            licensePlate: formData.value.licensePlate || undefined,
            appointmentDate: formData.value.date,
            timeSlot: formData.value.time,
            clientPhone: formData.value.phone,
            comment: formData.value.comment || undefined,
            telegramId: telegramStore.userId || undefined,
        }

        const appointment = await appointmentsStore.createAppointment(appointmentData)
        
        // Сохраняем fancyID из ответа
        createdAppointmentFancyID.value = appointment.fancyID || null

        console.log('Запись успешно создана')
        currentStep.value = 6
    } catch (error) {
        submitError.value = error instanceof Error ? error.message : 'Произошла ошибка при отправке формы'
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
        console.error('Ошибка при создании записи:', error)
    } finally {
        isSubmitting.value = false
    }
}

const selectedCategory = computed(() => {
    return serviceCategories.find(cat => cat.id === formData.value.service)
})

const isOtherSelected = computed(() => selectedCategory.value?.type === 'other')
const isMaintenanceSelected = computed(() => selectedCategory.value?.type === 'maintenance')
// Валидация первого шага
const isStep1Valid = computed(() => {
    // Должен быть выбран хотя бы один пункт
    if (!formData.value.service || formData.value.service.length === 0) {
        return false
    }
    // Если выбран "Другое", должна быть указана услуга
    if (isOtherSelected.value) {
        return formData.value.customService.trim().length > 0
    }
    return true
})

const step1Error = computed(() => {
    if (!formData.value.service || formData.value.service.length === 0) {
        return 'Выберите категорию услуги'
    }
    if (isOtherSelected.value && formData.value.customService.trim().length === 0) {
        return 'Укажите название услуги'
    }
    return null
})

// Load all slots on mount
onMounted(async () => {
    await appointmentsStore.loadAllAvailableSlots()
})

// Watch for date changes and update selected date in store, then switch to slots step
watch(() => formData.value.date, (newDate) => {
    if (newDate) {
        appointmentsStore.setSelectedDate(newDate as any)
        // Automatically switch to slots step when date is selected
        if (dateTimeStep.value === 0) {
            nextTick(() => {
                dateTimeStep.value = 1
            })
        }
    }
})

// Watch for step changes - if we return to step 2 and date is already selected, show slots
watch(() => currentStep.value, (newStep) => {
    if (newStep === 2 && formData.value.date && dateTimeStep.value === 0) {
        nextTick(() => {
            dateTimeStep.value = 1
        })
    }
})

// Array of dates with available slots for allowed-dates prop
const allowedDates = computed(() => {
    const dates: string[] = []
    appointmentsStore.dateAvailability.forEach((count, date) => {
        if (count > 0) {
            dates.push(date)
        }
    })
    return dates
})

// Computed: только доступные слоты для выбранной даты
const availableSlotsOnly = computed(() => {
    return appointmentsStore.availableSlots.filter(slot => slot.status === 'available')
})

// Computed: количество доступных слотов
const availableSlotsCount = computed(() => {
    return availableSlotsOnly.value.length
})

// Форматирование даты для отображения
const formatSelectedDate = (date: string) => {
    if (!date) return ''
    const dateObj = new Date(date)
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
    }
    return dateObj.toLocaleDateString('ru-RU', options)
}

const selectTimeSlot = (slot: TimeSlot) => {
    if (slot.status === 'available') {
        formData.value.time = slot.time
    }
}

const getSlotClass = (slot: TimeSlot) => {
    if (slot.status === 'blocked') return 'slot-blocked'
    if (slot.status === 'booked') return 'slot-booked'
    return 'slot-available'
}

const getSlotLabel = (slot: TimeSlot) => {
    if (slot.status === 'blocked') return 'Заблокировано'
    if (slot.status === 'booked') return 'Занято'
    return slot.displayTime
}

// Computed для отображения выбранной услуги
const selectedServiceLabel = computed(() => {
    if (formData.value.service === 'other' && formData.value.customService) {
        return formData.value.customService
    }
    return selectedCategory.value?.label || ''
})

// Computed для отображения выбранного времени
const selectedTimeDisplay = computed(() => {
    if (!formData.value.time) return 'Не выбрано'
    const slot = appointmentsStore.availableSlots.find(s => s.time === formData.value.time)
    return slot?.displayTime || formData.value.time
})

// Правила валидации
const validationRules = {
    required: (value: any) => !!value || 'Это поле обязательно для заполнения',

    customService: (value: string) => {
        if (!value || value.trim().length === 0) {
            return 'Введите название услуги'
        }
        return true
    },

    phone: (value: string) => {
        if (!value || value.trim().length === 0) {
            return 'Телефон обязателен для заполнения'
        }
        const cleanPhone = value.replace(/[\s\-()\+]/g, '')
        const phoneRegex = /^(7|8)?[0-9]{10}$/
        if (!phoneRegex.test(cleanPhone)) {
            return 'Введите корректный номер телефона (например: +7 (999) 123-45-67)'
        }
        return true
    },

    carBrand: (value: string) => {
        if (!value || value.trim().length === 0) {
            return 'Укажите марку автомобиля'
        }
     
        return true
    },

    carModel: (value: string) => {
        if (!value || value.trim().length === 0) {
            return 'Укажите модель автомобиля'
        }
       
        return true
    },

    carYear: (value: string | number) => {
        if (!value) return true // Необязательное поле

        return true
    },

    licensePlate: (value: string) => {
        if (!value || value.trim().length === 0) return true // Необязательное поле

        return true
    }
}
</script>

<template>
    <div class="booking-view">
        <v-window v-model="currentStep" class="booking-window">
            <!-- Step 1: Выбор услуги (категории) -->
            <v-window-item :value="0">
                <div class="step-content">
                    <div class="step-title">Выберите категорию услуги</div>
                    <div v-if="step1Error && currentStep === 0 && step1ValidationAttempted" class="step-error-message">
                        <v-alert type="warning" variant="tonal" density="compact" class="mb-4" ref="step1ErrorAlertRef">
                            {{ step1Error }}
                        </v-alert>
                    </div>
                    <v-radio-group v-model="formData.service" class="service-radio-group" hide-details>
                        <template v-for="category in serviceCategories" :key="category.id">
                            <label class="service-radio-label"
                                :ref="(el) => setRadioRef(category.id, el as HTMLElement)"
                                :class="{ 'service-radio-selected': formData.service === category.id }">
                                <v-radio :label="category.label" :value="category.id" class="service-radio"
                                    hide-details></v-radio>
                            </label>
                            <v-textarea v-if="category.type === 'maintenance' && isMaintenanceSelected"
                                v-model="formData.maintenanceInfo" label="Дополнительная информация" variant="outlined"
                                placeholder="Замена масла, фильтров, тормозной жидкости и т.д." rows="4"
                                class="form-field custom-service-field service-additional-field"></v-textarea>
                            <v-text-field v-if="category.type === 'other' && isOtherSelected"
                                v-model="formData.customService" label="Укажите услугу" variant="outlined"
                                placeholder="Введите название услуги" :rules="[validationRules.customService]"
                                class="form-field custom-service-field service-additional-field"></v-text-field>
                        </template>
                    </v-radio-group>
                </div>
            </v-window-item>
            <!-- Step 2: Дополнительная информация -->
            <v-window-item :value="1">
                <div class="step-content">
                    <div class="step-title">Дополнительная информация</div>
                    <v-textarea v-model="formData.comment" label="Комментарий (необязательно)" variant="outlined"
                        placeholder="Опишите дополнительную информацию о вашей проблеме" rows="6"></v-textarea>
                </div>
            </v-window-item>
            <!-- Step 3: Дата и время -->
            <v-window-item :value="2" class="date-time-window-item">
                <v-window v-model="dateTimeStep" class="date-time-window" direction="vertical">
                    <!-- Вложенный шаг 1: Календарь -->
                    <v-window-item :value="0">
                        <div class="step-content">
                            <div class="step-title">Выберите дату</div>
                            <v-date-picker show-adjacent-months v-model="formData.date" :allowed-dates="allowedDates"
                                variant="outlined" control-variant="modal" first-day-of-week="1" hide-header
                                class="date-picker">
                            </v-date-picker>
                        </div>
                    </v-window-item>
                    <!-- Вложенный шаг 2: Слоты времени -->
                    <v-window-item :value="1">
                        <div class="step-content">
                            <div class="step-title">Выберите время</div>
                            <div v-if="formData.date" class="time-slots-section">
                                <div class="time-slots-header">
                                    <div class="time-slots-title">Доступное время на {{
                                        formatSelectedDate(formData.date) }}:</div>
                                </div>
                                <div v-if="appointmentsStore.isLoadingSlots" class="loading-slots">
                                    <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
                                    <div>Загрузка слотов...</div>
                                </div>
                                <div v-else-if="availableSlotsCount === 0" class="no-slots">
                                    <v-icon size="36" color="grey">event_busy</v-icon>
                                    <div>Нет доступных слотов на выбранную дату</div>
                                    <div class="no-slots-hint">Пожалуйста, выберите другую дату</div>
                                    <v-btn @click="dateTimeStep = 0" color="primary" variant="outlined" class="mt-4">
                                        Выбрать другую дату
                                    </v-btn>
                                </div>
                                <div v-else class="time-slots-grid">
                                    <button v-for="slot in availableSlotsOnly" :key="slot.id"
                                        :class="['time-slot-btn', { 'selected': formData.time === slot.time }]"
                                        @click="selectTimeSlot(slot)">
                                        <div class="slot-time">{{ slot.displayTime }}</div>
                                        <v-icon v-if="formData.time === slot.time"
                                            class="selected-icon">check_circle</v-icon>
                                    </button>
                                </div>
                            </div>
                            <div v-else class="time-slots-placeholder">
                                <v-icon size="48" color="grey-lighten-1">calendar_today</v-icon>
                                <div>Дата не выбрана</div>
                                <v-btn @click="dateTimeStep = 0" color="primary" variant="outlined" class="mt-4">
                                    Выбрать дату
                                </v-btn>
                            </div>
                        </div>
                    </v-window-item>
                </v-window>
            </v-window-item>
            <!-- Step 4: Информация об автомобиле -->
            <v-window-item :value="3">
                <div class="step-content">
                    <div class="step-title">Информация об автомобиле</div>

                    <v-text-field v-model="formData.carBrand" label="Укажите марку автомобиля" variant="outlined"
                        placeholder="Введите марку" :rules="[validationRules.carBrand]"
                        class="custom-brand-field"></v-text-field>

                    <v-text-field v-model="formData.carModel" label="Модель" variant="outlined"
                        placeholder="Например: Camry, Solaris, Polo" :rules="[validationRules.carModel]"></v-text-field>

                    <div class="optional-fields">
                        <v-text-field v-model="formData.carYear" label="Год выпуска (необязательно)" variant="outlined"
                            placeholder="Например: 2020" type="number"
                            :rules="[validationRules.carYear]"></v-text-field>
                        <v-text-field v-model="formData.licensePlate" label="Госномер (необязательно)"
                            variant="outlined" placeholder="Например: А123БВ777"
                            :rules="[validationRules.licensePlate]"></v-text-field>
                    </div>
                </div>
            </v-window-item>
            <!-- Step 5: Контактные данные -->
            <v-window-item :value="4">
                <div class="step-content">
                    <div class="step-title">Введите контактные данные</div>

                    <v-text-field v-model="formData.phone" label="Телефон" variant="outlined"
                        placeholder="+7 (999) 123-45-67" type="tel" :rules="[validationRules.phone]"></v-text-field>

                    <v-textarea v-model="formData.comment" label="Дополнительная информация" variant="outlined"
                        placeholder="Укажите дополнительную информацию, если необходимо" rows="4"></v-textarea>
                </div>
            </v-window-item>
            <!-- Step 6: Проверка данных -->
            <v-window-item :value="5">
                <div class="step-content review-content">
                    <div class="step-title">Проверьте данные перед отправкой</div>
                    <div v-if="submitError" class="submit-error">
                        <v-alert type="error" variant="tonal" density="compact" class="compact-alert">
                            {{ submitError }}
                        </v-alert>
                    </div>

                    <div class="review-section">
                        <div class="review-section-title">Услуга</div>
                        <div class="review-section-content">
                            <div class="review-item">
                                <span class="review-label">Категория услуги:</span>
                                <span class="review-value">{{ selectedServiceLabel }}</span>
                            </div>
                            <div v-if="formData.maintenanceInfo" class="review-item">
                                <span class="review-label">Дополнительная информация:</span>
                                <span class="review-value">{{ formData.maintenanceInfo }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="review-section">
                        <div class="review-section-title">Дата и время</div>
                        <div class="review-section-content">
                            <div class="review-item">
                                <span class="review-label">Дата:</span>
                                <span class="review-value">{{ formData.date ? formatSelectedDate(formData.date) : 'Не выбрано'
                                    }}</span>
                            </div>
                            <div class="review-item">
                                <span class="review-label">Время:</span>
                                <span class="review-value">{{ selectedTimeDisplay }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="review-section">
                        <div class="review-section-title">Информация об автомобиле</div>
                        <div class="review-section-content">
                            <div v-if="formData.carBrand" class="review-item">
                                <span class="review-label">Марка:</span>
                                <span class="review-value">{{ formData.carBrand }}</span>
                            </div>
                            <div v-if="formData.carModel" class="review-item">
                                <span class="review-label">Модель:</span>
                                <span class="review-value">{{ formData.carModel }}</span>
                            </div>
                            <div v-if="formData.carYear" class="review-item">
                                <span class="review-label">Год выпуска:</span>
                                <span class="review-value">{{ formData.carYear }}</span>
                            </div>
                            <div v-if="formData.licensePlate" class="review-item">
                                <span class="review-label">Госномер:</span>
                                <span class="review-value">{{ formData.licensePlate }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="review-section">
                        <div class="review-section-title">Контактные данные</div>
                        <div class="review-section-content">
                            <div class="review-item">
                                <span class="review-label">Телефон:</span>
                                <span class="review-value">{{ formData.phone || 'Не указан' }}</span>
                            </div>
                            <div v-if="formData.comment" class="review-item">
                                <span class="review-label">Дополнительная информация:</span>
                                <span class="review-value">{{ formData.comment }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </v-window-item>
            <!-- Step 7: Успешная отправка -->
            <v-window-item :value="6">
                <div class="step-content success-content">
                    <div class="success-icon">
                        <v-icon size="80" color="success">check_circle</v-icon>
                    </div>
                    <div class="step-title success-title">Заявка успешно отправлена!</div>
                    <div class="success-message">
                        <p>Ваша заявка на запись принята.</p>
                        <p v-if="createdAppointmentFancyID" class="success-fancy-id">
                            <strong>Номер заявки: {{ createdAppointmentFancyID }}</strong>
                        </p>
                        <p class="success-info">Дата: {{ formData.date ? formatSelectedDate(formData.date) : '' }}</p>
                        <p class="success-info">Время: {{ selectedTimeDisplay }}</p>
                    </div>
                </div>
            </v-window-item>

        </v-window>
        <v-card-actions>
            <v-btn v-if="currentStep !== 6" variant="text" @click="prev">
                Назад
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn v-if="currentStep === 6" color="primary" variant="flat" @click="router.push({ name: 'home' })">
                Вернуться на главную
            </v-btn>
            <template v-else>
                <v-btn v-if="currentStep !== 5" color="primary" variant="flat" @click="next" :disabled="isNextButtonDisabled">
                    Далее
                </v-btn>
                <v-btn v-if="currentStep === 5" color="primary" variant="flat" @click="handleSubmit" :loading="isSubmitting"
                    :disabled="isSubmitting">
                    Отправить
                </v-btn>
            </template>
        </v-card-actions>
    </div>
</template>
<style lang="scss" scoped>
.booking-view {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
    padding: 16px;
}

.booking-header {
    padding: 16px 0;
    text-align: center;
    position: relative;
}

.back-button {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    color: #424242;
}

.booking-title {
    font-size: 24px;
    font-weight: 600;
    color: #424242;
    margin-bottom: 8px;
}

.step-indicator {
    font-size: 14px;
    color: #757575;
}

.booking-window {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.step-content {
    flex: 1;
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    justify-content: center;
}

.step-title {
    font-size: 20px;
    font-weight: 500;
    color: #424242;
    text-align: center;
}

.step-error-message {
    margin-top: 8px;
    margin-bottom: 8px;
}

.compact-alert {
    padding: 8px 12px !important;
    margin-bottom: 0 !important;
    font-size: 13px !important;
    line-height: 1.4 !important;

    :deep(.v-alert__content) {
        padding: 0 !important;
    }

    :deep(.v-alert__prepend) {
        margin-right: 8px !important;
    }
}

.success-content {
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 24px;
}

.success-icon {
    margin-bottom: 8px;
}

.success-title {
    color: #4caf50;
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
}

.success-message {
    max-width: 500px;
    margin: 0 auto;
    
    p {
        margin-bottom: 12px;
        font-size: 16px;
        color: #424242;
        line-height: 1.6;
    }
}

.success-info {
    font-weight: 500;
    color: #1976d2;
    margin-top: 8px;
}

.success-fancy-id {
    font-size: 18px;
    font-weight: 600;
    color: #4caf50;
    margin: 16px 0;
    padding: 12px;
    background: #e8f5e9;
    border-radius: 8px;
    border: 2px solid #4caf50;
}

.review-content {
    justify-content: flex-start;
    overflow-y: auto;
    padding-bottom: 16px;
}

.review-section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.review-section-title {
    font-size: 18px;
    font-weight: 600;
    color: #1976d2;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e3f2fd;
}

.review-section-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.review-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.review-label {
    font-size: 14px;
    font-weight: 500;
    color: #757575;
}

.review-value {
    font-size: 16px;
    font-weight: 400;
    color: #424242;
    word-break: break-word;
}

.submit-error {
    margin-bottom: 12px;
}

.service-radio-group {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;

}

.service-radio-label {
    display: block;
    cursor: pointer;
    padding: 16px;
    margin-bottom: 12px;

    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
    border: 2px solid transparent;

    &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        transform: translateY(-1px);
    }

    &.service-radio-selected {
        border-color: #64b5f6;
        background: #e3f2fd;
        box-shadow: 0 2px 8px rgba(100, 181, 246, 0.3);
    }
}

.service-radio {
    margin: 0 !important;
    padding: 0 !important;
    width: 100%;

    :deep(.v-label) {
        width: 100%;
        cursor: pointer;
    }

    :deep(.v-selection-control__input) {
        margin-right: 12px;
    }
}

.custom-service-field {
    animation: fadeIn 0.3s ease-in;
}

.service-additional-field {
    margin-top: -12px;
    margin-bottom: 12px;
    padding-left: 16px;
    padding-right: 16px;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.form-field {
    margin-top: 16px;
}

.car-brand-section {
    margin-top: 16px;
}

.field-label {
    font-size: 14px;
    font-weight: 500;
    color: #424242;
    margin-bottom: 12px;
}

.brand-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
}

.brand-button {
    text-transform: none !important;
    font-size: 14px !important;
    min-width: auto !important;
    padding: 8px 16px !important;
}

.custom-brand-field {
    animation: fadeIn 0.3s ease-in;
}

.optional-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.field-divider {
    text-align: center;
    color: #757575;
    font-size: 14px;
    margin: -8px 0;
    position: relative;

    &::before,
    &::after {
        content: '';
        position: absolute;
        top: 50%;
        width: calc(50% - 20px);
        height: 1px;
        background: #e0e0e0;
    }

    &::before {
        left: 0;
    }

    &::after {
        right: 0;
    }
}

.booking-actions {
    padding: 16px 0;
    display: flex;
    gap: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    margin-top: auto;
}

.nav-button {
    flex: 1;
    min-width: 120px;
    height: 48px;
    text-transform: none;
    font-size: 16px;
    font-weight: 500;
}

.nav-button-primary {
    background-color: #64b5f6 !important;
    color: white !important;
}

.nav-button-primary:hover {
    background-color: #42a5f5 !important;
}

.nav-button-submit {
    background-color: #81c784 !important;
    color: white !important;
}

.nav-button-submit:hover {
    background-color: #66bb6a !important;
}

.date-picker {
    width: 100%;
    margin: 16px 0;

    // Style all available dates (not disabled) - circular with highlight
    // v-btn--disabled is on the button inside .v-date-picker-month__day, not on the div itself
    :deep(.v-date-picker-month__day .v-btn:not(.v-btn--disabled)) {
        width: 36px !important;
        height: 36px !important;
        min-width: 36px !important;
        border-radius: 50% !important;
        background-color: #e3f2fd !important;
        border: 2px solid #64b5f6 !important;
        font-weight: 600 !important;
        color: #1976d2 !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.2s ease !important;

        &:hover {
            background-color: #bbdefb !important;
            border-color: #42a5f5 !important;
            transform: scale(1.1) !important;
        }
    }
}

.time-slots-section {
    margin-top: 16px;
    padding: 16px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex: 1;
    overflow-y: auto;
}

.time-slots-header {
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e0e0e0;
}

.time-slots-title {
    font-size: 16px;
    font-weight: 600;
    color: #424242;
}

.time-slots-placeholder {
    margin-top: 24px;
    padding: 40px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #9e9e9e;
    text-align: center;
}

.loading-slots {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: #757575;
    gap: 12px;
}

.no-slots {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: #757575;
    gap: 8px;
    text-align: center;
}

.no-slots-hint {
    font-size: 14px;
    color: #9e9e9e;
    margin-top: 8px;
}

.time-slots-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
}

.time-slot-btn {
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    min-height: 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    position: relative;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    &:hover {
        border-color: #64b5f6;
        box-shadow: 0 4px 12px rgba(100, 181, 246, 0.3);
        transform: translateY(-2px);
        background: #f5f9ff;
    }

    &.selected {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-color: #1976d2;
        color: #1976d2;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(25, 118, 210, 0.4);
        transform: translateY(-2px);

        .slot-time {
            font-size: 16px;
            font-weight: 700;
        }
    }

    .slot-time {
        font-size: 14px;
        font-weight: 600;
        color: #424242;
    }

    .selected-icon {
        position: absolute;
        top: 6px;
        right: 6px;
        color: #1976d2;
        font-size: 18px;
    }
}

.slot-time {
    font-size: 16px;
    font-weight: 500;
}

.slot-status {
    font-size: 12px;
    opacity: 0.8;
}

@media (max-width: 600px) {
    .booking-title {
        font-size: 20px;
    }

    .step-title {
        font-size: 18px;
    }

    .booking-actions {
        flex-direction: column;
    }

    .nav-button {
        width: 100%;
    }

    .time-slots-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .time-slot-btn {
        min-height: 55px;
        padding: 10px;
    }
}
</style>
<style lang="scss">
.v-window__container,
.date-time-window-item,
.date-time-window-item .v-window-item,
.v-window {
    flex: 1;
    display: flex;
}
</style>
