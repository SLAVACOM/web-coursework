# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Курсовая — вариант 23 «Садовый инвентарь». Клиент-серверное приложение, MVC, Node.js + Express + MySQL + EJS.

## Commands

```bash
# Зависимости
npm install

# База данных (Docker)
docker compose up -d          # поднять MySQL
docker compose down           # остановить
docker compose down -v        # остановить + удалить данные

# Сервер
npm run dev    # с nodemon (разработка)
npm start      # production

# Тесты (требуется запущенная БД)
npm test
```

## Architecture

```
app.js                  # точка входа, Express middleware
config/db.js            # mysql2 pool, читает переменные из .env
models/                 # только SQL — параметризованные запросы через pool.execute()
controllers/            # вызывают модели, рендерят views или отдают JSON
routes/                 # Express Router → controllers
views/                  # EJS-шаблоны; partials/header.ejs + partials/footer.ejs — обёртка
public/js/main.js       # jQuery: AJAX на /api/tools для поиска/фильтра без перезагрузки
```

**Поток данных:** Route → Controller → Model (MySQL) → Controller → View (EJS) или JSON

## Database

MySQL в Docker (`docker-compose.yml`). Схема и тестовые данные — `database/schema.sql`, монтируется как init-скрипт контейнера. Подключение — `config/db.js` (переменные из `.env`).

Таблицы:
- `categories` — id, name
- `tools` — id, name, category_id, quantity, condition (ENUM), purchase_date, price, description

## Key conventions

- Сырой SQL только в `models/` — контроллеры SQL не содержат.
- `condition` — зарезервированное слово MySQL, везде в кавычках: `` `condition` ``.
- AJAX-эндпоинт `/api/tools` принимает `?search=&category_id=` и возвращает JSON.
- Страница категорий `/categories` — отдельный роутер `routes/categoryRoutes.js`.
- Тесты (Mocha + Chai) — интеграционные, работают с реальной БД; пишут/удаляют строки с префиксом `TEST_`.
