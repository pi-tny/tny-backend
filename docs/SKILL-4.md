# SKILL: Camada HTTP — Fastify + Zod DTOs + Swagger gerado

## Quando usar esta skill
Use ao escrever a camada web do padrão `backend_contacteme`: Fastify 5 com
`fastify-type-provider-zod`, **DTOs em Zod** (request e response), **Swagger gerado a partir
das rotas** (`jsonSchemaTransform`), controllers por ação, JWT e tratamento de erro global.
A arquitetura de domínio/repositórios está na SKILL-3.

## Stack HTTP
- **Fastify 5** com `withTypeProvider<ZodTypeProvider>()`, `validatorCompiler`/`serializerCompiler`.
- **fastify-type-provider-zod v4** + **`jsonSchemaTransform`** → o OpenAPI é **gerado das rotas**
  (oposto de servir um YAML estático).
- `@fastify/swagger` + `@fastify/swagger-ui` (UI em `/docs`), `@fastify/jwt`, `@fastify/formbody`,
  plugin de websocket (socket.io).
- **Zod 3** para DTOs e validação.

## Bootstrap (`app.ts` / `server.ts`)
`app.ts` cria a instância, registra plugins, compiladores Zod, error handler, swagger e **registra
cada grupo de rotas manualmente** (sem autoload). `server.ts` registra o CORS e só então
`app.ready()` + `listen`.

```ts
// app.ts (recorte)
export const app = fastify({ routerOptions: { maxParamLength: 1048576 } } as any)
app.register(websocketPlugin)
app.register(fastifyJwt, { secret: env.JWT_SECRET_KEY, sign: { expiresIn: '7d' } })
app.setErrorHandler(errorHandler)
app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.register(fastifySwagger, {
  openapi: { info: { title: 'API ContacteMe', description: '...', version: '2.0.0' } },
  transform: jsonSchemaTransform,          // gera o spec a partir dos schemas das rotas
})
app.register(fastifySwaggerUi, { routePrefix: '/docs' })
app.register(require('@fastify/formbody'))
app.register(userRoutes); app.register(clientRoutes); /* ... */
```
```ts
// server.ts — CORS aqui, depois ready/listen
app.register(cors, { origin: env.ORIGIN })
async function start() { await app.ready(); app.listen({ port: env.PORT, host: '0.0.0.0' }, () => {}) }
start()
```

## DTOs (Zod) — request e response
Cada DTO é um arquivo `*-dto.ts` em `http/dto/<domínio>/` que **exporta o schema Zod e o tipo
inferido**. Há DTOs de entrada e de resposta. O tipo é reaproveitado para tipar o controller.

```ts
// http/dto/user/create-user-dto.ts
export const createUserDTO = z.object({
  name: z.string(), email: z.string(), password: z.string(),
  phoneNumber: z.string().optional(), companyId: z.string().optional(),
})
export type CreateUserDTO = z.infer<typeof createUserDTO>

// http/dto/user/fetch-user-dto.ts — DTO de RESPOSTA (modela o corpo retornado)
export const fetchUserResponseDTO = z.object({
  user: z.object({ id: z.string(), name: z.string(), email: z.string().email(), dateadded: z.date(),
    phones: z.array(z.object({ id: z.string().optional(), phone: z.string() })).optional().default([]) }),
})
export type FetchUserResponseDTO = z.infer<typeof fetchUserResponseDTO>
```

## Rotas — schema completo por rota (alimenta o Swagger)
Cada domínio tem `routes.ts` = plugin `async (app: FastifyInstance)`. Usa
`app.withTypeProvider<ZodTypeProvider>()` e declara, por rota, `tags`, `body`/`headers` e um mapa
`response` **com um schema Zod por status code**. Auth via `preHandler: [verifyJWT]`.

```ts
export async function userRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/users', {
    schema: {
      tags: ['Users'],
      body: createUserDTO,
      response: { 201: z.object({ token: z.string() }), 409: z.object({}) },
    },
  }, create)

  app.get('/users/profile', {
    preHandler: [verifyJWT],
    schema: {
      tags: ['Users'],
      headers: z.object({ authorization: z.string().describe('Bearer token (required)').optional() }),
      response: { 201: fetchUserResponseDTO, 404: z.object({ message: z.string() }), 409: z.object({}) },
    },
  }, fetchUser)
}
```
> O `response` por status **é** a documentação: o Swagger sai de `jsonSchemaTransform` sobre esses
> schemas. Sempre declare os status relevantes (sucesso + erros) com seus shapes.

