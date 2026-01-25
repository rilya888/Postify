# Coding Standards

## Naming Conventions

### Files and Folders

- **Components:** `PascalCase` (например, `ProjectCard.tsx`)
- **Utilities:** `camelCase` (например, `formatDate.ts`)
- **Constants:** `UPPER_SNAKE_CASE` (например, `API_BASE_URL`)
- **Folders:** `kebab-case` или `camelCase` (например, `project-card/` или `projectCard/`)

### Variables and Functions

- `camelCase` для переменных и функций
- `PascalCase` для компонентов и классов
- `UPPER_CASE` для констант

### TypeScript Types and Interfaces

- `PascalCase` для типов и интерфейсов
- Примеры: `User`, `Project`, `ApiResponse`
- Можно использовать префикс `I` для интерфейсов (опционально): `IUser`, `IProject`

## Code Documentation

### Function Documentation

Все функции должны иметь JSDoc комментарии на английском языке:

```typescript
/**
 * Generates content for specified platforms using OpenAI API
 * @param sourceContent - Original content to repurpose
 * @param platforms - Array of target platforms (linkedin, twitter, email)
 * @returns Promise with generated content for each platform
 * @throws {Error} If OpenAI API request fails
 */
async function generateContent(
  sourceContent: string,
  platforms: Platform[]
): Promise<GeneratedOutput[]> {
  // Implementation
}
```

### Component Documentation

```typescript
/**
 * ProjectCard component displays a single project with its details
 * @param project - Project data to display
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
 */
export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  // Implementation
}
```

### Inline Comments

- Использовать английский язык для комментариев в коде
- Комментарии должны объяснять "почему", а не "что"
- Избегать очевидных комментариев

```typescript
// Good: Explains why
// Using GPT-3.5 as fallback to reduce costs for simple requests
const model = useFallback ? 'gpt-3.5-turbo' : 'gpt-4-turbo';

// Bad: States the obvious
// Set model to gpt-4-turbo
const model = 'gpt-4-turbo';
```

## Code Organization Principles

### Single Responsibility Principle

- Каждый компонент/функция делает одну вещь
- Разделение логики и представления

### DRY (Don't Repeat Yourself)

- Переиспользование компонентов
- Общие утилиты в `lib/utils/`
- Общие типы в `types/`

### Separation of Concerns

- UI компоненты отдельно от бизнес-логики
- API логика в `lib/`
- Типы в `types/`

### File Structure

- Один компонент/функция на файл
- Связанные файлы в одной папке
- Индексы для экспорта (`index.ts`)

## Git Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - новая фича
- `fix` - исправление бага
- `docs` - документация
- `style` - форматирование
- `refactor` - рефакторинг
- `test` - тесты
- `chore` - рутинные задачи

### Examples

```
feat(auth): add email/password authentication
fix(api): handle OpenAI API rate limits
refactor(components): extract reusable button component
docs(readme): update installation instructions
```

---

*Создано: 2026-01-25*
