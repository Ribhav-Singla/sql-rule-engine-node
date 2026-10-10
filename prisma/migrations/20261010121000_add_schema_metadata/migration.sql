-- CreateTable
CREATE TABLE "schemas" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_tables" (
    "id" UUID NOT NULL,
    "schema_id" UUID NOT NULL,
    "table_name" TEXT NOT NULL,

    CONSTRAINT "schema_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_columns" (
    "id" UUID NOT NULL,
    "schema_table_id" UUID NOT NULL,
    "column_name" TEXT NOT NULL,
    "data_type" TEXT NOT NULL,
    "is_pk" BOOLEAN NOT NULL DEFAULT false,
    "is_fk" BOOLEAN NOT NULL DEFAULT false,
    "fk_reference" TEXT,
    "is_nullable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "schema_columns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schemas_name_idx" ON "schemas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "schema_tables_schema_id_table_name_idx"
    ON "schema_tables"("schema_id", "table_name");

-- CreateIndex
CREATE UNIQUE INDEX "schema_columns_schema_table_id_column_name_idx"
    ON "schema_columns"("schema_table_id", "column_name");

-- Seed the schema needed to backfill existing problems.
INSERT INTO "schemas" ("id", "name", "description")
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'ecommerce',
    'Ecommerce practice dataset'
)
ON CONFLICT ("name") DO NOTHING;

-- Add the problem-to-schema relationship.
ALTER TABLE "problems" ADD COLUMN "schema_id" UUID;

UPDATE "problems"
SET "schema_id" = (
    SELECT "id" FROM "schemas" WHERE "name" = 'ecommerce'
)
WHERE "schema_id" IS NULL;

ALTER TABLE "problems" ALTER COLUMN "schema_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "schema_tables"
    ADD CONSTRAINT "schema_tables_schema_id_fkey"
    FOREIGN KEY ("schema_id") REFERENCES "schemas"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schema_columns"
    ADD CONSTRAINT "schema_columns_schema_table_id_fkey"
    FOREIGN KEY ("schema_table_id") REFERENCES "schema_tables"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Ensure the join table exists before adding its schema-table foreign key.
CREATE TABLE IF NOT EXISTS "problem_schema_tables" (
    "problem_id" UUID NOT NULL,
    "schema_table_id" UUID NOT NULL,

    CONSTRAINT "problem_schema_tables_pkey" PRIMARY KEY ("problem_id","schema_table_id")
);

-- AddForeignKey
ALTER TABLE "problem_schema_tables"
    ADD CONSTRAINT "problem_schema_tables_schema_table_id_fkey"
    FOREIGN KEY ("schema_table_id") REFERENCES "schema_tables"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problems"
    ADD CONSTRAINT "problems_schema_id_fkey"
    FOREIGN KEY ("schema_id") REFERENCES "schemas"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
