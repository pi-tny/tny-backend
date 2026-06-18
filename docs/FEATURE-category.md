# FEATURE — Category (feature de referência)

Feature CRUD usada como molde para o resto do projeto. Implementada em TDD estrito.
Fonte de shapes/rotas: `docs/openapi.yaml`. Padrão de camadas: SKILL-1.

## 1. Camadas e responsabilidades (SKILL-1)

Fluxo: **route → controller → factory → use case → repository (interface) → impl Prisma**.

| Camada | Arquivo(s) | Responsabilidade única (SRP) |
|--------|-----------|------------------------------|
| **Route** | `http/controllers/categories/routes.ts` (público), `http/controllers/admin-categories/routes.ts` (auth) | Declara path + método + schema Zod (validação via type-provider) + hook de auth. Não tem regra. |
| **Controller** | um arquivo por ação (`list.ts`, `get.ts`, `create.ts`, `update.ts`, `delete.ts`) | Lê input já validado, chama o use case via factory, mapeia erro de domínio → HTTP, serializa no envelope `{data}`. Sem regra de negócio. |
| **Factory** | `use-cases/factories/make-*-use-case.ts` | DI manual: instancia o repositório Prisma e injeta no use case. |
| **Use case** | `use-cases/categories/*.ts` (uma classe, método único `execute`) | Regra de negócio pura. Depende da **interface** do repositório (DIP). Lança erro de domínio. Nunca importa Prisma nem toca HTTP. |
| **Repository (interface)** | `repositories/categories-repository.ts` | Contrato de persistência. ISP: só os métodos usados. |
| **Repository (Prisma)** | `repositories/prisma/prisma-categories-repository.ts` | Implementação real (SQLite via Prisma). |
| **Repository (in-memory)** | `repositories/in-memory/in-memory-categories-repository.ts` | Fake para unit tests; LSP: comportamento substituível ao real. |
| **Erro de domínio** | `use-cases/errors/resource-not-found-error.ts` | Discrimina "não encontrado" sem conhecer HTTP. |
| **Middleware** | `http/middlewares/verify-jwt.ts` | Responde 401 direto se o Bearer for inválido. |

### Interface do repositório (contrato)
```ts
interface CategoriesRepository {
  findMany(): Promise<Category[]>;
  findById(id: number): Promise<Category | null>;
  create(data: CategoryInput): Promise<Category>;
  update(id: number, data: CategoryInput): Promise<Category | null>;
  delete(id: number): Promise<boolean>; // false se não existia
}
```
`CategoryInput = { name: string; description: string | null }`. IDs são inteiros (openapi).

### Observação de design (DRY + SRP)
`GET /categories` (público) e `GET /admin/categories` (auth) retornam **dados idênticos**
(Category não tem flag `active`). Logo, **um único `ListCategoriesUseCase`** atende as duas
rotas; a diferença vive só na camada HTTP (a rota admin tem o hook `verifyJwt`). Criar dois
use cases iguais seria duplicação sem razão para mudar separada (viola SRP/DRY).

## 2. Casos de uso — comportamentos e erros

Shapes (openapi): `Category { id, name, description? }`, `CategoryCreate { name (req, max 100), description? }`.
Envelope: `{ data: ... }`. Erros no formato `Error`/`ValidationError`.

| Caso de uso | Comportamento observável | Erros |
|-------------|--------------------------|-------|
| **ListCategories** | Retorna todas as categorias (lista vazia se não houver). Ordem estável por `id`. | — |
| **GetCategory(id)** | Retorna a categoria do `id`. | `ResourceNotFoundError` → **404** se não existe. |
| **CreateCategory(input)** | Persiste e retorna a categoria criada com `id` gerado e `description` (`null` se omitida). | **400** se `name` ausente/vazio ou `> 100` chars (validação no schema da rota). **401** sem token. |
| **UpdateCategory(id, input)** | Atualiza `name`/`description` e retorna a categoria atualizada. | **404** se não existe; **400** validação; **401** sem token. |
| **DeleteCategory(id)** | Remove a categoria; resposta **204** sem corpo. | **404** se não existe; **401** sem token. |

