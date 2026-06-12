# Frontend

React + Vite приложение для Event Manager.

## Структура

```text
src/api/                      # API-клиенты и автогенерируемые типы
src/components/               # общие компоненты
src/components/AdminPanels/   # панели администратора
src/pages/                    # страницы приложения
src/utils/                    # frontend-утилиты
```

## API

Запросы к backend должны идти через функции в `src/api/`.

```text
src/api/client.ts
src/api/auth.ts
src/api/user.ts
src/api/admin.ts
```

Прямые `fetch` из компонентов не используются.

## Типы

Файл:

```text
src/api/types.tsx
```

генерируется из backend-моделей и не редактируется вручную.

Генерация запускается из корня проекта:

```bash
PATH="$PWD/backend/.venv/bin:$PATH" \
./sh/generate_ts.sh \
  "$PWD/backend/models/external.py" \
  "$PWD/frontend/src/api/types.tsx"
```

## Компоненты

`CompanyInput`

Поле ввода компании с подсказками через backend endpoint Dadata suggest.

```text
src/components/CompanyInput.tsx
```

`SearchableItemsWidget`

Общий модальный виджет для просмотра и поиска коллекций. Используется для участников, тегов и выбора посетителей.

```text
src/components/SearchableItemsWidget.tsx
```

`EventParticipantsWidget`

Адаптер над `SearchableItemsWidget` для списка участников мероприятия.

```text
src/components/EventParticipantsWidget.tsx
```

## Запуск

Обычно frontend запускается через корневой скрипт:

```bash
../run.sh
```

Отдельный запуск:

```bash
npm install
npm run dev
```

## Проверка сборки

```bash
npm run build
```
