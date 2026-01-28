# Checkout API (NestJS, DDD, Hexagonal)

Production-grade checkout onboarding API with Hexagonal Architecture, DDD, and Railway Oriented Programming (ROP).

## Features
- Product catalog seeded on startup (no product creation endpoints).
- Transaction flow with idempotent payment and concurrency-safe stock decrement.
- Sandbox payment gateway adapter.
- TypeORM migrations + automatic seeding.
- Dockerized with Postgres and optional pgAdmin.

## Prerequisites
- Node.js 20+
- pnpm
- Docker (for local DB and integration tests)

## Environment
Copy `.env.example` to `.env` and adjust values (payment sandbox keys and base URL).

## Local Development
```bash
pnpm install
pnpm run start:dev
```

## Migrations + Seed (local)
```bash
pnpm run db:ensure
pnpm run migration:run
pnpm run seed:run
```

## Docker
```bash
docker compose up --build
```

Reset DB:
```bash
docker compose down -v
```

## Integration Tests (Postgres container)
```bash
docker compose --profile test up -d postgres_test
pnpm run test:e2e
docker compose --profile test down -v
```

## Unit Tests + Coverage
```bash
pnpm run test
pnpm run test:cov
```

## Healthcheck
`GET /health`

## Swagger
`GET /docs`