Notas:
- Validação de input (presença/tamanho de `name`) é **responsabilidade do schema Zod na rota**,
  não do use case — o use case assume input já válido (SRP: regra de domínio ≠ validação de forma).
- `not-found` é decidido no **use case** (lança `ResourceNotFoundError`); o **controller** traduz para 404.

## 3. Testes — o que existe e em que camada

### Unit (use cases) — `src/use-cases/categories/*.spec.ts`
Vitest + `InMemoryCategoriesRepository`. Sem HTTP, sem Prisma, sem DB real. Padrão `sut` + `beforeEach`.
Cobertura **≥90%** nesta camada.

- `list-categories.spec.ts`: retorna todas; retorna lista vazia.
- `get-category.spec.ts`: retorna a categoria existente; **lança `ResourceNotFoundError`** se id não existe.
- `create-category.spec.ts`: cria com `id` gerado; `description` vira `null` quando omitida.
- `update-category.spec.ts`: atualiza campos; **lança `ResourceNotFoundError`** se id não existe.
- `delete-category.spec.ts`: remove (lista some); **lança `ResourceNotFoundError`** se id não existe.

### Integração HTTP (rotas) — `src/http/controllers/**/categories*.spec.ts`
Vitest + **`app.inject`** (sem subir servidor real). Usa o repositório **Prisma real** contra um
**SQLite de teste isolado** (ver decisão D1 abaixo), com as tabelas limpas em `beforeEach` e
`app.ready()`/`app.close()` no ciclo.

- público: `GET /categories` → 200 `{data:[...]}`; `GET /categories/{id}` → 200 / 404.
- admin: cada rota testa **401 sem token**, sucesso com token, e os erros (400 no create/update inválido, 404 no get/update/delete inexistente).
- Helper `createAndAuthenticate` (em `utils/test/`) cria um Admin e retorna um Bearer válido.

**Princípio de teste:** asserções sobre **comportamento observável** (status + corpo), nunca
"chamou método X do repositório".

## 4. Como cada teste exercita SOLID

- **DIP** — os unit tests instanciam `new XUseCase(inMemoryRepo)`: o use case recebe a **interface**,
  nunca o Prisma. É isso que torna o teste possível sem DB. Se o use case importasse `PrismaClient`,
  não daria para testá-lo isolado.
- **LSP** — `InMemoryCategoriesRepository` e `PrismaCategoriesRepository` implementam o mesmo contrato;
  os unit tests passam com o fake e as rotas passam com o real, sem o teste "fingir" comportamento
  diferente. Se o fake precisasse mentir, a interface estaria errada.
- **ISP** — `CategoriesRepository` expõe só os 5 métodos do CRUD; cada use case usa 1–2. Nenhum use
  case depende de método que não usa.
- **SRP** — testes de validação (nome vazio → 400) vivem na camada de rota; testes de regra
  (not-found → erro de domínio) vivem no use case. A separação dos testes espelha a separação de responsabilidades.
- **OCP** — adicionar um campo novo em Category mexe no schema/serializer, sem reescrever os use cases existentes.

## Decisões que preciso confirmar antes de codar

- **D1 — DB nos testes de integração.** A SKILL-1 manda DB real (lá, schema Postgres por suíte).
  Como estamos em SQLite, proponho: arquivo **`prisma/test.db`** dedicado (`DATABASE_URL` de teste),
  criado com `prisma migrate deploy` no setup global do Vitest e com tabelas limpas em `beforeEach`.
  Alternativa: SQLite **in-memory** (`file::memory:`) por processo. Qual prefere?
  - (a) `prisma/test.db` em arquivo (mais próximo do real, inspecionável) — **recomendado**
  - (b) `file::memory:` (mais rápido, efêmero)
- **D2 — Ordem dos commits TDD.** Seguirei a ordem sugerida (list → getById → create → update →
  delete; primeiro todos os use cases, depois as rotas), com mensagens marcadas `[RED]/[GREEN]/[REFACTOR]`.
  Confirma que posso **commitar** nessa cadência? (até agora não commitei nada — as Fases 1–3 estão
  só no working tree).
