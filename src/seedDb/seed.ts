import "@dotenvx/dotenvx/config";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import {
  problems,
  expectedResults,
  schemaMetadata,
  relevantTablesByProblem,
} from "./prisma_data.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

async function prisma_seed(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(async (tx) => {
      const schema = await tx.schema.upsert({
        where: { name: schemaMetadata.name },
        update: { description: schemaMetadata.description },
        create: {
          id: randomUUID(),
          name: schemaMetadata.name,
          description: schemaMetadata.description,
        },
      });

      const schemaTableIds = new Map<string, string>();

      await tx.schemaTable.deleteMany({ where: { schemaId: schema.id } });
      for (const tableRecord of schemaMetadata.tables) {
        const schemaTable = await tx.schemaTable.create({
          data: {
            id: randomUUID(),
            schemaId: schema.id,
            tableName: tableRecord.name,
            columns: {
              create: tableRecord.columns.map((column) => ({
                id: randomUUID(),
                columnName: column.name,
                dataType: column.dataType,
                isPk: column.isPk ?? false,
                isFk: column.isFk ?? false,
                fkReference: column.fkReference,
                isNullable: false,
              })),
            },
          },
        });
        schemaTableIds.set(tableRecord.name, schemaTable.id);
      }

      const problemIdMap: Record<string, string> = {};

      for (const problemRecord of problems) {
        const difficulty = "Medium";
        const existingProblem = await tx.problem.findFirst({
          where: {
            OR: [
              { title: problemRecord.pattern },
              { questionText: problemRecord.title },
            ],
          },
          select: { id: true },
        });
        const problem = existingProblem
          ? await tx.problem.update({
              where: { id: existingProblem.id },
              data: {
                title: problemRecord.pattern,
                questionText: `${problemRecord.title}`,
                difficulty,
                isFree: false,
                schemaId: schema.id,
              },
            })
          : await tx.problem.create({
              data: {
                id: randomUUID(),
                schemaId: schema.id,
                title: problemRecord.pattern,
                questionText: `${problemRecord.title}`,
                difficulty,
                isFree: false,
              },
            });

        problemIdMap[problemRecord.problem_id] = problem.id;
        await tx.problemSolution.deleteMany({
          where: { problemId: problem.id },
        });
        await tx.expectedResult.deleteMany({
          where: { problemId: problem.id },
        });
        await tx.problemSchemaTable.deleteMany({
          where: { problemId: problem.id },
        });

        const relevantTableNames =
          relevantTablesByProblem[problemRecord.problem_id];
        if (!relevantTableNames) {
          throw new Error(
            `No relevant table mapping found for problem_id: ${problemRecord.problem_id}`,
          );
        }

        const relevantTableIds = relevantTableNames.map((tableName) => {
          const schemaTableId = schemaTableIds.get(tableName);
          if (!schemaTableId) {
            throw new Error(
              `Table '${tableName}' is not defined in schema '${schema.name}'`,
            );
          }
          return schemaTableId;
        });

        await tx.problemSchemaTable.createMany({
          data: relevantTableIds.map((schemaTableId) => ({
            problemId: problem.id,
            schemaTableId,
          })),
          skipDuplicates: true,
        });

        await tx.problemSolution.create({
          data: {
            id: randomUUID(),
            problemId: problem.id,
            referenceSolutionQuery: problemRecord.query,
          },
        });
      }

      for (const expectedRecord of expectedResults) {
        const problemId = problemIdMap[expectedRecord.problem_id];
        if (!problemId) {
          console.warn(
            `No mapping found for problem_id: ${expectedRecord.problem_id}`,
          );
          continue;
        }

        let rowsData;
        try {
          rowsData = JSON.parse(expectedRecord.result_rows);
        } catch {
          rowsData = null;
        }

        await tx.expectedResult.create({
          data: {
            id: randomUUID(),
            problemId,
            rows: rowsData,
            rowsHash: expectedRecord.result_hash,
            isActive: true,
          },
        });
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function dataset_seed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  const sqlPath = fileURLToPath(new URL("./dataset_data.sql", import.meta.url));
  const sql = await readFile(sqlPath, "utf8");
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Ecommerce dataset seeded successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function seed(): Promise<void> {
  await dataset_seed();
  await prisma_seed();
}

void seed()
  .then(() => {
    console.log("Seed completed.");
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
