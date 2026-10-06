docker run --name postgres-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sqlruleengine -p 5432:5432 -d postgres:16

// postgresql://postgres:postgres@localhost:5432/sqlruleengine

docker run --name redis-db -p 6379:6379 -d redis:7-alpine

// redis://localhost:6379

npx prisma generate

npx prisma migrate dev --name init

npx prisma db push