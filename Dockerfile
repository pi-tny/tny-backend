# Single-stage image targeting Postgres. Runs via tsx so Prisma's driver-adapter
# runtime and the generated client work without a bundling step (the app is
# small; favour reliability over image size for now).
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

# better-sqlite3 is imported by src/lib/prisma even when running on Postgres,
# so its native build toolchain (and openssl for Prisma) must be present.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# install all deps (tsx is needed to run the server). npm install (not ci) is
# used because the committed lockfile is currently out of sync with package.json.
RUN npm install --no-audit --no-fund

COPY . .

# Generate the Prisma client for Postgres (scripts/prisma.mjs also syncs the
# schema datasource provider to postgresql).
RUN DATABASE_PROVIDER=postgres node scripts/prisma.mjs generate

EXPOSE 3000

# Apply the postgres migrations, then start the server.
CMD ["sh", "-c", "node scripts/prisma.mjs migrate deploy && npx tsx src/server.ts"]
