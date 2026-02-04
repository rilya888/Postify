# Итоги реализации плана: два тарифа подписки

Этот документ содержит сводку по всем выполненным этапам плана "Два тарифа подписки (текст / текст + аудио)", включая изменения в коде, решение проблем и статус оставшихся задач.

## Выполненные этапы:

### Этап 1. Фундамент (оба тарифа)

- **Назначение:** Реализация базовых механизмов генерации контента, кэширования и логирования.
- **Что сделано:**
    - **Кэширование (`lib/services/cache.ts`):** Добавлены константы `CACHE_TTL` (7 дней для Outputs, 7 дней для Content Pack) и функция `buildGenerationCacheKey` для детерминированных ключей кэша (без `Date.now()`).
    - **OpenAI клиент (`lib/ai/openai-client.ts`):** Функция `generateContentWithGracefulDegradation` модифицирована для приёма `ttlSeconds` для кэширования.
    - **Шаблоны промптов (`lib/ai/prompts/*.ts`, `lib/ai/prompt-templates.ts`):** Обновлены индивидуальные файлы промптов платформ для экспорта `*_SYSTEM_PROMPT` (короткие правила) и `*_USER_TEMPLATE` (задача + `{sourceContent}` + `{brandVoice}`). Добавлены `*_USER_TEMPLATE_FROM_PACK` с `{contentPack}` для будущей генерации из Content Pack. `lib/ai/prompt-templates.ts` теперь экспортирует `getPlatformSystemPrompt` и `getPlatformUserTemplate` (и `getPlatformUserTemplateFromPack`).
    - **AI сервис (`lib/services/ai.ts`):**
        - Реализована `serializeBrandVoiceForPrompt` для плейсхолдера `{brandVoice}`.
        - `generateForPlatforms` модифицирована для использования `getPlatformSystemPrompt` и `getPlatformUserTemplate` (или `getPlatformUserTemplateFromPack` при наличии Content Pack), построения пользовательских сообщений и использования `buildGenerationCacheKey` с `CACHE_TTL.OUTPUTS_SECONDS`.
        - Обеспечена передача только безопасных метаданных (e.g., `requestId`, `userId`, `projectId`, `sourceLength`, `brandVoiceId`) в `Logger.info`/`error`, без пользовательского контента.
        - Аналогичная логика применена в `regenerateForPlatform` и `generateContentVariations`.
    - **API роут (`app/api/generate/route.ts`):** Генерация `requestId` с использованием `randomUUID()` и передача его в `generateForPlatforms` и `Logger`.
    - **Логгер (`lib/utils/logger.ts`):** Добавлен комментарий о запрете логирования пользовательского контента.
- **Статус:** Выполнено.

### Этап 2. Content Pack и генерация из Pack (тариф «Текст»)

- **Назначение:** Создание структурированного "Content Pack" из исходного текста для более эффективной и управляемой генерации контента.
- **Что сделано:**
    - **Prisma (`prisma/schema.prisma`):** Добавлена модель `ContentPack` (поля: `projectId`, `userId`, `packJson` (Json), `inputHash` (String), `model`, `createdAt`).
    - **Сервис `lib/services/content-pack.ts`:** Создан для построения и управления Content Pack. Включает `buildContentPackFromText`, `getOrCreateContentPack` (использует кэш и БД), `formatContentPackForPrompt`.
    - **Интеграция в AI (`lib/services/ai.ts`):** `generateForPlatforms` вызывает `getOrCreateContentPack`. Если Content Pack успешно построен, используется `getPlatformUserTemplateFromPack` и `contentPack` в промпте; при ошибке построения Pack предусмотрен fallback на `sourceContent` (обратная совместимость).
- **Статус:** Выполнено.

### Этап 5. Конфиг моделей и параметры генерации

