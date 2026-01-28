#!/bin/sh
set -e

echo "Waiting for postgres at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
until nc -z "${POSTGRES_HOST}" "${POSTGRES_PORT}"; do
  sleep 1
done

echo "Ensuring database exists..."
node dist/infrastructure/database/ensure-database.js

echo "Running migrations..."
node dist/infrastructure/database/run-migrations.js

echo "Running seeds..."
node dist/infrastructure/database/run-seeds.js

echo "Starting API..."
exec node dist/main.js
