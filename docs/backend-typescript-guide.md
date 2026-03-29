# Backend TypeScript Guide

This backend intentionally uses a very small subset of TypeScript so it stays close to normal JavaScript.

## What to focus on

- `class SomethingService`
  This is just a class with methods. Think of it like a grouped object with related functions.

- `constructor(private readonly prisma: PrismaService)`
  NestJS injects the Prisma client for us. In plain words: the service gets database access automatically.

- `dto`
  A DTO is just the expected request body shape for a `POST` request.

- `?:`
  Optional field. The value may be missing.

- `: string`, `: number`, `: boolean`
  Simple type hints. They help the editor and catch mistakes early.

- decorators like `@Controller`, `@Get`, `@Post`, `@Injectable`
  These are NestJS labels that tell the framework what each file is for.

## What we removed to keep it simpler

- no advanced generics
- no custom types everywhere
- no complex utility types
- no required `!` syntax in DTO classes
- repeated Prisma query pieces moved into small helper functions

## How to read a module quickly

For each feature folder:

1. `*.controller.ts`
   This shows the API routes.
2. `*.service.ts`
   This shows the real logic and Prisma queries.
3. `dto/*.dto.ts`
   This shows what the request body should look like.

## Example mental model

`ListingsController`:
- receives HTTP request
- passes data to `ListingsService`

`ListingsService`:
- talks to Prisma
- reads or writes PostgreSQL data

`CreateListingDto`:
- validates that the request has the fields we expect

## Project rule going forward

Keep backend TypeScript in the "JavaScript with guardrails" style:

- small classes
- readable method names
- minimal custom typing
- no advanced patterns unless they clearly reduce complexity