- **Назначение:** Централизованное управление моделями OpenAI и параметрами генерации (температура, `max_tokens`) с привязкой к тарифному плану.
- **Что сделано:**
    - **`lib/constants/ai-models.ts`:** Создан файл с конфигом моделей и параметрами.
        - Определены параметры для Content Pack (`model: gpt-4o-mini`, `temperature: 0.2`, `maxTokens: 1500`).
        - Определены параметры для генерации постов: `defaultModel` по плану (e.g., `gpt-4o-mini` для free/pro), `fallbackModel: gpt-3.5-turbo`, `maxTokensByPlatform` и `temperatureByPlatform` для различных платформ (e.g., LinkedIn, Email).
        - Определена `TRANSCRIPTION_MODEL: whisper-1`.
        - Функции: `getModelConfig(plan)`, `getGenerateModel`, `getMaxTokensForPlatform`, `getTemperatureForPlatform`.
    - **`lib/services/content-pack.ts`:** Модифицирован для использования `getModelConfig(plan).contentPack` для выбора модели, температуры и `max_tokens`. Параметр `plan` добавлен в `buildContentPackFromText` и `getOrCreateContentPack` (по умолчанию `"free"`).
    - **`lib/services/ai.ts`:**
        - Функции `generateForPlatforms`, `regenerateForPlatform`, `generateContentVariations` теперь принимают параметр `plan` (по умолчанию `"free"`).
        - Используют `getModelConfig(plan).generate` для выбора модели, температуры и `max_tokens` по платформе.
        - `plan` передаётся в `getOrCreateContentPack`.
    - **API роуты (`app/api/generate/route.ts`, `app/api/generate/variations/route.ts`):** Передают `plan` из подписки пользователя в соответствующие AI-сервисы.
- **Решение проблем с тестами:**
    - `__tests__/ai-service.test.ts`: обновлены моки для `brandVoice`, `content-pack`, `generateContentWithGracefulDegradation`.
    - `__tests__/api/generate.test.ts`: обновлено ожидание вызова `generateForPlatforms` для учёта новых аргументов (`requestId`, `plan`).
    - `__tests__/content-validation.test.ts`: тест для LinkedIn теперь использует контент, соответствующий правилам платформы (длина, хэштеги, хук).
    - `__tests__/openai-client.test.ts`: тест на `generateContentWithRetry` обновлён для учёта fallback-модели (ожидает 4 вызова `mockCreate`).
- **Статус:** Выполнено.

### Этап 3. Подписки: тариф «Текст» vs «Текст + Аудио»

- **Назначение:** Введение двух тарифных планов с разными возможностями и лимитами, особенно для аудио.
- **Что сделано:**
    - **`lib/constants/plans.ts`:**
        - Добавлен тип **`PlanType = "text" | "text_audio"`**.
        - У каждого плана (`free`, `pro`, `enterprise`) теперь есть поле `planType` (free → `text`, pro/enterprise → `text_audio`).
        - Для планов `text_audio` добавлены поля `audioMinutesPerMonth` и `maxAudioFileSizeMb`.
        - Добавлены вспомогательные функции: `getPlanType(plan)`, `canUseAudio(plan)`, `getAudioLimits(plan)`.
    - **Prisma (`prisma/schema.prisma`):** В модель `Subscription` добавлены поля `audioMinutesUsedThisPeriod` (Int, `default: 0`) и `audioMinutesLimit` (Int, nullable).
    - **Миграция:** Создана `prisma/migrations/20260204120000_subscription_audio_usage/migration.sql` для добавления новых полей в `subscriptions`.
    - **`lib/services/quota.ts`:**
        - Функция `checkProjectQuota` теперь возвращает `planType` и `canUseAudio`.
        - Добавлена функция `checkAudioQuota(userId)` для проверки лимитов аудио (используемые/доступные минуты, возможность добавления минут).
        - Добавлена функция `incrementAudioMinutesUsed(userId, minutesUsed)` для учёта использованных минут после транскрипции.
    - **API роут (`app/api/subscription/features/route.ts`):** Создан новый GET-эндпоинт, который возвращает `planType`, `canUseAudio` и `audioLimits` для текущего пользователя, позволяя UI динамически отображать функциональность.
