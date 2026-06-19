# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — run the server in watch mode (`tsx watch src/server.ts`).
- `npm run build` — bundle to `dist/` with tsup; `npm start` runs the built server (`node dist/server.js`).
- `npm run lint` / `npm run lint:fix` — ESLint over `src` (typescript-eslint + prettier config); `npm run format` runs Prettier.
- `npm test` — run Vitest once; `npm run test:watch` watches; `npm run test:coverage` adds v8 coverage.

Prisma (config in `prisma.config.ts`, schema in `prisma/schema.prisma`; SQLite dev DB at `prisma/dev.db`):
- `npm run db:migrate` — create + apply a migration (wraps `prisma migrate dev`); `npm run db:reset` resets.
- `npm run db:generate` — regenerate the client. **Note:** client output is `generated/prisma` (custom `output` at the repo root), not the default `node_modules` location.
- `npm run db:seed` — seed (admin, categories, products). `npx prisma studio` inspects the DB.

Migrations are split per provider under `prisma/migrations/<sqlite|postgres>/`, selected by `DATABASE_PROVIDER`.

Vitest + Supertest are installed and configured (`vitest.config.mts`, `test/global-setup.ts`). Unit specs use in-memory repositories; e2e specs use Supertest against the imported `app` with an isolated test DB. Coverage thresholds are enforced at 90% over `src/use-cases/**`.

## Architecture

Fastify 5 + Prisma 7 + Zod 4 HTTP API in TypeScript (CommonJS build, ESM-style source run via `tsx`). Path alias `@/*` → `src/*`.

- `src/server.ts` is the only entry that calls `app.listen`. `src/app.ts` builds and exports the Fastify instance (plugins, swagger, error handler, route registration) **without** listening, so tests can import it. It uses `fastify-type-provider-zod` (`withTypeProvider<ZodTypeProvider>`), so route `schema` Zod objects validate input and serialize responses.
- `src/env/index.ts` validates `process.env` with Zod at startup and throws on invalid env. Import config via `import { env } from "@/env"` rather than reading `process.env` directly. Required: `JWT_SECRET`, `DATABASE_URL`; optional `PORT` (default 3000), `NODE_ENV` (`dev`|`test`|`production`), `DATABASE_PROVIDER` (`sqlite`|`postgres`), `CORS_ORIGIN` (default `*`).
- `src/lib/prisma.ts` exports the shared `PrismaClient` singleton, selecting the driver adapter (better-sqlite3 / pg) by `DATABASE_PROVIDER` (query logging only when `NODE_ENV=dev`).
- **Auth is Bearer-only.** `@fastify/jwt` signs access tokens (`expiresIn: 1d`); there is no refresh cookie. JWT payload is augmented in `src/@types/fastify-jwt.d.ts` as `{ sub: number }` (the admin id) — single admin role, no `role` claim. `src/http/middlewares/verify-jwt.ts` guards admin routes (responds 401 `UNAUTHORIZED`).
- Error/response envelopes are standardized in `src/http/http-schemas.ts`: success `{ data: ... }` (`dataResponse(schema)`), error `{ error: { code, message } }` (`errorResponseSchema`), validation `{ error: { code, message, fields[] } }` (`validationErrorResponseSchema`). Routes declare `response` per status code.
- Global error handler `src/http/error-handler.ts`: Zod/Fastify validation → 400 `VALIDATION_ERROR`, response serialization mismatch → 500, everything else → 500 `INTERNAL_SERVER_ERROR`. Domain errors are mapped to HTTP in `src/http/map-domain-error.ts` (call it from a controller's `catch`); 404 = `NOT_FOUND`.
- Swagger UI is served at `/docs` from a **static** `docs/openapi.yaml`.

### Intended layered pattern (controller → use case → repository)

`docs/SKILL-1.md` and `docs/SKILL-2.md` document the target architecture. The **Categories** vertical slice is fully implemented and is the **reference to copy** when adding a new domain:
- `repositories/*-repository.ts` are **interfaces** (only the methods the use cases need — ISP); concrete impls live in `repositories/prisma/` (handle Prisma `P2025` → `null`/`false`), fakes for unit tests in `repositories/in-memory/` (sequential ids).
- `use-cases/<domain>/` hold business rules (one class per use case, single `execute`, `*Request`/`*Response` types), with `use-cases/errors/*-error.ts` for domain errors and `use-cases/factories/make-*-use-case.ts` for manual DI.
- HTTP controllers are grouped by domain in `src/http/controllers/<domain>/` with one file per action plus a `routes.ts` and `schemas.ts`. Admin route groups call `router.addHook("onRequest", verifyJwt)`.

Reference files to mirror: `src/repositories/categories-repository.ts` (+ `prisma/`, `in-memory/`), `src/use-cases/categories/*`, `src/use-cases/factories/make-category-use-cases.ts`, `src/http/controllers/admin-categories/*` (and public `categories/*`). Read both SKILL docs too. Stack: Fastify 5, Prisma 7, Zod 4. **Database: SQLite for development now; PostgreSQL (via Docker) for production** (provider toggled by `DATABASE_PROVIDER`) — keep schema and queries portable, no DB-specific features. Where docs disagree with the code, the code is authoritative.

### TDD flow when adding a category

Build each domain in two commits, low-level first:
1. **Low-level commit** (`feat(<cat>): repository + use-cases + unit tests`): repository interface → in-memory impl → for each use case write the `.spec.ts` first (red), then the use case (green); add the Prisma impl (covered via e2e) and any domain errors. `npm test` units green + `npm run lint`.
2. **High-level commit** (`feat(<cat>): routes + e2e`): factory → Zod `schemas.ts` → controllers (`{ data }` envelope, `catch → mapDomainError`) → update `map-domain-error.ts` for new errors → `routes.ts` registered in `src/app.ts` → e2e spec (401 unauth, happy paths, 400 validation, 404). `npm test` all green.

`docs/ROADMAP.md` tracks the per-category order and status.

## Domain model

E-commerce / catalog + lead-capture domain. DB columns are snake_case; code identifiers are English (ESLint warns on Portuguese terms). Key entities in `prisma/schema.prisma`: `Product` (base; `active` soft-delete, optional `promotional_price` overriding variant prices) → `Variant` (cor/tamanho/estoque; `price` nullable, inherited from `Product`), `Category` (N:N via explicit `ProductCategory`), `Image` (product- or variant-scoped), `Lead` (marketing, email-unique upsert), `Order`/`OrderItem` (orders; product name/color/size and `unit_price` are **frozen** onto `OrderItem` at purchase time; `status` and `payment_method` are enum-like strings validated by Zod since SQLite has no enums), and `Admin` (bcrypt `password_hash`).
