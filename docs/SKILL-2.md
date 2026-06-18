# SKILL: Padrão de API Fastify + Prisma (nlw-journey)

## Quando usar esta skill
Use ao escrever código novo neste projeto (API HTTP em Fastify + Prisma + Zod sobre SQLite),
ou em projetos que devam seguir EXATAMENTE o mesmo padrão flat e procedural: uma rota = um arquivo = uma função named export que recebe `app: FastifyInstance` e fala direto com o Prisma.

## Stack
- **Runtime:** Node.js via `tsx` (dev: `npm run start:dev` → `tsx watch src/server.ts`). Build com `tsup` (`npm run build` → `build/`).
- **Framework:** Fastify 5 + `@fastify/cors` (+ `@fastify/jwt`, `@fastify/cookie`, `@fastify/swagger` neste projeto).
- **ORM:** Prisma 7 (`@prisma/client`). **Datasource: SQLite no desenvolvimento**; migração para PostgreSQL (via Docker) prevista para depois — mantenha schema/queries portáveis.
- **Validação:** Zod 4 via `fastify-type-provider-zod`.
- **Datas:** dayjs (locale pt-br + `localizedFormat`).
- **Testes:** **ausente** (nenhum runner instalado, sem script `test`).

## Estrutura de pastas
```
src/
├── server.ts          # entry point: cria app, registra cors/compiladores/errorHandler/rotas, listen
├── env.ts             # schema Zod das env vars + export do `env` validado
├── error-handler.ts   # errorHandler global do Fastify
├── errors/            # classes de erro customizadas
│   └── client-error.ts
├── lib/               # wrappers de infra (singletons/clients) — SEM regra de negócio
│   ├── prisma.ts      # singleton PrismaClient
│   ├── mail.ts        # getMailClient() (nodemailer)
│   └── dayjs.ts       # dayjs configurado
└── routes/            # uma rota por arquivo, kebab-case nomeado pela ação
prisma/
├── schema.prisma      # models Trip/Participant/Activity/Link, @@map snake_case
└── migrations/
```
Não existem pastas `controllers/`, `services/`, `repositories/`, `tests/`.

## Bootstrap do servidor
`server.ts` roda no nível de módulo (não há função `bootstrap`/`main`). Ordem: `fastify()` → cors → compiladores Zod → errorHandler → `register` de cada rota manualmente → `listen`.

```ts
// src/server.ts
const app = fastify()

app.register(cors, { origin: '*' })

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)

app.register(createTrip)
app.register(confirmTrip)
// ... cada rota é importada por nome e registrada manualmente (sem autoload)

app.listen({ port: env.PORT }).then(() => {
    console.log('Server running!')
})
```
**Ao criar uma rota nova:** importe-a no topo e adicione um `app.register(novaRota)` na lista.

## Configuração de env
Validação via Zod no boot; qualquer acesso a env passa por `import { env } from "./env"`. Nunca leia `process.env` cru fora deste arquivo.

```ts
// src/env.ts
import { z } from 'zod'

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    API_BASE_URL: z.string().url(),
    WEB_BASE_URL: z.string().url(),
    PORT: z.coerce.number().default(3333)
})

export const env = envSchema.parse(process.env)
```

## Padrão de rotas
Cada rota: `export async function <nomeCamelCase>(app: FastifyInstance)`, usando `app.withTypeProvider<ZodTypeProvider>()` e passando `schema` Zod. O handler retorna um objeto puro (Fastify serializa). Erros de negócio são `throw new ClientError(...)`.

**Rota simples (GET com params):**
```ts
// src/routes/get-trip-details.ts
export async function getTripDetails(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId', {
        schema: {
            params: z.object({ tripId: z.string() }),
        }
    }, async (req) => {
        const { tripId } = req.params
        const trip = await prisma.trip.findUnique({
            select: { id: true, destination: true, starts_at: true, ends_at: true, is_confirmed: true },
            where: { id: tripId },
        })
        if(!trip){ throw new ClientError('Trip not found') }
        return { trip }
    })
}
```

**Rota com validação de body + regra de negócio:**
```ts
// src/routes/create-activity.ts
export async function createActivity(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/activities', {
        schema: {
            params: z.object({ tripId: z.string() }),
            body: z.object({
                title: z.string().min(4),
                occurs_at: z.coerce.date(),
            })
        }
    }, async (req) => {
        const { tripId } = req.params
        const { title, occurs_at } = req.body

        const trip = await prisma.trip.findUnique({ where: { id: tripId } })
        if(!trip){ throw new ClientError('Trip not found') }
        if(dayjs(occurs_at).isBefore(trip.starts_at)){ throw new ClientError('Invalid activity date') }
        if(dayjs(occurs_at).isAfter(trip.ends_at)){ throw new ClientError('Invalid activity date') }

        const activity = await prisma.activity.create({
            data: { title, occurs_at, trip_id: tripId }
        })
        return { activityId: activity.id }
    })
}
```

## Camadas (controller / service / repository ou o que existir)
**Não existe separação em camadas.** O padrão real e consolidado (12/12 rotas) é:

> **route handler → prisma direto.**

Toda a feature vive dentro do handler da rota: validação de input (Zod no `schema`), regras de negócio (checagens com `dayjs` + `throw new ClientError`), acesso a dados (`prisma.*`) e efeitos colaterais (envio de e-mail via `getMailClient()`).

