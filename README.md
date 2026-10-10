# SQL Rule Engine API

Backend API for SQL interview practice. The application provides:

- User registration, login, refresh-token rotation, and logout.
- Public SQL problem and schema browsing.
- Interview sessions with ordered questions and optional timers.
- SQL normalization, rule analysis, evaluation, and fingerprints.
- Final submissions with attempts, feedback, and explanation evaluation.
- PostgreSQL-backed metadata and ecommerce practice data.
- Redis caching.

## Contents

- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Infrastructure setup](#infrastructure-setup)
- [Environment variables](#environment-variables)
- [Database workflow](#prisma-database-workflow)
- [Available scripts](#available-scripts)
- [Run the application](#run-the-application)
- [API overview](#api-overview)
- [Complete interview flow](#complete-interview-flow)
- [Validation and formatting](#validation-and-formatting)
- [Troubleshooting](#troubleshooting)

## Requirements

- Node.js 20 or newer.
- pnpm 10.33.0 or npm.
- Docker Desktop.
- PostgreSQL 16, preferably through Docker.
- Redis 7, preferably through Docker.

The project is configured to use pnpm:

```powershell
corepack enable
pnpm install
```

You can use the equivalent npm commands if preferred:

```powershell
npm install
```

## Quick start

After installing the prerequisites, run the following sequence from the
repository root:

```powershell
corepack enable
pnpm install
docker start postgres-db
docker start redis-db
pnpm db:generate
pnpm db:migrate
pnpm seed
pnpm db:sandbox
pnpm dev
```

If the Docker containers do not exist yet, follow the
[Infrastructure setup](#infrastructure-setup) section first. Ensure the
`.env` file is configured before running the seed and sandbox commands.

## Infrastructure setup

Run these commands from PowerShell.

```powershell
docker run --name postgres-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sqlruleengine -p 5432:5432 -d postgres:16

// postgresql://postgres:postgres@localhost:5432/sqlruleengine

docker run --name redis-db -p 6379:6379 -d redis:7-alpine

// redis://localhost:6379

npx prisma generate

npx prisma migrate dev --name init

npx prisma db push

// redis GUI

docker run -d --name redis-insight -p 5540:5540 -v redis-insight-data:/data redis/redisinsight:latest
-- connection string - "redis://host.docker.internal:6379"


docker exec -it postgres-db psql -U postgres -d sqlruleengine
```

The PostgreSQL connection string is:

```text
postgresql://postgres:postgres@localhost:5432/sqlruleengine
```

The Redis connection string is:

```text
redis://localhost:6379
```

### Re-running Docker commands

The container name must be unique. If the containers already exist, start them
instead of creating them again:

```powershell
docker start postgres-db
docker start redis-db
```

To inspect container status:

```powershell
docker ps
docker ps -a
```

## Environment variables

Create a `.env` file in the project root:

```dotenv
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sqlruleengine
SANDBOX_DATABASE_URL=
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=300

SQL_STATEMENT_TIMEOUT_MS=5000
SQL_LOCK_TIMEOUT_MS=3000
SQL_IDLE_IN_TX_TIMEOUT_MS=10000
SQL_MAX_ROWS=10000
MAX_RUNS_PER_QUESTION=3

NODE_ENV=development
JWT_SECRET=replace-with-at-least-16-characters
JWT_REFRESH_SECRET=replace-with-a-different-secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
REFRESH_COOKIE_NAME=refreshToken
BCRYPT_ROUNDS=12
```

### Environment variable reference

| Variable                    | Description                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| `PORT`                      | HTTP server port. Defaults to `8000`.                                       |
| `DATABASE_URL`              | Privileged PostgreSQL connection used by Prisma and trusted operations.     |
| `SANDBOX_DATABASE_URL`      | Optional least-privilege PostgreSQL connection for untrusted SQL execution. |
| `REDIS_URL`                 | Redis connection URL.                                                       |
| `CACHE_TTL_SECONDS`         | Cache lifetime in seconds.                                                  |
| `SQL_STATEMENT_TIMEOUT_MS`  | Maximum SQL execution time.                                                 |
| `SQL_LOCK_TIMEOUT_MS`       | PostgreSQL lock timeout for sandbox queries.                                |
| `SQL_IDLE_IN_TX_TIMEOUT_MS` | PostgreSQL idle transaction timeout.                                        |
| `SQL_MAX_ROWS`              | Maximum result rows returned by sandbox queries.                            |
| `MAX_RUNS_PER_QUESTION`     | Maximum evaluation runs allowed for one problem.                            |
| `NODE_ENV`                  | `development`, `qa`, or `production`.                                       |
| `JWT_SECRET`                | Access-token signing secret; minimum 16 characters.                         |
| `JWT_REFRESH_SECRET`        | Refresh-token signing secret; minimum 16 characters.                        |
| `ACCESS_TOKEN_TTL`          | Access-token duration, for example `15m`.                                   |
| `REFRESH_TOKEN_TTL`         | Refresh-token duration, for example `7d`.                                   |
| `REFRESH_COOKIE_NAME`       | Name of the refresh-token cookie.                                           |
| `BCRYPT_ROUNDS`             | Password hashing cost between 4 and 31.                                     |

Never commit `.env` or real credentials.

## Prisma database workflow

Generate the Prisma client:

```powershell
pnpm db:generate
```

Apply existing migrations in development:

```powershell
pnpm db:migrate
```

Create a new migration after changing `prisma/schema.prisma`:

```powershell
pnpm prisma migrate dev --name describe_your_change
```

Push the schema without creating a migration:

```powershell
pnpm db:push
```

Inspect the database with Prisma Studio:

```powershell
pnpm db:studio
```

Check migration status:

```powershell
pnpm prisma migrate status
```

Use migrations for committed schema changes. Use `db push` only for local
experimentation where migration history is not required.

## Available scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` / `npm run dev` | Start the development server with automatic restart. |
| `pnpm build` / `npm run build` | Compile TypeScript and resolve path aliases. |
| `pnpm start` / `npm run start` | Run the compiled application from `dist`. |
| `pnpm typecheck` / `npm run typecheck` | Check TypeScript without emitting files. |
| `pnpm lint` / `npm run lint` | Run ESLint. |
| `pnpm format` / `npm run format` | Format source files with Prettier. |
| `pnpm db:generate` / `npm run db:generate` | Generate the Prisma client. |
| `pnpm db:migrate` / `npm run db:migrate` | Apply or create development migrations. |
| `pnpm db:push` / `npm run db:push` | Push the Prisma schema without a migration. |
| `pnpm db:studio` / `npm run db:studio` | Open Prisma Studio. |
| `pnpm seed` / `npm run seed` | Reset and seed application and ecommerce data. |
| `pnpm db:sandbox` / `npm run db:sandbox` | Configure the least-privilege SQL sandbox role. |

## Seed data

Run:

```powershell
pnpm seed
```

or:

```powershell
npm run seed
```

After seeding the database, configure the sandbox database role:

```powershell
npm run db:sandbox
```

The seed performs two operations:

1. Recreates the `ecommerce` PostgreSQL schema from
   `src/seedDb/dataset_data.sql`.
2. Resets and reseeds all Prisma-managed application tables from
   `src/seedDb/prisma_data.ts`.

The Prisma reset removes:

- Users and authentication sessions.
- Interview sessions and questions.
- Attempts and attempt runs.
- Problems, solutions, and expected results.
- Schema, table, column, and problem-table metadata.

Therefore, every seed run deletes existing users and interview history. Register
a new user after seeding.

The seed creates metadata for:

- `customers`
- `products`
- `orders`
- `order_items`

It also maps each seeded problem to only its relevant schema tables.

## Sandbox database role

For production or shared environments, configure a separate read-only database
role for user-submitted SQL:

```powershell
pnpm db:sandbox
```

This command uses `DATABASE_URL` as the administrator connection and
`SANDBOX_DATABASE_URL` as the read-only role connection. Set both variables
before running it.

If `SANDBOX_DATABASE_URL` is not set, the application falls back to
`DATABASE_URL` and logs a warning. Do not use that fallback in production.

## Run the application

Development mode with automatic restart:

```powershell
pnpm dev
```

Production-style build:

```powershell
pnpm build
pnpm start
```

The default server URL is:

```text
http://localhost:8000
```

Health check:

```http
GET http://localhost:8000/health
```

## Validation and formatting

Type-check the project:

```powershell
pnpm typecheck
```

Build the project:

```powershell
pnpm build
```

Format source files:

```powershell
pnpm format
```

Lint:

```powershell
pnpm lint
```

## API overview

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

Register:

```http
POST http://localhost:8000/api/auth/register
Content-Type: application/json
```

```json
{
  "email": "student@example.com",
  "password": "Password123!"
}
```

Login:

```http
POST http://localhost:8000/api/auth/login
Content-Type: application/json
```

```json
{
  "email": "student@example.com",
  "password": "Password123!"
}
```

Save the returned `data.accessToken`. Send it on protected requests:

```http
Authorization: Bearer <accessToken>
```

The refresh token is stored in an HTTP-only cookie.

### Problems

These endpoints are public:

```http
GET /api/problems
GET /api/problems/:problemId
```

Each problem includes its schema metadata and only the relevant tables linked
through `problem_schema_tables`.

### SQL operations

These endpoints require authentication:

```http
POST /api/normalize
POST /api/fingerprint
POST /api/rules
POST /api/evaluate
POST /api/sql/session-questions/<sessionQuestionId>/evaluate-before-submit
POST /api/sql/session-questions/<sessionQuestionId>/submit
POST /api/sql/attempts/<attemptId>/evaluate-followup
```

Example evaluation request:

```http
POST http://localhost:8000/api/evaluate
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "sql": "SELECT MAX(total_amount) FROM orders;",
  "schema_name": "ecommerce",
  "problem_id": "<problem-id>"
}
```

## Complete interview flow

### 1. Load problems

```http
GET http://localhost:8000/api/problems
```

Copy the problem IDs from the response.

### 2. Start an interview

```http
POST http://localhost:8000/api/sql/interview-sessions/<userId>/start
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "mode": "interview",
  "readinessCheckPassed": true,
  "questions": [
    {
      "problemId": "<problem-id-1>",
      "timerEnabled": true,
      "timeLimitSeconds": 900
    },
    {
      "problemId": "<problem-id-2>",
      "timerEnabled": false
    }
  ]
}
```

The authenticated user ID in the URL must match the user ID in the access
token. The first question is activated automatically. A user cannot start a
second interview while an existing interview has a status other than
`completed`; the API returns `SESSION_ALREADY_ACTIVE` with HTTP 409.

### 3. Get the current question

```http
GET http://localhost:8000/api/sql/interview-sessions/<sessionId>/current
Authorization: Bearer <accessToken>
```

Use `deadlineAt` as the authoritative server deadline. The frontend clock is
only for display.

### 4. Evaluate before submitting

Run the candidate query to receive only the `question_attempt` preview. This
also creates the pending `attempt` and its `attemptRun`; repeated evaluations
create additional runs for the same pending attempt.

```http
POST http://localhost:8000/api/sql/session-questions/<sessionQuestionId>/evaluate-before-submit
Authorization: ******
Content-Type: application/json
```

```json
{
  "sql": "SELECT email FROM customers GROUP BY email HAVING COUNT(*) > 1;"
}
```

### 5. Submit a question

```http
POST http://localhost:8000/api/sql/session-questions/<sessionQuestionId>/submit
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "finalQuery": "SELECT email FROM customers GROUP BY email HAVING COUNT(*) > 1;",
  "explanationText": "The query groups equal email values and keeps duplicates.",
  "edgeCaseText": "Null handling depends on the dataset constraints."
}
```

The preview step creates the `attempt` and `attemptRun` when used. Final
submission updates an existing pending attempt with the final query, status,
and score, and records the final query as an `attemptRun`. If no preview was
run, final submission creates the attempt and its final `attemptRun` itself.
A unique database index prevents concurrent duplicate final submissions.

### 6. Advance to the next question

After displaying the submission feedback:

```http
POST http://localhost:8000/api/sql/interview-sessions/<sessionId>/next
Authorization: Bearer <accessToken>
```

Repeat the current-question, solve, submit, and next steps. When there are no
pending questions, the session is marked `completed` and `currentQuestion` is
`null`.

### Interview edge cases

- Expired access tokens should be refreshed once through `/api/auth/refresh`,
  then the original request may be retried once.
- A session belonging to another user returns `SESSION_NOT_FOUND`.
- A timed-out question cannot be submitted.
- A question cannot receive more than one final attempt.
- Advancing an already completed session returns
  `SESSION_ALREADY_COMPLETED`.
- Refreshing the browser should call the current-question endpoint instead of
  creating a new interview.
- If a submit request times out on the network, fetch the current question
  before retrying to avoid duplicate submissions.

## Standard responses

Successful responses use:

```json
{
  "response": true,
  "message": "Human-readable message",
  "data": {}
}
```

Errors use:

```json
{
  "response": false,
  "error": "Human-readable error",
  "error_code": "ERROR_CODE"
}
```

Protected endpoints require an access token in the `Authorization` header:

```http
Authorization: Bearer <access-token>
```

Do not send a request body with GET endpoints. A whitespace-only body with
`Content-Type: application/json` is invalid JSON and returns `INVALID_JSON`
with HTTP 400.

## Useful Docker commands

View PostgreSQL logs:

```powershell
docker logs postgres-db
```

View Redis logs:

```powershell
docker logs redis-db
```

Stop services:

```powershell
docker stop postgres-db redis-db
```

Start services again:

```powershell
docker start postgres-db redis-db
```

Open a PostgreSQL shell:

```powershell
docker exec -it postgres-db psql -U postgres -d sqlruleengine
```

## Destructive database reset

To drop the development database, replay migrations, and run the configured
seed:

```powershell
pnpm prisma migrate reset
```

This deletes all database data, including users and interview history. Use it
only for a disposable development database.

## Troubleshooting

### PostgreSQL or Redis is unavailable

Check that both containers are running:

```powershell
docker ps
docker start postgres-db
docker start redis-db
```

If a container does not exist, rerun the corresponding `docker run` command in
[Infrastructure setup](#infrastructure-setup).

### Prisma cannot connect to the database

Confirm that `DATABASE_URL` in `.env` matches the PostgreSQL container and then
regenerate the client:

```powershell
pnpm db:generate
pnpm prisma migrate status
```

### SQL sandbox execution fails

Confirm that `SANDBOX_DATABASE_URL` is set, then recreate the sandbox role:

```powershell
pnpm db:sandbox
```

The application can fall back to `DATABASE_URL` for local development, but a
separate read-only sandbox connection is strongly recommended and should be
used in shared or production environments.

### The API returns `401 Unauthorized`

Log in again or call `/api/auth/refresh` when the access token expires. Send
the refreshed access token as a Bearer token on protected requests.
