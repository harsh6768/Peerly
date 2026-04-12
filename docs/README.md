# Trusted Network Docs

This folder is the current working architecture reference for Trusted Network.

## Recommended reading order

1. [Production Stack](./production-stack.md)
2. [PostgreSQL vs MySQL](./database-comparison.md)
3. [Frontend Architecture](./frontend-architecture.md)
4. [Backend Blueprint](./backend-blueprint.md)
5. [Housing MVP Workflow v1](./housing-mvp-workflow-v1.md)
6. [Listing Matching Heuristic](./listing-matching-heuristic.md)
7. [Parked Delivery Module](./parked-delivery-module.md)
8. [MVP Schema Design](./mvp-schema-design.md)
9. [Entity Relationship Diagram](./entity-relationship-diagram.md)
10. [Backend API MVP](./backend-api-mvp.md)
11. [Backend TypeScript Guide](./backend-typescript-guide.md)
12. [Platform Deployment Guide](./platform-deployment.md)
13. [Supabase Google Auth with Netlify and EC2](./supabase-google-auth-netlify.md)
14. [Housing scale-up sprint (images, APIs, caching)](./SPRINT_SCALING_HOUSING.md)
15. [Listing image upload architecture](./listing-image-upload-architecture.md)
16. [Maps and client config](./maps-and-client-config.md) — Places + Static Maps env vars, billing toggles, `GET /api/public-config`
17. [Platforms and services](./platforms-and-services.md) — Third-party vendors and frameworks with documentation links
18. [Prisma and PostgreSQL migrations](./prisma-postgresql-migrations.md) — schema changes, `prisma generate` / `migrate deploy` / PM2 restart, recovery script

## What these docs cover

- The recommended long-term product stack beyond the current Vite frontend
- The database comparison and why PostgreSQL is the preferred default
- The modular frontend structure we should move toward as the product grows
- The current housing-only product workflow and the intent-driven UX reset
- The backend scoring heuristic used to rank room listings for signed-in and signed-out users
- Which delivery APIs and screens were parked for later, without removing schema keys
- The backend domain model, service boundaries, API surfaces, and rollout path
- The first working backend API slice and example payloads for the MVP
- A lightweight guide for reading and working in the backend TypeScript code
- The visual relationship map between schema entities
- The recommended free-stack deployment plan and environment setup
- The exact Netlify + Supabase Auth + Google OAuth redirect flow used by the current login system

These docs are written so frontend and backend can evolve independently without losing the shared product model.

The **housing scale-up** sprint doc and **listing image architecture** doc describe the canonical image model (public id in DB, URLs at read time) and related API changes.

**Maps and client config** documents the shared Google Maps browser key, how to enable or disable Static Map previews (`STATIC_MAP_PREVIEW_ENABLED`, `VITE_GOOGLE_MAPS_STATIC_MAP_ENABLED`), and how public config complements optional `VITE_CLOUDINARY_CLOUD_NAME`.

**Platforms and services** is a link hub for Netlify, the API host model (e.g. EC2 + Nginx), PostgreSQL/Prisma, Supabase, Cloudinary, Google Maps, Resend, Expo/EAS, and the main open-source frameworks.

**Prisma and PostgreSQL migrations** explains what breaks when columns are added or removed without aligning the DB, client, and compiled API, documents the golden-rule commands after `schema.prisma` changes, and provides a PM2-friendly recovery script tailored to this NestJS backend (`dist/`, not Next.js `.next`).
