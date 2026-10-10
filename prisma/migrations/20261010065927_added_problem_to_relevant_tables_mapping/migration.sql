-- CreateTable
CREATE TABLE "problem_schema_tables" (
    "problem_id" UUID NOT NULL,
    "schema_table_id" UUID NOT NULL,

    CONSTRAINT "problem_schema_tables_pkey" PRIMARY KEY ("problem_id","schema_table_id")
);

-- AddForeignKey
ALTER TABLE "problem_schema_tables"
    ADD CONSTRAINT "problem_schema_tables_problem_id_fkey"
    FOREIGN KEY ("problem_id") REFERENCES "problems"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
