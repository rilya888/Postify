# Admin Panel

The admin panel allows administrators to view service statistics and manage users, subscriptions, projects, transcripts, and cache.

## Access

- **URL:** `/admin` (redirects to `/admin/dashboard`)
- **Routes:** `/admin/dashboard`, `/admin/users`, `/admin/users/[id]`, `/admin/subscriptions`, `/admin/projects`, `/admin/projects/[id]`, `/admin/transcripts`, `/admin/cache`
- Only users with role `admin` can access these routes. Others are redirected to `/dashboard`.

## Creating the first admin

### Option A: Database role (recommended)

1. Run migrations so the `users.role` column exists:
   ```bash
   npx prisma migrate deploy
   ```
2. Set one user as admin (replace with the user's email):
   - **Prisma Studio:** `npx prisma studio` → open `users` → edit the user → set `role` to `admin`
   - **SQL:** `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`

### Option B: Environment variable (no migration)

Set `ADMIN_EMAILS` in `.env.local` (local) or in your host's environment (production) to a comma-separated list of admin emails. Those users will be treated as admins even if `role` in the DB is `user`:

```env
ADMIN_EMAILS="admin@example.com,other@example.com"
```

### Railway (production)

1. Open your project on [Railway](https://railway.app) → select the service (Postify app).
2. Go to **Variables** (or **Settings** → **Variables**).
3. Add a variable: **Name** `ADMIN_EMAILS`, **Value** your admin email(s), e.g. `your@email.com` or `admin@example.com,other@example.com`.
4. Save; Railway will redeploy if needed. After deploy, log in with that email — the "Admin" link will appear in the menu.

## Admin API (for reference)

All require an authenticated session with `role === "admin"`. Return `403 Forbidden` otherwise.

### Stats and users

- **GET /api/admin/stats** — Aggregated stats for the dashboard (users, projects, outputs, subscriptions, transcripts, cache).
- **GET /api/admin/users** — List users with pagination and search (`?limit`, `offset`, `search`, `sortBy`, `sortOrder`, `role`, `plan`).
- **GET /api/admin/users/[id]** — Single user with subscription and recent projects.
- **PATCH /api/admin/users/[id]** — Update user: `plan`, `subscriptionStatus`, `role`, `resetAudioMinutes`. Cannot remove your own admin role or the last admin.
- **GET /api/admin/users/export** — Export users as CSV (`?search`, `role`, `plan`, `limit`; max 10000). Returns `text/csv` with `Content-Disposition: attachment`.

### Subscriptions, projects, transcripts

- **GET /api/admin/subscriptions** — List subscriptions with pagination (`?limit`, `offset`, `plan`, `status`, `sortBy`, `sortOrder`).
- **GET /api/admin/projects** — List projects with pagination (`?limit`, `offset`, `search` by title or user email, `sortBy`, `sortOrder`).
- **GET /api/admin/transcripts** — List transcripts with pagination (`?limit`, `offset`, `status`: pending | in_progress | completed | failed).

### Cache

- **GET /api/admin/cache** — Cache statistics (total, expired, sizeEstimate).
- **POST /api/admin/cache** — Body:
  - `{ "action": "clean-expired" }` — Remove expired cache entries.
  - `{ "action": "clear-all", "confirmKey": "DELETE" }` — Remove all cache entries (confirmation required).
  - `{ "action": "invalidate-project", "projectId": "<id>" }` — Invalidate cache for one project.

## Navigation

Logged-in admins see an "Admin" link in the header dropdown (user menu). From the admin panel, "Back to app" returns to the main dashboard.
