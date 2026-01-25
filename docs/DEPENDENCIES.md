# Project Dependencies Plan

Список всех зависимостей, которые будут установлены в ЭТАП 1.

## Production Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.19.0",
    "next-auth": "^4.24.7",
    "openai": "^4.52.0",
    "zod": "^3.23.8",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zustand": "^4.5.0",
    "bcryptjs": "^2.4.3",
    "@tiptap/react": "^2.4.0",
    "@tiptap/starter-kit": "^2.4.0",
    "lucide-react": "^0.424.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0",
    "react-hot-toast": "^2.4.1"
  }
}
```

## Development Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.5.0",
    "prisma": "^5.19.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "@tailwindcss/typography": "^0.5.13"
  }
}
```

## Обоснование зависимостей

### Core
- `next`, `react`, `react-dom` - основа Next.js 14
- `typescript` - строгая типизация

### Database
- `@prisma/client`, `prisma` - ORM для работы с PostgreSQL
- Типы генерируются автоматически из schema

### Authentication
- `next-auth` - аутентификация и сессии
- `bcryptjs` - хеширование паролей

### AI Integration
- `openai` - официальный SDK для OpenAI API

### Validation
- `zod` - runtime валидация и type inference
- `@hookform/resolvers` - интеграция Zod с React Hook Form

### Forms
- `react-hook-form` - управление формами с минимальными ре-рендерами

### State Management
- `zustand` - легковесный state management (легче Redux)

### Editor
- `@tiptap/react` + `@tiptap/starter-kit` - rich text editor

### UI
- `lucide-react` - иконки
- `clsx`, `tailwind-merge` - утилиты для условных классов
- `react-hot-toast` - уведомления

### Styling
- `@tailwindcss/typography` - стили для типографики

### Code Quality
- `eslint`, `eslint-config-next` - линтинг
- `prettier`, `prettier-plugin-tailwindcss` - форматирование

---

*Будет использовано в ЭТАП 1 при установке зависимостей*
