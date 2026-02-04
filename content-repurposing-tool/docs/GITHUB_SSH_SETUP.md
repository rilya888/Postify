# GitHub SSH Setup Instructions

## SSH Key Created

SSH ключ для GitHub успешно создан:
- **Private key:** `~/.ssh/id_ed25519_github`
- **Public key:** `~/.ssh/id_ed25519_github.pub`

## Public Key

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBPAxdTm1ITEGA9uumBpcp4kd+Z5flC8BpqcxiAC0fCV github-mac@MacBook-Pro-mac-3.local
```

## Добавление ключа в GitHub

1. Скопируйте публичный ключ выше (весь ключ от `ssh-ed25519` до конца)

2. Перейдите на GitHub:
   - Откройте https://github.com/settings/keys
   - Или: GitHub → Settings → SSH and GPG keys → New SSH key

3. Добавьте ключ:
   - **Title:** `MacBook Pro - Postify Project` (или любое название)
   - **Key:** Вставьте скопированный публичный ключ
   - Нажмите **Add SSH key**

4. Проверьте подключение:
   ```bash
   ssh -T git@github.com
   ```
   Должно появиться: `Hi rilya888! You've successfully authenticated...`

5. После успешной проверки сделайте push:
   ```bash
   cd "/Users/mac/Projects/Al ass/content-repurposing-tool"
   git push -u origin main
   ```

## Альтернатива: Копирование ключа в буфер обмена

```bash
# macOS
pbcopy < ~/.ssh/id_ed25519_github.pub

# Затем вставьте (Cmd+V) в поле Key на GitHub
```

---

*Создано: 2026-01-25*
