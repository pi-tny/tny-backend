# Skill: Padrão de API Node + Fastify + Prisma (gympass-style-app)

## Quando usar esta skill
Use ao escrever código novo neste projeto (ou em um clone direto dele): uma API HTTP
em Node/TypeScript com Fastify, Prisma e arquitetura em camadas (controller → use case →
repository). Cobre criação de rotas, use cases, repositórios, validação, erros e testes.

## Stack
- **Runtime:** Node.js + TypeScript (ESM via `tsx`/`tsup`), path alias `@/*` → `src/*`.
- **Framework HTTP:** Fastify 5 (`@fastify/jwt`, `@fastify/cookie`, `@fastify/cors`, `@fastify/swagger`).
- **ORM:** Prisma 7. **Datasource: SQLite no desenvolvimento**; a migração para PostgreSQL (via Docker) está prevista para depois — escreva o schema/queries de forma portável e evite recursos exclusivos de um banco.
- **Validação:** Zod 4 (env e input HTTP), com `fastify-type-provider-zod`.
- **Hash/auth:** bcryptjs + JWT (cookie `refreshToken`).
- **Testes:** Vitest + Supertest; ambiente Prisma custom para e2e. (Padrão-alvo — ainda não há runner instalado neste projeto.)

## Estrutura de pastas
```
src/
├── @types/            # augmentation de tipos (ex.: payload do fastify-jwt)
├── env/               # carga + validação de variáveis de ambiente (Zod)
├── http/
│   ├── controllers/   # por domínio (users, gyms, check-ins): handlers + routes.ts + .spec.ts
│   └── middlewares/   # verify-jwt, verify-user-role
├── lib/               # prisma.ts (PrismaClient singleton)
├── repositories/
│   ├── *-repository.ts        # INTERFACES (contratos)
│   ├── prisma/                # implementações reais (Prisma)
│   └── in-memory/             # implementações fake p/ testes unitários
├── use-cases/
│   ├── *.ts           # regra de negócio (uma classe por caso de uso)
│   ├── errors/        # classes de erro de domínio
│   └── factories/     # make-*-use-case.ts (DI manual: instancia repo + use case)
├── utils/             # helpers puros (+ utils/test/ p/ helpers e2e)
├── app.ts             # monta Fastify, plugins, rotas, errorHandler
└── server.ts          # entry: app.listen
```

## Bootstrap do servidor
`app.ts` cria e exporta a instância (sem `listen`, para os testes a importarem);
`server.ts` é o único entry que sobe a porta.

```ts
// src/app.ts
export const app = fastify()

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  cookie: { cookieName: 'refreshToken', signed: false },
  sign: { expiresIn: '10m' },
})
app.register(fastifyCookie)

app.register(usersRoutes)   // registro MANUAL de cada grupo de rotas (sem autoload)
app.register(gymsRoutes)
app.register(checkInsRoutes)
```

```ts
// src/server.ts
import { app } from './app'
import { env } from '@/env'

app.listen({ host: '0.0.0.0', port: env.PORT }).then(() => {
  console.log('🚀 HTTP Server Running!')
})
```

## Configuração de env
Variáveis carregadas com `dotenv` e validadas com Zod no import. Falha de validação
**lança** e derruba o processo. Sempre importe `env` daqui — nunca leia `process.env` cru.

```ts
// src/env/index.ts
import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
  JWT_SECRET: z.string(),
  PORT: z.coerce.number().default(3333),
})

const _env = envSchema.safeParse(process.env)
if (_env.success === false) {
  console.error('Invalid environment variables', _env.error.format())
  throw new Error('Invalid environment variables')
}
export const env = _env.data
```
> Ao adicionar uma variável nova, adicione-a aqui **e** no `.env.example`.

## Padrão de rotas
Cada domínio tem um `routes.ts` que é um plugin Fastify `async (app: FastifyInstance)`.
Handlers ficam em arquivos separados por ação (`register.ts`, `create.ts`, ...).
Autenticação via hook `onRequest` (por rota ou para o grupo todo).

```ts
// src/http/controllers/users/routes.ts — rota simples + rota autenticada
export async function usersRoutes(app: FastifyInstance) {
  app.post('/users', register)
  app.post('/sessions', authenticate)
  app.patch('/token/refresh', refresh)

  /** Authenticated */
  app.get('/me', { onRequest: [verifyJWT] }, profile)
}
```

```ts
// src/http/controllers/gyms/routes.ts — hook no grupo + checagem de role
export async function gymsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)              // todas as rotas exigem JWT

  app.get('/gyms/search', search)
  app.get('/gyms/nearby', nearby)
  app.post('/gyms', { onRequest: [verifyUserRole('ADMIN')] }, create)
}
```

