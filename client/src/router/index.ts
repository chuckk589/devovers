import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import BookingView from '../views/BookingView.vue'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import AdminQuestionsView from '../views/AdminQuestionsView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'
import AdminAppointmentsView from '../views/AdminAppointmentsView.vue'
import MyAppointmentsView from '../views/MyAppointmentsView.vue'
import CommentView from '../views/CommentView.vue'
import { useAuthStore } from '../stores/auth'
import { useTelegramStore } from '../stores/telegram'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { requiresTelegram: true }
    },
    {
      path: '/booking',
      name: 'booking',
      component: BookingView,
      meta: { requiresTelegram: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/questions',
      name: 'admin-questions',
      component: AdminQuestionsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsersView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/appointments',
      name: 'admin-appointments',
      component: AdminAppointmentsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/my-appointments',
      name: 'my-appointments',
      component: MyAppointmentsView,
      meta: { requiresTelegram: true }
    },
    {
      path: '/comment',
      name: 'comment',
      component: CommentView,
      meta: { requiresTelegram: true }
    }
  ]
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const telegramStore = useTelegramStore()

  // Проверка авторизации для админ-панели
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Перенаправляем на страницу логина, сохраняя запрошенный путь
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  // Проверка Telegram WebApp для публичных страниц
  if (to.meta.requiresTelegram) {
    // Если еще не инициализирован, пытаемся инициализировать
    if (!telegramStore.isInitialized) {
      telegramStore.initTelegramWebApp()
    }

    // Проверяем, есть ли данные Telegram из текущей сессии
    const isFromTelegram = telegramStore.isFromTelegram || 
      (typeof window !== 'undefined' && window.Telegram?.WebApp !== undefined)

    if (!isFromTelegram) {
      // Если не из Telegram
      if (typeof window !== 'undefined') {
        alert('Это приложение доступно только из Telegram')
      }
      next(false) // Блокируем навигацию
      return
    }
  }

  next()
})

export default router

