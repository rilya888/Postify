# Детальный план реализации рекомендаций (RECOMMENDATIONS)

Документ описывает пошаговую реализацию всех пунктов из плана-обзора: planType в Subscription, сброс аудио-квоты, rate limiting для transcribe/content-pack, асинхронная очередь транскрипции, cost tracking, language override, Content Pack versioning, централизованный model fallback.

**Базовые пути:** `app/`, `lib/`, `prisma/`, `components/`. Импорты через `@/lib`, `@/components`.

---

## Фаза 1: planType в Subscription + сброс квоты + rate limit transcribe/content-pack

### 1.1 Добавить planType и audioMinutesResetAt в схему

**Файл:** `prisma/schema.prisma`

**Действия:**

1. Добавить enum (после модели Subscription или в блоке enums):

```prisma
enum PlanType {
  TEXT           // только текст
  TEXT_AUDIO     // текст + аудио
  TEXT_AUDIO_VIDEO
  CUSTOM
}
```

2. В модели `Subscription`:
   - Добавить поле `planType PlanType @default(TEXT)`.
   - Добавить `audioMinutesResetAt DateTime?` (дата следующего сброса квоты).
   - Оставить существующие `audioMinutesUsedThisPeriod`, `audioMinutesLimit`, `currentPeriodEnd` (в RECOMMENDATIONS использованы имена `audioMinutesUsed`/`audioMinutesResetAt`; у нас уже есть used/limit, добавляем только resetAt для явного сброса).

**Итог полей Subscription (дополнение):**

```prisma
planType             PlanType   @default(TEXT)
audioMinutesResetAt   DateTime?
```

3. Создать миграцию:

```bash
npx prisma migrate dev --name add_plan_type_and_audio_reset
```

4. В миграции (ручная правка при необходимости) заполнить `planType` из `plan`:

```sql
-- Если Prisma не добавила default, добавить колонку с default
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "planType" TEXT NOT NULL DEFAULT 'TEXT';
-- Маппинг: free -> TEXT, pro/enterprise -> TEXT_AUDIO
UPDATE "subscriptions"
SET "planType" = CASE
  WHEN "plan" = 'free' THEN 'TEXT'
  WHEN "plan" IN ('pro', 'enterprise') THEN 'TEXT_AUDIO'
  ELSE 'TEXT'
END;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "audioMinutesResetAt" TIMESTAMP(3);
-- Установить audioMinutesResetAt = currentPeriodEnd для существующих записей, где есть currentPeriodEnd
UPDATE "subscriptions"
SET "audioMinutesResetAt" = "currentPeriodEnd"
WHERE "currentPeriodEnd" IS NOT NULL;
```

После миграции выполнить `npx prisma generate`.

---

### 1.2 Константы планов: поддержка planType из БД

**Файл:** `lib/constants/plans.ts`

**Действия:**

1. Добавить тип для значения из БД:

```ts
export type PlanTypeDB = "TEXT" | "TEXT_AUDIO" | "TEXT_AUDIO_VIDEO" | "CUSTOM";
```

2. Оставить текущий `PlanType = "text" | "text_audio"` для UI/логики (lowercase). Добавить маппинг:

```ts
export const PLAN_TYPE_FROM_DB: Record<PlanTypeDB, PlanType> = {
  TEXT: "text",
  TEXT_AUDIO: "text_audio",
  TEXT_AUDIO_VIDEO: "text_audio",
  CUSTOM: "text_audio",
};
```

3. Экспортировать функцию, которая по подписке возвращает planType для проверок:

```ts
export function getPlanTypeFromSubscription(subscription: { planType?: string | null } | null): PlanType {
  if (!subscription?.planType) return "text";
  return PLAN_TYPE_FROM_DB[subscription.planType as PlanTypeDB] ?? "text";
}
```

4. В `PLAN_LIMITS` оставить текущий `planType` для обратной совместимости (когда подписка ещё без planType или для дефолтов). Все проверки «can use audio» перевести на чтение из подписки в quota.ts (см. ниже).

---

### 1.3 Quota: чтение planType из БД и сброс квоты при смене периода

**Файл:** `lib/services/quota.ts`

**Действия:**

1. Импорт: добавить `getPlanTypeFromSubscription` из `@/lib/constants/plans`.

