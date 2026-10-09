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