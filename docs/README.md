# Trusted Network Docs

This folder is the current working architecture reference for Trusted Network.

## Recommended reading order

1. [Production Stack](./production-stack.md)
2. [PostgreSQL vs MySQL](./database-comparison.md)
3. [Frontend Architecture](./frontend-architecture.md)
4. [Backend Blueprint](./backend-blueprint.md)
5. [Housing MVP Workflow v1](./housing-mvp-workflow-v1.md)
6. [Parked Delivery Module](./parked-delivery-module.md)
7. [MVP Schema Design](./mvp-schema-design.md)
8. [Entity Relationship Diagram](./entity-relationship-diagram.md)
9. [Backend API MVP](./backend-api-mvp.md)
10. [Backend TypeScript Guide](./backend-typescript-guide.md)
11. [Platform Deployment Guide](./platform-deployment.md)

## What these docs cover

- The recommended long-term product stack beyond the current Vite frontend
- The database comparison and why PostgreSQL is the preferred default
- The modular frontend structure we should move toward as the product grows
- The current housing-only product workflow and the intent-driven UX reset
- Which delivery APIs and screens were parked for later, without removing schema keys
- The backend domain model, service boundaries, API surfaces, and rollout path
- The first working backend API slice and example payloads for the MVP
- A lightweight guide for reading and working in the backend TypeScript code
- The visual relationship map between schema entities
- The recommended free-stack deployment plan and environment setup

These docs are written so frontend and backend can evolve independently without losing the shared product model.
