# ROADMAP — rotas por categoria

Desenvolvimento incremental das categorias do domínio, replicando o slice de referência
**Categories**. Cada categoria entra em 2 commits: **low** (repository + use-cases + unit
tests, TDD) e **high** (controllers + routes + e2e). Ver "TDD flow" no `CLAUDE.md`.

Ordem: **Auth → Products → Orders → Leads → Admins**.

## Status

| # | Categoria | Rotas | Status |
|---|-----------|-------|--------|
| — | Health | `GET /health` | ✅ done |
| — | Categories | `GET /categories`, `GET /categories/:id`, `GET/POST /admin/categories`, `PUT/DELETE /admin/categories/:id` | ✅ done (referência) |
| 1 | Auth | `POST /admin/auth/login`, `GET /admin/auth/me`, `POST /admin/auth/logout` | ✅ done |
| 2 | Products | `GET /products`, `GET /products/:id`, `GET /products/:id/related`, `GET/POST /admin/products`, `PUT/DELETE /admin/products/:id`, `PUT /admin/products/:id/categories` | ✅ done |
| 2b | Variants | `GET/POST /admin/products/:id/variants`, `PUT/DELETE /admin/variants/:id` | ✅ done |
| 2c | Images | `POST /admin/products/:id/images`, `PUT/DELETE /admin/images/:id` | ✅ done (url JSON, sem upload binário) |
| 3 | Orders | `POST /orders`, `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status` | ✅ done (sem mexer estoque; whatsapp via WHATSAPP_NUMBER) |
| 4 | Leads | `POST /leads`, `GET /admin/leads`, `DELETE /admin/leads/:id` | ⬜ todo |
| 5 | Admins | `GET/POST /admin/admins`, `PUT/DELETE /admin/admins/:id` | ⬜ todo |

## Regras de negócio a cobrir nos testes

- **Products**: `GET /products` lista só `active=true` (admin lista todos); soft-delete via `active=false`; sku único → 409.
- **Variants**: `variant_sku` único → 409; `price` null herda de `Product`.
- **Orders** (`CreateOrder`): congela `product_name`/`color`/`size` e resolve `unit_price`
  (`Product.promotional_price` → senão `Variant.price` → senão `Product.price`), calcula `total`;
  `status` ∈ `new|fulfilled|ignored`.
- **Leads**: upsert por `email` único.
- **Admins**: `email` único → 409; respostas omitem `password_hash`.

> Atualizar o status (⬜ → ✅) ao concluir cada categoria.
