# PostgreSQL and Prisma schema changes

When you **add or remove columns** (or change types, enums, relations) in [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma), two things must stay aligned:

1. **The database** — PostgreSQL must actually have those columns (via migrations or a controlled `db push`).
2. **The Prisma Client** — the generated client in `node_modules/.prisma` and `node_modules/@prisma/client` must match the schema.

If either side is stale, you typically see errors at runtime (unknown column, missing field, P2022, client validation failures) or the API process may still be running **old compiled code** from before `npm run build`.

All commands below are run on the **API host**, from the **`backend/`** directory unless noted otherwise.

## Golden rule after you change `schema.prisma`

Whenever you update the Prisma schema and deploy:

```bash
cd backend   # or your server path to the API repo

npx prisma generate
npm run build
pm2 restart cirvo-backend
```

- **`prisma generate`** refreshes the Prisma Client so Node code matches the schema file.
- **`npm run build`** recompiles NestJS output into **`dist/`** (this repo does not use Next.js or `.next`).
- **`pm2 restart …`** loads the new `dist/` bundle and the new client; a plain file change on disk does not affect an already-running process.

You still need to **apply DDL to PostgreSQL** when the schema change adds/removes columns:

- **Production:** create a migration in dev, commit it, then on the server run **`npx prisma migrate deploy`** (once per deploy, before or with your usual release steps). Skipping this leaves the DB out of sync even if generate/build succeed.
- **Prototyping only:** `npx prisma db push` can mutate the DB without migration files; not a substitute for a proper migration history in production.

## One-command recovery script

Use this when the API is broken after a schema change, a bad deploy, or a mismatched Prisma Client (e.g. old `dist/`, corrupted generated client).

**Important:** This stack is **NestJS + `tsc` → `dist/`**. Do not use `.next` (that is for Next.js). Adjust the PM2 process name and config path to match your server.

```bash
cd backend   # your API checkout on the server

pm2 stop cirvo-backend && \
rm -rf dist node_modules/.prisma node_modules/@prisma/client && \
npm install && \
npx prisma migrate deploy && \
npx prisma generate && \
npm run build && \
pm2 start ecosystem.config.js
```

- **`rm -rf dist`** drops old compiled JS so the next `npm run build` cannot accidentally mask stale output (optional but helps when debugging weird runtime errors).
- **`migrate deploy`** applies pending migrations; if your DB is already up to date, it is a no-op.
- If **`ecosystem.config.js`** lives elsewhere (e.g. repo root), change the last line to the correct path, or use `pm2 restart cirvo-backend` after `pm2 start` once the app is registered.

### Variants

- If you **know** migrations are already applied and only the client/build is wrong, you can omit `migrate deploy` and use the shorter **Golden rule** sequence instead.
- If `npm install` is not needed, you can remove that line to save time (keep the `rm` lines for `.prisma` / `@prisma/client` if the client is suspect).

## Quick checklist (column add/remove)

| Step | Command / action |
|------|-------------------|
| 1 | Edit `schema.prisma`; add a migration (`npx prisma migrate dev` locally) and commit migration SQL. |
| 2 | On production DB: `npx prisma migrate deploy`. |
| 3 | On API server: `npx prisma generate` → `npm run build` → `pm2 restart cirvo-backend`. |
| 4 | Confirm `GET /health/ready` (or your probe) and a smoke test on the affected API. |

## Related docs

- [DEPLOYMENT.md](../DEPLOYMENT.md) — EC2 / process layout.
- [Backend TypeScript Guide](./backend-typescript-guide.md) — NestJS and Prisma in this repo.
