# tny catálogo — backend

api do catálogo da tny: fastify + typescript + prisma (sqlite) + zod.
arquitetura em camadas (route → controller → use case → repository). contrato em `docs/openapi.yaml`.

## desenvolvimento

```bash
cp .env.example .env
npm install
npm run db:migrate   # aplica migrations
npm run db:seed      # popula dados de exemplo (opcional)
npm run dev          # http://localhost:3000
```

- docs (swagger ui): http://localhost:3000/docs
- health: http://localhost:3000/health

## scripts

`dev` `build` `start` · `lint` `lint:fix` `format` · `test` `test:watch` `test:coverage` · `db:migrate` `db:generate` `db:seed` `db:reset`

## docker

sqlite roda dentro do próprio container; o arquivo do banco fica num volume nomeado (`tny_data`).
o entrypoint aplica as migrations antes de subir.

```bash
cp .env.example .env
docker compose up --build
```

- api: http://localhost:3000/docs
- seed (opcional): `docker compose exec api node_modules/.bin/prisma db seed`