2. В `checkAudioQuota`:
   - Вместо `const plan = (subscription?.plan || "free") as Plan` и `getPlanType(plan)` использовать `getPlanTypeFromSubscription(subscription)` для `planType`.
   - Если `planType === "text"` — возвращать `allowed: false` и т.д.
   - Добавить логику сброса: если `subscription.audioMinutesResetAt` есть и `now > subscription.audioMinutesResetAt`, то:
     - Вызвать `prisma.subscription.update` для этого пользователя: `audioMinutesUsedThisPeriod: 0`, `audioMinutesResetAt: addMonths(now, 1)` (или по правилу периода, например из `currentPeriodEnd`).
     - После обновления заново прочитать подписку или подставить `usedMinutes = 0` и новый `audioMinutesResetAt` в возвращаемый объект.
   - Функция `addMonths` реализовать в этом файле или в `lib/utils/date.ts`: `addMonths(date: Date, months: number): Date`.

3. В `incrementAudioMinutesUsed`:
   - Перед инкрементом проверить: если `currentPeriodEnd` и `now > currentPeriodEnd`, то сначала обновить период: установить `audioMinutesUsedThisPeriod: 0`, обновить `currentPeriodEnd` и `audioMinutesResetAt` на следующий период (например +1 месяц от now). Затем прибавить `minutesUsed` к 0.
   - Или вызывать из `checkAudioQuota` единую функцию `ensureAudioQuotaPeriod(subscription)` которая при необходимости сбрасывает счётчик и сдвигает resetAt/periodEnd.

4. Рекомендуется вынести «сброс периода» в отдельную функцию `resetAudioQuotaIfPeriodEnded(userId: string): Promise<void>` и вызывать её в начале `checkAudioQuota` и при необходимости в `incrementAudioMinutesUsed`.

**Файл (новый):** `lib/utils/date.ts`  
- Функция `addMonths(date: Date, months: number): Date` (учёт границ месяца, например через setMonth/getMonth).

---

### 1.4 API subscription/features: отдавать planType из БД

**Файл:** `app/api/subscription/features/route.ts`

**Действия:**

- Вместо `planType: audio.planType` (который сейчас из getPlanType(plan)) брать `planType: getPlanTypeFromSubscription(subscription)` или напрямую `subscription.planType` с маппингом в lowercase для UI (TEXT -> "text", TEXT_AUDIO -> "text_audio"). Чтобы UI не ломался, оставить формат ответа `planType: "text" | "text_audio"`.

---

### 1.5 Rate limit для transcribe

**Файл:** `lib/constants/rate-limits.ts` (создать)

**Содержимое:**

- Константы по планам (free/pro/enterprise): для действия `transcribe` — points и duration. Пример: free: 2/час, pro: 10/час, enterprise: 50/час. Аналогично для `contentPack` (по плану: 10/мин, 50/мин, 200/мин) и при желании переопределить `generate`.

**Файл:** `lib/utils/rate-limit.ts`

**Действия:**

- Добавить хранилище для transcribe (аналогично `store`): ключ userId, окно 3600 ms, счётчик.
- Добавить функцию `checkTranscribeRateLimit(userId: string, plan: Plan): { allowed: boolean; retryAfterSeconds?: number }`. Внутри использовать лимиты из `lib/constants/rate-limits.ts` для переданного плана.
- Добавить функцию `checkContentPackRateLimit(userId: string, plan: Plan)` по той же схеме (окно 60 s, лимиты по плану).

Важно: текущий rate-limit in-memory хранит один счётчик на userId; для «по плану» нужно либо хранить отдельные ключи (userId + action), либо один счётчик на userId для transcribe и применять лимит (points) в зависимости от плана при проверке. Проще всего: один Map для transcribe (userId -> Entry с count и resetAt), при проверке брать лимит points из константы по плану и сравнивать count.

**Файлы API:**

- `app/api/transcribe/route.ts`: после проверки сессии и подписки вызвать `checkTranscribeRateLimit(session.user.id, plan)`. При `!allowed` вернуть 429 с `Retry-After`.
- `app/api/projects/[id]/ingest-audio/route.ts`: то же — вызов `checkTranscribeRateLimit(userId, plan)` перед обработкой файла.
- `app/api/projects/[id]/content-pack/route.ts`: вызвать `checkContentPackRateLimit(userId, plan)` перед `getOrCreateContentPack`.

