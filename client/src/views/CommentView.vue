<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionsStore } from '../stores/questions'
import { useTelegramStore } from '../stores/telegram'

const router = useRouter()
const questionsStore = useQuestionsStore()
const telegramStore = useTelegramStore()

const message = ref('')
const submitError = ref<string | null>(null)
const isSuccess = ref(false)

const canSubmit = computed(() => {
  return message.value.trim().length > 0 && !questionsStore.isSubmitting
})

const handleSubmit = async () => {
  if (!canSubmit.value || !telegramStore.userId) {
    return
  }

  submitError.value = null
  isSuccess.value = false

  try {
    await questionsStore.createQuestion({
      message: message.value.trim(),
      telegramId: telegramStore.userId,
    })

    isSuccess.value = true
    message.value = ''

    // Через 3 секунды возвращаемся на главную
    setTimeout(() => {
      router.push({ name: 'home' })
    }, 3000)
  } catch (error) {
    submitError.value = questionsStore.error || 'Произошла ошибка при отправке вопроса'
  }
}

onMounted(() => {
  if (!telegramStore.userId) {
    router.push({ name: 'home' })
  }
})
</script>

<template>
  <div class="comment-view">
    <div class="header">
      <v-btn
        icon
        variant="text"
        @click="router.push({ name: 'home' })"
        class="back-button"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <h1 class="title">Задать вопрос</h1>
    </div>

    <div class="content">
      <v-card class="form-card" elevation="2">
        <v-card-text>
          <div v-if="isSuccess" class="success-message">
            <v-icon size="48" color="success">mdi-check-circle</v-icon>
            <div class="success-title">Вопрос отправлен!</div>
            <div class="success-text">Мы получили ваш вопрос и ответим в ближайшее время.</div>
            <div class="success-hint">Вы будете перенаправлены на главную страницу...</div>
          </div>

          <div v-else>
            <div class="form-description">
              <p>Задайте свой вопрос или оставьте комментарий. Мы свяжемся с вами в ближайшее время.</p>
            </div>

            <div v-if="submitError" class="error-message">
              <v-alert type="error" variant="tonal" density="compact">
                {{ submitError }}
              </v-alert>
            </div>

            <v-textarea
              v-model="message"
              label="Ваш вопрос или комментарий"
              variant="outlined"
              placeholder="Введите ваш вопрос или комментарий здесь..."
              rows="8"
              :disabled="questionsStore.isSubmitting"
              class="message-field"
              counter
              maxlength="1000"
            ></v-textarea>

            <v-btn
              color="primary"
              variant="elevated"
              size="large"
              block
              @click="handleSubmit"
              :loading="questionsStore.isSubmitting"
              :disabled="!canSubmit"
              class="submit-button"
            >
              <v-icon start>mdi-send</v-icon>
              Отправить вопрос
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.comment-view {
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
  max-width: 600px;
  margin: 0 auto;
}

.form-card {
  border-radius: 12px;
  padding: 8px;
}

.form-description {
  margin-bottom: 24px;
  color: #757575;
  font-size: 14px;
  line-height: 1.6;

  p {
    margin: 0;
  }
}

.error-message {
  margin-bottom: 16px;
}

.message-field {
  margin-bottom: 24px;
}

.submit-button {
  margin-top: 8px;
}

.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  gap: 16px;
}

.success-title {
  font-size: 24px;
  font-weight: 600;
  color: #4caf50;
}

.success-text {
  font-size: 16px;
  color: #424242;
  max-width: 400px;
}

.success-hint {
  font-size: 14px;
  color: #757575;
  margin-top: 8px;
}

@media (max-width: 600px) {
  .title {
    font-size: 24px;
  }

  .form-description {
    font-size: 13px;
  }
}
</style>