- **Статус:** Выполнено.

### Этап 4. Аудио Ingest (только тариф «Текст + Аудио»)

- **Назначение:** Реализация процесса загрузки, транскрипции аудиофайлов и интеграция их в основной конвейер генерации контента.
- **Что сделано:**
    - **Prisma (`prisma/schema.prisma`):**
        - Добавлены модели **SourceAsset** (для хранения метаданных источника, типа "text" или "audio") и **Transcript** (для результатов транскрипции).
        - В модель `Project` добавлена связь `sourceAssets`.
    - **Миграция:** Создана `prisma/migrations/20260204140000_source_asset_transcript/migration.sql` для создания таблиц `source_assets` и `transcripts`.
    - **`lib/services/transcription.ts`:**
        - Реализована функция `transcribeAudioFile(filePath, options?)` для вызова OpenAI Whisper API с использованием `whisper-1` и `response_format: "verbose_json"` (для получения текста, языка, длительности). Включена логика повторов с экспоненциальной задержкой.
        - Добавлена функция `normalizeTranscript(raw)` для базовой очистки текста транскрипта (trim, схлопывание пробелов/переносов).
        - Заглушка `getAudioDurationSeconds` (возвращает `undefined`) для возможности проверки длительности аудио до транскрипции (можно подключить `music-metadata` для полноценной реализации).
    - **API роут `POST /api/projects/[id]/ingest-audio`:**
        - Обработка multipart `FormData` для загрузки аудиофайлов.
        - Проверка авторизации, прав на проект.
        - **Проверка плана:** Запрос отклоняется, если план пользователя не **`text_audio`**.
        - **Проверка лимитов:** Проверка `maxAudioFileSizeMb` (размер файла) и `audioMinutesLimit` (суммарная длительность после транскрипции).
        - Загруженный файл временно сохраняется на диск.
        - Создается запись **SourceAsset** со статусом `pending`.
        - Вызывается `transcribeAudioFile`. При успехе создаётся запись **Transcript** со статусом `completed`, привязанная к `SourceAsset`. При неудаче `Transcript` создаётся со статусом `failed`.
        - Временный файл удаляется после обработки.
        - `project.sourceContent` обновляется нормализованным транскриптом для обеспечения совместимости с существующим UI и конвейером генерации.
        - `incrementAudioMinutesUsed` вызывается для учёта использованных минут.
        - `audioMinutesLimit` устанавливается для подписки, если он `null` (при первом использовании аудио).
- **Статус:** Выполнено.

### Этап 6. Версионирование и метаданные

- **Назначение:** Добавление возможности отката к предыдущим версиям генерируемого контента и расширение метаданных генерации для улучшения отслеживаемости.
- **Что сделано:**
    - **Prisma (`prisma/schema.prisma`):** В модель **`OutputVersion`** добавлено опциональное поле **`generationMetadata`** (тип `Json`) для дублирования метаданных генерации при сохранении версии.
    - **Миграция:** Создана `prisma/migrations/20260204150000_output_version_metadata/migration.sql` для добавления `generationMetadata` в таблицу `output_versions`.
    - **`lib/services/ai.ts`:**
        - В функции **`regenerateForPlatform`**: Перед сохранением нового контента, если существует предыдущий `Output` с контентом, создается новая запись **`OutputVersion`**, сохраняя старый `content` и его `generationMetadata`.
        - Измеряется **`latencyMs`** вокруг вызова генерации; в метаданные добавлены **`latencyMs`**, **`tokensUsed`** (пока `null`), **`costEstimate`** (пока `null`), **`seed`** (пока `null`). Аналогичные поля добавлены в `generateForPlatforms`.
    - **`lib/services/editor.ts`:** В функциях `updateOutputContent` и `revertOutputToVersion` при создании `OutputVersion` теперь также передается `generationMetadata` текущего `Output`.
    - **`types/ai.ts`:** В тип `GenerationMetadata` добавлены поля `latencyMs?`, `tokensUsed?`, `costEstimate?`, `seed?`.
