import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { LicenseManager } from 'ag-grid-enterprise';
import vuetify from './plugins/vuetify'
import router from './router'
import { useTelegramStore } from './stores/telegram'
import { useAuthStore } from './stores/auth'
import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';

import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(vuetify)
app.use(router)


ModuleRegistry.registerModules([AllEnterpriseModule.with(AgChartsEnterpriseModule)]);
LicenseManager.setLicenseKey('[v228]__MTk1NjUyODAwMDAwMA==8e4a7798ecd2eddcdfed53ddafa55324');
// Инициализация Telegram WebApp и проверка авторизации
const telegramStore = useTelegramStore()
const authStore = useAuthStore()

// Инициализируем Telegram WebApp
telegramStore.initTelegramWebApp()

// Проверяем авторизацию при загрузке
authStore.checkAuth()

app.mount('#app')

