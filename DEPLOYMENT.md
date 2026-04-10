# Production deployment (backend, web, mobile)

This document implements the production rollout checklist: EC2 API, Netlify web, Supabase Auth URLs, and iOS-first native builds.

## 1. Backend (EC2)

### Process

- Run Node behind **HTTPS** (Nginx, Caddy, or ALB) terminating TLS; proxy to `http://127.0.0.1:PORT`.
- Copy [`backend/env.example`](backend/env.example) to `.env` on the server and fill secrets.

### Environment

| Variable | Purpose |
|----------|---------|
| `PORT` | Listen port (default `4000`). |
| `DATABASE_URL` | PostgreSQL URL for Prisma. |
| `CORS_ORIGINS` | Comma-separated **https** origins allowed to call the API (e.g. `https://sirva.in,https://www.sirva.in`). Omit for local dev (permissive CORS). |
| `TRUST_PROXY` | Set to `1` when behind a reverse proxy so client IP / secure cookies behave correctly. |

### Health checks (load balancer)

| Path | Use |
|------|-----|
| `GET /health` | **Liveness** — no database; **no** `/api` prefix (configured in [`backend/src/main.ts`](backend/src/main.ts)). |
| `GET /health/ready` | **Readiness** — runs `SELECT 1` against the database; returns `503` if DB is down. |
| `GET /api/...` | All application routes under `/api`. |

Point uptime checks at `https://your-api-domain/health` (or `/health/ready` for stricter checks).

### Housing needs API (`/api/housing-needs`) — 404 on save or list

If the browser or `curl` shows **`Cannot GET /api/housing-needs`** or **`Cannot POST /api/housing-needs`**, the process behind your API domain is almost always an **outdated backend build** (this repo already registers [`HousingNeedsModule`](backend/src/app.module.ts) and exposes [`POST /api/housing-needs`](backend/src/modules/housing-needs/housing-needs.controller.ts)). Listings can work while housing-needs returns 404 if only part of the app was redeployed.

**Fix on the API host (EC2):**

1. Pull the latest code and install dependencies.
2. `npm run build` in [`backend/`](backend/) (output: `backend/dist/`).
3. Apply the database schema so `HousingNeed` exists: `npx prisma migrate deploy` (or `prisma db push` only if that matches how you manage prod).
4. Restart the Node process (PM2, systemd, etc.).

**Smoke tests** (replace with your API origin):

```bash
# Should return JSON (often `[]`), not 404
curl -sS -o /dev/null -w "%{http_code}\n" "https://api.your-domain.com/api/housing-needs"

# Authenticated create returns 400 (validation) or 201 — not 404
curl -sS -X POST "https://api.your-domain.com/api/housing-needs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session_jwt>" \
  -d '{}'
```

After the backend is current, the **Find room → Your room need** flow can create posts again.

## 2. Web (Netlify)

### Build

- Root for the site: [`frontend/`](frontend/) (or set Netlify base directory to `frontend`).
- Build command: `npm run build` (see [`frontend/netlify.toml`](frontend/netlify.toml)).
- Publish directory: `frontend/dist`.

### Environment variables (Netlify UI)

Set for **Production** (and **Preview** if previews should hit a real API):

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `https://api.your-domain.com/api` |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |

Template: [`frontend/.env.production.example`](frontend/.env.production.example).

### Why production still calls `localhost:4000` (or the wrong API)

Vite **inlines** `VITE_*` values when **`npm run build` runs**. They are **not** read on each browser request. So:

1. **Name must be exact:** `VITE_API_BASE_URL` (not `API_BASE_URL` or `VITE_BACKEND_URL`). Only names starting with `VITE_` are exposed to the client bundle.
2. **Netlify:** Add variables under **Site configuration → Environment variables** for the right **Deploy context** (Production vs Preview). After changing them, use **Deploy → Trigger deploy** (clear cache if needed). An old deploy’s `dist/` will keep the old URL until you rebuild.
3. **Monorepo:** Set **Base directory** to `frontend` (or equivalent), **Publish directory** to `frontend/dist`, and ensure the build runs from the folder that contains [`frontend/vite.config.ts`](frontend/vite.config.ts).
4. **Local `.env`:** If you build a production bundle on your machine with `frontend/.env` pointing at `http://localhost:4000/api`, that value is what gets shipped. Production builds on Netlify should not rely on a committed local `.env` (those files are gitignored for a reason).

On Netlify, `NETLIFY=true` is set during build; [`frontend/vite.config.ts`](frontend/vite.config.ts) fails the build if `VITE_API_BASE_URL` is missing or still points at localhost when that flag is present.

### Smoke test after deploy

1. Open production URL → browse loads.
2. Sign in with Google → session persists (local storage / Supabase).
3. Housing flows call API without CORS errors (browser devtools Network tab).

