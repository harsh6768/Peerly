# Trusted Network Production Stack

## Goal

Choose a stack that supports:

- Fast MVP iteration
- Mobile-first product UX
- Trust and verification workflows
- Marketplace matching logic
- Real-time urgent interactions
- Future parcel tracking and admin tooling

## Current frontend stack

The current frontend stack is a strong choice for the product stage we are in now:

- React
- TypeScript
- Vite
- React Router

Why it fits:

- Very fast iteration speed for landing pages and product flows
- Easy to keep modular as the surface area grows
- Strong developer experience for a small team
- Good fit for mobile-first responsive UI

## Recommended full production stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Optional: Zustand for local UI state only

### Backend

- Node.js
- NestJS
- TypeScript
- Prisma
- PostgreSQL

### Infra and platform

- Redis
- BullMQ for background jobs
- S3 or Cloudflare R2 for image uploads
- Ably, Pusher, or WebSockets for real-time events
- Postmark, Resend, or SendGrid for transactional email

### Auth and trust layer

- Company email OTP or magic link
- Google or Microsoft workspace login
- Optional LinkedIn verification
- Admin-reviewed badge or automated verification rules

### Observability

- Sentry
- PostHog or Mixpanel
- Structured backend logs

### Testing

- Vitest for frontend unit tests
- Playwright for end-to-end flows
- Jest or Nest test tools for backend tests

## Why NestJS is the best backend fit here

NestJS is the best choice if we expect the platform to grow into multiple business domains:

- auth and verification
- housing listings
- traveler routes
- item requests
- matches
- chat
- notifications
- parcel tracking later
- admin moderation

It gives us:

- Strong module boundaries
- Better code organization for a growing product
- TypeScript-first architecture
- Easier onboarding for future developers

If speed was the only goal, Fastify or Express would also work. But for this project, NestJS is the more durable choice.

## Suggested package direction

### Frontend additions

- `@tanstack/react-query`
- `react-hook-form`
- `zod`
- `@hookform/resolvers`
- `clsx`

### Backend core packages

- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/config`
- `@nestjs/jwt`
- `@nestjs/passport`
- `class-validator`
- `class-transformer`
- `prisma`
- `@prisma/client`
- `ioredis`
- `bullmq`

## Production environments

### Early MVP

- Frontend: Vercel or Netlify
- Backend: Railway, Render, Fly.io, or AWS
- Database: managed PostgreSQL

### Growth stage

- Frontend: Vercel
- Backend: AWS ECS, Fly.io, or Render
- Database: Neon, Supabase Postgres, RDS, or Railway Postgres
- Storage: S3 or R2

## Recommendation summary

For Trusted Network, the recommended direction is:

- Keep the current React + TypeScript + Vite frontend
- Add TanStack Query, forms, and schema validation next
- Build the backend in NestJS + PostgreSQL + Prisma
- Add Redis and queueing once notifications and tracking increase
- Design real-time and verification as first-class modules, not add-ons

This stack will work fine for parcel tracking later as long as backend services and data models are designed cleanly now.
