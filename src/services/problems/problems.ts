import { db } from "../../db/index.js";
import { RelevantTableLink } from "../../types/index.js";

function getRelevantTables(relevantTables: RelevantTableLink[]) {
  return relevantTables
    .map(({ schemaTable }: RelevantTableLink) => schemaTable)
    .sort((first, second) => first.tableName.localeCompare(second.tableName));
}

export async function getProblems() {
  let problems: any = [];
  try {
    const problemRecords = await db.problem.findMany({
      select: {
        id: true,
        title: true,
        questionText: true,
        difficulty: true,
        isFree: true,
        schema: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        relevantTables: {
          select: {
            schemaTable: {
              select: {
                id: true,
                tableName: true,
                columns: {
                  select: {
                    id: true,
                    columnName: true,
                    dataType: true,
                    isPk: true,
                    isFk: true,
                    fkReference: true,
                    isNullable: true,
                  },
                  orderBy: { columnName: "asc" },
                },
              },
            },
          },
        },
      },
    });

    problems = problemRecords.map(({ relevantTables, ...problem }) => ({
      ...problem,
      schema: {
        ...problem.schema,
        tables: getRelevantTables(relevantTables),
      },
    }));
  } catch (error) {
    console.error("Error fetching problems:", error);
  }
  return problems;
}

export async function getProblemById(problemId: string) {
  let problem: any = null;
  try {
    const problemRecord = await db.problem.findFirst({
      where: {
        id: problemId,
      },
      select: {
        id: true,
        title: true,
        questionText: true,
        difficulty: true,
        isFree: true,
        schema: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        relevantTables: {
          select: {
            schemaTable: {
              select: {
                id: true,
                tableName: true,
                columns: {
                  select: {
                    id: true,
                    columnName: true,
                    dataType: true,
                    isPk: true,
                    isFk: true,
                    fkReference: true,
                    isNullable: true,
                  },
                  orderBy: { columnName: "asc" },
                },
              },
            },
          },
        },
      },
    });
    if (problemRecord) {
      const { relevantTables, ...problemData } = problemRecord;
      problem = {
        ...problemData,
        schema: {
          ...problemData.schema,
          tables: getRelevantTables(relevantTables),
        },
      };
    }
  } catch (error) {
    console.error("Error fetching problem:", error);
  }
  return problem;
}