If CORS fails, add your exact Netlify URL (including `https://`) to **`CORS_ORIGINS`** on the backend.

## 3. Supabase Auth — URL configuration

**Do not** use `exp://*` as **Site URL** in production. That value is for Expo Go development only.

### Site URL

Set to your **production web origin** (no wildcards), for example:

- `https://sirva.in`

### Redirect URLs (allow list)

Add at least:

| URL | Purpose |
|-----|---------|
| `https://your-domain.com/**` | Production web (and www if used). |
| `http://localhost:5173/**` | Local Vite dev (optional). |
| `cirvo://**` | Native app deep links (scheme matches [`mobile/app.json`](mobile/app.json) `scheme`). |

After changing redirects, run OAuth again on web and in a **standalone** iOS build (not Expo Go) to capture the exact redirect string; add any additional paths Supabase or Expo generates (see logs in dev: [`mobile/src/lib/auth.tsx`](mobile/src/lib/auth.tsx) warns the exact `redirectTo` in `__DEV__`).

### Google Cloud Console

Under **APIs & Services → Credentials → OAuth 2.0 Client**:

- **Authorized JavaScript origins**: production web origin(s).
- **Authorized redirect URIs**: must include Supabase’s **Google provider callback** URL shown in Supabase **Authentication → Providers → Google** (typically `https://<project-ref>.supabase.co/auth/v1/callback`), plus any web callback your app uses.

Keep Supabase and Google Console in sync when URLs change.

## 4. Mobile — iOS-first (EAS)

### Prerequisites

- Apple Developer Program membership.
- Expo account (`npx expo login`).

### One-time: link project to EAS

From [`mobile/`](mobile/):

```bash
cd mobile
npx eas-cli@latest init
```

This adds `expo.extra.eas.projectId` to `app.json` (or merge the generated snippet). Commit that ID.

### Bundle identifiers

[`mobile/app.json`](mobile/app.json) sets:

- **iOS:** `ios.bundleIdentifier` — `in.sirva.cirvo` (change if your Apple App ID uses another string).
- **Android:** `android.package` — same reverse-DNS style for Play Store later.

### Build

```bash
cd mobile
npx eas-cli@latest build --platform ios --profile production
```

Use **TestFlight** first (`eas submit` or App Store Connect), then promote to App Store.

### Mobile env (EAS secrets)

For production builds, set via EAS or `eas secret:create`:

- `EXPO_PUBLIC_API_BASE_URL` — production API base URL ending in `/api`.
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

See [`mobile/.env.example`](mobile/.env.example) and [`mobile/env.production.example`](mobile/env.production.example).

### Auth note

Production sign-in should use **standalone** builds (TestFlight / App Store), not **Expo Go**. Redirect URIs use the `cirvo` scheme, not `exp://`.

## 5. Environment separation

Prefer separate Supabase projects or strict redirect lists for **staging** vs **production**. Never point production mobile builds at a dev API IP.

## 6. Post-MVP reliability (P0)

Use this section when you are live and want **observability** and **faster host response** without expanding product surface area first.

### Inquiry notifications

Hosts respond faster when they know a new enquiry arrived without opening the app.

- **In-app:** the app already has a notifications surface; ensure new `listing-inquiry` events create rows users can open (see backend notifications module if present).
- **Email:** on `POST` inquiry creation (or status change), enqueue an email to the listing owner (Resend or similar) with a deep link to `/find-tenant/host/inquiries/:id`.
- **Digest:** optional daily summary if you want fewer emails.

Keep templates short and link straight to the inquiry detail route.

### Synthetic checks (test alerting without real traffic)

Point an external monitor (UptimeRobot, Better Stack, Pingdom, etc.) at:

| URL | Expect |
|-----|--------|
| `https://<web>/` | 200 |
| `https://<api>/api/listings?status=PUBLISHED&limit=1` | 200 + JSON body |
| `https://<api>/api/housing-needs` | 200 (may be `[]`) — **not** 404 after backend deploy |
| `https://<api>/health` | 200 when exposed at server root (see [`backend/src/main.ts`](backend/src/main.ts); if you get 404, use `/api/...` checks only or align Nginx so `/health` reaches the app) |

Optional GitHub Actions cron (replace URLs):

```yaml
on:
  schedule: [{ cron: '*/15 * * * *' }]
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -o /dev/null -w '%{http_code}\n' "https://api.example.com/api/listings?status=PUBLISHED&limit=1"
```

### Staging for alert testing

To validate **alerting** (PagerDuty, Slack, email) without touching production users:

- Deploy a **staging** API + web (second Netlify site, second subdomain, or path-based preview with stable URL).
- Configure monitors against **staging** first; clone alert rules to **production** once firing is correct.
- Use the same smoke checks as above against the staging base URLs.
