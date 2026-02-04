# Подробный план реализации MVP: AI Content Repurposing Tool

## 1. ОБЗОР ПРОЕКТА

### 1.1 Концепция
SaaS-инструмент для автоматической переработки контента в форматы для разных платформ с помощью AI, с возможностью ручной доработки.

### 1.2 Целевая аудитория (Personas)

**Persona 1: Контент-маркетолог (Sarah)**
- Проблема: 5-7 часов в неделю на адаптацию статей под соцсети
- Потребность: Быстрое создание 10+ постов из одной статьи
- Бюджет: $29-49/месяц

**Persona 2: Подкастер (Mike)**
- Проблема: Транскрипты не используются для контента
- Потребность: Автоматическое создание постов, тредов, email-рассылок
- Бюджет: $19-39/месяц

**Persona 3: Соло-креатор (Alex)**
- Проблема: Нет времени на контент-план
- Потребность: Один вебинар → неделя контента
- Бюджет: $9-29/месяц

### 1.3 Конкурентный анализ

| Конкурент | Сильные стороны | Слабые стороны | Наша дифференциация |
|-----------|----------------|----------------|---------------------|
| Copy.ai | Широкий функционал | Дорого, сложно | Фокус на repurposing |
| Jasper | Качественный AI | Нет специализации | Платформо-специфичные шаблоны |
| Notion AI | Интеграция | Не для контента | Сохранение голоса автора |
| Buffer | Планирование | Нет генерации | AI + ручная доработка в одном месте |

**Наше преимущество:** Специализация на repurposing + сохранение авторского стиля

---

## 2. MVP СКОПИРОВАНИЕ (MVP Scope)

### 2.1 Что ВКЛЮЧАЕМ в MVP (Must Have)

**Core Features:**
1. ✅ Загрузка контента (текст, транскрипт)
2. ✅ Выбор платформ (LinkedIn, Twitter/X, Email)
3. ✅ Генерация черновиков с AI
4. ✅ Редактор с live preview
5. ✅ Копирование в буфер обмена
6. ✅ Базовая авторизация (email/password)
7. ✅ История проектов (последние 10)

**Платформы MVP:**
- LinkedIn (пост, 3000 символов)
- Twitter/X (тред, 280 символов на твит)
- Email (newsletter, 500-1000 слов)

### 2.2 Что НЕ включаем в MVP (Nice to Have)

- ❌ Интеграции с соцсетями (автопостинг)
- ❌ Планирование контента
- ❌ Аналитика
- ❌ Командная работа
- ❌ Множество платформ (Instagram, Facebook, TikTok)
- ❌ Видео/аудио обработка (только транскрипты)
- ❌ Brand voice обучение (в v2)

---

## 3. ТЕХНОЛОГИЧЕСКИЙ СТЕК

### 3.1 Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand (легковесный)
- **Forms:** React Hook Form + Zod
- **Editor:** Lexical или Tiptap (rich text editor)
- **Icons:** Lucide React

**Обоснование:** Next.js для SSR/SSG, быстрая разработка, Railway deployment

### 3.2 Backend
- **Runtime:** Next.js API Routes (на Railway)
- **Database:** PostgreSQL (Railway PostgreSQL или Supabase)
- **ORM:** Prisma
- **Auth:** NextAuth.js
- **File Storage:** Railway Volumes или Supabase Storage

**Обоснование:** Railway поддерживает долгие AI-запросы без лимитов времени, можно хостить БД на той же платформе

### 3.3 AI/ML
- **Primary:** OpenAI GPT-4 Turbo (gpt-4-1106-preview)
- **Fallback:** GPT-3.5 Turbo (для экономии)
- **Whisper API:** Для транскрипции (если добавим в v1.1)
- **Embeddings:** OpenAI text-embedding-3-small (для поиска по истории)

**Обоснование:** GPT-4 для качества, GPT-3.5 для скорости/экономии

### 3.4 Инфраструктура
- **Hosting:** Railway (Full-stack: Frontend + API + Database)
- **Database:** Railway PostgreSQL (или Supabase для начала)
- **CDN:** Cloudflare (опционально, для статики)
- **Monitoring:** Railway Metrics + Sentry (опционально)
- **Email:** Resend или SendGrid

