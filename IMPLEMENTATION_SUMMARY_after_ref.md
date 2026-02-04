# Итоги реализации: два тарифа подписки (текст / текст + аудио)

Сводка по выполненным этапам плана «Два тарифа подписки», включая изменения в коде и статус задач.

---

## Этап 1. Фундамент (оба тарифа)

**Цель:** Базовые механизмы генерации, кэширования и логирования.

**Сделано:**

- **Кэширование (`lib/services/cache.ts`):**
  - Константы `CACHE_TTL` (7 дней для Outputs, 7 дней для Content Pack).
  - Функция `buildGenerationCacheKey` для детерминированных ключей (без `Date.now()`).

- **OpenAI клиент (`lib/ai/openai-client.ts`):**
  - В `generateContentWithGracefulDegradation` добавлен параметр `ttlSeconds` для кэширования.

- **Промпты (`lib/ai/prompts/*.ts`, `lib/ai/prompt-templates.ts`):**
  - Экспорт `*_SYSTEM_PROMPT` и `*_USER_TEMPLATE` по платформам.
  - Добавлены `*_USER_TEMPLATE_FROM_PACK` с `{contentPack}`.
  - В `prompt-templates.ts`: `getPlatformSystemPrompt`, `getPlatformUserTemplate`, `getPlatformUserTemplateFromPack`.

- **AI-сервис (`lib/services/ai.ts`):**
  - `serializeBrandVoiceForPrompt` для плейсхолдера `{brandVoice}`.
  - `generateForPlatforms` использует шаблоны платформ, `buildGenerationCacheKey`, `CACHE_TTL.OUTPUTS_SECONDS`.
  - В логах только безопасные метаданные (requestId, userId, projectId, sourceLength, brandVoiceId), без пользовательского контента.
  - Та же схема в `regenerateForPlatform` и `generateContentVariations`.

- **API (`app/api/generate/route.ts`):** Генерация `requestId` через `randomUUID()`, передача в `generateForPlatforms` и логгер.

- **Логгер (`lib/utils/logger.ts`):** Зафиксирован запрет логирования пользовательского контента.

**Статус:** выполнен.

---

## Этап 2. Content Pack и генерация из Pack (тариф «Текст»)

**Цель:** Структурированный Content Pack из исходного текста для управляемой генерации.

**Сделано:**

- **Prisma (`prisma/schema.prisma`):**
  - Модель `ContentPack`: `projectId`, `userId`, `packJson` (Json), `inputHash`, `model`, `createdAt`.

- **Сервис `lib/services/content-pack.ts`:**
  - `buildContentPackFromText`, `getOrCreateContentPack` (кэш + БД), `formatContentPackForPrompt`.

- **Интеграция в AI (`lib/services/ai.ts`):**
  - `generateForPlatforms` вызывает `getOrCreateContentPack`.
  - При успешном Pack — `getPlatformUserTemplateFromPack` и `contentPack` в промпте; при ошибке — fallback на `sourceContent`.

**Статус:** выполнен.

---

## Этап 3. Подписки: тариф «Текст» vs «Текст + Аудио»

**Цель:** Два тарифных плана с разными возможностями и лимитами (в т.ч. по аудио).

**Сделано:**

- **`lib/constants/plans.ts`:**
  - Тип `PlanType = "text" | "text_audio"`.
  - У планов: `planType`, для `text_audio` — `audioMinutesPerMonth`, `maxAudioFileSizeMb`.
  - Функции: `getPlanType(plan)`, `canUseAudio(plan)`, `getAudioLimits(plan)`.

- **Prisma:** В `Subscription` добавлены `audioMinutesUsedThisPeriod`, `audioMinutesLimit`.
- **Миграция:** `20260204120000_subscription_audio_usage`.

- **`lib/services/quota.ts`:**
  - `checkProjectQuota` возвращает `planType` и `canUseAudio`.
  - `checkAudioQuota(userId)`, `incrementAudioMinutesUsed(userId, minutesUsed)`.

- **API:** GET `/api/subscription/features` — возвращает `planType`, `canUseAudio`, `audioLimits` для текущего пользователя.

**Статус:** выполнен.

---

## Этап 4. Аудио Ingest (тариф «Текст + Аудио»)

**Цель:** Загрузка аудио, транскрипция и встраивание в конвейер генерации.

**Сделано:**

- **Prisma:**
  - Модели `SourceAsset` (тип text/audio) и `Transcript`.
  - У `Project` связь `sourceAssets`.
- **Миграция:** `20260204140000_source_asset_transcript`.

- **`lib/services/transcription.ts`:**
  - `transcribeAudioFile(filePath, options?)` — вызов OpenAI Whisper (`whisper-1`, `response_format: "verbose_json"`), ретраи.
  - `normalizeTranscript(raw)` — базовая очистка текста.
  - Заглушка `getAudioDurationSeconds` (для будущей проверки длительности до транскрипции).

- **API POST `/api/projects/[id]/ingest-audio`:**
  - Multipart FormData, проверка плана и лимитов (`maxAudioFileSizeMb`, `audioMinutesLimit`).
  - Создание `SourceAsset`, вызов транскрипции, создание `Transcript`, обновление `project.sourceContent`, вызов `incrementAudioMinutesUsed`.
  - Удаление временного файла после обработки.

