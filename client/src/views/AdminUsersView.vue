<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Пользователи</span>
            <v-btn
              color="primary"
              variant="text"
              icon="mdi-arrow-left"
              @click="router.push('/admin')"
            >
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="usersStore.isLoading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <div class="mt-4">Загрузка пользователей...</div>
            </div>
            
            <div v-else-if="usersStore.error" class="text-center py-8">
              <v-alert type="error" variant="tonal" class="mb-4">
                {{ usersStore.error }}
              </v-alert>
              <v-btn color="primary" @click="usersStore.loadUsers()">
                Попробовать снова
              </v-btn>
            </div>

            <div v-else class="ag-theme-material" style="height: 600px;">
              <ag-grid-vue
                :theme="theme"
                :columnDefs="columnDefs"
                :rowData="usersStore.users"
                :defaultColDef="defaultColDef"
                :pagination="true"
                :paginationPageSize="20"
                :rowSelection="'single'"
                style="height: 100%; width: 100%;"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AgGridVue } from 'ag-grid-vue3'
import { useUsersStore } from '../stores/users'
import { themeQuartz } from 'ag-grid-community'
import type { ColDef } from 'ag-grid-community'

const router = useRouter()
const usersStore = useUsersStore()
const theme = ref(themeQuartz)
const columnDefs: ColDef[] = [
  {
    headerName: 'ID',
    field: 'id',
    width: 100,
    cellRenderer: (params: any) => {
      return params.value ? params.value.substring(0, 8) + '...' : ''
    },
  },
  {
    headerName: 'Telegram ID',
    field: 'telegramId',
    width: 130,
  },
  {
    headerName: 'Имя пользователя',
    field: 'username',
    width: 150,
    cellRenderer: (params: any) => {
      return params.value || '-'
    },
  },
  {
    headerName: 'Имя',
    field: 'firstName',
    width: 150,
    cellRenderer: (params: any) => {
      return params.value || '-'
    },
  },
  {
    headerName: 'Фамилия',
    field: 'lastName',
    width: 150,
    cellRenderer: (params: any) => {
      return params.value || '-'
    },
  },
  {
    headerName: 'Заявок',
    field: 'appointments',
    width: 100,
    cellRenderer: (params: any) => {
      return params.value ? params.value.length : 0
    },
  },
  {
    headerName: 'Дата создания',
    field: 'createdAt',
    width: 180,
    cellRenderer: (params: any) => {
      if (!params.value) return '-'
      const date = new Date(params.value)
      return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
]

const defaultColDef: ColDef = {
  sortable: true,
  filter: false,
  resizable: true,
  flex: 1,
}

onMounted(() => {
  usersStore.loadUsers()
})
</script>

<style scoped>
.ag-theme-material {
  --ag-font-family: 'Roboto', sans-serif;
}
</style>

