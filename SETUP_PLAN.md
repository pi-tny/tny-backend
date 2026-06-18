# SETUP_PLAN — Backend TNY Catálogo

Plano de execução em fases. Arquitetura: **camadas da SKILL-1** reaproveitando
validação por type-provider e `lib/` de infra da SKILL-2. Fonte de shapes/rotas:
`docs/openapi.yaml`. Identificadores em inglês; português só em mensagens/comentários/seed.

## Decisões confirmadas (Fase 0)
- **Banco:** SQLite no dev (Postgres via Docker fica p/ depois — revisitar na Fase 6).
- **Enums:** SQLite não suporta enum nativo do Prisma → `status`/`payment_method` como `String`
  no schema, com valores fechados garantidos por Zod/união TS na camada de app. API mantém lowercase do openapi.
- **Testes:** Vitest + Supertest (não Jest). Unit `*.spec.ts` ao lado do código; e2e em `src/http/**/*.spec.ts`.
- **Validação:** `fastify-type-provider-zod` com `schema` na rota (controller fino).
- **Envelope:** `{data}` / `{data,meta}` do openapi em toda resposta.
- **Erro:** formato openapi `{error:{code,message}}` e `{error:{code,message,fields:[{field,message}]}}`.
- **Auth:** Bearer-only (sem cookie refresh, sem `/token/refresh`).

## Princípios transversais
- Rotas na raiz, sem prefixo de versão (paths iguais ao openapi: `/categories`, `/admin/...`); porta `3000`; `/health`; `/docs` (Swagger UI) + `/docs/json`.
- IDs inteiros (`number`). Valores de enum lowercase na API; se algum dia virar enum Prisma (Postgres), mapper central em `utils/`.
- Use case depende da **interface** do repositório (DIP). Prisma só em `repositories/prisma/` e `lib/`.

---

## Fase 1 — Schema Prisma e migração
**Modificar:** `prisma/schema.prisma`, `prisma.config.ts` (datasource SQLite via `env("DATABASE_URL")`).
**Criar:** `prisma/migrations/<ts>_init/`.
- Provider `sqlite`, `url = env("DATABASE_URL")` (ex.: `file:./dev.db`).
- Modelos em inglês com `@@map`/`@map` snake_case plural: `Product` (`products`), `Variant` (`variants`),
  `Category` (`categories`), `ProductCategory` (`product_categories`), `Image` (`images`),
  `Order` (`orders`), `OrderItem` (`order_items`), `Lead` (`leads`), `Admin` (`admins`).
- `status`/`payment_method` como `String` (SQLite não tem enum nativo); valores fechados validados por Zod
  na app. Defaults: `status` default `"new"`, `payment_method` default `"to_be_defined"`.
- Campos: `Product.promotional_price Float?`, `Product.active Boolean @default(true)`,
  `created_at DateTime @default(now())` (substitui `data_*`), `unit_price`, `variant_sku`, `position`, `marketing_consent`, `consent_date`.
- Nullables conforme openapi: `Order.email/message/notes?`, `Category.description?`, `Image.alt_text?`, `Variant.price?`.
- Índices: `@@index([name])` Product, `@@index([status])` Order.
- Cascade: Product→Variant/Image `Cascade`; OrderItem→Variant `Restrict`; ProductCategory `Cascade`.
- `npx prisma migrate dev --name init` + `npx prisma generate`. Mostrar diff/saída. **PARE.**

## Fase 2 — Tooling
**Criar:** `.env.example`, `eslint.config.js` (flat), `.prettierrc`, `vitest.config.mts`.
**Modificar:** `package.json` (somar scripts + devDeps: vitest, @vitest/coverage, supertest, @types/supertest, prettier, plugins eslint), `tsconfig.json` (`target ES2022`, `module NodeNext`, `outDir dist`, `strict`).
- `.env.example`: `DATABASE_URL` (ex.: `file:./dev.db`), `PORT=3000`, `JWT_SECRET`, `NODE_ENV`, `CORS_ORIGIN`.
- ESLint flat + Prettier sem conflito; warning para identificadores em português.
- Vitest + Supertest: unit `*.spec.ts` ao lado do código; e2e em `src/http/**/*.spec.ts`.
- Scripts: `dev build start lint lint:fix format test test:watch test:coverage db:migrate db:generate db:seed db:reset`.
- **PARE.**