## Controllers — um arquivo por ação
Handlers ficam em `create-user-controller.ts`, `login-user-controller.ts`, etc. Recebem o use case
via factory, mapeiam erros de domínio → HTTP em `try/catch`, e — quando há transação — fazem
`commit`/`rollback` com o `db` retornado pela factory.

```ts
export async function create(request: FastifyRequest<{ Body: CreateUserDTO }>, reply: FastifyReply) {
  const { name, email, password, phoneNumber, companyId } = request.body
  const { createUserUseCase, db } = await makeCreateUserUseCase()
  try {
    const user = await createUserUseCase.execute({ name, email, password, phoneNumber, companyId })
    const token = await reply.jwtSign({}, { sign: { sub: user.id } })   // JWT assinado no controller
    await db.commitAndClose()
    return reply.status(201).send({ token })
  } catch (error) {
    await db.rollbackAndClose()
    if (error instanceof UserAlredyExistsError) return reply.status(409).send({ message: error.message })
    throw error
  }
}
```
- **Id autenticado:** `request.user.sub` (preenchido pelo `verifyJWT` + payload do JWT).
- **Sem envelope padrão:** o corpo retorna o shape do recurso direto (`{ token }`, `{ user }`,
  `{ phone }`) — não há wrapper `{ data }`.
- **Duas formas de validar input coexistem:** (a) tipar `FastifyRequest<{ Body: DTO }>` confiando no
  schema da rota; (b) `schema.parse(request.body)` dentro do controller. Prefira (a) quando a rota
  já declara o `body`.

## Middleware de auth
```ts
// http/middleware/verify-jwt.ts
export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try { await request.jwtVerify() } catch { return reply.status(401).send({ message: 'Unauthorized' }) }
}
```

## Error handler global
Registrado em `app.ts`. Trata, nesta ordem: erro de validação do Fastify
(`FST_ERR_VALIDATION`), `ZodError` (com `flatten().fieldErrors`), `TokenExpiredError`, e cai em 500.

```ts
export function errorHandler(error: any, req: any, res: any) {
  if (error.validation && error.code === 'FST_ERR_VALIDATION')
    return res.status(400).send({ message: 'Validation failed', errors: error.validation })
  if (error instanceof ZodError)
    return res.status(400).send({ message: 'Invalid input', errors: error.flatten().fieldErrors })
  if (error instanceof TokenExpiredError)
    return res.status(400).send({ message: error.message })
  console.log('Error:', error)
  return res.status(500).send({ message: 'Internal server error' })
}
```

## Testes e2e (HTTP)
Supertest contra `app.server`, com `app.ready()`/`app.close()` e limpeza de banco entre testes via
um **DatabaseCleaner** escolhido por `env.TYPE_DB` (factory que devolve cleaner Prisma ou Firebird).

```ts
beforeAll(async () => { cleanerDb = env.TYPE_DB === 'firebird'
  ? await DatabaseCleanerFactory.createFirebird() : await DatabaseCleanerFactory.createPrisma()
  await app.ready() })
beforeEach(async () => { await cleanerDb.cleanDatabase() })
afterAll(async () => { await app.close() })
```

## Convenções
- `http/controllers/<domínio>/` com `routes.ts` + um arquivo por ação + `*.spec.ts` (e2e).
- `http/dto/<domínio>/` com `*-dto.ts` (schema + tipo inferido), request e response.
- `http/handlers/` para handlers de webhook; `http/middleware/` para hooks de auth.
- Nomes em kebab-case pela ação; named exports; rota = plugin `async (app)`.

## Anti-padrões
- **Não gerar o spec à mão nem servir YAML estático** — o padrão aqui é `jsonSchemaTransform` a
  partir dos schemas das rotas. Toda rota deve declarar `tags` + `response` por status.
- **Não tratar erro de negócio com `reply.send` no use case** — lance erro de domínio e mapeie no
  controller; o resto cai no `errorHandler` global.
- **Não montar o spec sem schema de resposta** — sem `response`, o `/docs` fica vazio para a rota.

## Inconsistências observadas
- **`errorHandler` tipado `any`** e com **dois formatos de erro** diferentes (`errors: error.validation`
  cru vs `flatten().fieldErrors`); sem shape único de erro.
- **Status 201 em GET** (`/users/profile`, `/users/phones`) — semanticamente deveria ser 200.
- **`app` com cast `as any`** para passar `routerOptions.maxParamLength`.
- **DTO de create** usa `z.string()` para email (sem `.email()`), enquanto o de login usa `.email()`.
- **`commit/rollback` no controller** mesmo quando o banco é Prisma (onde são stubs) — ver SKILL-3.
