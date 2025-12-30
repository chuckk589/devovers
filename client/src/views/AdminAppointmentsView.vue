<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Заявки</span>
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
            <div v-if="isLoading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <div class="mt-4">Загрузка заявок...</div>
            </div>
            
            <div v-else-if="error" class="text-center py-8">
              <v-alert type="error" variant="tonal" class="mb-4">
                {{ error }}
              </v-alert>
              <v-btn color="primary" @click="appointmentsStore.loadAllAppointments()">
                Попробовать снова
              </v-btn>
            </div>

            <div v-else class="ag-theme-material" style="height: 600px;">
              <ag-grid-vue
                ref="gridRef"
                :theme="theme"
                :columnDefs="columnDefs"
                :rowData="appointments"
                :defaultColDef="defaultColDef"
                :pagination="true"
                :paginationPageSize="20"
                :rowSelection="'single'"
                style="height: 100%; width: 100%;"
                @cell-value-changed="onCellValueChanged"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AgGridVue } from 'ag-grid-vue3'
import { themeQuartz } from 'ag-grid-community'
import { useAppointmentsStore } from '../stores/appointments'
import type { ColDef } from 'ag-grid-community'

const router = useRouter()
const appointmentsStore = useAppointmentsStore()
const theme = ref(themeQuartz)
const gridRef = ref<any>(null)

const appointments = computed(() => appointmentsStore.allAppointments)
const isLoading = computed(() => appointmentsStore.isLoadingAllAppointments)
const error = computed(() => appointmentsStore.error)

function extractKeys(mappings: Record<string, string>) {
  return Object.keys(mappings);
}

const statusMap: Record<string, string> = {
    'pending': 'Ожидает',
    'confirmed': 'Подтверждена',
    'completed': 'Завершена',
    'cancelled': 'Отменена',
} as const

const serviceMap: Record<string, string> = {
    'maintenance': 'Техническое обслуживание (ТО)',
    'diagnostics': 'Диагностика',
    'suspension': 'Ремонт ходовой',
    'tire-service': 'Шиномонтаж',
    'bodywork': 'Кузовные работы',
    'other': 'Другое',
} as const
const columnDefs: ColDef[] = [
  {
    headerName: 'ID',
    field: 'fancyID',
    width: 100,
  },
  {
    headerName: 'Дата',
    field: 'appointmentDate',
    width: 120,
    cellRenderer: (params: any) => {
      if (!params.value) return '-'
      const date = new Date(params.value)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    },
  },
  {
    headerName: 'Время',
    field: 'timeSlot',
    width: 100,
  },
  {
    headerName: 'Услуга',
    field: 'serviceId',
    width: 150,
    cellRenderer: (params: any) => {
      return serviceMap[params.value] || params.value
    },
  },
  {
    headerName: 'Марка',
    field: 'carBrand',
    width: 120,
    cellRenderer: (params: any) => {
      return params.data.customCarBrand || params.value || '-'
    },
  },
  {
    headerName: 'Модель',
    field: 'carModel',
    width: 120,
    cellRenderer: (params: any) => {
      return params.value || '-'
    },
  },
  {
    headerName: 'Год',
    field: 'carYear',
    width: 80,
    cellRenderer: (params: any) => {
      return params.value || '-'
    },
  },
  {
    headerName: 'Гос. номер',
    field: 'licensePlate',
    width: 120,
    cellRenderer: (params: any) => {
      return params.value || '-'
    },
  },
  {
    headerName: 'Клиент',
    field: 'clientName',
    width: 150,
    cellRenderer: (params: any) => {
      if (params.data.user) {
        const user = params.data.user
        return user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || `ID: ${user.telegramId}`
      }
      return params.value || '-'
    },
  },
  {
    headerName: 'Телефон',
    field: 'clientPhone',
    width: 130,
    cellRenderer: (params: any) => {
      return params.value || '-'
    },
  },
  {
    headerName: 'Статус',
    field: 'status',
    width: 120,
    cellRenderer: (params: any) => {
      return statusMap[params.value] || params.value
    },
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: extractKeys(statusMap),
    },
    refData: statusMap,
    editable: true,
  },
  {
    headerName: 'Комментарий',
    field: 'comment',
    flex: 1,
    minWidth: 150,
    cellRenderer: (params: any) => {
      return params.value || '-'
    },
  },
  {
    headerName: 'Создана',
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
async function onCellValueChanged(params: any) {
  // Обрабатываем только изменения статуса
  if (params.colDef.field === 'status') {
    const oldValue = params.oldValue
    const newValue = params.newValue
    
    // Если значение не изменилось, ничего не делаем
    if (oldValue === newValue) return
    
    try {
      await appointmentsStore.updateAppointmentStatus(
        params.data.id,
        newValue as 'pending' | 'confirmed' | 'completed' | 'cancelled'
      )
    } catch (error) {
      console.error('Ошибка изменения статуса:', error)
      // Возвращаем старое значение при ошибке
      if (gridRef.value?.api) {
        params.node.setDataValue('status', oldValue)
      }
    }
  }
}
onMounted(() => {
  appointmentsStore.loadAllAppointments()
})
</script>

<style scoped>
.ag-theme-material {
  --ag-font-family: 'Roboto', sans-serif;
}
</style>

