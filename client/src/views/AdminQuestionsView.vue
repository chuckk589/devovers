<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionsStore, type Question } from '../stores/questions'

const router = useRouter()
const questionsStore = useQuestionsStore()

const selectedQuestion = ref<Question | null>(null)
const answerMessage = ref('')
const answerError = ref<string | null>(null)
const isSubmittingAnswer = ref(false)

// Сортировка
const sortBy = ref<'date' | 'status'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Computed для управления диалогом
const isDialogOpen = computed({
  get: () => selectedQuestion.value !== null,
  set: (value) => {
    if (!value) {
      closeAnswerForm()
    }
  }
})

// Отсортированные вопросы
const sortedQuestions = computed(() => {
  const questions = [...questionsStore.questions]
  
  return questions.sort((a, b) => {
    if (sortBy.value === 'date') {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    } else {
      // Сортировка по статусу
      const hasAnswerA = hasAnswers(a)
      const hasAnswerB = hasAnswers(b)
      
      // Если статусы разные
      if (hasAnswerA !== hasAnswerB) {
        if (sortOrder.value === 'desc') {
          // Убывание: сначала без ответов (false), потом с ответами (true)
          return hasAnswerA ? 1 : -1
        } else {
          // Возрастание: сначала с ответами (true), потом без ответов (false)
          return hasAnswerA ? -1 : 1
        }
      }
      
      // Если статус одинаковый, сортируем по дате (новые сверху)
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    }
  })
})

// Форматирование даты
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Получение имени пользователя
const getUserName = (question: Question) => {
  if (!question.user) return 'Неизвестный пользователь'
  if (question.user.username) return `@${question.user.username}`
  const firstName = question.user.firstName || ''
  const lastName = question.user.lastName || ''
  return `${firstName} ${lastName}`.trim() || `ID: ${question.user.telegramId}`
}

// Проверка наличия ответов
const hasAnswers = (question: Question) => {
  return question.answers && question.answers.length > 0
}

// Открыть форму ответа
const openAnswerForm = (question: Question) => {
  selectedQuestion.value = question
  answerMessage.value = ''
  answerError.value = null
}

// Закрыть форму ответа
const closeAnswerForm = () => {
  selectedQuestion.value = null
  answerMessage.value = ''
  answerError.value = null
}

// Отправить ответ
const handleSubmitAnswer = async () => {
  if (!selectedQuestion.value || !answerMessage.value.trim()) {
    return
  }

  isSubmittingAnswer.value = true
  answerError.value = null

  try {
    await questionsStore.createAnswer({
      message: answerMessage.value.trim(),
      questionId: selectedQuestion.value.id,
    })

    // Перезагружаем вопросы
    await questionsStore.loadQuestions()
    closeAnswerForm()
  } catch (error) {
    answerError.value = questionsStore.error || 'Произошла ошибка при отправке ответа'
  } finally {
    isSubmittingAnswer.value = false
  }
}

onMounted(async () => {
  await questionsStore.loadQuestions()
})
</script>

