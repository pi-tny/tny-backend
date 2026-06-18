# TODO — features restantes

Category está implementada como **feature de referência** (use cases + rotas pública/admin,
TDD, 100% de cobertura nos use cases). **Implementar cada feature abaixo em TDD seguindo o
padrão de Category**: interface de repositório → in-memory + Prisma → use cases (`*.spec.ts`
unit) → factories → controllers/rotas (e2e via Supertest) → registrar em `app.ts`.

Convenções já estabelecidas (ver `docs/FEATURE-category.md`): envelope `{data}`, erros no
formato openapi, validação por type-provider Zod na rota, IDs inteiros, auth Bearer via
`verifyJwt`, enums (`status`/`payment_method`) como String validada por Zod, mapeamento de erro
de domínio via `@/http/map-domain-error`.

## Ordem sugerida

### 1. Auth (Authentication) — base para tudo que é admin
- `POST /admin/auth/login` (bcrypt compare, assina JWT), `GET /admin/auth/me`, `POST /admin/auth/logout`.
- Bloqueio após 5 tentativas inválidas (RNF003) — modelar contador/lockout.
- Erros: 401 (credenciais), 423 (conta bloqueada).
- Substituir o helper de teste `create-and-authenticate` para usar o login real, se desejado.

### 2. Admin (Administrators) — CRUD
- `GET/POST /admin/admins`, `PUT/DELETE /admin/admins/{id}`.
- Nunca retornar `password_hash`. Hash no create/update quando `password` vier.

### 3. Product (+ ProductCategory) — núcleo do catálogo
- Público: `GET /products` (filtros `category_id`, `q`, paginação), `GET /products/{id}`
  (detalhe com variants/images/categories), `GET /products/{id}/related`.
- Admin: `GET/POST /admin/products`, `GET/PUT/DELETE /admin/products/{id}` (DELETE = soft delete `active=false`),
  `PUT /admin/products/{id}/categories` (substitui o conjunto).
- **Regra de preço/promoção** (resolver `final_price` por variant) e **`cover_image`** (fallback) — domínio.
- Paginação genérica reutilizável (`meta`) — extrair util.

### 4. Variant
- `GET/POST /admin/products/{id}/variants`, `PUT/DELETE /admin/variants/{id}`.
- `final_price` read-only resolvido pela regra de herança + promoção.

### 5. Image (upload)
- `POST /admin/products/{id}/images` (multipart — instalar `@fastify/multipart`),
  `PUT/DELETE /admin/images/{id}`. Regra `variant_id` null = imagem geral.

### 6. Order (público + admin)
- `POST /orders`: valida estoque (`Variant.quantity`), **congela** itens (nome/cor/tamanho/preço),
  resolve preço (herança + promoção), calcula `total`, gera `whatsapp_url`/`whatsapp_message`.
  Erros: 400 (validação), 409 (estoque insuficiente).
- Admin: `GET /admin/orders` (filtros status/data, paginação), `GET /admin/orders/{id}`,
  `PATCH /admin/orders/{id}/status`.

### 7. Lead (público + admin)
- `POST /leads`: **upsert** por email (renova `consent_date`).
- Admin: `GET /admin/leads` (busca `q`, paginação), `DELETE /admin/leads/{id}` (LGPD).

## Itens transversais pendentes
- Schemas de **response** Zod nas rotas (hoje só request é validado) para fechar o contrato e o `/docs`.
- Util de **paginação** (`page`/`limit`/`meta`) compartilhado.
- Helper de **mapeamento enum** lowercase (API) ↔ String, caso vire enum Prisma no Postgres.
- Revisar a **tensão SQLite × Postgres no Docker** na Fase 6.
