#!/bin/sh
set -e
# apply migrations to the sqlite file before starting
node_modules/.bin/prisma migrate deploy
exec node dist/server.js
