# SKILL: Arquitetura em camadas + domínio rico + multi-banco

## Quando usar esta skill
Use ao escrever código novo em uma API Node/TypeScript que segue o padrão do projeto
`backend_contacteme`: arquitetura em camadas com **domínio rico** (classes de entidade com
comportamento), repositórios com **múltiplas implementações** (Prisma/libSQL, Firebird e
in-memory) selecionadas em runtime, e injeção de dependência manual via factories. Cobre
entities, repositories + mappers, use cases, factories, services e gateways. A camada HTTP
(Fastify/Zod/Swagger) é tratada na SKILL-4.

## Stack
- **Runtime:** Node.js + TypeScript (CommonJS), dev via `tsx watch src/server.ts`.
- **Build:** `tsup` (esm+cjs, `--dts`, externals `@prisma/client`/`@libsql/client`) + `tsc-alias`
  (resolve o alias `@/*` no output). Deploy em Vercel (`vercel-build`).
- **ORM/Bancos (dois, escolhidos em runtime):** Prisma 6 com adapter **libSQL/Turso**
  (`@prisma/adapter-libsql`) **e** **Firebird** (`node-firebird`) via SQL cru. `env.TYPE_DB`
  (`'sqlite' | 'firebird'`) decide qual usar.
- **Validação:** Zod 3 (DTOs, env, validação HTTP).
- **Auth/cripto:** `@fastify/jwt` + `jsonwebtoken`, `bcrypt`.
- **Integrações externas:** `fetch` encapsulado em **gateways**; `socket.io` (plugin de websocket).
- **Testes:** Jest + ts-jest (preset ESM) + Supertest; `--runInBand`. Unit em `src/use-cases`,
  e2e em `src/http`. Alias `@/*` via `moduleNameMapper`.

## Estrutura de pastas
```
src/
├── entities/          # domínio rico: classe por agregado, com comportamento (não DTO anêmico)
├── helpers/           # tipos/utilitários puros (ex.: Replace<T,R>)
├── repositories/
│   ├── *-repository.ts        # INTERFACES (contratos)
│   ├── prisma/                # impl Prisma + prisma/mappers/
│   ├── firebird/              # impl Firebird (SQL cru) + firebird/mappers/
│   └── in-memory/             # fakes p/ unit tests
├── use-cases/
│   ├── <domínio>/     # uma classe por caso de uso (execute único)
│   ├── errors/        # classes de erro de domínio
│   └── factories/     # make-*-use-case: DI manual + escolha de banco em runtime
├── services/          # wrappers de infra (ex.: FirebirdService.query)
├── gateways/          # integrações externas atrás de interface (ports & adapters)
├── lib/               # conexões/singletons: prisma.ts, firebird.ts, websocket.ts
├── http/              # camada web (ver SKILL-4)
├── @types/            # augmentation de tipos
├── env.ts             # schema Zod das envs + export validado
└── app.ts / server.ts
```

## Entities — domínio rico
Uma classe por agregado: `_id` privado (UUID gerado se não vier), `props` privado, **getters**
e **métodos de comportamento** (não apenas dados). Soft-delete é regra de domínio (`deletedAt`
+ `isDeleted()`/`delete()`/`undelete()`). O construtor usa o helper `Replace` para tornar campos
opcionais com default.

```ts
// helpers/replace.ts
export type Replace<T, R> = Omit<T, keyof R> & R

// entities/user.ts (recorte)
export class User {
  private _id: string
  private props: UserProps

  constructor(props: Replace<UserProps, { dateadded?: Date; level?: number }>, id?: string) {
    this._id = id ?? randomUUID()
    this.props = { ...props, dateadded: props.dateadded ?? new Date(), status: props.status ?? 1, level: props.level ?? 2 }
  }

  public get id(): string { return this._id }
  public get email(): string { return this.props.email }

  public isDeleted(): Boolean { return this.props.deletedAt ? true : false }
  public delete() { this.props.deletedAt = new Date() }
  public promote() { this.props.level = 1 }
  public addPhone(phone: PhoneUser) { this.props.phones?.push(phone) }
}
```
> Use cases conversam com a entidade pelos métodos (`user.isDeleted()`, `user.addPhone(...)`),
> nunca mexendo em campos crus.

