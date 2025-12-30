# Настройка базы данных

## Требования
- PostgreSQL 12+
- Node.js 18+

## Установка зависимостей

Зависимости уже установлены в проекте:
- `@nestjs/typeorm` - интеграция TypeORM с NestJS
- `typeorm` - ORM для работы с БД
- `pg` - драйвер PostgreSQL
- `class-validator` и `class-transformer` - для валидации DTO

## Настройка переменных окружения

Создайте файл `.env` в корне проекта на основе `.env.example`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=devovers
NODE_ENV=development
PORT=3000
```

## Создание базы данных

1. Подключитесь к PostgreSQL:
```bash
psql -U postgres
```

2. Создайте базу данных:
```sql
CREATE DATABASE devovers;
```

3. Выйдите из psql:
```sql
\q
```

## Запуск приложения

При первом запуске TypeORM автоматически создаст таблицы (благодаря `synchronize: true` в режиме разработки).

```bash
npm run start:dev
```

## Структура таблиц

### Таблица `appointments`

Основная таблица для хранения записей на услуги:

- `id` (UUID) - уникальный идентификатор
- `serviceId` (VARCHAR) - ID выбранной услуги
- `customService` (VARCHAR, nullable) - название кастомной услуги
- `maintenanceInfo` (TEXT, nullable) - дополнительная информация для ТО
- `carBrand` (VARCHAR) - марка автомобиля
- `customCarBrand` (VARCHAR, nullable) - кастомная марка
- `carModel` (VARCHAR, nullable) - модель автомобиля
- `carYear` (VARCHAR, nullable) - год выпуска
- `licensePlate` (VARCHAR, nullable) - госномер
- `appointmentDate` (DATE) - дата записи
- `timeSlot` (TIME) - временной слот (например, "09:00")
- `clientName` (VARCHAR, nullable) - имя клиента
- `clientPhone` (VARCHAR, nullable) - телефон клиента
- `comment` (TEXT, nullable) - комментарий
- `status` (ENUM) - статус записи: pending, confirmed, completed, cancelled
- `createdAt` (TIMESTAMP) - дата создания
- `updatedAt` (TIMESTAMP) - дата обновления

## API Endpoints

- `GET /api/appointments/available-slots?date=2024-01-15` - получить доступные слоты на дату
- `POST /api/appointments/book` - создать новую запись
- `GET /api/appointments` - получить все записи
- `GET /api/appointments/:id` - получить запись по ID
- `PATCH /api/appointments/:id/status` - обновить статус записи
- `PATCH /api/appointments/:id/cancel` - отменить запись

## Важные замечания

⚠️ **В продакшене** установите `synchronize: false` в `app.module.ts` и используйте миграции TypeORM для управления схемой БД.