---

### 1.6 Stripe / создание подписки: выставлять planType

**Места, где создаётся или обновляется Subscription:**

- При регистрации пользователя (если создаётся дефолтная подписка free): при создании записи Subscription задать `planType: "TEXT"`.
- При смене плана (Stripe webhook или админка): при обновлении `plan` на pro/enterprise выставлять `planType: "TEXT_AUDIO"`, а также при первом включении аудио выставить `audioMinutesResetAt` (например currentPeriodEnd или now + 1 month).

Найти в коде все `prisma.subscription.create` и `prisma.subscription.update` и добавить установку `planType` по правилу plan -> planType.

---

**Чек-лист Фаза 1:**

- [ ] Prisma: enum PlanType, поля planType и audioMinutesResetAt в Subscription, миграция и заполнение planType.
- [ ] lib/constants/plans.ts: PlanTypeDB, getPlanTypeFromSubscription, маппинг.
- [ ] lib/utils/date.ts: addMonths.
- [ ] lib/services/quota.ts: использование planType из БД, сброс квоты при now > audioMinutesResetAt, incrementAudioMinutesUsed с учётом сброса периода.
- [ ] app/api/subscription/features: planType из subscription.
- [ ] lib/constants/rate-limits.ts: лимиты по планам для transcribe и contentPack.
- [ ] lib/utils/rate-limit.ts: checkTranscribeRateLimit, checkContentPackRateLimit (с учётом плана).
- [ ] app/api/transcribe/route.ts и ingest-audio/route.ts: проверка transcribe rate limit.
- [ ] app/api/projects/[id]/content-pack/route.ts: проверка content-pack rate limit.
- [ ] Все места создания/обновления Subscription: выставлять planType и при необходимости audioMinutesResetAt.

---

## Фаза 2: Асинхронная очередь транскрипции (TranscriptionJob + worker + API + UI)

### 2.1 Схема БД

**Файл:** `prisma/schema.prisma`

**Действия:**

1. Добавить enum:

