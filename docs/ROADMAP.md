# ROADMAP — rotas por categoria

Desenvolvimento incremental das categorias do domínio, replicando o slice de referência
**Categories**. Cada categoria entra em 2 commits: **low** (repository + use-cases + unit
tests, TDD) e **high** (controllers + routes + e2e). Ver "TDD flow" no `CLAUDE.md`.

Ordem: **Auth → Products → Orders → Leads → Admins**.

## Status

| # | Categoria | Rotas | Status |
|---|-----------|-------|--------|
| — | Health | `GET /health` | ✅ done |
| — | Categories | `GET /categories`, `GET /categories/:id`, `GET/POST /admin/categories`, `PUT/DELETE /admin/categories/:id` | ✅ done (referência; listas paginadas por `page`/`limit`) |
| 1 | Auth | `POST /admin/auth/login`, `GET /admin/auth/me`, `POST /admin/auth/logout` | ✅ done |
| 2 | Products | `GET /products`, `GET /products/:id`, `GET /products/:id/related`, `GET/POST /admin/products`, `PUT/DELETE /admin/products/:id`, `PUT /admin/products/:id/categories` | ✅ done |
| 2b | Variants | `GET/POST /admin/products/:id/variants`, `PUT/DELETE /admin/variants/:id` | ✅ done |
| 2c | Images | `POST /admin/products/:id/images`, `PUT/DELETE /admin/images/:id` | ✅ done (url JSON, sem upload binário) |
| 3 | Orders | `POST /orders`, `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status` | ✅ done (sem mexer estoque; whatsapp via WHATSAPP_NUMBER) |
| 4 | Leads | `POST /leads`, `GET /admin/leads`, `DELETE /admin/leads/:id` | ✅ done (upsert por email; list paginada) |
| 5 | Admins | `GET/POST /admin/admins`, `PUT/DELETE /admin/admins/:id` | ✅ done (email único; respostas sem password_hash) |

## Regras de negócio a cobrir nos testes

- **Products**: `GET /products` lista só `active=true` (admin lista todos); soft-delete via `active=false`; sku único → 409.
- **Variants**: `variant_sku` único → 409; `price` null herda de `Product`.
- **Orders** (`CreateOrder`): congela `product_name`/`color`/`size` e resolve `unit_price`
  (`Product.promotional_price` → senão `Variant.price` → senão `Product.price`), calcula `total`;
  `status` ∈ `new|fulfilled|ignored`.
- **Leads**: upsert por `email` único.
- **Admins**: `email` único → 409; respostas omitem `password_hash`.

> Atualizar o status (⬜ → ✅) ao concluir cada categoria.

## Próximos passos (pós-categorias)

- ⬜ **Swagger gerado por TS (substituir `docs/openapi.yaml` estático).** Hoje
  `src/app.ts` registra o `@fastify/swagger` em `mode: "static"` lendo o YAML do
  disco. Migrar para geração automática a partir dos schemas Zod das rotas (já
  usamos `fastify-type-provider-zod`), **sem perder** o que o YAML tem: `info`,
  `servers`, `tags`, `securitySchemes`, descrições longas (regra de preço,
  imagens, LGPD) e exemplos. Plano:
  1. Config global do swagger em TS (`info`/`servers`/`tags`/`securitySchemes`)
     + `transform` do `fastify-type-provider-zod` para gerar o OpenAPI das rotas.
  2. Enriquecer os schemas/rotas com `summary`/`description`/`.meta({ example })`
     migrando o conteúdo do YAML; remover `docs/openapi.yaml`.
  3. Teste de paridade (`app.inject('/docs/json')`) para garantir que nada sumiu.
  - Tarefa de 1 sessão dedicada (~15 `routes.ts` + config); 2 commits (infra,
    depois conteúdo).
- ⬜ (opcional) Script `db:seed:pg` (generate-postgres + seed) para semear o
  Postgres pelo host sem o passo manual de regenerar o client.