**Обоснование:** Railway = всё в одном месте, нет лимитов на время выполнения (важно для AI), проще управление, можно хостить БД на платформе

### 3.5 Инструменты разработки
- **Package Manager:** pnpm
- **Linting:** ESLint + Prettier
- **Type Safety:** TypeScript (strict mode)
- **Testing:** Vitest + React Testing Library (базовые тесты)
- **CI/CD:** Railway автоматический деплой из GitHub (или GitHub Actions)

---

## 4. АРХИТЕКТУРА СИСТЕМЫ

### 4.1 Структура проекта

```
content-repurposing-tool/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Protected routes
│   │   ├── dashboard/           # Главная
│   │   ├── projects/             # Список проектов
│   │   ├── projects/[id]/       # Редактор проекта
│   │   └── settings/
│   ├── api/                      # API Routes
│   │   ├── auth/                # NextAuth endpoints
│   │   ├── projects/             # CRUD проектов
│   │   ├── generate/             # AI генерация
│   │   └── platforms/           # Платформо-специфичные эндпоинты
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
├── components/                   # React компоненты
│   ├── ui/                      # shadcn компоненты
│   ├── editor/                  # Редактор контента
│   ├── platform-selector/       # Выбор платформ
│   └── project-card/            # Карточка проекта
├── lib/                          # Утилиты
│   ├── ai/                      # OpenAI клиент
│   ├── db/                      # Prisma клиент
│   ├── auth.ts                  # NextAuth config
│   └── utils.ts                 # Общие утилиты
├── prisma/                       # Prisma schema
│   └── schema.prisma
├── types/                        # TypeScript типы
├── railway.json                  # Railway конфигурация (опционально)
├── Dockerfile                    # Docker для Railway (опционально)
└── public/                       # Статика
```

### 4.2 Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  projects      Project[]
  subscription  Subscription?
}

model Project {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  title         String
  sourceContent String    @db.Text
  platforms     String[]  // ["linkedin", "twitter", "email"]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  outputs       Output[]
}