```prisma
enum JobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

2. Добавить модель:

```prisma
model TranscriptionJob {
  id            String    @id @default(cuid())
  projectId     String?
  userId        String
  status        JobStatus @default(PENDING)
  progress      Int?      @default(0)

  audioFilePath String    // путь к файлу на диске (временный)
  result        Json?
  error         String?    @db.Text

  sourceAssetId String?    // если привязан к SourceAsset (ingest в проект)
  createdAt     DateTime  @default(now())
  startedAt     DateTime?
  completedAt   DateTime?

  @@index([userId, status])
  @@index([projectId])
  @@index([status])
  @@map("transcription_jobs")
}
```

Связь с User при необходимости через userId (в Prisma можно не объявлять relation, если не нужны include). При желании добавить relation User и/или Project.

3. Миграция: `npx prisma migrate dev --name add_transcription_jobs`

---

### 2.2 Сервис воркера

**Файл:** `lib/workers/transcription-worker.ts` (или `lib/services/transcription-worker.ts`)

**Действия:**

1. Класс или объект с методом `processNextJob()`:
   - Найти одну запись `TranscriptionJob` где `status === 'PENDING'`, orderBy createdAt asc.
   - Если нет — return.
   - Обновить на PROCESSING, записать startedAt.
   - Запустить интервал (setInterval) раз в 3–5 сек для обновления progress (например по elapsed time от startedAt, оценка 5 мин на задачу — progress = min(90, (elapsed / 300000) * 100)).
   - Вызвать существующий `transcribeAudioFile(job.audioFilePath)` из `lib/services/transcription.ts`.
   - По успеху: обновить job (status COMPLETED, progress 100, result, completedAt), удалить файл с диска (fs.unlink), при наличии sourceAssetId — создать/обновить Transcript и SourceAsset, обновить project.sourceContent, вызвать incrementAudioMinutesUsed.
   - По ошибке: обновить job (status FAILED, error: message, completedAt), удалить файл при необходимости.
   - Остановить интервал progress.

2. Метод `start()`: цикл (while true) с вызовом processNextJob и sleep(5000).

3. Зависимости: prisma, transcribeAudioFile, normalizeTranscript, incrementAudioMinutesUsed, getOpenAIClient или прямой вызов transcription.ts. Не вызывать trackCost здесь — cost будет в Фазе 3 при вызове transcribeAudioFile или в воркере после успеха (см. Фазу 3).

4. Учесть: один воркер обрабатывает одну джобу за раз; для нескольких инстансов нужна блокировка (например обновить status на PROCESSING с where status=PENDING в одном update и обрабатывать только если update count > 0).

---

### 2.3 Запуск воркера

- Вариант A: отдельный процесс/скрипт (node scripts/transcription-worker.js), в production — отдельный контейнер или worker dyno.
- Вариант B: в том же процессе Next.js — запуск цикла при старте (например в instrumentation.ts или в custom server). Для serverless не подходит; тогда только отдельный процесс.

**Файл:** `scripts/transcription-worker.ts` (или .js)

- Импорт воркера, вызов worker.start(). Обработка SIGTERM для graceful shutdown (остановить цикл).

---

### 2.4 API: создание джобы (upload + enqueue)

**Маршрут:** `POST /api/projects/[id]/transcribe` (или `POST /api/transcribe/route.ts` изменить на «создать джобу» для проекта).

**Файл:** `app/api/projects/[id]/transcribe/route.ts` (создать)

**Логика:**

1. Auth, проверка прав на проект, canUseAudio (по subscription.planType), checkAudioQuota, checkTranscribeRateLimit.
2. FormData: файл audio.
3. Валидация типа/размера (как в текущем ingest-audio).
4. Сохранить файл во временную директорию (os.tmpdir()), путь запомнить.
5. Создать SourceAsset (type audio, fileUrlOrPath = путь) и запись TranscriptionJob (projectId, userId, status PENDING, audioFilePath, sourceAssetId = sourceAsset.id).
6. Вернуть 200: `{ jobId, status: 'PENDING', estimatedSeconds: 300 }`.

Не вызывать Whisper в этом handler. Существующий `POST /api/transcribe` можно оставить для «только транскрипция без проекта» и тоже перевести на джобы (отдельная джоба без projectId) или оставить синхронным для коротких файлов с предупреждением в UI.

**Файл:** `app/api/jobs/[jobId]/route.ts` (создать)

- GET: по jobId вернуть запись TranscriptionJob (id, status, progress, error, result, projectId). Проверка: только свой userId. При status COMPLETED в result отдавать текст и метаданные для UI. Функция estimateTimeRemaining(job) — по startedAt и средней длительности оценить оставшиеся секунды.

---

### 2.5 Переключение ingest-audio на очередь (опционально)

**Файл:** `app/api/projects/[id]/ingest-audio/route.ts`

- Вариант 1: полностью заменить на создание джобы (как в 2.4) и возврат jobId; клиент переходит на polling.
- Вариант 2: оставить синхронный путь для файлов до N минут (например 2), иначе создавать джобу и возвращать jobId. В обоих случаях использовать общий сервис воркера для джоб.

---

### 2.6 UI: компонент статуса и polling

**Файл:** `components/transcription/transcription-status.tsx` (создать)

- Props: jobId, onComplete?: (data) => void.
- Использовать React Query (useQuery) с queryKey ['transcription-job', jobId], queryFn: fetch GET /api/jobs/[jobId]. refetchInterval: (data) => (data?.status === 'COMPLETED' || data?.status === 'FAILED') ? false : 3000.
- При status COMPLETED: toast.success, вызвать onComplete (например редирект на edit страницу проекта).
- При status FAILED: показать Alert с error и кнопкой «Попробовать снова».
- Иначе: Progress bar по data.progress, текст «Transcribing…», опционально estimatedTimeRemaining.

**Страница/модалка загрузки аудио**

- После POST /api/projects/[id]/transcribe получить jobId, показать TranscriptionStatus с этим jobId. При onComplete — переход на страницу редактирования проекта.

---

**Чек-лист Фаза 2:**

- [ ] Prisma: TranscriptionJob, JobStatus, миграция.
- [ ] lib/workers/transcription-worker.ts: processNextJob, progress, вызов transcribeAudioFile, обновление Transcript/SourceAsset/Project, удаление файла, обработка ошибок.
- [ ] scripts/transcription-worker.ts: запуск воркера.
- [ ] POST /api/projects/[id]/transcribe: сохранение файла, создание Job + SourceAsset, возврат jobId.
- [ ] GET /api/jobs/[jobId]: возврат статуса и result.
- [ ] components/transcription/transcription-status.tsx: polling, прогресс, завершение/ошибка.
- [ ] Интеграция в страницу/модалку загрузки аудио (переход на джобы там, где нужны длинные файлы).

---

## Фаза 3: Cost tracking (UsageCost + trackCost)

### 3.1 Схема

**Файл:** `prisma/schema.prisma`

- В модели User добавить relation: `usageCosts UsageCost[]`.
- В модели Project добавить relation: `usageCosts UsageCost[]` (если ещё нет).

Добавить:

```prisma
enum OperationType {
  NORMALIZE
  CONTENT_PACK
  GENERATE_POST
  TRANSCRIBE_AUDIO
}

