import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export interface CreateQuestionData {
  message: string
  telegramId: number
}

export interface CreateAnswerData {
  message: string
  questionId: string
}

export interface Question {
  id: string
  message: string
  user?: {
    id: string
    telegramId: number
    username?: string
    firstName?: string
    lastName?: string
  }
  answers?: Answer[]
  createdAt: string
  updatedAt: string
}

export interface Answer {
  id: string
  message: string
  questionId: string
  owner?: {
    id: string
    login: string
  }
  createdAt: string
  updatedAt: string
}

export const useQuestionsStore = defineStore('questions', () => {
  const error = ref<string | null>(null)
  const isSubmitting = ref(false)
  const isLoading = ref(false)
  const questions = ref<Question[]>([])

  async function createQuestion(data: CreateQuestionData) {
    isSubmitting.value = true
    error.value = null

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Ошибка при отправке вопроса')
      }

      const question = await response.json()
      return question
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при отправке вопроса'
      console.error('Ошибка отправки вопроса:', err)
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  async function loadQuestions() {
    isLoading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      const token = authStore.token
      
      if (!token) {
        throw new Error('Токен авторизации не найден')
      }

      const response = await fetch('/api/questions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки вопросов')
      }

      const data: Question[] = await response.json()
      questions.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при загрузке вопросов'
      console.error('Ошибка загрузки вопросов:', err)
      questions.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function createAnswer(data: CreateAnswerData) {
    isSubmitting.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      const token = authStore.token
      
      if (!token) {
        throw new Error('Токен авторизации не найден')
      }

      const response = await fetch(`/api/questions/${data.questionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: data.message }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Ошибка при отправке ответа')
      }

      const answer = await response.json()
      return answer
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка при отправке ответа'
      console.error('Ошибка отправки ответа:', err)
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    error,
    isSubmitting,
    isLoading,
    questions,
    createQuestion,
    loadQuestions,
    createAnswer,
  }
})