## Camadas — feature completa ponta-a-ponta (cadastro de usuário)
Fluxo: **route → controller → factory → use case → repository (interface) → impl Prisma**.
O use case depende da **interface** do repositório (não da implementação concreta).

**1. Controller** (valida input, instancia o use case via factory, mapeia erro → HTTP):
```ts
// src/http/controllers/users/register.ts
export async function register(request: FastifyRequest, reply: FastifyReply) {
  const registerSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
  })
  const { name, email, password } = registerSchema.parse(request.body)

  try {
    const registerUseCase = makeRegisterUseCase()
    await registerUseCase.execute({ name, email, password })
  } catch (err) {
    if (err instanceof UserAlredyExistsError) {
      return reply.status(409).send({ message: err.message })
    }
    throw err               // erro não esperado sobe p/ o errorHandler global
  }
  return reply.status(201).send()
}
```

**2. Factory** (DI manual — liga use case ao repositório Prisma):
```ts
// src/use-cases/factories/make-register-use-case.ts
export function makeRegisterUseCase() {
  const usersRepository = new PrismaUsersRepository()
  return new RegisterUseCase(usersRepository)
}
```

**3. Use case** (regra de negócio; recebe repo via constructor; lança erro de domínio):
```ts
// src/use-cases/register.ts
export class RegisterUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({ name, email, password }: RegisterUseCaseRequest):
    Promise<RegisterUseCaseResponse> {
    const password_hash = await hash(password, 6)
    const userWithSameEmail = await this.usersRepository.findByEmail(email)
    if (userWithSameEmail) throw new UserAlredyExistsError()

    const user = await this.usersRepository.create({ name, email, password_hash })
    return { user }
  }
}
```

**4. Repositório — interface + implementação Prisma** (controllers/use cases nunca tocam o Prisma direto):
```ts
// src/repositories/users-repository.ts (contrato)
export interface UsersRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(data: Prisma.UserCreateInput): Promise<User>
}
```
```ts
// src/repositories/prisma/prisma-users-repository.ts (impl real)
export class PrismaUsersRepository implements UsersRepository {
  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data })
  }
  // findById / findByEmail via prisma.user.findUnique(...)
}
```
> Cada use case tem um par de I/O tipado (`interface XUseCaseRequest` / `XUseCaseResponse`)
> e expõe um único método `execute(...)`.

## Validação de input
Zod, com o schema **declarado dentro do handler** e `.parse()` sobre `request.body`/
`params`/`query`. `ZodError` é capturado globalmente (vira 400) — não trate no controller.

```ts
// src/http/controllers/gyms/search.ts — query string
const searchGymsQuerySchema = z.object({
  q: z.string(),
  page: z.coerce.number().min(1).default(1),
})
const { q, page } = searchGymsQuerySchema.parse(request.query)
```
```ts
// src/http/controllers/check-ins/create.ts — params + body, com refine
const createCheckInsParamsSchema = z.object({ gymId: z.string().uuid() })
const createCheckInsBodySchema = z.object({
  latitude: z.number().refine((v) => Math.abs(v) <= 90),
  longitude: z.number().refine((v) => Math.abs(v) <= 180),
})
const { gymId } = createCheckInsParamsSchema.parse(request.params)
const { latitude, longitude } = createCheckInsBodySchema.parse(request.body)
```

## Tratamento de erro
Híbrido: **classes de erro de domínio** lançadas pelos use cases + **try/catch local**
no controller mapeando para status HTTP + **errorHandler global** como rede de segurança.

```ts
// src/app.ts — errorHandler global
app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({ message: 'Validation error', issues: error.format() })
  }
  if (env.NODE_ENV !== 'production') {
    console.error(error)
  } else {
    // TODO: log para ferramenta externa (Datadog/NewRelic/Sentry)
  }
  return reply.status(500).send({ message: 'Internal Server Error' })
})
```
```ts
// src/use-cases/errors/resource-not-found-error.ts — classe de erro de domínio
export class ResourceNotFoundError extends Error {
  constructor() {
    super('Resource not found')
  }
}
```
Middlewares de auth respondem 401 diretamente:
```ts
// src/http/middlewares/verify-jwt.ts
export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (error) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }
}
```

## Padrão de teste
Vitest. Dois níveis, separados por pasta (ver scripts `test` vs `test:e2e`):

- **Unit** (`src/use-cases/*.spec.ts`): testam o use case com um **repositório in-memory**
  (não há mock de Prisma com lib de mock — usam fakes reais). Convenção `sut` + `beforeEach`.