**Статус:** выполнен.

---

## Этап 5. Конфиг моделей и параметры генерации

**Цель:** Централизованные модели и параметры по плану и платформе.

**Сделано:**

- **`lib/constants/ai-models.ts`:**
  - Параметры для Content Pack (модель, temperature, maxTokens).
  - Параметры генерации постов: default/fallback по плану, `maxTokensByPlatform`, `temperatureByPlatform`.
  - `TRANSCRIPTION_MODEL: whisper-1`.
  - Функции: `getModelConfig(plan)`, `getGenerateModel`, `getMaxTokensForPlatform`, `getTemperatureForPlatform`.

- **`lib/services/content-pack.ts`:** Использует `getModelConfig(plan).contentPack`; в функции добавлен параметр `plan`.

- **`lib/services/ai.ts`:** `generateForPlatforms`, `regenerateForPlatform`, `generateContentVariations` принимают `plan`, используют `getModelConfig(plan).generate`.

- **API:** Роуты генерации передают `plan` из подписки в AI-сервисы.

- **Тесты:** Обновлены моки и ожидания в `ai-service.test.ts`, `api/generate.test.ts`, `content-validation.test.ts`, `openai-client.test.ts`.

**Статус:** выполнен.

---

## Этап 6. Версионирование и метаданные

**Цель:** Откат к предыдущим версиям и расширенные метаданные генерации.

**Сделано:**

- **Prisma:** У `OutputVersion` добавлено поле `generationMetadata` (Json).
- **Миграция:** `20260204150000_output_version_metadata`.

- **`lib/services/ai.ts`:**
  - В `regenerateForPlatform`: перед сохранением нового контента создаётся `OutputVersion` со старым контентом и `generationMetadata`.
  - Измерение `latencyMs`, расширение метаданных: `latencyMs`, `tokensUsed`, `costEstimate`, `seed` (часть полей пока null).

- **`lib/services/editor.ts`:** При создании `OutputVersion` в `updateOutputContent` и `revertOutputToVersion` передаётся `generationMetadata` текущего `Output`.

- **`types/ai.ts`:** В `GenerationMetadata` добавлены `latencyMs?`, `tokensUsed?`, `costEstimate?`, `seed?`.

**Статус:** выполнен.

---

## Этап 7. UX: тариф и загрузка аудио

**Цель:** Отображение тарифа и загрузка аудио/текста в интерфейсе.

**Сделано:**

- **Страница генерации (`app/(dashboard)/projects/[id]/generate/page.tsx`):**
  - Запрос к `/api/subscription/features` при загрузке.
  - Бейдж тарифа («Текст» или «Текст + Аудио») рядом с заголовком.
  - Блок «Загрузить аудио» только при `canUseAudio === true`: файловый инпут, вызов `POST /api/projects/[id]/ingest-audio`, статус «Транскрипция…», тосты, перезагрузка проекта после успеха.
  - Блок «Загрузить .txt» для тарифа «Текст»: загрузка .txt и обновление `project.sourceContent` через `PATCH /api/projects/[id]`.

**Статус:** выполнен.

---

## Что осталось (опционально / дополнения) — выполнено

- **Защита от дорогих запросов:** при длине текста ≥ 15 000 символов всегда используется Content Pack (без fallback на сырой текст); генерация по платформам ограничена concurrency 3 (`LONG_TEXT_THRESHOLD_CHARS`, `GENERATION_CONCURRENCY` в `lib/constants/ai-models.ts`, `lib/services/ai.ts`).
- **Проверка PII:** утилита `lib/utils/pii-check.ts` (email, телефон, адрес); вызов в API generate, предупреждение в UI на странице генерации.
- **Тесты:** `__tests__/content-pack.test.ts` (мок OpenAI), `__tests__/transcription.test.ts` (мок Whisper), `__tests__/quota-plan-limits.test.ts` (лимиты планов), `__tests__/pii-check.test.ts`.
- **Инвалидация кэша:** ключ кэша с префиксом `gen_${projectId}_`; `invalidateProjectGenerationCache(projectId)` в `lib/services/cache.ts`; вызов при PATCH проекта с изменением `sourceContent` в `app/api/projects/[id]/route.ts`.
- **Учёт стоимости:** `WHISPER_COST_PER_MINUTE` в `lib/constants/ai-models.ts`; `costEstimate` записывается в Transcript при ingest-audio; в generationMetadata поле `costEstimate` пока null (при появлении токенов можно заполнять).
- **Документация миграции:** `content-repurposing-tool/MIGRATION_GUIDE.md` (маппинг free/pro → text/text_audio, поведение старых проектов, кэш, лимиты).
- **Отдельные эндпоинты:** POST `/api/projects/[id]/content-pack` (построить и вернуть Pack), POST `/api/transcribe` (только транскрипция файла, без привязки к проекту). Загрузка аудио в проект — по-прежнему POST `/api/projects/[id]/ingest-audio`.

Вне текущего плана (отложено): видео, YouTube, асинхронные джобы, Polish (LLM), Custom-тариф, Redis/Upstash для rate limit.

---

*Документ создан по итогам реализации плана «Два тарифа подписки».*
