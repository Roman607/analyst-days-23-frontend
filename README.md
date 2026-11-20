# Analyst Days 23 · Персональная траектория

Мобильный фронтенд на Next.js, Tailwind CSS и shadcn/ui. Участник выбирает темы и выступления из программы на 20–21 ноября 2026 года, затем скачивает один PNG на оба дня. Статусы карточек и строки PNG берутся из последнего актуального ответа FastAPI. Вкладка восстанавливает подтверждённый выбор той же версии программы в течение 20 минут.

## Локальный запуск

Нужны Node.js 24 и запущенный [FastAPI-бэкенд](https://github.com/Roman607/analyst-days-23-backend) со снимком программы. По умолчанию сервер разработки проксирует `/api/*` на `http://127.0.0.1:8000`.

```sh
npm ci
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Для другого адреса FastAPI запустите `BACKEND_URL=http://127.0.0.1:8001 npm run dev`.

## Проверка и сборка

```sh
npm run typecheck
npm run build
npm start
docker build -t analyst-days-23-frontend .
docker run --rm -p 3000:3000 analyst-days-23-frontend
```

В production HTTPS-прокси направляет `/` на порт 3000 фронтенда, а `/api/*` с сохранённым префиксом на FastAPI. Для проверки production-сборки без общего прокси можно передать адрес FastAPI при сборке через `BACKEND_URL=http://127.0.0.1:8000 npm run build`.

## Выпуск

GitHub Actions проверяет типы и собирает Next.js и Docker-образ на pull request и при push в `main`. Успешная сборка `main` публикует `ghcr.io/roman607/analyst-days-23-frontend:<SHA>`. Полный тег для общего выпуска указан в итогах прогона. Две версии образов принимает workflow выпуска в репозитории бэкенда.

[Стенд Timeweb](https://ad23-track.89.23.100.193.nip.io:8445/) · [ТЗ фронтенда](<ТЗ фронтенда — Analyst Days 23.md>) · [Промпт](PROMPTS.md)
