#!/usr/bin/env bash
# Apply migration: add postsPerPlatformByPlatform column to projects table.
# Run from project root: ./scripts/migrate-posts-per-platform-by-platform.sh
#
# Option 1 (recommended): use Prisma migrate deploy (applies all pending migrations)
# Option 2: run only this migration's SQL via psql (if you need to apply just this one)

set -e
cd "$(dirname "$0")/.."

for f in .env .env.local; do
  if [ -f "$f" ]; then
    set -a
    source "$f"
    set +a
  fi
done

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Add it to .env or .env.local in the project root."
  exit 1
fi

echo "Applying migration: add postsPerPlatformByPlatform to projects..."

# Option 1: Prisma migrate deploy (applies all pending migrations, including this one)
npx prisma migrate deploy

echo "Done. Regenerating Prisma client..."
npx prisma generate

echo "Migration completed successfully."
