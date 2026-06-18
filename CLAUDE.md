# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run start:dev` — run the server in watch mode (`tsx watch src/server.ts`).
- `npm run build` — bundle to `build/` with tsup.
- `npm start` — run the built server (`node build/server.js`).
- `npm run lint` — ESLint over `src` with `--fix` (`@rocketseat/eslint-config/node`).

Prisma (config in `prisma.config.ts`, schema in `prisma/schema.prisma`, SQLite at `prisma/dev.db`):
- `npx prisma migrate dev --name <name>` — create + apply a migration.
- `npx prisma generate` — regenerate the client. **Note:** client output is `prisma/generated/prisma` (custom `output`), not the default `node_modules` location.
- `npx prisma studio` — inspect the DB.

There is currently **no test runner configured** (no `test` script, no Vitest/Supertest installed) despite the docs describing one — see Architecture note below.

## Architecture

Fastify 5 + Prisma 7 + Zod 4 HTTP API in TypeScript (CommonJS build, ESM-style source run via `tsx`). Path alias `@/*` → `src/*`.

- `src/server.ts` is the only entry that calls `app.listen`. `src/app.ts` builds and exports the Fastify instance (plugins, swagger, error handler) **without** listening, so tests can import it.
- `src/env/index.ts` validates `process.env` with Zod at startup and throws on invalid env. Import config via `import { env } from "@/env"` rather than reading `process.env` directly. Required: `JWT_SECRET`; optional `PORT` (default 3333), `NODE_ENV` (`dev`|`test`|`production`).
- `src/lib/prisma.ts` exports the shared `PrismaClient` singleton (query logging enabled only when `NODE_ENV=dev`).
- Auth: `@fastify/jwt` signs access tokens (10m expiry) and reads a `refreshToken` cookie. JWT payload shape is augmented in `src/@types/fastify-jwt.d.ts` (`sub`, `role: "ADMIN" | "MEMBER"`).
- Global error handler in `app.ts` converts `ZodError` → HTTP 400 with `{ message, issues }`; everything else → 500.
- Swagger UI is served at `/docs` from a **static** `docs/openapi.yaml` (the in-code `jsonSchemaTransform` generation is currently commented out).

### Intended layered pattern (controller → use case → repository)

`docs/SKILL-1.md` and `docs/SKILL-2.md` document the target architecture this project is being built toward. The directories exist (`src/http`, `src/routes`, `src/use-cases`, `src/repositories`, `src/utils`) but are mostly empty — new feature code should follow that pattern:
- `repositories/*-repository.ts` are **interfaces**; concrete impls live in `repositories/prisma/`, fakes for unit tests in `repositories/in-memory/`.
- `use-cases/` hold business rules (one class per use case), with `use-cases/errors/` for domain errors and `use-cases/factories/make-*-use-case.ts` for manual DI.
- HTTP controllers are grouped by domain with their own `routes.ts`.

Read both SKILL docs before adding features — they cover the conventions for routes, validation, errors, and tests. Their Stack sections are reconciled with this project: Fastify 5, Prisma 7, Zod 4. **Database: SQLite for development now; PostgreSQL (via Docker) is planned for later** — keep schema and queries portable and avoid DB-specific features. Where docs still disagree with the code, the code is authoritative.

## Domain model

E-commerce / catalog + lead-capture domain (Portuguese field names). Key entities in `prisma/schema.prisma`: `Produto` (base product) → `Item` (variation: cor/tamanho/estoque, price nullable and inherited from Produto), `Categoria` (N:N via explicit `ProdutoCategoria`), `Imagem`, `Lead` (marketing, email-unique upsert), `Pedido`/`ItemPedido` (orders; product details and price are **frozen** onto `ItemPedido` at purchase time), and `Admin` (bcrypt `senha_hash`).