Feature completa ponta-a-ponta — **criar viagem** (`src/routes/create-trip.ts`), do input ao efeito colateral:
```ts
// src/routes/create-trip.ts  (recorte)
}, async (req) => {
    const { destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite } = req.body

    // 1. regra de negócio inline
    if(dayjs(starts_at).isBefore(new Date())){ throw new ClientError('Invalid trip start date.') }
    if(dayjs(ends_at).isBefore(starts_at)){ throw new ClientError('Invalid trip end date.') }

    // 2. acesso a dados direto via prisma (com nested create dos participantes)
    const trip = await prisma.trip.create({
        data: {
            destination, starts_at, ends_at,
            participants: { createMany: { data: [
                { name: owner_name, email: owner_email, is_owner: true, is_confirmed: true },
                ...emails_to_invite.map(email => ({ email })),
            ] } }
        }
    })

    // 3. efeito colateral inline (e-mail) usando lib/ e env
    const mail = await getMailClient()
    await mail.sendMail({ /* ...html com confirmationLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm` */ })

    return { tripId: trip.id }
}
```
A única "camada" extraída é `src/lib/` — mas ela contém **apenas clients de infra** (`prisma`, `mail`, `dayjs`), nunca regra de negócio. Mantenha essa fronteira: lib = client/singleton; rota = tudo o mais.

## Validação de input
Zod declarado dentro de `schema` ({ `body`, `params` }) e ligado ao tipo via `app.withTypeProvider<ZodTypeProvider>()`. Os compiladores são registrados uma vez em `server.ts` (`setValidatorCompiler`/`setSerializerCompiler`). Não há JSON Schema nativo nem class-validator. Erros de schema viram `ZodError` e são tratados pelo errorHandler global (400).

```ts
// integração schema + rota — src/routes/confirm-trip.ts
app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
    schema: {
        params: z.object({ tripId: z.string().uuid() })
    }
}, async (req, res) => { /* req.params.tripId já tipado e validado */ })
```

## Tratamento de erro
Um único `errorHandler` global registrado em `server.ts`. Regras de negócio lançam `ClientError` (→ 400); `ZodError` → 400 com `fieldErrors`; qualquer outro → 500. Todo erro é logado com `console.log(error)`.

```ts
// src/error-handler.ts
type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = ((error, req, reply) => {
    console.log(error)
    if(error instanceof ZodError){
        return reply.status(400).send({ message: 'Invalid input', errors: error.flatten().fieldErrors })
    }
    if(error instanceof ClientError){
        return reply.status(400).send({ message: error.message })
    }
    return reply.status(500).send({ message: 'Internal server error' })
})
```

Classe de erro customizada (corpo vazio — serve só para discriminar via `instanceof`):
```ts
// src/errors/client-error.ts
export class ClientError extends Error {}
```
**Ao criar erro de negócio:** use `throw new ClientError('mensagem')` dentro do handler. Não use `reply.status(...).send(...)` para erro de negócio — deixe o errorHandler global responder.

## Padrão de teste
**Ausente.** Não há runner (vitest/jest) instalado, nenhum arquivo `*.test.ts`/`*.spec.ts`, nenhum mock de Prisma e nenhum setup de testcontainers. O script `test` em `package.json` é placeholder (`echo "Error: no test specified" && exit 1`).

> Não existe padrão de teste a seguir neste projeto. Se for introduzir testes, isso é uma decisão nova de arquitetura — não há convenção prévia para imitar.

## Convenções de nomenclatura
- Arquivos de rota em **kebab-case** nomeados pela ação: `create-trip.ts`, `get-participants.ts`.
- **Sem sufixos de camada** (`.service.ts` / `.repository.ts` não existem).
- **Named exports** em todo o projeto — `export async function`, `export const`, `export class`. **Nenhum default export.**
- Função de rota em **camelCase** equivalente ao arquivo: `create-trip.ts` → `createTrip`.
- Colunas e tabelas do banco em **snake_case** (`starts_at`, `is_confirmed`, `@@map("trips")`); por consequência, os campos no payload/`data` também são snake_case (`trip_id`, `occurs_at`).
- Retorno de criação: objeto com id nomeado pelo recurso — `{ tripId: ... }`, `{ activityId: ... }`.

## Anti-padrões (o que NÃO fazer neste codebase)
- **Não criar camadas service/repository/controller** só para "organizar". O padrão consolidado é prisma direto na rota; introduzir camadas quebra a consistência das 12 rotas existentes.
- **Não ler `process.env` cru** fora de `src/env.ts` — importe `env`.
- **Não responder erro de negócio com `reply.status().send()`** — lance `ClientError` e deixe o errorHandler global formatar.
- **Não pôr regra de negócio em `src/lib/`** — lib é só client/singleton de infra.
- **Não usar default export** nem JSON Schema nativo do Fastify para validação (o projeto é 100% Zod via type provider).

## Inconsistências observadas
- **Validação de `tripId`/ids em params:** algumas rotas usam `z.string()` (`get-trip-details.ts`, `create-activity.ts`) e outras `z.string().uuid()` (`confirm-trip.ts`). Sem padrão único.
- **Assinatura do handler:** parte das rotas recebe só `async (req) =>` e parte `async (req, res) =>` (este último onde há `res.redirect`). Use `res` apenas quando precisar redirecionar.
- **`Promise.all` sem `await`:** em `confirm-trip.ts` o envio de e-mails aos participantes é disparado com `Promise.all(...)` **sem `await`** (fire-and-forget), enquanto `create-trip.ts` aguarda o `sendMail`. Comportamento de envio não é uniforme.
- **`.env.example` ausente:** o projeto depende de `--env-file .env` e de 3 URLs obrigatórias, mas não versiona um exemplo das variáveis.