model UsageCost {
  id            String        @id @default(cuid())
  userId        String
  projectId     String?
  operation     OperationType
  model         String
  tokensInput   Int           @default(0)
  tokensOutput  Int           @default(0)
  costUSD       Decimal       @db.Decimal(10, 6)
  metadata      Json?
  timestamp     DateTime      @default(now())

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([userId, timestamp])
  @@index([operation, timestamp])
  @@index([projectId])
  @@map("usage_costs")
}
```

Миграция: `npx prisma migrate dev --name add_usage_costs`

---

### 3.2 Калькулятор цен и сервис trackCost

**Файл:** `lib/constants/pricing.ts` (создать)

- Константа OPENAI_PRICING: для каждой модели либо { input, output } (за миллион токенов), либо { perMinute } для Whisper. Использовать актуальные значения из документации OpenAI.
- Функция calculateCost(params: { model, tokensInput?, tokensOutput?, durationMinutes? }): number. Для whisper — perMinute * durationMinutes; для chat — (tokensInput/1e6)*input + (tokensOutput/1e6)*output.

**Файл:** `lib/services/cost-tracking.ts` (создать)

- Функция `trackCost(params: { userId, projectId?, operation: OperationType, model, tokensInput?, tokensOutput?, durationMinutes?, metadata? })`. Вычислить cost через calculateCost, prisma.usageCost.create. Возвращать cost (number) при необходимости.

---

### 3.3 Интеграция в AI-вызовы

- **Генерация постов:** в `lib/services/ai.ts` после каждого успешного вызова OpenAI (generateContent и т.п.) получить usage (prompt_tokens, completion_tokens), вызвать trackCost(operation: GENERATE_POST, model, tokensInput, tokensOutput, projectId, userId).
- **Content Pack:** в `lib/services/content-pack.ts` (или там, где вызывается модель для pack) после ответа — trackCost(CONTENT_PACK, ...).
- **Нормализация текста:** если есть отдельный вызов AI для нормализации (normalize) — trackCost(NORMALIZE, ...).
- **Транскрипция:** в `lib/services/transcription.ts` в функции transcribeAudioFile после успешного ответа вычислить durationMinutes, вызвать trackCost(TRANSCRIBE_AUDIO, model: 'whisper-1', durationMinutes, userId, projectId если передать). Либо вызывать trackCost из воркера после успешной транскрипции (передать projectId, userId из job).

Добавить вызовы trackCost во все перечисленные места, не ломая текущий поток (trackCost в try после успеха, в catch не вызывать).

---

**Чек-лист Фаза 3:**

- [ ] Prisma: UsageCost, OperationType, связи User/Project, миграция.
- [ ] lib/constants/pricing.ts: OPENAI_PRICING, calculateCost.
- [ ] lib/services/cost-tracking.ts: trackCost.
- [ ] lib/services/ai.ts: trackCost после генерации.
- [ ] lib/services/content-pack.ts: trackCost после создания pack.
- [ ] Нормализация (если есть отдельный AI-вызов): trackCost NORMALIZE.
- [ ] Транскрипция (и воркер): trackCost TRANSCRIBE_AUDIO.

---

## Фаза 4: Language override UI

### 4.1 Схема Project

**Файл:** `prisma/schema.prisma`

- В Project добавить: `detectedLanguage String?`, `userSelectedLanguage String?`. Миграция.

---

### 4.2 Бэкенд: определение языка и сохранение выбора

- При транскрипции Whisper возвращает язык — сохранять в Transcript.language и при обновлении project можно писать в project.detectedLanguage.
- В PATCH /api/projects/[id] (или отдельном endpoint) принимать опционально `userSelectedLanguage` и записывать в project.userSelectedLanguage. При генерации/контент-паке использовать выбранный язык, если задан, иначе detectedLanguage, иначе дефолт.

---

### 4.3 UI: LanguageSelector

**Файл:** `components/projects/language-selector.tsx` (создать)

- Props: detectedLanguage?, value (userSelectedLanguage или 'auto'), onChange.
- Список языков: en, ru, es, и т.д. + опция 'auto' (Auto-detect). Select с отображением «Detected: …» когда value === 'auto' и detectedLanguage есть.
- Использовать в форме проекта/редактирования (например на странице generate или в настройках проекта).

---

**Чек-лист Фаза 4:**

- [ ] Project: detectedLanguage, userSelectedLanguage, миграция.
- [ ] Сохранение detectedLanguage при транскрипции.
- [ ] API обновления проекта: приём userSelectedLanguage.
- [ ] components/projects/language-selector.tsx и встраивание в форму.

---

## Фаза 5: Content Pack versioning

### 5.1 Схема ContentPack

**Файл:** `prisma/schema.prisma`

- В ContentPack добавить: `version Int @default(1)`, `promptVersion String @default("v1")`.
- Уникальный индекс или unique: [projectId, version]. Миграция.

---

### 5.2 Константы промптов и версии

**Файл:** `lib/ai/prompts/content-pack.ts` (или в существующем месте промптов content pack)

- Экспорт объекта CONTENT_PACK_PROMPTS: { v1: { system, user }, v2: { system, user }, latest: 'v2' }.
- Функция getContentPackPrompt(version: string) возвращает промпт для версии.

---

### 5.3 Сервис getOrCreateContentPack

**Файл:** `lib/services/content-pack.ts`

- Добавить опциональный параметр `promptVersion?: string` (по умолчанию 'v1' или latest).
- При создании pack: вычислить следующий version для проекта (max(version)+1), записать promptVersion, inputHash как сейчас. Кэш искать по projectId + inputHash + promptVersion.
- Вызов AI с выбранным промптом из getContentPackPrompt(promptVersion).

---

### 5.4 API content-pack: опциональный query promptVersion

**Файл:** `app/api/projects/[id]/content-pack/route.ts`

- Принимать из query или body promptVersion, передавать в getOrCreateContentPack. По умолчанию latest.

---

**Чек-лист Фаза 5:**

- [ ] ContentPack: version, promptVersion, миграция.
- [ ] lib/ai/prompts: CONTENT_PACK_PROMPTS, getContentPackPrompt.
- [ ] lib/services/content-pack.ts: поддержка promptVersion, инкремент version.
- [ ] API content-pack: передача promptVersion.

---

## Фаза 6: Централизованный model fallback и ModelFallbackLog

### 6.1 Конфиг fallback и лог в БД

**Файл:** `lib/constants/ai-models.ts`

- Добавить MODEL_FALLBACKS: Record<string, string[]> (primary -> [fallback1, fallback2]). Для whisper-1 — пустой массив.

**Файл:** `prisma/schema.prisma`

- Модель ModelFallbackLog: id, requestedModel, usedModel, timestamp. Миграция.

---

### 6.2 Единая точка вызова OpenAI с fallback

**Файл:** `lib/ai/openai-client.ts`

- Функция callWithFallback(params: { model, ...rest }): перебор [params.model, ...MODEL_FALLBACKS[params.model]]. При успехе: если использована не запрошенная модель — записать в ModelFallbackLog (requestedModel, usedModel). При ошибке (кроме auth) — пробовать следующую модель. Выброс ошибки после исчерпания списка.

- Заменить текущие вызовы chat.completions.create в генерации/контент-паке на callWithFallback где нужна устойчивость.

---

**Чек-лист Фаза 6:**

- [ ] MODEL_FALLBACKS в lib/constants/ai-models.ts.
- [ ] Модель ModelFallbackLog, миграция.
- [ ] lib/ai/openai-client.ts: callWithFallback и логирование в ModelFallbackLog.
- [ ] Подключение callWithFallback в генерации и content pack.

---

## Порядок выполнения и зависимости

1. **Фаза 1** — без зависимостей; выполнить первой (planType, квота, rate limits).
2. **Фаза 2** — зависит от Фазы 1 (rate limit и quota используются в API джоб). Можно разрабатывать параллельно с Фазой 1, интегрировать после.
3. **Фаза 3** — после Фазы 2 удобно: в воркере сразу вызывать trackCost для TRANSCRIBE_AUDIO. Фазу 3 можно начать после 1 и 2.
4. **Фазы 4, 5, 6** — после стабилизации 1–3; порядок 4 → 5 → 6 или по приоритету (например 6 для надёжности раньше 4 и 5).

---

## Тесты (рекомендуемые)

- Фаза 1: unit для getPlanTypeFromSubscription, для resetAudioQuotaIfPeriodEnded и checkAudioQuota (сброс при periodEnd). Интеграция: rate limit transcribe возвращает 429 при превышении.
- Фаза 2: создание джобы возвращает jobId; GET job возвращает статус; GET job для чужой джобы (другой userId) возвращает 404; воркер переводит PENDING -> COMPLETED (мок Whisper); при отмене джоба переходит в CANCELLED и файл удаляется.
- Фаза 3: trackCost создаёт запись UsageCost с верным costUSD; calculateCost для whisper и для chat.
- Фаза 5: getOrCreateContentPack с разными promptVersion создаёт записи с разными version/promptVersion.
- Фаза 6: callWithFallback при падении первой модели вызывает вторую и пишет в ModelFallbackLog.

Этот документ можно использовать как пошаговый чек-лист и основу для тикетов в трекере задач.

---

## Дополнения и уточнения (что ещё учесть)

После повторного просмотра плана ниже перечислены пункты, которые стоит явно добавить или уточнить при реализации.

### Фаза 1

- **Имена таблиц в миграциях:** В Prisma схема может использовать `@@map("subscriptions")` — в сыром SQL миграции использовать именно это имя таблицы, а не `Subscription`. Проверить `prisma/schema.prisma` перед правкой миграции.
- **Где создаётся/обновляется Subscription:** Явно внести в план список мест для установки `planType`:
  - `app/api/admin/users/[id]/route.ts` — `subscription.upsert` (при сохранении пользователя/плана): при создании/обновлении выставлять `planType` по правилу plan → TEXT/TEXT_AUDIO; при первом назначении pro/enterprise выставить `audioMinutesResetAt` (например now + 1 month).
  - `app/api/projects/[id]/ingest-audio/route.ts` — `prisma.subscription.update` (установка audioMinutesLimit): при этом обновлении не трогать planType; при смене плана через Stripe/админку planType обновляется в users/[id].
  - При первой регистрации пользователя: если в коде есть создание дефолтной подписки (например в `lib/auth/register.ts` или по первому запросу к features), добавить `planType: "TEXT"`. Если подписка создаётся только при первом логине/features — проверить этот путь и задать planType там.

### Фаза 2: воркер и джобы

- **Атомичное «взятие» джобы:** Чтобы при нескольких инстансах воркера одна джоба не обрабатывалась дважды, брать джобу атомарно: один запрос вида `prisma.transcriptionJob.updateMany({ where: { status: 'PENDING' }, data: { status: 'PROCESSING', startedAt: new Date() } })` не подходит для «взять одну». Вариант: `findFirst` по PENDING + orderBy createdAt, затем `update` с условием `where: { id: job.id, status: 'PENDING' }`; если `update.count === 0`, джобу уже взял другой воркер — пропустить и взять следующую. Либо сырой SQL `UPDATE transcription_jobs SET status = 'PROCESSING', "startedAt" = now() WHERE id = (SELECT id FROM transcription_jobs WHERE status = 'PENDING' ORDER BY "createdAt" ASC LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *` (PostgreSQL).
- **Проверка квоты в воркере:** Перед вызовом Whisper в воркере повторно вызвать `checkAudioQuota(job.userId)`. Если `!allowed` (например пользователь понизил план или истёк период) — пометить джобу FAILED с сообщением «Audio quota not available», удалить файл, не вызывать Whisper и не вызывать `incrementAudioMinutesUsed`.
- **Отмена джобы (CANCELLED):** Добавить endpoint `POST /api/jobs/[jobId]/cancel`: проверка session.user.id === job.userId, обновление status на CANCELLED. Удалить временный файл с диска. Воркер при выборе следующей джобы не брать записи со status CANCELLED; перед началом Whisper ещё раз проверить status и выйти, если уже CANCELLED.
- **GET /api/jobs/[jobId] — авторизация:** После загрузки джобы проверить `job.userId === session.user.id`. Если нет — вернуть 404 (не 403), чтобы не раскрывать существование джобы другим пользователям.
- **Размещение файла и деплой воркера:** Если API и воркер работают на одной машине с общим каталогом (например `os.tmpdir()`), путь к файлу в джобе корректен. Если воркер и API на разных нодах (несколько инстансов, serverless + отдельный worker), временный файл должен быть в общем хранилище: загрузка в S3 (или аналог), в джобе хранить `audioFileUrl` (S3 URI); воркер скачивает файл во временный каталог, вызывает Whisper, затем удаляет локальный и объект в S3. В плане явно зафиксировать выбранный вариант (одна нода / общее хранилище) и при необходимости добавить шаги: upload в S3 в POST transcribe, очистка объекта в воркере после обработки.
- **Очистка старых джоб и «забытых» файлов:** Периодическая задача (cron или отдельный скрипт): удалять записи TranscriptionJob со status COMPLETED/FAILED/CANCELLED старше N дней (например 7 или 30). Для джоб в статусе FAILED/PENDING с очень старым createdAt — помечать CANCELLED и удалять файл. Проверять диск на «осиротевшие» файлы (файл есть, джоба уже удалена) и удалять их.
- **При падении джобы:** При status FAILED обновить SourceAsset: `fileUrlOrPath: null`. Опционально создать запись Transcript с status 'failed' и пустым rawTranscript, чтобы UI мог показать «транскрипция не удалась» по связи asset → transcript.
- **Логирование в воркере:** Явно логировать: старт обработки джобы (jobId, userId), успешное завершение (jobId, durationSeconds), ошибку (jobId, error.message). Это нужно для отладки и мониторинга без доступа к UI.

### Фаза 3: cost tracking

- **Ошибка trackCost:** Вызов `trackCost` обернуть в try/catch. При ошибке (например недоступна БД) только логировать и не пробрасывать исключение, чтобы сбой учёта стоимости не ломал генерацию/транскрипцию.
- **Неизвестная модель в pricing:** В `calculateCost` если модели нет в OPENAI_PRICING — возвращать 0 и логировать предупреждение (unknown model), чтобы новые модели не роняли расчёт.

### Фаза 4: язык

- **Где используется язык:** Перед реализацией уточнить в коде: куда передаётся язык при генерации и при создании content pack (промпты, параметры API). Подключить туда приоритет: `project.userSelectedLanguage ?? project.detectedLanguage ?? 'en'`.

### Фаза 5: Content Pack

- **Миграция существующих записей:** При добавлении полей `version` и `promptVersion` задать default 1 и 'v1'. Для уже существующих строк Prisma/default обработают новые колонки; при необходимости выполнить `UPDATE content_packs SET version = 1, prompt_version = 'v1' WHERE version IS NULL` (или полагаться на default в миграции).

### Общее

- **Каноническая кодовая база:** В проекте есть и корень (`app/`, `lib/`, `prisma/`), и папка `content-repurposing-tool/`. В плане зафиксировано: реализацию вести в корне (`app/`, `lib/`, `prisma/`, `components/`). Если те же файлы есть в `content-repurposing-tool/`, после изменений синхронизировать или чётко указать, какая копия основная.
- **Деплой воркера:** В документацию (или README деплоя) добавить: запуск воркера как отдельного процесса (`node scripts/transcription-worker.js` или через npm script), переменные окружения (DATABASE_URL, OPENAI_API_KEY), что при нескольких репликах воркера нужна атомичная выборка джобы (см. выше).
- **Админка (опционально):** Для поддержки удобно: страница списка TranscriptionJob (фильтр по статусу, пользователю); агрегаты UsageCost по пользователю/операции за период. В план можно внести как опциональный шаг после основных фаз.
- **Откат миграций:** Для миграции с planType предусмотреть откат (down migration): удаление колонок planType и audioMinutesResetAt при необходимости отката. Не обязательно делать сразу, но зафиксировать в процессе миграций.
