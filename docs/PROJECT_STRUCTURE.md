# Project Structure Plan

Детальная структура проекта, которая будет создана в ЭТАП 1.

## Полная структура

```
content-repurposing-tool/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Route group для auth (не влияет на URL)
│   │   ├── login/
│   │   │   └── page.tsx              # Страница входа
│   │   └── signup/
│   │       └── page.tsx              # Страница регистрации
│   ├── (dashboard)/                  # Route group для защищенных routes
│   │   ├── layout.tsx                # Layout с навигацией для dashboard
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Главная страница dashboard
│   │   ├── projects/
│   │   │   ├── page.tsx              # Список проектов
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Создание нового проекта
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Просмотр проекта
│   │   │       ├── edit/
│   │   │       │   └── page.tsx     # Редактирование проекта
│   │   │       └── generate/
│   │   │           └── page.tsx     # Генерация контента
│   │   └── settings/
│   │       └── page.tsx              # Настройки пользователя
│   ├── api/                           # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts         # NextAuth route handler
│   │   ├── projects/
│   │   │   ├── route.ts             # GET (список), POST (создание)
│   │   │   └── [id]/
│   │   │       └── route.ts         # GET, PATCH, DELETE
│   │   ├── generate/
│   │   │   └── route.ts              # POST - генерация контента
│   │   └── outputs/
│   │       └── [id]/
│   │           └── route.ts         # PATCH - обновление output
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Landing page
│   ├── globals.css                    # Глобальные стили
│   └── not-found.tsx                 # 404 страница
├── components/                         # React компоненты
│   ├── ui/                            # shadcn/ui компоненты (будут скопированы)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...                       # Другие UI компоненты
│   ├── auth/                          # Auth компоненты
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   ├── dashboard/                     # Dashboard компоненты
│   │   ├── project-card.tsx
│   │   ├── project-list.tsx
│   │   └── empty-state.tsx
│   ├── projects/                      # Project компоненты
│   │   ├── project-form.tsx
│   │   ├── platform-selector.tsx
│   │   └── content-input.tsx
│   ├── editor/                        # Editor компоненты (ЭТАП 4)
│   │   ├── content-editor.tsx
│   │   └── editor-toolbar.tsx
│   ├── preview/                       # Preview компоненты (ЭТАП 4)
│   │   ├── preview-panel.tsx
│   │   └── platform-preview.tsx
│   └── layout/                        # Layout компоненты
│       ├── header.tsx
│       ├── sidebar.tsx
│       └── navigation.tsx
├── lib/                                # Утилиты и конфигурация
│   ├── ai/                             # AI интеграция (ЭТАП 3)
│   │   ├── openai-client.ts          # OpenAI client setup
│   │   ├── prompts/                   # Промпты для платформ
│   │   │   ├── linkedin.ts
│   │   │   ├── twitter.ts
│   │   │   └── email.ts
│   │   └── generate.ts                # Функции генерации
│   ├── db/                             # Database утилиты
│   │   └── prisma.ts                  # Prisma client instance
│   ├── auth/                           # Auth утилиты
│   │   └── config.ts                  # NextAuth конфигурация
│   ├── validations/                   # Zod schemas
│   │   ├── auth.ts                    # Auth validation schemas
│   │   ├── project.ts                 # Project validation schemas
│   │   └── generate.ts                # Generation validation schemas
│   ├── constants/                      # Константы
│   │   ├── platforms.ts              # Платформы и их лимиты
│   │   └── app.ts                     # Общие константы приложения
│   └── utils/                          # Общие утилиты
│       ├── cn.ts                      # Tailwind class merger
│       ├── copy.ts                    # Copy to clipboard
│       └── format.ts                  # Форматирование данных
├── prisma/                             # Prisma
│   ├── schema.prisma                  # Database schema
│   └── migrations/                     # Миграции (автогенерируются)
├── types/                              # TypeScript типы
│   ├── auth.ts                        # Auth types
│   ├── project.ts                     # Project types
│   ├── platform.ts                    # Platform types
│   └── api.ts                         # API response types
├── hooks/                              # Custom React hooks
│   ├── use-auth.ts                    # Auth hook
│   ├── use-projects.ts                # Projects hook
│   └── use-autosave.ts                # Autosave hook (ЭТАП 4)
├── public/                             # Статические файлы
│   ├── images/                        # Изображения
│   ├── icons/                         # Иконки
│   └── favicon.ico                    # Favicon
├── docs/                               # Документация проекта
│   ├── DESIGN_SYSTEM.md               # Design system
│   ├── PROJECT_STRUCTURE.md           # Этот файл
│   └── ARCHITECTURE.md                # Архитектура (будет добавлено)
├── .env.local                         # Локальные переменные окружения (не коммитить!)
├── .env.example                       # Пример переменных окружения
├── .gitignore                         # Git ignore правила
├── .eslintrc.json                     # ESLint конфигурация
├── .prettierrc                        # Prettier конфигурация
├── next.config.js                     # Next.js конфигурация
├── tailwind.config.ts                 # Tailwind конфигурация
├── tsconfig.json                      # TypeScript конфигурация
├── package.json                       # Зависимости проекта
├── pnpm-lock.yaml                     # Lock file
├── railway.json                       # Railway конфигурация (опционально)
└── README.md                          # Документация проекта
```

## Важные моменты

- Route groups `(auth)` и `(dashboard)` не влияют на URL, но помогают организовать код
- Все API routes в `app/api/` следуют структуре файловой системы
- Компоненты организованы по функциональности
- `lib/` содержит всю бизнес-логику, разделенную по доменам
- `types/` для TypeScript типов, которые используются в нескольких местах
- `docs/` для документации проекта

## Будущие расширения

- В ЭТАП 6 добавим папки для новых фич (templates, calendar, etc.)
- Можно будет добавить `tests/` для unit/integration тестов
- Можно добавить `scripts/` для утилитарных скриптов

---

*Создано: 2026-01-25*
