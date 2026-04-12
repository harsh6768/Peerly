# Platforms and third-party services

This is a **single checklist** of external products the MVP uses in code or production, with links to each vendor. For env var names and deploy steps, see [DEPLOYMENT.md](../DEPLOYMENT.md), [maps-and-client-config.md](./maps-and-client-config.md), and [listing-image-upload-architecture.md](./listing-image-upload-architecture.md).

## Hosting and edge

| Platform | Role in this repo | Link |
|----------|-------------------|------|
| **Netlify** | Builds and hosts the **Vite** web app (`frontend/`). `VITE_*` env vars are set in the Netlify UI. | [netlify.com](https://www.netlify.com/) · [Docs](https://docs.netlify.com/) |
| **AWS EC2** (or similar VPS) | **NestJS API** is documented as running behind Nginx (or Caddy/ALB) on a VM; not managed by Netlify. | [Amazon EC2](https://aws.amazon.com/ec2/) |
| **Nginx** (common) | TLS termination and reverse proxy to Node; see [nginx_complete_setup.md](./nginx_complete_setup.md). | [nginx.org](https://nginx.org/) |

## Data

| Platform | Role in this repo | Link |
|----------|-------------------|------|
| **PostgreSQL** | Primary database via **Prisma** (`DATABASE_URL`). | [postgresql.org](https://www.postgresql.org/) |
| **Prisma** | ORM, migrations, `schema.prisma`. After column changes: see [prisma-postgresql-migrations.md](./prisma-postgresql-migrations.md). | [prisma.io](https://www.prisma.io/) |

## Authentication and identity

| Platform | Role in this repo | Link |
|----------|-------------------|------|
| **Supabase** | **Auth** for web and mobile: Google OAuth, session; frontend/mobile use `@supabase/supabase-js`. Backend verifies tokens (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) for `POST /api/auth/supabase/google-login`. | [supabase.com](https://supabase.com/) · [Dashboard](https://supabase.com/dashboard) · [Auth docs](https://supabase.com/docs/guides/auth) |
| **Google** | **OAuth** provider configured inside Supabase; **Google Cloud** project also used for Maps API keys (separate from Supabase project). | [Google Cloud Console](https://console.cloud.google.com/) · [OAuth documentation](https://developers.google.com/identity/protocols/oauth2) |

## Media and maps

| Platform | Role in this repo | Link |
|----------|-------------------|------|
| **Cloudinary** | **Listing images**: signed uploads, `public_id` in DB, delivery URLs; env on API + optional `VITE_CLOUDINARY_CLOUD_NAME` / public-config. | [cloudinary.com](https://cloudinary.com/) · [Console](https://console.cloudinary.com/) · [Docs](https://cloudinary.com/documentation) |
| **Google Maps Platform** | **Places API (New)** (autocomplete, place details) and **Maps Static API** (preview map image); browser key in `VITE_GOOGLE_MAPS_API_KEY`. | [Maps Platform](https://developers.google.com/maps) · [Cloud Console – APIs](https://console.cloud.google.com/apis/library) · [Pricing overview](https://mapsplatform.google.com/pricing/) |

## Email

| Platform | Role in this repo | Link |
|----------|-------------------|------|
| **Resend** | Transactional email for verification flows (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`); see `ResendEmailService`. | [resend.com](https://resend.com/) · [Docs](https://resend.com/docs) |

## Mobile

| Platform | Role in this repo | Link |
|----------|-------------------|------|
| **Expo** | **React Native** app (`mobile/`), dev client, native modules. | [expo.dev](https://expo.dev/) · [Docs](https://docs.expo.dev/) |
| **EAS** | **Cloud builds** and **TestFlight** / store submission (`eas build`, `eas submit`). | [EAS Build](https://docs.expo.dev/build/introduction/) · [EAS Submit](https://docs.expo.dev/submit/introduction/) |
| **Apple Developer** | iOS signing, App Store Connect (production path in [DEPLOYMENT.md](../DEPLOYMENT.md)). | [developer.apple.com](https://developer.apple.com/) |

## Application stack (open-source, not “cloud accounts”)

These are the main frameworks/libraries; you do not log into them as separate vendors, but they define how the product is built.

| Piece | Where | Link |
|-------|--------|------|
| **React** | `frontend/`, `mobile/` | [react.dev](https://react.dev/) |
| **Vite** | `frontend/` build tool | [vite.dev](https://vite.dev/) |
| **React Router** | `frontend/` routing | [reactrouter.com](https://reactrouter.com/) |
| **TanStack Query** | `frontend/` server state | [tanstack.com/query](https://tanstack.com/query) |
| **NestJS** | `backend/` API | [nestjs.com](https://nestjs.com/) |
| **Node.js** | Backend runtime | [nodejs.org](https://nodejs.org/) |
| **TypeScript** | Monorepo | [typescriptlang.org](https://www.typescriptlang.org/) |
| **React Navigation** | `mobile/` | [reactnavigation.org](https://reactnavigation.org/) |

## Optional / planned (referenced in docs, not always wired in code)

From [production-stack.md](./production-stack.md) and related notes: **Redis**, **BullMQ**, **S3/R2**, realtime (**Ably** / **Pusher** / WebSockets), analytics (**Sentry**, **PostHog**), alternate email providers. Add them here when they are in active use with env vars in `backend/env.example` or the frontend.
