# План внедрения тарифа Max (v2)

## Контекст
Нужно добавить тариф `Max` между `Pro` и `Enterprise`.

Целевая матрица возможностей:
- `Pro`: текстовые функции, без аудио, без выбора тона поста, без Brand Voice.
- `Max`: все из `Pro` + аудио (транскрибация и лимиты аудио).
- `Enterprise`: все из `Max` + увеличенные лимиты + выбор `post tone` + `brand voice`.

## Принципы реализации
- Не хардкодить проверки вида `plan === "enterprise"`, где это не обязательно.
- Ввести единый слой capabilities/entitlements и использовать его в API и UI.
- Обеспечить предсказуемое поведение при понижении плана (downgrade).
- Комментарии в коде приложения оставлять только на английском языке.

## Этап 1. Core-модель планов и прав
1. Расширить типы планов:
   - Добавить `max` в `PlanDB` и `Plan`.
   - Обновить `DB_PLANS`.
2. Обновить `PLAN_LIMITS`:
   - Добавить `max` с лимитами между `pro` и `enterprise`.
   - Уточнить/зафиксировать увеличенные лимиты `enterprise`.
3. Ввести capability-layer в `lib/constants/plans.ts`:
   - `canUseAudio`
   - `canUseSeries`
   - `canUsePostTone`
   - `canUseBrandVoice`
   - `maxPostsPerPlatform`
4. Привязать `getAudioLimits` и `getPlanType` к новой модели без условностей в роутах.

Критерий готовности:
- В ядре проекта есть единый источник прав по плану.

## Этап 2. Rate limits и плановые ограничения
1. Обновить `lib/constants/rate-limits.ts`:
   - Добавить профиль лимитов для `max`.
2. Проверить `lib/utils/rate-limit.ts` на использование нового `Plan`.
3. Обновить комментарии/доки, где перечислены планы.

Критерий готовности:
- Все rate-limit функции принимают и корректно обрабатывают `max`.

## Этап 3. Backend API: feature-gating через capabilities
1. `app/api/subscription/features/route.ts`:
   - Отдавать фичи и лимиты из capability-layer.
2. `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`, `app/api/projects/create-and-generate/route.ts`:
   - Серии постов включать по `canUseSeries`.
   - `postTone` применять только по `canUsePostTone`.
3. `app/api/generate/route.ts`:
   - Запрет/разрешение series и `postToneOverride` по capabilities.
4. `app/api/transcribe/route.ts`, `app/api/projects/[id]/ingest-audio/route.ts`:
   - Аудио доступно для `Max` и `Enterprise`.
   - Сообщения об апгрейде соответствуют реальной матрице.
5. `app/api/brand-voices/route.ts`:
   - Ввести серверную проверку `canUseBrandVoice`.

Критерий готовности:
- Нельзя обойти ограничения тарифа прямым API-запросом.

## Этап 4. Admin и служебные API
1. Обновить enum/валидации в админских API:
   - `app/api/admin/users/[id]/route.ts`
   - `app/api/admin/subscriptions/route.ts`
   - `app/api/admin/users/export/route.ts`
2. Добавить `max` в фильтры/селекты:
   - `app/admin/users/page.tsx`
   - `app/admin/subscriptions/page.tsx`
   - `components/admin/admin-users-list.tsx`
   - `components/admin/admin-subscriptions-list.tsx`
   - `components/admin/admin-user-edit.tsx`
3. Устранить некорректные допущения (например, `pro` как audio-план).

Критерий готовности:
- Админка полноценно работает с новым планом `max`.

## Этап 5. UI продукта и лендинг
1. Обновить подписочные компоненты:
   - `components/subscription/plan-badge.tsx`
   - `components/subscription/subscription-block.tsx`
   - `components/dashboard/subscription-card.tsx`
2. Обновить формы/экраны проектов:
   - `components/projects/project-form.tsx`
   - `components/projects/new-project-flow.tsx`
   - `app/(dashboard)/projects/[id]/generate/page.tsx`
3. Ограничить Brand Voice в Settings по capability.
4. Обновить лендинг `app/page.tsx` под 4 тарифа (Trial, Pro, Max, Enterprise).

Критерий готовности:
- Пользовательский интерфейс консистентно отражает новую тарифную сетку.

## Этап 6. Локализация
1. Обновить `messages/en.json` и `messages/ru.json`:
   - Новые ключи `planMax`, `pricing.max*`, `admin.plans.max`.
   - Обновить тексты апгрейда и подсказок по фичам.
2. Проверить, что не осталось строк с устаревшей матрицей тарифов.

Критерий готовности:
- UI не содержит старых названий/ограничений планов.

## Этап 7. Downgrade-сценарии
1. Зафиксировать поведение при смене плана:
   - `Enterprise -> Max/Pro`
   - `Max -> Pro`
2. Для недоступных фич:
   - Не применять в генерации.
   - Данные сохранять без удаления, если это безопасно.
3. Проверить, что старые проекты не падают после downgrade.

Критерий готовности:
- Понижение плана не вызывает ошибок и не ломает генерацию.

## Этап 8. Тесты
1. Обновить/добавить unit tests:
   - `__tests__/quota-plan-limits.test.ts`
   - проверки capabilities.
2. Обновить API tests для plan-gating:
   - generate/projects/subscription/admin/brand-voices.
3. Добавить таблицу сценариев по планам:
   - `trial/free/pro/max/enterprise` x `audio/series/postTone/brandVoice`.

Критерий готовности:
- Тесты покрывают матрицу прав и лимитов для всех планов.

## Этап 9. Релиз и валидация
1. Пройти ручной smoke-check:
   - Создание проекта, генерация, аудио, админ-фильтры, апдейт плана.
2. Проверить отсутствие хардкода старой тройки планов в критичных местах.
3. Подготовить короткий rollback-план (что откатить в первую очередь).

Критерий готовности:
- Функциональность `Max` работает end-to-end без регрессий.

---

## Порядок реализации в текущем спринте
1. Этапы 1-4 (ядро + API + админка) — обязательные.
2. Этапы 5-6 (UI + i18n) — обязательные.
3. Этапы 7-8 — обязательные минимум в части критичных тестов.
4. Этап 9 — smoke-check перед завершением.
