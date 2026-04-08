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
