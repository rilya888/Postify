# Troubleshooting Guide

Common issues and solutions for HelixCast.

## Environment and Setup

### Application won't start

- **Check environment variables.** Ensure `.env.local` (or production env) has:
  - `DATABASE_URL` — PostgreSQL connection string
  - `NEXTAUTH_SECRET` — Random string (e.g. `openssl rand -base64 32`)
  - `NEXTAUTH_URL` — App URL (e.g. `http://localhost:3000` or production URL)
  - `OPENAI_API_KEY` — Valid OpenAI API key
- **Run migrations:** `npx prisma migrate deploy` (production) or `npx prisma migrate dev` (development).
- **Regenerate Prisma client:** `npx prisma generate` if you see "PrismaClient is not generated" errors.

### Database connection errors

- Verify `DATABASE_URL` format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=...`
- For Railway/cloud DBs, ensure SSL is enabled if required (e.g. `?sslmode=require`).
- Check firewall/network: the host running the app must be able to reach the database port.

## Authentication

### "Unauthorized" or session lost

- Clear cookies for the app domain and log in again.
- Ensure `NEXTAUTH_URL` matches the URL you use (no trailing slash; same protocol and host).
- In production, use HTTPS and a strong `NEXTAUTH_SECRET`.

### Redirect loop on login

- Confirm `NEXTAUTH_URL` and any auth callback URLs in the provider (e.g. NextAuth pages) match exactly.
- Check that the auth API route is not blocked (e.g. by middleware or reverse proxy).

## Content Generation (OpenAI)

### "Internal server error during content generation"

- **OpenAI API key:** Ensure `OPENAI_API_KEY` is set and valid; check usage/billing in the OpenAI dashboard.
- **Rate limits:** You may hit OpenAI rate limits. The app returns 429 with `Retry-After`; wait and retry.
- **Quota:** Free plan limits source content length; ensure input is within `maxCharactersPerContent` for the plan.

### Generation is slow or times out

- Large source content or many platforms increase latency. Consider shorter input or fewer platforms per request.
- Check OpenAI status page for outages.

## API Errors

### 429 Too Many Requests

- **Generate:** 10 requests per minute per user. Wait for the time indicated in `Retry-After` header.
- **Output updates (PATCH):** 30 updates per minute per user.
- **Projects (GET/POST/PATCH/DELETE):** 60 requests per minute per user.

Reduce request frequency or implement client-side throttling/retry with backoff.

### 400 Bad Request

- **Missing/invalid fields:** Check request body against [API documentation](API.md) (e.g. `projectId`, `platforms`, `sourceContent` for generation).
- **Validation errors:** Response may include `details` (e.g. Zod errors). Fix payload and retry.

### 404 Project or output not found

- Resource was deleted or ID is wrong. Ensure the user owns the project; refresh the project list and try again.

## Build and Deploy

### Build fails (Prisma, modules)

- Run `npm ci` and `npx prisma generate`.
- Ensure Node version matches `.nvmrc` or `package.json` engines (e.g. Node 18+).

### Production env not applied

- On Railway/Vercel, set all variables in the dashboard; avoid relying on `.env` files in the repo.
- Restart the service after changing environment variables.

## Still stuck?

- Check application logs (Railway dashboard, `npm run dev` console, or configured logger).
- Open an issue or contact support (see [README](../README.md) or in-app support channel).