- **e2e** (`src/http/**/*.spec.ts`): Supertest contra `app.server`, com `app.ready()`/`app.close()`.
  Rodam no ambiente Vitest custom `prisma` (mapeado em `vite.config.mts` por glob). No SQLite de dev,
  isole cada suíte por um **arquivo de banco próprio** (ex.: `file:./test-<uuid>.db`) + `prisma migrate deploy`,
  removendo o arquivo no teardown. Quando o projeto migrar para PostgreSQL (Docker), troque para um
  **schema isolado por suíte** (UUID) dropado no teardown.

```ts
// src/use-cases/register.spec.ts — unit com repo in-memory
let usersRepository: InMemoryUsersRepository
let sut: RegisterUseCase

describe('Register Use Case', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new RegisterUseCase(usersRepository)
  })

  it('should not be able to register with same email twice', async () => {
    const email = 'john.doe@example.com'
    await sut.execute({ name: 'John Doe', email, password: '123456' })
    await expect(() =>
      sut.execute({ name: 'John Doe', email, password: '123456' }),
    ).rejects.toBeInstanceOf(UserAlredyExistsError)
  })
})
```
Helper e2e para autenticar (com flag de admin):
```ts
// src/utils/test/create-and-authenticate-user.ts (resumido)
export async function createAndAuthenticateUser(app: FastifyInstance, isAdmin = false) {
  await prisma.user.create({ data: { /* ... */ role: isAdmin ? 'ADMIN' : 'MEMBER' } })
  const authResponse = await request(app.server).post('/sessions')
    .send({ email: 'johndoe@example.com', password: '123456' })
  return { token: authResponse.body.token }
}
```

## Convenções de nomenclatura
- **Arquivos:** kebab-case (`fetch-nearby-gyms.ts`, `make-register-use-case.ts`).
- **Sufixos:** `*-repository.ts` (interface), `prisma-*-repository.ts` / `in-memory-*-repository.ts`
  (impls), `make-*-use-case.ts` (factory), `*-error.ts` (erro), `*.spec.ts` (teste).
- **Controllers** são nomeados pela ação (`register.ts`, `create.ts`) — **não** se usa `.service.ts`/`.controller.ts`.
- **Exports:** sempre **nomeados** (`export class`, `export function`, `export const`). Não há `export default` em `src/`.
- **Casing:** classes em PascalCase; funções/handlers em camelCase; campos de modelo/DB em snake_case
  (`password_hash`, `created_at`) — por isso o ESLint desliga a regra `camelcase`.
- **Imports internos** usam o alias `@/` (ex.: `@/use-cases/...`), não caminhos relativos longos.
- **Use case:** uma classe por caso, método único `execute`, par de tipos `*Request`/`*Response`.

## Anti-padrões (o que NÃO fazer neste codebase)
- **Não chamar `prisma` direto de controller ou use case.** Sempre passar pela interface de
  repositório + implementação (o único uso direto de `prisma` fora de `repositories/`/`lib/` é
  o helper de teste `utils/test/create-and-authenticate-user.ts`).
- **Não instanciar use case com `new` no controller.** Use a factory `make-*-use-case`.
- **Não tratar `ZodError` no controller.** Deixe cair no `setErrorHandler` global (vira 400).
- **Não ler `process.env` diretamente.** Importe `env` de `@/env`.
- **Não usar `export default`** em código de `src/`.
- **Não validar input com JSON Schema do Fastify nem class-validator** — o padrão é Zod no handler.

## Inconsistências observadas
- **Aplicação de JWT nas rotas:** `gymsRoutes` usa `app.addHook('onRequest', verifyJWT)` para o grupo
  inteiro, enquanto `usersRoutes` aplica `{ onRequest: [verifyJWT] }` rota a rota. Dois estilos coexistem.
- **Import do Prisma client:** `prisma-users-repository.ts` importa de `'prisma/prisma-client'`,
  enquanto os demais (`users-repository.ts`, use cases, in-memory) importam de `'@prisma/client'`.
- **Typos no contrato (propagados):** classe/arquivo `UserAlredyExistsError` / `user-alredy-exists-error.ts`
  e o arquivo de teste `seach-gyms.spec.ts`. Ao referenciar, manter a grafia existente para não quebrar imports.
- **`.env.example` incompleto:** não contém `PORT` (existe no schema de env com default 3333) nem
  `JWT_SECRET`/`DATABASE_URL` alinhados a todos os ambientes — conferir antes de assumir variáveis.
- **CI parcial:** o workflow roda apenas `npm run test` (unit). Testes e2e e lint não rodam no CI,
  e o Node do CI é 18 enquanto `@types/node` é 22.
- **Sem logger configurado** no Fastify (`fastify()` sem `{ logger }`); logs de erro saem via `console.error`.
```
