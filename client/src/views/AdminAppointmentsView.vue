<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Заявки</span>
            <div class="d-flex align-center" style="gap: 8px;">
              <v-btn
                color="error"
                variant="elevated"
                :disabled="!selectedAppointmentId || isDeleting"
                :loading="isDeleting"
                @click="handleDeleteClick"
              >
                <v-icon start>mdi-delete</v-icon>
                Удалить
              </v-btn>
              <v-btn
                color="primary"
                variant="text"
                icon="mdi-arrow-left"
                @click="router.push('/admin')"
              >
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
            </div>
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
                :getRowId="(params: any) => params.data.id"
                style="height: 100%; width: 100%;"
                @cell-value-changed="onCellValueChanged"
                @selection-changed="onSelectionChanged"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Диалог подтверждения удаления -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6">Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить эту заявку? Это действие нельзя отменить.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="deleteDialog = false"
            :disabled="isDeleting"
          >
            Отмена
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="confirmDelete"
            :loading="isDeleting"
          >
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { AgGridVue } from 'ag-grid-vue3'
import { themeQuartz } from 'ag-grid-community'
import { useAppointmentsStore } from '../stores/appointments'
import type { ColDef } from 'ag-grid-community'

const router = useRouter()
const route = useRoute()
const appointmentsStore = useAppointmentsStore()
const theme = ref(themeQuartz)
const gridRef = ref<any>(null)
const selectedAppointmentId = ref<string | null>(null)
const isDeleting = ref(false)
const deleteDialog = ref(false)

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
// d@c87VtgHSb34s
// 147.45.97.43
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
// Функция для выделения строки по ID
const selectRowById = (appointmentId: string) => {
  if (!gridRef.value?.api) return
  
  const gridApi = gridRef.value.api
  const rowNode = gridApi.getRowNode(appointmentId)
  
  if (rowNode) {
    // Выделяем строку
    rowNode.setSelected(true)
    // Прокручиваем к строке
    gridApi.ensureNodeVisible(rowNode, 'middle')
  } 
}

// Обработка query параметра id при загрузке
const handleQueryId = async () => {
  const appointmentId = route.query.id as string | undefined
  
  if (appointmentId && !isLoading.value && appointments.value.length > 0) {
    await nextTick()
    selectRowById(appointmentId)
  }
}

// Отслеживаем загрузку данных и query параметры
watch([() => isLoading.value, () => appointments.value.length, () => route.query.id], 
  async ([newIsLoading, newAppointmentsLength, newId]) => {
    if (!newIsLoading && newAppointmentsLength > 0 && newId) {
      await nextTick()
      selectRowById(newId as string)
    }
  }
)

// Обработчик изменения выбора строки
const onSelectionChanged = () => {
  if (gridRef.value?.api) {
    const selectedRows = gridRef.value.api.getSelectedRows()
    selectedAppointmentId.value = selectedRows.length > 0 ? selectedRows[0].id : null
  }
}

// Обработчик клика на кнопку удаления
const handleDeleteClick = () => {
  if (selectedAppointmentId.value) {
    deleteDialog.value = true
  }
}

// Подтверждение удаления
const confirmDelete = async () => {
  if (!selectedAppointmentId.value) return
  
  isDeleting.value = true
  try {
    await appointmentsStore.deleteAppointment(selectedAppointmentId.value)
    selectedAppointmentId.value = null
    deleteDialog.value = false
  } catch (error) {
    console.error('Ошибка удаления:', error)
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  await appointmentsStore.loadAllAppointments()
  // Обрабатываем query параметр после загрузки
  await handleQueryId()
})
</script>

<style scoped>
.ag-theme-material {
  --ag-font-family: 'Roboto', sans-serif;
}
</style>