model Output {
  id            String    @id @default(cuid())
  projectId     String
  project       Project   @relation(fields: [projectId], references: [id])
  platform      String    // "linkedin" | "twitter" | "email"
  content       String    @db.Text
  isEdited      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Subscription {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  plan          String    // "free" | "pro" | "enterprise"
  status        String    // "active" | "canceled"
  currentPeriodEnd DateTime?
  createdAt     DateTime  @default(now())
}
```

### 4.3 API Endpoints

**Authentication:**
- `POST /api/auth/signup` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход

**Projects:**
- `GET /api/projects` - Список проектов пользователя
- `POST /api/projects` - Создать проект
- `GET /api/projects/[id]` - Получить проект
- `PATCH /api/projects/[id]` - Обновить проект
- `DELETE /api/projects/[id]` - Удалить проект

**Generation:**
- `POST /api/generate` - Генерация контента для платформ
  - Body: `{ projectId, platforms, sourceContent }`
  - Response: `{ outputs: [{ platform, content }] }`

**Platforms:**
- `GET /api/platforms` - Список доступных платформ
- `GET /api/platforms/[name]/template` - Шаблон для платформы

---

## 5. USER FLOW И UI/UX

### 5.1 Основной User Flow

```
1. Landing Page
   ↓
2. Sign Up / Login
   ↓
3. Dashboard (пустой или с проектами)
   ↓
4. Create New Project
   ├─ Ввод исходного контента (textarea или upload)
   ├─ Выбор платформ (checkboxes)
   └─ Generate
   ↓
5. Results Page
   ├─ Список сгенерированных вариантов
   ├─ Редактор для каждого варианта
   ├─ Preview
   └─ Copy to Clipboard
   ↓
6. Save Project (опционально)
   ↓
7. Back to Dashboard
```

### 5.2 Wireframes (описание)

**Dashboard:**
- Header: Logo, User menu, Upgrade button
- Main: Grid карточек проектов (3 колонки)
- Empty state: "Create your first project" CTA
- Sidebar: Navigation (Projects, Settings)

**Project Editor:**
- Left panel: Исходный контент (read-only)
- Center: Список платформ с редакторами (tabs)
- Right panel: Preview + Copy button
- Top: Save, Delete, Back buttons

**Landing Page:**
- Hero: "Transform one piece of content into weeks of social media posts"
- Features: 3 колонки (Speed, Quality, Control)
- Pricing: 3 тарифа (Free, Pro, Enterprise)
- CTA: "Start Free Trial"

### 5.3 Design System

**Colors:**
- Primary: #6366f1 (Indigo)
- Secondary: #8b5cf6 (Purple)
- Success: #10b981 (Green)
- Error: #ef4444 (Red)
- Background: #f9fafb (Gray-50)
- Text: #111827 (Gray-900)

**Typography:**
- Headings: Inter (Bold)
- Body: Inter (Regular)
- Code: JetBrains Mono

**Components:**
- Использовать shadcn/ui для консистентности
- Кастомные компоненты: PlatformCard, ContentEditor, PreviewPanel

---

## 6. AI ПРОМПТЫ И СТРАТЕГИЯ

### 6.1 Промпт для LinkedIn

```
Ты — эксперт по созданию контента для LinkedIn. 

Задача: Переработай следующий исходный контент в пост для LinkedIn.

Требования:
- Длина: 1200-2500 символов
- Формат: Начинай с hook (вопрос или провокация)
- Структура: Hook → Проблема → Решение → CTA
- Стиль: Профессиональный, но живой
- Используй эмодзи умеренно (2-3 на пост)
- Добавь релевантные хештеги (3-5)

Исходный контент:
{sourceContent}

Важно: Сохрани ключевые идеи и факты из оригинала, но адаптируй под формат LinkedIn.
```

### 6.2 Промпт для Twitter/X

```
Ты — эксперт по созданию тредов в Twitter/X.

Задача: Создай тред из исходного контента.

Требования:
- Каждый твит: максимум 280 символов
- Количество твитов: 3-8 (в зависимости от объема)
- Первый твит: Hook с номером твита (1/5)
- Последующие: Продолжение мысли
- Последний твит: CTA или вывод
- Используй эмодзи для визуального разделения
- Добавь релевантные хештеги в последний твит

Исходный контент:
{sourceContent}

Формат вывода: JSON массив строк, где каждая строка — один твит.
```

### 6.3 Промпт для Email

```
Ты — эксперт по email-маркетингу.

Задача: Создай newsletter из исходного контента.

Требования:
- Длина: 500-1000 слов
- Структура: Subject line → Greeting → Основной контент → CTA → Signature
- Стиль: Персональный, дружелюбный
- Разбивай на короткие параграфы (2-3 предложения)
- Используй подзаголовки для структуры
- CTA должен быть четким и actionable

Исходный контент:
{sourceContent}

Важно: Адаптируй под формат email, но сохрани ценность оригинала.
```

### 6.4 Стратегия оптимизации промптов

1. **Few-shot learning:** Добавлять 1-2 примера хорошего контента
2. **Temperature:** 0.7 для креативности, но не слишком
3. **Max tokens:** 
   - LinkedIn: 2000
   - Twitter: 500 (на тред)
   - Email: 1500
4. **Retry logic:** 3 попытки при ошибке
5. **Caching:** Кэшировать результаты для одинакового контента

---

## 7. ПЛАН РАЗРАБОТКИ (8 недель)

### Неделя 1-2: Setup & Core Infrastructure
- [ ] Инициализация Next.js проекта
- [ ] Настройка Prisma + Railway PostgreSQL (или Supabase)
- [ ] Настройка NextAuth.js
- [ ] Базовая структура папок
- [ ] Настройка Railway проекта и переменных окружения
- [ ] Landing page (статичная)
- [ ] Auth flow (signup/login)

**Deliverable:** Работающая авторизация + база данных + Railway deployment

### Неделя 3-4: Dashboard & Projects CRUD
- [ ] Dashboard UI
- [ ] API endpoints для проектов
- [ ] Создание проекта (форма)
- [ ] Список проектов
- [ ] Удаление проекта
- [ ] Базовая навигация

**Deliverable:** Пользователь может создавать и управлять проектами

### Неделя 5-6: AI Integration & Generation
- [ ] OpenAI клиент
- [ ] Промпты для платформ
- [ ] API endpoint `/api/generate`
- [ ] UI для выбора платформ
- [ ] Генерация контента
- [ ] Обработка ошибок AI

**Deliverable:** Генерация контента работает для всех платформ

### Неделя 7: Editor & Preview
- [ ] Rich text editor (Lexical/Tiptap)
- [ ] Редактирование сгенерированного контента
- [ ] Preview панель
- [ ] Copy to clipboard
- [ ] Сохранение изменений

**Deliverable:** Пользователь может редактировать и копировать контент

### Неделя 8: Polish & Launch
- [ ] Тестирование всех flows
- [ ] Исправление багов
- [ ] Оптимизация производительности
- [ ] Настройка Railway production environment
- [ ] Настройка домена и SSL
- [ ] SEO для landing page
- [ ] Документация
- [ ] Deploy на Railway production

**Deliverable:** MVP готов к запуску на Railway

---

## 8. МОНЕТИЗАЦИЯ

### 8.1 Pricing Tiers

**Free Tier:**
- 3 проекта в месяц
- 1 платформа на проект
- Базовые шаблоны
- Водяной знак (опционально)

**Pro ($29/месяц):**
- Безлимитные проекты
- Все платформы
- Расширенные шаблоны
- Приоритетная поддержка
- Экспорт в PDF

**Enterprise ($99/месяц):**
- Все из Pro
- Brand voice обучение
- API доступ
- Командная работа
- Кастомные шаблоны

### 8.2 Unit Economics (Pro план)

**Расходы на пользователя:**
- OpenAI API: ~$5-10/месяц (100 проектов × $0.05-0.10)
- Infrastructure: ~$3-5/месяц (Railway + PostgreSQL)
- **Total COGS: ~$8-15/месяц**

**Выручка:**
- $29/месяц

**Margin: ~60-75%**

### 8.3 Прогноз выручки (6 месяцев)

| Месяц | Пользователи | MRR | Примечания |
|-------|--------------|-----|------------|
| 1 | 10 | $290 | Launch |
| 2 | 25 | $725 | Ранние adopters |
| 3 | 50 | $1,450 | Word of mouth |
| 4 | 100 | $2,900 | Marketing push |
| 5 | 200 | $5,800 | Product-market fit |
| 6 | 350 | $10,150 | Scaling |

**Assumptions:** 5% conversion rate, 20% churn rate

---

## 9. GO-TO-MARKET СТРАТЕГИЯ

### 9.1 Pre-Launch (2 недели до запуска)

1. **Landing Page:**
   - Собрать waitlist (email)
   - Promise: "Early access + 50% discount"

2. **Content Marketing:**
   - 3-5 постов в LinkedIn/Twitter о проблеме
   - Блог-пост: "How I save 10 hours/week on content"

3. **Communities:**
   - Indie Hackers
   - Product Hunt Ship
   - Reddit (r/entrepreneur, r/SaaS)

### 9.2 Launch Week

1. **Product Hunt:**
   - Подготовить assets (screenshots, video)
   - Мобилизовать сеть для upvotes
   - Цель: Top 5 Product of the Day

2. **Twitter/X:**
   - Launch thread
   - Демо видео
   - Giveaway (1 год бесплатно)

3. **Email Outreach:**
   - 50-100 контент-маркетологов
   - Персональное сообщение
   - Free trial offer

### 9.3 Post-Launch (месяцы 2-6)

1. **Content Marketing:**
   - Еженедельный блог о контент-маркетинге
   - Case studies пользователей
   - SEO оптимизация

2. **Partnerships:**
   - Интеграции с популярными инструментами
   - Affiliate программа (20% recurring)

3. **Paid Ads:**
   - Google Ads (long-tail keywords)
   - LinkedIn Ads (targeting контент-маркетологов)
   - Budget: $500-1000/месяц

---

## 10. МЕТРИКИ УСПЕХА

### 10.1 Product Metrics

**Activation:**
- % пользователей, создавших первый проект: >60%
- Время до первого проекта: <5 минут

**Engagement:**
- DAU/MAU: >30%
- Проектов на пользователя: >5/месяц
- Редактирование контента: >70% проектов

**Retention:**
- Day 7 retention: >40%
- Day 30 retention: >20%
- Monthly churn: <15%

### 10.2 Business Metrics

- **MRR Growth:** 20-30% месяц к месяцу
- **CAC (Customer Acquisition Cost):** <$50
- **LTV (Lifetime Value):** >$300
- **LTV/CAC Ratio:** >6:1

### 10.3 Technical Metrics

- **API Response Time:** <3 секунды для генерации
- **Uptime:** >99.5%
- **Error Rate:** <1%

---

## 11. РИСКИ И МИТИГАЦИЯ

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Высокая стоимость OpenAI API | Средняя | Высокое | Использовать GPT-3.5 для простых задач, кэширование |
| Низкое качество AI контента | Средняя | Высокое | Улучшение промптов, few-shot learning, user feedback loop |
| Конкуренты запускают аналоги | Высокая | Среднее | Фокус на специализацию, быстрое развитие |
| Низкая конверсия | Средняя | Высокое | A/B тестирование, улучшение onboarding |
| Технические проблемы | Низкая | Среднее | Мониторинг, автоматические алерты |

---

## 12. ROADMAP ПОСЛЕ MVP

### v1.1 (месяц 2-3)
- [ ] Интеграция с Twitter API (автопостинг)
- [ ] Интеграция с LinkedIn API
- [ ] История версий контента
- [ ] Экспорт в PDF/DOCX
- [ ] **Content Variations Generator** - Генерация 3-5 вариантов одного поста
- [ ] **Hashtag & Keyword Suggester** - Автоматический подбор хештегов

### v1.2 (месяц 3-4)
- [ ] **Brand Voice Library** - Обучение AI на стиле пользователя
- [ ] **Content Repurposing Templates** - Готовые шаблоны для популярных сценариев
- [ ] Больше платформ (Instagram, Facebook, TikTok)
- [ ] **Smart Content Calendar** - Автоматическое планирование контента

### v1.3 (месяц 4-5)
- [ ] **Multi-Language Repurposing** - Генерация контента на разных языках
- [ ] **Content Remix Mode** - Комбинирование нескольких постов в один

### v2.0 (месяц 6+)
- [ ] API для разработчиков
- [ ] Интеграции (Notion, Google Docs, Zapier)
- [ ] Мобильное приложение (опционально)

---

## 13. ДОПОЛНИТЕЛЬНЫЕ ФИЧИ (POST-MVP)

### 13.1 Brand Voice Library (Библиотека голосов бренда)
**Приоритет:** Высокий | **Версия:** v1.2

**Описание:**
Пользователь загружает 5-10 примеров своего лучшего контента. AI анализирует стиль, тон, структуру и создает уникальный профиль "голоса бренда". Все последующие генерации автоматически используют этот стиль.

**Польза:**
- Контент звучит как автор, а не как AI
- Сохранение уникального стиля бренда
- Увеличение узнаваемости

**Техническая реализация:**
- Сбор примеров контента пользователя
- Анализ через embeddings (text-embedding-3-small)
- Создание промпта-шаблона с характеристиками стиля
- Интеграция в процесс генерации

**UI/UX:**
- Onboarding шаг: "Загрузите примеры вашего контента"
- Dashboard раздел: "Brand Voice Settings"
- Визуализация характеристик стиля (формальный/неформальный, длинные/короткие предложения, использование эмодзи)

---

### 13.2 Content Variations Generator (Генератор вариаций)
**Приоритет:** Высокий | **Версия:** v1.1

**Описание:**
Для одного исходного поста генерирует 3-5 вариантов с разными подходами:
- Формальный/профессиональный
- Дружелюбный/неформальный
- Провокационный/controversial
- Data-driven (с цифрами и фактами)
- Story-driven (с историями и примерами)

**Польза:**
- A/B тестирование контента
- Выбор лучшего варианта для аудитории
- Разнообразие контента без дополнительной работы

**Техническая реализация:**
- Модификация промптов с указанием тона/стиля
- Параллельная генерация нескольких вариантов
- Сохранение всех вариантов для сравнения

**UI/UX:**
- Кнопка "Generate Variations" после основной генерации
- Side-by-side сравнение вариантов
- Возможность выбрать лучший и отредактировать

---

### 13.3 Smart Content Calendar (Умный календарь контента)
**Приоритет:** Средний | **Версия:** v1.2

**Описание:**
Автоматически распределяет сгенерированный контент по датам с учетом:
- Оптимального времени публикации для каждой платформы
- Баланса типов контента (образовательный, развлекательный, промо)
- Праздников и трендов
- Частоты публикаций (не спамить)

**Польза:**
- Планирование контента на недели/месяцы вперед
- Максимальный охват аудитории
- Экономия времени на планирование

**Техническая реализация:**
- Календарный компонент с drag-and-drop
- Алгоритм распределения контента
- Интеграция с планировщиками (Buffer, Hootsuite API)
- Учет часовых поясов и времени активности аудитории

**UI/UX:**
- Визуальный календарь (месячный/недельный вид)
- Автоматическое предложение дат
- Возможность ручной корректировки
- Экспорт в iCal/Google Calendar

---

### 13.4 Multi-Language Repurposing (Мультиязычная переработка)
**Приоритет:** Средний | **Версия:** v1.3

**Описание:**
Генерация контента на разных языках с сохранением смысла, стиля и структуры. Поддержка культурной адаптации (не просто перевод, а адаптация под аудиторию).

**Польза:**
- Охват международной аудитории
- Экономия на переводчиках
- Сохранение стиля на всех языках

**Техническая реализация:**
- GPT-4 для перевода с контекстом
- Промпты для культурной адаптации
- Поддержка популярных языков (EN, ES, FR, DE, RU, ZH, JA)
- Сохранение оригинального контента и переводов

**UI/UX:**
- Выбор языка при генерации
- Side-by-side сравнение оригинала и перевода
- Возможность редактировать перевод

---

### 13.5 AI-Powered Hashtag & Keyword Suggester (Подсказчик хештегов)
**Приоритет:** Высокий | **Версия:** v1.1

**Описание:**
Автоматически анализирует контент и предлагает:
- Релевантные хештеги для каждой платформы
- Оптимальное количество хештегов
- Популярные и нишевые хештеги
- Mentions релевантных аккаунтов

**Польза:**
- Улучшение discoverability контента
- Экономия времени на подборе хештегов
- Увеличение охвата

**Техническая реализация:**
- Анализ контента через embeddings
- База популярных хештегов по темам
- Интеграция с API платформ для проверки трендов
- ML модель для предсказания эффективности

**UI/UX:**
- Автоматическое предложение после генерации
- Категории: популярные, нишевые, трендовые
- Копирование одним кликом
- История использованных хештегов

---

### 13.6 Content Repurposing Templates (Шаблоны переработки)
**Приоритет:** Высокий | **Версия:** v1.2

**Описание:**
Готовые шаблоны для популярных сценариев переработки:
- "Статья → 10 LinkedIn постов"
- "Подкаст → Twitter тред + Email newsletter"
- "Видео → Instagram carousel + TikTok script"
- "Блог-пост → LinkedIn article + Twitter thread + Email"

**Польза:**
- Быстрый старт для типовых задач
- Оптимизированные конфигурации
- Обучение пользователей best practices

**Техническая реализация:**
- Предустановленные конфигурации платформ
- Автоматическая генерация по шаблону
- Возможность создавать кастомные шаблоны
- Сохранение шаблонов пользователя

**UI/UX:**
- Галерея шаблонов при создании проекта
- Предпросмотр что будет сгенерировано
- Популярные шаблоны в топе
- Сохранение своих шаблонов

---

### 13.7 Content Remix Mode (Режим ремикса контента)
**Приоритет:** Низкий | **Версия:** v1.3

**Описание:**
Берет несколько старых постов пользователя и создает новый комбинированный контент, объединяя лучшие идеи, факты и формулировки.

**Польза:**
- Максимальное использование существующего контента
- Создание нового из проверенного материала
- Экономия времени на идеи

**Техническая реализация:**
- Выбор нескольких проектов из истории
- Анализ и извлечение ключевых идей
- Комбинирование через AI с сохранением лучших элементов
- Генерация нового контента на основе комбинации

**UI/UX:**
- Multi-select проектов из истории
- Предпросмотр какие идеи будут использованы
- Генерация нового контента с указанием источников

---

## 14. РЕСУРСЫ И ИНСТРУМЕНТЫ

### 13.1 Документация
- [Next.js Docs](https://nextjs.org/docs)
- [Railway Docs](https://docs.railway.app) - Хостинг и деплой
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Railway PostgreSQL](https://docs.railway.app/databases/postgresql) - База данных

### 13.2 Полезные библиотеки
- `openai` - OpenAI SDK
- `@prisma/client` - Prisma ORM
- `next-auth` - Authentication
- `zod` - Schema validation
- `@lexical/react` - Rich text editor
- `react-hot-toast` - Notifications

### 13.3 Design Resources
- [shadcn/ui](https://ui.shadcn.com) - UI компоненты
- [Tailwind UI](https://tailwindui.com) - Готовые компоненты
- [Heroicons](https://heroicons.com) - Иконки

---

## 15. ЧЕКЛИСТ ПЕРЕД ЗАПУСКОМ

### Техническая готовность
- [ ] Все основные фичи работают
- [ ] Нет критических багов
- [ ] Производительность оптимизирована
- [ ] Мониторинг настроен
- [ ] Backup базы данных настроен
- [ ] SSL сертификат установлен

### Продуктовая готовность
- [ ] Landing page готова
- [ ] Onboarding flow протестирован
- [ ] Pricing страница готова
- [ ] Terms of Service и Privacy Policy
- [ ] Support канал настроен (email/Discord)

### Маркетинговая готовность
- [ ] Product Hunt launch подготовлен
- [ ] Социальные сети готовы
- [ ] Email шаблоны готовы
- [ ] Демо видео записано
- [ ] Блог-посты подготовлены

---

## ЗАКЛЮЧЕНИЕ

Этот план обеспечивает четкий путь от идеи до запуска MVP за 8 недель. Ключевые принципы:

1. **Фокус на core value:** Только самое необходимое для MVP
2. **Быстрая итерация:** Запуск → Feedback → Улучшение
3. **Масштабируемость:** Архитектура готова к росту
4. **Data-driven:** Метрики с первого дня

**Следующий шаг:** Начать с Недели 1-2 (Setup & Infrastructure)

---

---

## 16. RAILWAY DEPLOYMENT GUIDE

### 15.1 Настройка Railway проекта

1. **Создание проекта:**
   - Зарегистрироваться на [railway.app](https://railway.app)
   - Создать новый проект из GitHub репозитория
   - Railway автоматически определит Next.js

2. **Настройка базы данных:**
   - Добавить PostgreSQL service в проект
   - Railway автоматически создаст переменную `DATABASE_URL`
   - Запустить миграции: `npx prisma migrate deploy`

3. **Переменные окружения:**
   ```
   DATABASE_URL=postgresql://... (автоматически)
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=https://your-app.railway.app
   OPENAI_API_KEY=your-openai-key
   ```

4. **Деплой:**
   - Railway автоматически деплоит при push в main
   - Можно настроить preview deployments для PR

### 15.2 Railway конфигурация (railway.json)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 15.3 Преимущества Railway для этого проекта

- ✅ **Нет лимитов на время выполнения** - важно для долгих AI-запросов
- ✅ **Всё в одном месте** - Frontend, API, Database
- ✅ **Простая настройка** - автоматический деплой из Git
- ✅ **Масштабирование** - автоматическое при росте нагрузки
- ✅ **Бесплатный тариф** - $5 кредитов в месяц для старта

### 15.4 Мониторинг и логи

- Railway предоставляет встроенные метрики
- Логи доступны в реальном времени
- Можно интегрировать Sentry для error tracking

---

*Документ обновлен: 2026-01-25*
*Версия: 2.1 (Railway Edition)*
