<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)

const canSubmit = computed(() => {
  return username.value.trim().length > 0 && password.value.length > 0 && !authStore.isLoading
})

const handleLogin = async () => {
  if (!canSubmit.value) return

  try {
    await authStore.login({
      username: username.value.trim(),
      password: password.value,
    })
    router.push({ name: 'admin' })
  } catch (error) {
    console.error('Login error:', error)
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && canSubmit.value) {
    handleLogin()
  }
}
</script>

<template>
  <div class="login-view">
    <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="4">
          <v-card class="login-card" elevation="8">
            <v-card-title class="text-center login-title">
              <h2>Вход в систему</h2>
            </v-card-title>

            <v-card-text>
              <v-form @submit.prevent="handleLogin">
                <v-text-field
                  v-model="username"
                  label="Имя пользователя"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  :disabled="authStore.isLoading"
                  @keypress="handleKeyPress"
                  autofocus
                ></v-text-field>

                <v-text-field
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  label="Пароль"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  variant="outlined"
                  :disabled="authStore.isLoading"
                  @click:append-inner="showPassword = !showPassword"
                  @keypress="handleKeyPress"
                  class="mt-4"
                ></v-text-field>

                <v-alert
                  v-if="authStore.error"
                  type="error"
                  variant="tonal"
                  class="mt-4"
                  closable
                  @click:close="authStore.error = null"
                >
                  {{ authStore.error }}
                </v-alert>

                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  class="mt-6"
                  :loading="authStore.isLoading"
                  :disabled="!canSubmit"
                >
                  Войти
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  padding: 24px;
  border-radius: 16px;
}

.login-title {
  padding: 24px 0 16px 0;
}

.login-title h2 {
  font-size: 28px;
  font-weight: 600;
  color: #424242;
}

:deep(.v-field__input) {
  padding-top: 12px;
  padding-bottom: 12px;
}

@media (max-width: 600px) {
  .login-card {
    margin: 16px;
  }

  .login-title h2 {
    font-size: 24px;
  }
}
</style>

