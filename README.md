# Event Manager

Приложение для регистрации участников на мероприятия и администрирования событий.

Backend: FastAPI, SQLModel, SQLite, Redis.  
Frontend: React, Vite, Max UI.

## Возможности

Для пользователя:

- подача заявки на регистрацию;
- вход по телефону и паролю;
- просмотр мероприятий;
- регистрация и отмена регистрации на мероприятие;
- просмотр списка участников мероприятия;
- редактирование профиля и настроек уведомлений.

Для администратора:

- просмотр, редактирование и одобрение заявок;
- создание, редактирование, архивирование и удаление мероприятий;
- управление пользователями;
- управление посетителями мероприятия;
- просмотр логов backend/frontend;
- выгрузка XLSX-отчета.

## Backend

Основная точка сборки приложения:

```text
backend/main.py
```

`main.py` является composition root: в нем создаются настройки, БД, Redis session storage, log reader, Dadata suggest-сервис, report renderer и FastAPI-приложение.

Основные модули:

```text
backend/app.py                         # класс App поверх FastAPI
backend/models/internal.py             # SQLModel модели БД
backend/models/external.py             # публичные request/response модели
backend/server/server.py               # регистрация HTTP routes
backend/server/endpoints/              # endpoint handlers
backend/server/database/               # абстракция и SQLModel реализация БД
backend/server/session_storage/        # абстракция и Redis реализация сессий
backend/server/log_reader/             # чтение логов
backend/server/report/                 # генерация отчетов
backend/server/company_suggest/        # suggest компаний через Dadata
```

## Компании

Компании хранятся отдельной таблицей:

```text
company
  id
  name
  inn
  address
```

Пользователи и заявки ссылаются на компанию через `company_id`.

Во внешнем API поле `company` пока остается строкой, чтобы frontend работал с простым значением. Преобразование между строкой и `company_id` выполняется на backend.

При вводе компании frontend использует `CompanyInput`, который получает подсказки через backend endpoint:

```http
GET /companies/suggest?q=...
```

Backend-интерфейс:

```text
backend/server/company_suggest/_company_suggest.py
```

Реализация через пакет `dadata`:

```text
backend/server/company_suggest/dadata_company_suggest.py
```

Если `DADATA_TOKEN` не задан, suggest возвращает пустой список, ручной ввод компании продолжает работать.

## Переменные окружения

Файл:

```text
backend/.env
```

Основные переменные:

```env
SESSION_TTL=86400
VERIFICATION_CODE_TTL=300

REDIS_HOST=localhost
REDIS_PORT=6379

ADMIN_PHONE=+70000000000
ADMIN_PASSWORD=0000000000

DADATA_TOKEN=
```

`ADMIN_PHONE` и `ADMIN_PASSWORD` используются для создания/обновления администратора при инициализации БД. Имя администратора задается как `Admin User`.

## Запуск

```bash
chmod +x run.sh
./run.sh
```

С полным локальным сбросом БД, логов и frontend build:

```bash
./run.sh --reset
```

С принудительным освобождением портов:

```bash
./run.sh --force
```

Остановка:

```bash
./stop.sh
```

Локальные адреса по умолчанию:

```text
Backend:  http://localhost:8000
Frontend: http://localhost:5173
Redis:    localhost:6379
```

## Тесты

Запуск backend-тестов:

```bash
cd backend
.venv/bin/python -m pytest
```

Проверка покрытия endpoint handlers:

```bash
cd backend
.venv/bin/python -m pytest --cov=server.endpoints --cov-report=term-missing
```

Текущее покрытие `server.endpoints`:

```text
100%
```

Проверка frontend build:

```bash
cd frontend
npm run build
```

## Генерация frontend типов

Frontend-типы генерируются из backend Pydantic-моделей:

```bash
PATH="$PWD/backend/.venv/bin:$PATH" \
./sh/generate_ts.sh \
  "$PWD/backend/models/external.py" \
  "$PWD/frontend/src/api/types.tsx"
```

Файл `frontend/src/api/types.tsx` не редактируется вручную.

## Тестовые данные

Тестовые пользователи и мероприятия добавляются функцией:

```text
backend/tests/test_func.py::insert_test_data
```

Сейчас она вызывается в `backend/main.py` при локальном запуске. Для production-запуска этот вызов нужно отключить или вынести за env-флаг.

## Технические замечания

- Endpoint handlers лежат отдельно от регистрации routes и тестируются напрямую.
- `server.endpoints` покрыт тестами на 100%.
- В проекте используется простой SQLite setup без Alembic; изменения схемы сейчас обрабатываются вручную в коде и через reset локальной БД.
- `Company` пока не удаляется автоматически, даже если на нее больше никто не ссылается. Это намеренно оставлено как TODO рядом с моделью.