## Fase 3 — Bootstrap do server
**Modificar:** `src/env/index.ts` (+`CORS_ORIGIN`, PORT default 3000), `src/app.ts`, `src/server.ts`, `src/lib/prisma.ts` (corrigir import `@prisma/client`), `src/@types/fastify-jwt.d.ts`.
**Criar:** `src/http/middlewares/`, plugin de erro, `src/utils/errors/` (AppError base), `src/http/controllers/health/`.
- Env Zod; bootstrap Fastify (type-provider zod) conforme skill.
- `setErrorHandler` global → formato `Error`/`ValidationError` do openapi (`{error:{code,message,fields}}`).
- Swagger: carregar `docs/openapi.yaml` do disco, servir spec em `/docs/json` e UI em `/docs` (NÃO gerar do código).
- CORS por env; `GET /health`. Rotas reais sob `/api/v1`.
- Verificar `npm run dev` (/docs) + `npm run lint`. **PARE.**

## Fase 4 — Feature de referência: Category (TDD)
**Criar:** `docs/FEATURE-category.md` (primeiro, PARA aprovação), depois:
`src/repositories/categories-repository.ts` (interface), `repositories/prisma/prisma-categories-repository.ts`,
`repositories/in-memory/in-memory-categories-repository.ts`,
`src/use-cases/categories/*.ts` + `*.test.ts`, `use-cases/errors/`, `use-cases/factories/`,
`src/http/controllers/categories/` (public) e `admin-categories/` (auth) + testes de rota (Fastify inject).
- Rotas: `GET /categories`, `GET /categories/{id}` (público); `GET/POST /admin/categories`, `PUT/DELETE /admin/categories/{id}` (auth).
- TDD estrito RED→GREEN→REFACTOR, commits marcados `[RED]/[GREEN]/[REFACTOR]`.
- Cobertura ≥90% nos use cases.
**Criar:** `TODO.md` com as features restantes. **PARE.**

## Fase 5 — Seed
**Criar:** `prisma/seed.ts`; **Modificar:** `package.json` (`prisma.seed`).
- 1 Admin (bcrypt, senha logada), 5 categorias, ~6 produtos (alguns com promo, 2-3 variants, 1-2 images picsum), 0 orders/leads.
- **PARE.**

## Fase 6 — Docker
**Criar:** `Dockerfile` (multi-stage, user não-root), `docker-compose.yml`, `.dockerignore`; **Modificar:** `README.md`.
- ⚠️ **Tensão a resolver na Fase 6:** o dev é SQLite mas a Fase 6 do task previa `postgres:16-alpine`.
  O provider do Prisma é único — não dá para SQLite no dev e Postgres no container sem trocar o schema.
  Opções (decidir na hora): (a) container também com SQLite (volume p/ o `.db`); (b) promover para Postgres
  no Docker, trocando o provider + migração dedicada. Levo as duas pra você na Fase 6.
- `docker compose up --build`. **PARE.**

---

## O que NÃO será feito agora (vira TODO.md na Fase 4)
Features Product, Variant, Image, Order (incl. herança de preço, congelamento, estoque, whatsapp_url),
Lead (upsert), Admin (CRUD), Auth (login/me/logout + bloqueio após 5 tentativas RNF003),
upload de imagem (`@fastify/multipart`), produtos relacionados, paginação genérica reutilizável.
Cada uma: "implementar em TDD seguindo o padrão de Category".

## Decisões — todas confirmadas na Fase 0
Banco SQLite (dev) · enums como String+Zod · Vitest+Supertest · validação por type-provider ·
envelope `{data}` · erro formato openapi · auth Bearer-only · porta 3000 + prefixo `/api/v1`.
Único ponto em aberto: a tensão SQLite×Postgres no Docker (Fase 6, acima).
