# Trusted Network Platform Deployment Guide

This document describes a practical free or free-to-start deployment setup for Trusted Network as of March 29, 2026.

## Recommended free-stack architecture

### Option A: Best default for this project

- Frontend: Cloudflare Pages
- Backend API: Render
- Database: Neon Postgres
- Auth: Clerk or Supabase Auth
- Redis / rate limiting: Upstash Redis
- Email: Resend
- File storage: Cloudflare R2 or Supabase Storage later

This is the best balance of:

- low cost
- easy setup
- future scalability
- strong fit for NestJS + Prisma + React

### Option B: Fewer vendors

- Frontend: Cloudflare Pages
- Backend: Supabase Edge Functions or separate backend later
- Database: Supabase Postgres
- Auth: Supabase Auth
- Storage: Supabase Storage

This is simpler, but less ideal if you want a full NestJS backend immediately.

### Option C: Vercel-based frontend

- Frontend: Vercel Hobby
- Backend API: Render
- Database: Neon Postgres
- Auth: Clerk
- Redis: Upstash
- Email: Resend

This is also a good choice, but I still slightly prefer Cloudflare Pages for this project’s frontend hosting.

## Recommended choice for Trusted Network

Use this unless there is a strong reason not to:

- Frontend: Cloudflare Pages
- Backend: Render
- Database: Neon
- Auth: Clerk
- Redis: Upstash
- Email: Resend

## Why this setup works well

### Cloudflare Pages

Best for:

- React frontend hosting
- preview deploys
- fast static delivery

Why it fits:

- strong free plan
- good DX for frontend deploys
- easy custom domain setup later

### Render

Best for:

- NestJS API hosting
- simple background services
- PostgreSQL-adjacent app hosting

Why it fits:

- straightforward Node deployment
- easier than forcing NestJS into worker-style runtime constraints

Important note:

- Render free services may spin down
- acceptable for MVP and internal testing
- not ideal for production-grade low-latency expectations

### Neon

Best for:

- PostgreSQL with Prisma
- branching and development workflows
- future relational growth

Why it fits:

- very strong free plan
- serverless Postgres model
- clean fit for relational marketplace data

### Clerk

Best for:

- auth speed
- polished login flows
- organization-aware growth path

Why it fits:

- easier auth setup for MVP
- better UX out of the box
- supports future company/network identity well

If you want fewer vendors, Supabase Auth is the alternative.

### Upstash Redis

Best for:

- OTP throttling
- rate limiting
- caching
- lightweight queue-related workflows later

### Resend

Best for:

- magic link or OTP emails
- transactional notifications

## Deployment order

Follow this order to avoid unnecessary backtracking.

### 1. Database first

Set up Neon before backend coding goes too far.

Create:

- Neon project
- development database
- connection string

Why first:

- Prisma schema and migrations depend on it
- backend environment depends on it

### 2. Backend next

Set up Render service for the NestJS backend.

Configure:

- Git repo connection
- build command
- start command
- environment variables

### 3. Auth provider

Set up Clerk or Supabase Auth after backend is started.

Why now:

- user model and session flow can be integrated early
- trust and verification are core product concerns

### 4. Frontend deploy

Deploy frontend to Cloudflare Pages after backend base URL and auth config exist.

### 5. Email

Add Resend once login and notifications are wired.

### 6. Redis

Add Upstash when OTP throttling, rate limiting, or queue-like behavior becomes necessary.

## Suggested environment variables

## Frontend

```env
VITE_API_BASE_URL=
VITE_APP_ENV=
VITE_CLERK_PUBLISHABLE_KEY=
```

If using Supabase Auth instead of Clerk:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Backend

```env
NODE_ENV=
PORT=
DATABASE_URL=
DIRECT_URL=
FRONTEND_URL=

JWT_SECRET=

CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=

RESEND_API_KEY=
EMAIL_FROM=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

If using Supabase Auth instead of Clerk, replace the Clerk keys with Supabase config.

## Build and run settings

## Frontend on Cloudflare Pages

If you deploy from this workspace repository, set the frontend root directory to `frontend`.

Build command:

```bash
npm install && npm run build
```

Output directory:

```bash
dist
```

## Backend on Render

If you deploy from this workspace repository, set the backend root directory to `backend`.

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm run start:prod
```

If you use NestJS with the typical output:

```bash
node dist/main.js
```

## Local-to-hosted rollout plan

### Phase 1: MVP local

- local frontend app from `frontend/`
- local NestJS app
- hosted Neon database

### Phase 2: internal launch

- frontend on Cloudflare Pages
- backend on Render free service
- Neon database
- Clerk auth

### Phase 3: early production hardening

- paid backend instance if spin-down becomes painful
- Redis added for rate limiting and OTP flows
- storage added for listing images
- Sentry and analytics added

## Notes by feature area

### Tenant replacement

Needs:

- image storage
- listing CRUD
- direct contact handoff
- verification display

Free-stack impact:

- backend + database enough to start
- storage can be added slightly later

### Send Item

Needs:

- route CRUD
- shipment request CRUD
- matching
- chat or direct contact

Free-stack impact:

- backend, database, and auth are enough to ship MVP

### Parcel tracking later

Needs:

- event ingestion
- event timeline storage
- maybe external carrier integrations

Free-stack impact:

- current recommended stack can support the first version
- scaling or queueing changes may come later

## Risks and tradeoffs on free plans

### Render free service spin-down

This may make first request latency noticeable.

Acceptable for:

- demos
- testing
- internal pilots

Less ideal for:

- polished public launch

### Free DB limits

Neon free is strong, but still not “infinite production.”

Fine for:

- MVP
- internal pilots
- early validation

### Too many vendors

This stack is excellent technically, but introduces multiple providers.

If team simplicity matters more than best-of-breed choices:

- use Supabase for auth + db + storage

## Final recommendation

If you want the best free or free-to-start setup for Trusted Network:

1. Cloudflare Pages for frontend
2. Render for backend
3. Neon for Postgres
4. Clerk for auth
5. Resend for email
6. Upstash for Redis later

That gives you a clean MVP path with strong long-term upgrade options.
