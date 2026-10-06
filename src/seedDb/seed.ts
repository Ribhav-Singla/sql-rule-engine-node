import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import "../config/settings.js";
import { problems, expectedResults } from "./data.js";

async function seed(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(async (tx) => {
      const problemIdMap: Record<string, string> = {};

      for (const problemRecord of problems) {
        const difficulty = problemRecord.pattern.split("/")[0].trim() || "Medium";
        const existingProblem = await tx.problem.findFirst({
          where: { title: problemRecord.title },
          select: { id: true },
        });
        const problem = existingProblem
          ? await tx.problem.update({
              where: { id: existingProblem.id },
              data: {
                questionText: `${problemRecord.title}`,
                difficulty,
                isFree: false,
              },
            })
          : await tx.problem.create({
              data: {
                id: randomUUID(),
                title: problemRecord.title,
                questionText: `${problemRecord.title}`,
                difficulty,
                isFree: false,
              },
            });

        problemIdMap[problemRecord.problem_id] = problem.id;
        await tx.problemSolution.deleteMany({ where: { problemId: problem.id } });
        await tx.expectedResult.deleteMany({ where: { problemId: problem.id } });
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
          console.warn(`No mapping found for problem_id: ${expectedRecord.problem_id}`);
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

void seed()
  .then(() => {
    console.log("Seed completed.");
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