## Repositórios — interface + N implementações + mappers
O contrato é uma **interface** no nível raiz de `repositories/`. Cada implementação concreta vive
em sua pasta (`prisma/`, `firebird/`, `in-memory/`) e recebe o cliente/serviço de banco **pelo
construtor** (DIP). A conversão linha-do-banco ↔ entidade fica em um **mapper estático**.

```ts
// repositories/user-repository.ts (contrato)
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  create(data: User): Promise<User>
  update(data: User): Promise<User>
  delete(id: string): Promise<void>
}
```
```ts
// repositories/prisma/prisma-user-repository.ts
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient | TransactionClient) {}
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { userId: id } })
    return user ? PrismaUserMapper.toDomain(user) : null   // mapper converte colunas → entidade
  }
}
```
```ts
// repositories/firebird/firebird-user-repository.ts — mesma interface, SQL cru
export class FirebirdUserRepository implements UserRepository {
  constructor(private db: FirebirdService) {}
  async findById(id: string) {
    const result = await this.db.query({ ssql: `SELECT * FROM users WHERE userid = ?`, params: [id] })
    return result.length ? FirebirdUserMapper.toDomain(result[0]) : null
  }
}
```
```ts
// repositories/prisma/mappers/prisma-user-mapper.ts — static toDomain / toPrisma
export class PrismaClientPhoneMapper {
  static toDomain(raw: PrismaPhone): Phone { return new Phone({ number: raw.phoneNumber, clientId: raw.clientId, deletedAt: raw.phoneDeleted ? new Date() : null }, raw.phoneId) }
  static toPrisma(phone: Phone): PrismaPhone { return { phoneId: phone.id, phoneNumber: phone.number, clientId: phone.clientId, phoneDeleted: phone.isDeleted() ? 1 : 0 } }
}
```
- **Mapper isola o de/para**: nomes de coluna divergentes (`userEmail`/`useremail`) e flags inteiras
  (`userDeleted: 0|1`) nunca vazam para o domínio.
- `in-memory/` implementa a MESMA interface com arrays (LSP) — base dos unit tests.

## Use cases
Uma classe por caso, repositórios **injetados pela interface** no construtor, método único
`execute`, par de tipos `*Request`/`*Response`, lançando erros de domínio (`errors/`).

```ts
export class AddPhoneNumberUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private phoneUserRepository: PhoneUserRepository,
    private companyRepository: CompanyRepository,
  ) {}

  async execute({ userId, companyId, phoneNumber }: AddPhoneNumberUserRequest): Promise<AddPhoneNumberUserResponse> {
    const user = await this.userRepository.findById(userId)
    if (!user || user.isDeleted()) throw new ResourceNotFoundError()
    if (!(await this.companyRepository.isUserInCompany(userId, companyId))) throw new UserNotInCompanyError()
    const existing = await this.phoneUserRepository.findByNumberAndCompany(phoneNumber, companyId)
    if (existing && !existing.isDeleted()) throw new PhoneAlreadyExistsError()
    const phoneUser = new PhoneUser({ number: phoneNumber, userId: user.id, companyId })
    await this.phoneUserRepository.create(phoneUser)
    return { phoneUser }
  }
}
```

## Factories — DI manual + escolha de banco em runtime
`make-*-use-case` é **async**, escolhe a implementação por `env.TYPE_DB`, monta os repositórios
(e services quando Firebird) e devolve `{ useCase, db }`. O `db` é retornado para o controller
controlar a transação (commit/rollback) — ver SKILL-4.

```ts
export async function makeAddPhoneNumberUserUseCase() {
  let db, userRepository, phoneUserRepository, companyRepository
  if (env.TYPE_DB === 'sqlite') {
    db = await PrismaDB.getConnection()
    userRepository = new PrismaUserRepository(db)
    phoneUserRepository = new PrismaUserPhoneRepository(db)
    companyRepository = new PrismaCompanyRepository(db)
  } else {
    db = await FirebirdDB.getConnection()
    const dbService = new FirebirdService(db)
    userRepository = new FirebirdUserRepository(dbService)
    phoneUserRepository = new FirebirdUserPhoneRepository(dbService)
    companyRepository = new FirebirdCompanyRepository(dbService)
  }
  return { addPhoneNumberUser: new AddPhoneNumberUserUseCase(userRepository, phoneUserRepository, companyRepository), db }
}
```
> É a factory que conhece a implementação concreta. Use case e controller permanecem agnósticos
> de banco (dependem só da interface) — DIP + LSP entre Prisma/Firebird/in-memory.