<template>
  <div class="admin-questions-view">
    <div class="header">
      <v-btn
        icon
        variant="text"
        @click="router.push({ name: 'admin' })"
        class="back-button"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <h1 class="title">Вопросы пользователей</h1>
    </div>

    <div class="content">
      <div v-if="questionsStore.isLoading" class="loading">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <div class="loading-text">Загрузка вопросов...</div>
      </div>

      <div v-else-if="questionsStore.error" class="error-message">
        <v-alert type="error" variant="tonal" density="compact">
          {{ questionsStore.error }}
        </v-alert>
      </div>

      <div v-else-if="questionsStore.questions.length === 0" class="empty-state">
        <v-icon size="64" color="grey-lighten-1">mdi-comment-question-outline</v-icon>
        <div class="empty-title">Нет вопросов</div>
        <div class="empty-subtitle">Вопросы от пользователей будут отображаться здесь</div>
      </div>

      <div v-else>
        <div class="sort-controls">
          <v-select
            v-model="sortBy"
            :items="[
              { title: 'По дате', value: 'date' },
              { title: 'По статусу', value: 'status' }
            ]"
            label="Сортировать по"
            variant="outlined"
            density="compact"
            hide-details
            class="sort-select"
          ></v-select>
          <v-btn-toggle
            v-model="sortOrder"
            mandatory
            variant="outlined"
            density="compact"
            class="sort-order-toggle"
          >
            <v-btn value="desc" size="small">
              <v-icon start size="16">mdi-sort-descending</v-icon>
              Убывание
            </v-btn>
            <v-btn value="asc" size="small">
              <v-icon start size="16">mdi-sort-ascending</v-icon>
              Возрастание
            </v-btn>
          </v-btn-toggle>
        </div>

        <div class="questions-list">
          <v-card
            v-for="question in sortedQuestions"
            :key="question.id"
            class="question-card"
            elevation="2"
          >
          <v-card-title class="question-header">
            <div class="question-user-info">
              <v-icon size="18" color="primary">mdi-account</v-icon>
              <span class="user-name">{{ getUserName(question) }}</span>
              <v-chip
                v-if="hasAnswers(question)"
                size="small"
                color="success"
                variant="flat"
                class="ml-2"
              >
                <v-icon start size="14">mdi-check-circle</v-icon>
                Отвечено
              </v-chip>
              <v-chip
                v-else
                size="small"
                color="warning"
                variant="flat"
                class="ml-2"
              >
                <v-icon start size="14">mdi-clock-outline</v-icon>
                Без ответа
              </v-chip>
            </div>
            <div class="question-date">{{ formatDate(question.createdAt) }}</div>
          </v-card-title>

          <v-card-text class="question-content">
            <div class="question-message">{{ question.message }}</div>

            <div v-if="question.answers && question.answers.length > 0" class="answers-section">
              <div class="answers-title">
                <v-icon size="16" color="success">mdi-check-circle</v-icon>
                Ответы ({{ question.answers.length }})
              </div>
              <div
                v-for="answer in question.answers"
                :key="answer.id"
                class="answer-item"
              >
                <div class="answer-header">
                  <span class="answer-author">
                    {{ answer.owner?.login || 'Администратор' }}
                  </span>
                  <span class="answer-date">{{ formatDate(answer.createdAt) }}</span>
                </div>
                <div class="answer-message">{{ answer.message }}</div>
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="question-actions">
            <v-btn
              color="primary"
              variant="elevated"
              size="small"
              @click="openAnswerForm(question)"
              :disabled="isSubmittingAnswer"
            >
              <v-icon start size="18">mdi-reply</v-icon>
              Ответить
            </v-btn>
          </v-card-actions>
        </v-card>
        </div>
      </div>
    </div>

    <!-- Диалог ответа -->
    <v-dialog v-model="isDialogOpen" max-width="600" persistent>
      <v-card v-if="selectedQuestion">
        <v-card-title>
          <span class="text-h6">Ответить на вопрос</span>
        </v-card-title>

        <v-card-text>
          <div class="question-preview">
            <div class="question-label">Вопрос:</div>
            <div class="question-text">{{ selectedQuestion.message }}</div>
          </div>

          <div v-if="answerError" class="error-message">
            <v-alert type="error" variant="tonal" density="compact">
              {{ answerError }}
            </v-alert>
          </div>

          <v-textarea
            v-model="answerMessage"
            label="Ваш ответ"
            variant="outlined"
            placeholder="Введите ответ на вопрос..."
            rows="6"
            :disabled="isSubmittingAnswer"
            class="mt-4"
            counter
            maxlength="1000"
          ></v-textarea>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeAnswerForm"
            :disabled="isSubmittingAnswer"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="handleSubmitAnswer"
            :loading="isSubmittingAnswer"
            :disabled="!answerMessage.trim() || isSubmittingAnswer"
          >
            Отправить ответ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped lang="scss">
.admin-questions-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  padding: 16px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-top: 8px;
}

.back-button {
  color: #424242;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #424242;
  margin: 0;
}

.content {
  max-width: 1000px;
  margin: 0 auto;
}

.sort-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.sort-select {
  flex: 0 0 200px;
  max-width: 200px;
}

.sort-order-toggle {
  flex: 0 0 auto;
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

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-card {
  border-radius: 8px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.question-user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.user-name {
  font-weight: 500;
  color: #424242;
  font-size: 14px;
}

.question-date {
  font-size: 12px;
  color: #757575;
}

.question-content {
  padding: 12px 16px !important;
}

.question-message {
  font-size: 14px;
  color: #424242;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.answers-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
}

.answers-title {
  font-size: 13px;
  font-weight: 600;
  color: #757575;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.answer-item {
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.answer-author {
  font-weight: 500;
  color: #1976d2;
  font-size: 13px;
}

.answer-date {
  font-size: 11px;
  color: #757575;
}

.answer-message {
  font-size: 13px;
  color: #424242;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.question-actions {
  padding: 8px 16px !important;
}

.question-preview {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.question-label {
  font-size: 12px;
  font-weight: 500;
  color: #757575;
  margin-bottom: 8px;
}

.question-text {
  font-size: 14px;
  color: #424242;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 600px) {
  .title {
    font-size: 24px;
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>

