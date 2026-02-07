# План внедрения: генерация на языке исходного материала

## 1) Цель
Сделать так, чтобы генерация контента по умолчанию выполнялась на языке исходного материала и не переключалась на английский без явной причины.

## 2) Правила языка генерации
- Базовое правило: язык output = язык входного текста.
- Для смешанного входа: использовать доминирующий язык.
- Для короткого/неуверенного входа: fallback в порядке приоритета:
  1. сохраненный язык проекта (если есть),
  2. английский по умолчанию.
- Для серии постов: язык фиксируется на всю серию в рамках одного запуска.

## 3) Архитектурные изменения
- Добавить универсальный модуль language detection с confidence.
- Добавить единый language instruction builder для prompt pipeline.
- Встроить language enforcement в:
  - generateForPlatforms,
  - regenerateForPlatform,
  - generateContentVariations.
- Добавить language-aware cache key, чтобы кэш не смешивал результаты разных языков.

## 4) Логика prompt enforcement
- Перед платформенным шаблоном добавлять обязательную директиву:
  - писать строго на target language,
  - не переводить в английский, если target != en,
  - сохранять названия брендов/URL/@mentions без перевода.
- Для content-pack пути применять ту же директиву.

## 5) Пост-проверка и автокоррекция
- После генерации проверять язык output.
- Если output не совпадает с target language:
  - выполнить один повторный запрос с усиленной директивой языка.
- Если после ретрая mismatch сохраняется:
  - вернуть результат, но зафиксировать mismatch в metadata и логах.

## 6) Кэш и metadata
- В генерационный cache key включить targetLanguage.
- В generation metadata добавить:
  - targetLanguage,
  - detectedOutputLanguage,
  - languageDetectionConfidence,
  - languageMismatchRetried.

## 7) Наблюдаемость
- Добавить structured logs:
  - targetLanguage,
  - outputLanguage,
  - mismatch,
  - retryTriggered.
- Это нужно для дальнейшей оптимизации качества и alerting.

## 8) Тестирование
- Unit: детектор языка (ru/en/mixed/short).
- Unit: language instruction builder.
- Integration: генерация с русским source не уходит в английский.
- Регрессия: существующие тесты генерации не ломаются.

## 9) Этапность внедрения
1. Утилиты определения языка и language instruction.
2. Встраивание в generate/regenerate/variations.
3. Language-aware cache key и metadata.
4. Пост-проверка языка + 1 retry.
5. Прогон тестов и сборки.

## 10) Критерии приемки
- Для русского input output стабильно на русском.
- Для английского input output стабильно на английском.
- Для mixed input выбирается доминирующий язык.
- Кэш не возвращает output на неверном языке.
- Комментарии в коде — только на английском.
