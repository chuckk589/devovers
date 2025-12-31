FROM node:22-alpine as base

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Копируем исходный код
COPY . .

# Собираем приложение
RUN yarn build

# Production stage
FROM node:22-alpine as production

WORKDIR /app

# Копируем package.json и устанавливаем только production зависимости
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# Копируем собранное приложение из base stage
COPY --from=base /app/dist ./dist

# Устанавливаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]