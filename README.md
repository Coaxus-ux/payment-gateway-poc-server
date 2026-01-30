# Payment Gateway POC Server

API de checkout y procesamiento de pagos construida con **NestJS**, **TypeORM** y **PostgreSQL**. Implementa **Arquitectura Hexagonal** (puertos y adaptadores), **Domain-Driven Design** y **Railway Oriented Programming** para el manejo de errores.

Integra con el sandbox de **Wompi** como proveedor de pagos.

---

## Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Stack Tecnologico](#stack-tecnologico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalacion](#instalacion)
- [Variables de Entorno](#variables-de-entorno)
- [Base de Datos](#base-de-datos)
- [Ejecucion](#ejecucion)
- [Docker](#docker)
- [API Endpoints](#api-endpoints)
- [Modelos de Dominio](#modelos-de-dominio)
- [Diagrama de Entidades](#diagrama-de-entidades)
- [Manejo de Errores](#manejo-de-errores)
- [Testing](#testing)
- [Scripts Disponibles](#scripts-disponibles)

---

## Arquitectura

El proyecto sigue una **Arquitectura Hexagonal** con cuatro capas bien definidas:

```
┌─────────────────────────────────────────────────────┐
│                  Presentation                       │
│         Controllers, DTOs, Validators               │
├─────────────────────────────────────────────────────┤
│                  Application                        │
│            Use Cases, Ports (interfaces)            │
├─────────────────────────────────────────────────────┤
│                    Domain                           │
│       Entidades, Value Objects, Reglas de negocio   │
├─────────────────────────────────────────────────────┤
│                 Infrastructure                      │
│     Repositorios (TypeORM), Payment Provider,       │
│     Mappers, Configuracion                          │
└─────────────────────────────────────────────────────┘
```

**Patrones clave:**

- **Ports & Adapters** -- Las interfaces (puertos) se definen en `application/ports/` y las implementaciones (adaptadores) en `infrastructure/`.
- **Inyeccion de dependencias** via Symbol tokens para desacoplamiento.
- **Railway Oriented Programming** -- El tipo `Result<T, E>` encapsula exito/error sin excepciones.
- **Aggregate Design (DDD)** -- Constructores privados, factory methods (`create()`, `restore()`), transiciones de estado explicitas.
- **Optimistic Locking** -- `@VersionColumn` en transacciones para control de concurrencia.
- **Pessimistic Write Locks** -- Bloqueos de escritura en actualizaciones de estado.
- **Idempotencia** -- Las operaciones de pago verifican el estado actual antes de procesar.

---

## Stack Tecnologico

| Categoria          | Tecnologia                          |
|--------------------|-------------------------------------|
| Framework          | NestJS 11                           |
| Lenguaje           | TypeScript 5.7                      |
| Runtime            | Node.js 20+                         |
| Base de datos      | PostgreSQL 16                       |
| ORM                | TypeORM 0.3                         |
| Validacion         | class-validator, class-transformer  |
| Config validation  | Zod                                 |
| HTTP Client        | Axios                               |
| Documentacion API  | Swagger / OpenAPI                   |
| Testing            | Jest 30, Supertest                  |
| Package Manager    | pnpm                                |
| Contenedores       | Docker, Docker Compose              |

---

## Estructura del Proyecto

```
src/
├── application/                    # Capa de aplicacion
│   ├── ports/                      # Interfaces (contratos)
│   │   ├── customer.repository.ts
│   │   ├── delivery.repository.ts
│   │   ├── payment-provider.ts
│   │   ├── product.repository.ts
│   │   └── transaction.repository.ts
│   ├── tokens/                     # Tokens de inyeccion de dependencias
│   └── use-cases/                  # Casos de uso
│       ├── create-transaction.use-case.ts
│       ├── find-all-products.use-case.ts
│       ├── find-all-transactions.use-case.ts
│       ├── find-customer-by-email.use-case.ts
│       ├── find-customer-by-id.use-case.ts
│       ├── find-delivery.use-case.ts
│       ├── find-product.use-case.ts
│       ├── find-transaction.use-case.ts
│       ├── pay-transaction.use-case.ts
│       └── update-delivery.use-case.ts
│
├── domain/                         # Capa de dominio (logica de negocio)
│   ├── customer.ts
│   ├── delivery.ts
│   ├── product.ts
│   ├── stock.ts                    # Value Object
│   └── transaction.ts
│
├── infrastructure/                 # Capa de infraestructura
│   ├── database/
│   │   ├── entities/               # Entidades TypeORM
│   │   ├── mappers/                # Domain <-> Persistence mappers
│   │   ├── migrations/             # Migraciones SQL
│   │   ├── repositories/           # Implementaciones de repositorios
│   │   ├── seeds/                  # Datos iniciales (productos)
│   │   ├── ensure-database.ts      # Script para crear la BD
│   │   ├── run-migrations.ts       # Ejecutor de migraciones
│   │   └── run-seeds.ts            # Ejecutor de seeds
│   └── payment/
│       └── wompi/                  # Adaptador del proveedor Wompi
│
├── presentation/                   # Capa de presentacion
│   ├── controllers/
│   │   ├── admin.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── delivery.controller.ts
│   │   ├── health.controller.ts
│   │   ├── product.controller.ts
│   │   └── transaction.controller.ts
│   ├── dtos/                       # Data Transfer Objects
│   ├── validators/                 # Validadores custom (Luhn, Expiry)
│   └── errors/                     # Mapeo de errores a HTTP
│
├── shared/                         # Utilidades transversales
│   ├── logging/                    # Logger con redaccion de datos sensibles
│   ├── request-context/            # Middleware de contexto (request ID)
│   └── result.ts                   # Tipo Result<T, E>
│
├── config/                         # Validacion de entorno con Zod
├── app.module.ts                   # Modulo raiz
└── main.ts                         # Bootstrap de la aplicacion

docker/
└── entrypoint.sh                   # Script de entrada para Docker

test/
└── checkout.e2e-spec.ts            # Tests end-to-end
```

---

## Requisitos Previos

- **Node.js** >= 20
- **pnpm** (se habilita via `corepack enable`)
- **PostgreSQL** 16 (o Docker)
- **Docker** y **Docker Compose** (opcional, para despliegue containerizado)

---

## Instalacion

```bash
# Clonar el repositorio
git clone <repo-url>
cd payment-gateway-poc-server

# Habilitar pnpm
corepack enable

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Wompi
```

---

## Variables de Entorno

Crear un archivo `.env` basado en `.env.example`:

| Variable               | Descripcion                                  | Default                                      |
|------------------------|----------------------------------------------|----------------------------------------------|
| `NODE_ENV`             | Entorno de ejecucion                         | `development`                                |
| `PORT`                 | Puerto del servidor                          | `3000`                                       |
| `LOG_LEVEL`            | Nivel de logging                             | `info`                                       |
| `POSTGRES_HOST`        | Host de PostgreSQL                           | `localhost`                                  |
| `POSTGRES_PORT`        | Puerto de PostgreSQL                         | `5432`                                       |
| `POSTGRES_USER`        | Usuario de PostgreSQL                        | `postgres`                                   |
| `POSTGRES_PASSWORD`    | Password de PostgreSQL                       | `postgres`                                   |
| `POSTGRES_DB`          | Nombre de la base de datos                   | `checkout`                                   |
| `CORS_ORIGINS`         | Origenes CORS permitidos (separados por coma)| `http://localhost:3000,http://localhost:5173` |
| `CORS_METHODS`         | Metodos HTTP permitidos                      | `GET,POST,PATCH,OPTIONS`                     |
| `CORS_HEADERS`         | Headers permitidos                           | `Content-Type,Authorization`                 |
| `CORS_CREDENTIALS`     | Enviar credenciales CORS                     | `false`                                      |
| `PAYMENT_BASE_URL`     | URL base del gateway de pagos                | `https://api-sandbox.co.uat.wompi.dev/v1`    |
| `PAYMENT_PUBLIC_KEY`   | Llave publica de Wompi                       | --                                           |
| `PAYMENT_PRIVATE_KEY`  | Llave privada de Wompi                       | --                                           |
| `PAYMENT_EVENTS_KEY`   | Llave de eventos de Wompi (opcional)         | --                                           |
| `PAYMENT_INTEGRITY_KEY`| Llave de integridad de Wompi (opcional)      | --                                           |

La validacion de entorno se realiza con **Zod** al iniciar la aplicacion. Si falta una variable requerida, el servidor no arrancara.

---

## Base de Datos

### Configuracion inicial

```bash
# 1. Levantar PostgreSQL (si usas Docker)
docker compose up postgres -d

# 2. Crear la base de datos (si no existe)
pnpm run db:ensure

# 3. Ejecutar migraciones
pnpm run migration:run

# 4. Insertar datos iniciales (catalogo de productos)
pnpm run seed:run
```

### Migraciones

Las migraciones se encuentran en `src/infrastructure/database/migrations/` y se ejecutan en orden cronologico. Crean las tablas:

- `products` -- Catalogo de productos con stock
- `customers` -- Informacion de compradores
- `deliveries` -- Direcciones de envio
- `transactions` -- Transacciones de checkout
- `transaction_items` -- Items de cada transaccion
- `admin_users` -- Usuarios administradores

### Seeds

El seed inserta un catalogo de productos pre-definidos con stock inicial. No se exponen endpoints para crear productos; el catalogo es fijo.

---

## Ejecucion

### Desarrollo

```bash
# Watch mode con hot-reload
pnpm run start:dev
```

### Debug

```bash
pnpm run start:debug
```

### Produccion

```bash
pnpm run build
pnpm run start:prod
```

La aplicacion estara disponible en `http://localhost:3000`.

La documentacion Swagger se encuentra en `http://localhost:3000/docs`.

---

## Docker

### Levantar todo el stack

```bash
# Postgres + API
docker compose up -d
```

El contenedor de la API ejecuta automaticamente las migraciones y seeds al iniciar (via `docker/entrypoint.sh`).

### Con pgAdmin (herramienta de BD)

```bash
docker compose --profile tools up -d
```

pgAdmin estara disponible en `http://localhost:5050`.

### Solo la base de datos

```bash
docker compose up postgres -d
```

### Base de datos de testing

```bash
docker compose --profile test up postgres_test -d
```

### Build multi-stage

El `Dockerfile` usa un build multi-stage de 3 fases:

1. **deps** -- Instala dependencias con `pnpm install --frozen-lockfile`
2. **builder** -- Compila TypeScript
3. **runner** -- Imagen final minima (Alpine) con solo el codigo compilado

---

## API Endpoints

### Health Check

| Metodo | Ruta      | Descripcion         |
|--------|-----------|---------------------|
| GET    | `/health` | Estado del servidor |

### Productos

| Metodo | Ruta            | Descripcion                  |
|--------|-----------------|------------------------------|
| GET    | `/products`     | Listar todos los productos   |
| GET    | `/products/:id` | Obtener un producto por ID   |

### Transacciones (Flujo de Checkout)

| Metodo | Ruta                    | Descripcion                      |
|--------|-------------------------|----------------------------------|
| POST   | `/transactions`         | Crear transaccion pendiente      |
| POST   | `/transactions/:id/pay` | Ejecutar pago de una transaccion |
| GET    | `/transactions/:id`     | Consultar detalle de transaccion |

#### Crear Transaccion

```json
POST /transactions
{
  "items": [
    { "productId": "uuid", "quantity": 2 }
  ],
  "amount": 50000,
  "currency": "COP",
  "customer": {
    "email": "usuario@example.com",
    "fullName": "Juan Perez",
    "phone": "3001234567"
  },
  "delivery": {
    "addressLine1": "Calle 123 #45-67",
    "city": "Bogota",
    "country": "CO",
    "postalCode": "110111"
  }
}
```

- Valida disponibilidad de stock
- Verifica que el monto coincida con el calculo de items
- Retorna la transaccion con estado `PENDING`

#### Ejecutar Pago

```json
POST /transactions/:id/pay
{
  "cardNumber": "4242424242424242",
  "expMonth": "12",
  "expYear": "2028",
  "cvc": "123",
  "holderName": "Juan Perez"
}
```

- Valida el numero de tarjeta con el **algoritmo de Luhn**
- Valida que la fecha de expiracion sea futura
- Procesa el pago via Wompi
- Decrementa stock atomicamente si el pago es exitoso
- Retorna la transaccion con estado `SUCCESS` o `FAILED`

### Clientes

| Metodo | Ruta                          | Descripcion                               |
|--------|-------------------------------|-------------------------------------------|
| GET    | `/customers/lookup?email=...` | Perfil del cliente con ultima transaccion |
| GET    | `/customers/:id`              | Obtener cliente por ID                    |
| GET    | `/customers?email=...`        | Obtener cliente por email                 |

### Envios (Delivery)

| Metodo | Ruta              | Descripcion                                  |
|--------|-------------------|----------------------------------------------|
| GET    | `/deliveries/:id` | Consultar direccion de envio                 |
| PATCH  | `/deliveries/:id` | Actualizar direccion (solo si estado PENDING) |

#### Actualizar Direccion

```json
PATCH /deliveries/:id
{
  "transactionId": "uuid",
  "addressLine1": "Nueva Calle 456",
  "city": "Medellin"
}
```

### Admin

| Metodo | Ruta                                           | Descripcion                  |
|--------|-------------------------------------------------|------------------------------|
| GET    | `/admin/transactions?email=...&limit=&offset=` | Listar transacciones (admin) |

Requiere que el `email` proporcionado exista en la tabla `admin_users`.

### Documentacion

| Metodo | Ruta    | Descripcion |
|--------|---------|-------------|
| GET    | `/docs` | Swagger UI  |

---

## Modelos de Dominio

### Transaction

Agregado principal que representa una operacion de checkout.

- **Estados:** `PENDING` -> `SUCCESS` | `FAILED`
- **Transiciones:** `markSuccess(providerRef)`, `markFailed(reason)`
- **Inmutabilidad:** Una vez finalizada, no se puede modificar
- Contiene `TransactionItem[]` con snapshots del producto al momento de la compra

### Customer

Informacion del comprador.

- Email normalizado a minusculas y con indice unico
- Validacion de campos requeridos: id, email, fullName

### Product

Producto del catalogo con gestion de inventario.

- Incluye `Stock` (Value Object) para control de disponibilidad
- Genera snapshots inmutables para el historial de transacciones
- `imageUrls` almacenado como JSONB

### Delivery

Direccion de envio asociada a una transaccion.

- Solo se puede actualizar mientras la transaccion este en estado `PENDING`

### Stock (Value Object)

Objeto de valor inmutable para inventario.

- `canDecrement(quantity)` -- Verifica si hay stock suficiente
- `decrement(quantity)` -- Retorna nueva instancia con stock reducido

---

## Diagrama de Entidades

```
┌───────────────┐       ┌──────────────────┐
│   Products    │       │    Customers     │
├───────────────┤       ├──────────────────┤
│ id (PK)       │       │ id (PK)          │
│ name          │       │ email (unique)   │
│ description   │       │ fullName         │
│ imageUrls     │       │ phone            │
│ priceAmount   │       └────────┬─────────┘
│ currency      │                │
│ stockUnits    │                │ 1:N
└───────┬───────┘                │
        │                ┌───────┴─────────┐
        │ N:1            │  Transactions   │
        │                ├─────────────────┤
        │                │ id (PK)         │
┌───────┴───────────┐    │ customer_id (FK)│
│ TransactionItems  │    │ delivery_id (FK)│───┐
├───────────────────┤    │ status          │   │
│ id (PK)           │    │ amount          │   │
│ transaction_id(FK)│────┤ currency        │   │
│ product_id (FK)   │    │ providerRef     │   │
│ quantity          │    │ failureReason   │   │
│ unitPriceAmount   │    │ cardLast4       │   │
│ currency          │    │ version         │   │
│ productSnapshot   │    │ createdAt       │   │
│ createdAt         │    │ updatedAt       │   │
│ updatedAt         │    └─────────────────┘   │
└───────────────────┘                          │
                          ┌────────────────┐   │
                          │   Deliveries   │   │
                          ├────────────────┤   │
                          │ id (PK)        │◄──┘
                          │ addressLine1   │  1:1
                          │ addressLine2   │
                          │ city           │
                          │ country        │
                          │ postalCode     │
                          └────────────────┘

┌────────────────┐
│  AdminUsers    │
├────────────────┤
│ id (PK)        │
│ email (unique) │
│ fullName       │
│ role           │
│ createdAt      │
│ updatedAt      │
└────────────────┘
```

---

## Manejo de Errores

La aplicacion usa un patron **Result** (Railway Oriented Programming) en lugar de excepciones:

```typescript
type Result<T, E> = Ok<T> | Err<E>
```

### Tipos de Error de Aplicacion

| Error                       | HTTP Status | Descripcion                            |
|-----------------------------|-------------|----------------------------------------|
| `PRODUCT_NOT_FOUND`         | 404         | Producto no encontrado                 |
| `OUT_OF_STOCK`              | 409         | Stock insuficiente                     |
| `TRANSACTION_NOT_FOUND`     | 404         | Transaccion no encontrada              |
| `DELIVERY_NOT_FOUND`        | 404         | Direccion de envio no encontrada       |
| `DELIVERY_UPDATE_FORBIDDEN` | 403         | Transaccion ya finalizada              |
| `CUSTOMER_NOT_FOUND`        | 404         | Cliente no encontrado                  |
| `AMOUNT_MISMATCH`           | 400         | El monto no coincide con los items     |
| `ITEMS_INVALID`             | 400         | Items invalidos en la transaccion      |
| `PAYMENT_FAILED`            | 400         | Pago rechazado por el proveedor        |
| `TRANSACTION_FINALIZED`     | 409         | La transaccion ya fue procesada        |
| `ADMIN_UNAUTHORIZED`        | 403         | Email no autorizado como administrador |

### Seguridad en Logs

Los datos sensibles (numeros de tarjeta, tokens, llaves) son redactados automaticamente antes de ser escritos en logs.

---

## Testing

### Unit Tests

```bash
# Ejecutar tests
pnpm test

# Watch mode
pnpm run test:watch

# Con cobertura
pnpm run test:cov
```

Los tests unitarios cubren:

- Entidades de dominio (Transaction, Stock)
- Mappers (TransactionMapper)
- Casos de uso (CreateTransaction, PayTransaction)

### Tests End-to-End

```bash
# 1. Levantar la base de datos de pruebas
docker compose --profile test up postgres_test -d

# 2. Ejecutar tests e2e
pnpm run test:e2e
```

Los tests e2e ejecutan el flujo completo de checkout con el proveedor de pagos mockeado.

### Debug de Tests

```bash
pnpm run test:debug
```

---

## Scripts Disponibles

| Script                    | Descripcion                         |
|---------------------------|-------------------------------------|
| `pnpm run build`          | Compilar TypeScript                 |
| `pnpm run start`          | Iniciar la aplicacion               |
| `pnpm run start:dev`      | Iniciar en modo desarrollo (watch)  |
| `pnpm run start:debug`    | Iniciar en modo debug               |
| `pnpm run start:prod`     | Iniciar en produccion               |
| `pnpm run lint`           | Ejecutar ESLint con auto-fix        |
| `pnpm run format`         | Formatear codigo con Prettier       |
| `pnpm run db:ensure`      | Crear la base de datos si no existe |
| `pnpm run migration:run`  | Ejecutar migraciones pendientes     |
| `pnpm run seed:run`       | Insertar datos iniciales            |
| `pnpm test`               | Ejecutar tests unitarios            |
| `pnpm run test:watch`     | Tests en modo watch                 |
| `pnpm run test:cov`       | Tests con reporte de cobertura      |
| `pnpm run test:e2e`       | Tests end-to-end                    |
| `pnpm run test:debug`     | Tests en modo debug                 |
