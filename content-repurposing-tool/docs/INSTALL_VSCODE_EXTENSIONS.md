# Установка VS Code расширений

## Способ 1: Через VS Code UI (Рекомендуется)

1. Откройте VS Code
2. Откройте папку проекта: `/Users/mac/Projects/Al ass/content-repurposing-tool`
3. VS Code автоматически предложит установить рекомендуемые расширения
4. Или вручную:
   - Нажмите `Cmd+Shift+X` (открыть Extensions)
   - Введите название расширения
   - Нажмите Install

## Способ 2: Через командную строку

Сначала установите VS Code command line tools:
1. Откройте VS Code
2. Нажмите `Cmd+Shift+P`
3. Введите: `Shell Command: Install 'code' command in PATH`
4. Выберите эту команду

Затем выполните:

```bash
cd "/Users/mac/Projects/Al ass/content-repurposing-tool"

# Обязательные расширения
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension Prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next

# Дополнительные расширения
code --install-extension eamodio.gitlens
code --install-extension usernamehw.errorlens
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
code --install-extension rangav.vscode-thunder-client
```

## Список расширений

### Обязательные:
1. **ESLint** (`dbaeumer.vscode-eslint`) - Линтинг кода
2. **Prettier** (`esbenp.prettier-vscode`) - Форматирование кода
3. **Prisma** (`Prisma.prisma`) - Поддержка Prisma schema
4. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - Автодополнение Tailwind классов
5. **TypeScript and JavaScript Language Features** (`ms-vscode.vscode-typescript-next`) - TypeScript поддержка

### Дополнительные (рекомендуемые):
6. **GitLens** (`eamodio.gitlens`) - Расширенная работа с Git
7. **Error Lens** (`usernamehw.errorlens`) - Показ ошибок inline
8. **Auto Rename Tag** (`formulahendry.auto-rename-tag`) - Автоматическое переименование тегов
9. **Path Intellisense** (`christian-kohler.path-intellisense`) - Автодополнение путей
10. **Thunder Client** (`rangav.vscode-thunder-client`) - Тестирование API

---

*После установки расширений перезапустите VS Code*