- **Статус:** Выполнено.

### Этап 7. UX: выбор тарифа и загрузки аудио

- **Назначение:** Адаптация пользовательского интерфейса для поддержки новых тарифных планов и функциональности загрузки аудио/текста.
- **Что сделано:**
    - **Страница генерации (`app/(dashboard)/projects/[id]/generate/page.tsx`):**
        - При загрузке страницы выполняется запрос к `/api/subscription/features` для получения `planType` и `canUseAudio` текущего пользователя.
        - **Бейдж тарифа:** Рядом с заголовком страницы отображается текущий тариф пользователя («Текст» или «Текст + Аудио» с иконкой).
        - **Блок «Загрузить аудио»:**
            - Отображается только для тарифов **`text_audio`** (если `canUseAudio` = `true`).
            - Включает файловый инпут для выбора аудиофайла (`.mp3`, `.m4a`, `.wav` и т.д.) и кнопку «Выбрать файл».
            - При загрузке файла вызывается **`POST /api/projects/[id]/ingest-audio`**.
            - Отображается статус «Транскрипция…» во время обработки, затем тост об успехе или ошибке.
            - После успешной транскрипции проект автоматически перезагружается, обновляя `sourceContent` на транскрипт.
        - **Блок «Загрузить .txt»:**
            - Отображается для тарифов **`text`** (внутри карточки Source Content).
            - Позволяет загрузить `.txt` файл, содержимое которого считывается клиентом и используется для обновления `project.sourceContent` через **`PATCH /api/projects/[id]`**.
- **Статус:** Выполнено.

---

## Что по плану осталось (дополнения / опционально)

Все обязательные этапы плана выполнены. Ниже перечислены пункты из разделов "Дополнения к плану" и "Что явно не входит", которые могут быть реализованы в будущем:

1.  **Защита от дорогих запросов (п. 6.2)**
    *   При очень длинном тексте/транскрипте — всегда сначала строить Content Pack.
    *   Ограничить concurrency по платформам (очередь до K параллельных вызовов).
2.  **PII (п. 7.3), опционально**
    *   Простая проверка на email/телефон/адрес (regex) в тексте или транскрипте; при обнаружении — предупреждение в UI, без блокировки генерации.
3.  **Дополнительные тесты из плана**
    *   Content Pack: мок OpenAI, проверка формата JSON и полей.
    *   Транскрипция: мок Whisper API, проверка сохранения Transcript.
    *   Лимиты плана: тариф text не принимает аудио; text_audio проверяет лимит минут.
4.  **Инвалидация кэша**
    *   При изменении исходного текста проекта или смене brand voice — инвалидировать кэш Pack и outputs по этому проекту (удалить ключи или сбросить TTL).
5.  **Учёт стоимости (опционально)**
    *   Заполнять `costEstimate` в `Transcript` и `generationMetadata` `Output`; при желании — отдельный учёт по `userId`/`period`.
6.  **Документация миграции для существующих пользователей**
    *   Краткий чек-лист/раздел: как ведут себя старые проекты при переходе на Pack, маппинг `free`/`pro` → `text`/`text_audio`, что делать с уже сгенерированными outputs.
7.  **Отдельные эндпоинты**
    *   При необходимости выделить `/api/ingest`, `/api/content-pack`, `/api/transcribe`; сейчас логика совмещена с `/api/generate` и upload — по плану это допустимо.
8.  **Видео, YouTube, асинхронные джобы (GenerationJob), отдельный шаг Polish (LLM), Custom-тариф, Redis/Upstash для rate limit**
    *   Эти пункты явно не входили в текущий план и отложены на будущее.