## Services e Gateways
- **Service** (`services/`): wrapper fino de infra. Ex.: `FirebirdService.query({ ssql, params })`
  promisifica o driver callback-based; os repositórios Firebird dependem dele, não do driver cru.
- **Gateway** (`gateways/`): integração externa **atrás de uma interface** (porta). A implementação
  (`WhatsGwGateway implements WhatsAppGateway`) encapsula `fetch`/credenciais; use cases dependem da
  interface. Trocar de provedor = nova classe que implementa a porta (OCP).

```ts
export interface WhatsAppGateway {
  sendMessage(message: Message): Promise<SendResponse>
  sendBulkMessages(messages: Message[]): Promise<BulkResponse[]>
  checkPhoneState(phoneNumber: string): Promise<boolean>
}
```

## lib/ — conexões e singletons
- `lib/prisma.ts`: instancia o `PrismaClient` (com adapter libSQL quando `DATABASE_TURSOR`+dev),
  expõe `PrismaDB.getConnection()/startTransaction()/disconnect()` e as interfaces
  `DatabaseTransaction`/`DatabaseConnection`.
- `lib/firebird.ts`: `pool` do `node-firebird`, `FirebirdDB.getConnection()/startTransaction()`,
  com `commitAndClose()/rollbackAndClose()` que dão `detach()` na conexão.
- `lib/websocket.ts`: plugin Fastify do socket.io.
- `env.ts`: schema Zod gigante (envs de Firebird, libSQL, JWT, gateway externo); `envSchema.parse`
  no import (derruba o processo se inválido).

## Convenções de nomenclatura
- **Arquivos:** kebab-case por papel — `create-user-controller.ts`, `make-create-use-case.ts`,
  `prisma-user-mapper.ts`, `firebird-user-repository.ts`, `*-dto.ts`, `*.spec.ts`.
- **Classes:** PascalCase. Repo concreto = `<Db><Entity>Repository implements <Entity>Repository`.
  Mapper = `<Db><Entity>Mapper` com `static toDomain`/`toPrisma`. Use case = `<Ação>UseCase`.
- **Entidades:** `_id` privado + `props` privado + getters + métodos de comportamento.
- **Exports:** sempre **nomeados**. Nada de `export default` em `src/`.
- **Factories:** `make-*-use-case`, async, retornam `{ useCase, db }`.

## Anti-padrões (o que NÃO fazer)
- **Não acessar Prisma/Firebird direto** de use case ou controller — sempre via interface de
  repositório (impl + mapper). O único lugar que conhece o banco concreto é a factory e `lib/`.
- **Não instanciar use case com `new` no controller** — use `make-*-use-case`.
- **Não criar entidade anêmica** (só getters/setters). Comportamento (soft-delete, promote,
  addPhone) mora na entidade.
- **Não deixar nome de coluna do banco vazar** para domínio/HTTP — converta no mapper.
- **Não duplicar regra por banco**: a regra vive no use case; só o acesso a dados troca por impl.

## Inconsistências observadas
- **Transação assimétrica:** o controller chama `db.commitAndClose()/rollbackAndClose()` sempre,
  mas no caminho Prisma esses métodos são *stubs* (não há transação real) — só o Firebird de fato
  commita/dá rollback. Atenção ao assumir atomicidade no modo sqlite.
- **`env.parse`** (não `safeParse`) — falha de env lança direto, sem mensagem formatada.
- **Mappers parciais:** alguns `toPrisma` montam o objeto inteiro, outros repositórios ignoram o
  mapper no `create`/`update` e escrevem campos na mão (ex.: `PrismaUserRepository.create`).
- **`update` Firebird suspeito:** `SET username = username` (não usa o parâmetro) — provável bug
  herdado; conferir antes de copiar.
- **Typo propagado:** `sucess` (sem o segundo `c`) no retorno do gateway WhatsApp.
