<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const handleBookService = () => {
  router.push({ name: 'booking' })
}

const handleMyAppointments = () => {
  router.push({ name: 'my-appointments' })
}

const handleLeaveComment = () => {
  router.push({ name: 'comment' })
}
</script>

<template>
  <div class="home-page">
    <div class="header">
      <h1 class="title">Добро пожаловать</h1>
      <p class="subtitle">Выберите действие</p>
    </div>

    <div class="buttons-container">
      <v-btn
        class="action-button button-book"
        size="x-large"
        variant="elevated"
        block
        @click="handleBookService"
      >
        <v-icon start size="large">mdi-calendar-plus</v-icon>
        Записаться на услугу
      </v-btn>

      <v-btn
        class="action-button button-appointments"
        size="x-large"
        variant="elevated"
        block
        @click="handleMyAppointments"
      >
        <v-icon start size="large">mdi-calendar-clock</v-icon>
        Мои записи
      </v-btn>

      <v-btn
        class="action-button button-comment"
        size="x-large"
        variant="elevated"
        block
        @click="handleLeaveComment"
      >
        <v-icon start size="large">mdi-comment-text</v-icon>
        Оставить комментарий
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  position: relative;
}

.header {
  text-align: center;
  margin-bottom: 48px;
  padding-top: 32px;
}

.title {
  font-size: 32px;
  font-weight: 600;
  color: #424242;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: #757575;
  margin: 0;
}

.buttons-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.action-button {
  height: 80px !important;
  font-size: 18px !important;
  font-weight: 500 !important;
  border-radius: 16px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
  text-transform: none !important;
}

.button-book {
  background-color: #64b5f6 !important;
  color: white !important;
}

.button-book:hover {
  background-color: #42a5f5 !important;
}

.button-appointments {
  background-color: #81c784 !important;
  color: white !important;
}

.button-appointments:hover {
  background-color: #66bb6a !important;
}

.button-comment {
  background-color: #90caf9 !important;
  color: white !important;
}

.button-comment:hover {
  background-color: #64b5f6 !important;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.action-button:active {
  transform: translateY(0);
}

@media (max-width: 600px) {
  .title {
    font-size: 28px;
  }

  .subtitle {
    font-size: 14px;
  }

  .action-button {
    height: 72px !important;
    font-size: 16px !important;
  }

  .header {
    margin-bottom: 40px;
    padding-top: 24px;
  }
}
</style>

