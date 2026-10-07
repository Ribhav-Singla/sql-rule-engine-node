import { db } from "../../db/index.js";

export async function getProblems() {
  let problems: any = [];
  try {
    problems = await db.problem.findMany({
      select: {
        id: true,
        title: true,
        questionText: true,
        difficulty: true,
        isFree: true,
      },
    });
  } catch (error) {
    console.error("Error fetching problems:", error);
  }
  return problems;
}

export async function getProblemById(problemId: string) {
  let problem: any = null;
  try {
    problem = await db.problem.findFirst({
      where: {
        id: problemId,
      },
      select: {
        id: true,
        title: true,
        questionText: true,
        difficulty: true,
        isFree: true,
      },
    });
  } catch (error) {
    console.error("Error fetching problem:", error);
  }
  return problem;
}
