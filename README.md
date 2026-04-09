# Trusted Network

Trusted Network is a hyperlocal, trust-based platform for solving urgent real-life problems through a verified professional or community network.

## Workspace layout

This repository now uses a simple workspace structure:

- `frontend/` for the React + Vite app
- `backend/` for the NestJS + Prisma API
- `mobile/` for the Expo (React Native) app
- `docs/` for product and architecture references

**Production deploy checklist (EC2, Netlify, Supabase URLs, EAS iOS):** [DEPLOYMENT.md](./DEPLOYMENT.md).

## Current MVP focus

- Find replacement tenants
- Send items via trusted travelers

## Current frontend stack

- React
- TypeScript
- Vite
- React Router

## Architecture docs

Backend and frontend planning docs now live in [docs/README.md](./docs/README.md).

Recommended reading order:

1. [Production Stack](./docs/production-stack.md)
2. [PostgreSQL vs MySQL](./docs/database-comparison.md)
3. [Frontend Architecture](./docs/frontend-architecture.md)
4. [Backend Blueprint](./docs/backend-blueprint.md)
5. [MVP Schema Design](./docs/mvp-schema-design.md)
6. [Entity Relationship Diagram](./docs/entity-relationship-diagram.md)
7. [Backend API MVP](./docs/backend-api-mvp.md)
8. [Backend TypeScript Guide](./docs/backend-typescript-guide.md)
9. [Platform Deployment Guide](./docs/platform-deployment.md)
10. [Supabase Google Auth with Netlify and EC2](./docs/supabase-google-auth-netlify.md)
11. [EC2 to api.cirvo.in Complete Setup Guide](./docs/nginx_complete_setup.md)

## Local development

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run start:dev
```

## Validation

Frontend:

```bash
cd frontend
npm run build
npm run lint
```

Backend:

```bash
cd backend
npm run build
```
