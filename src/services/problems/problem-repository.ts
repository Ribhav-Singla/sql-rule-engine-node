import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import type { ProblemResponse } from "../../types/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

function getProblemsFilePath(): string {
  return resolve(__dirname, "../../data/problems.json");
}

let cachedProblems: ProblemResponse[] | null = null;

export function getProblems(): ProblemResponse[] {
  if (!cachedProblems) {
    cachedProblems = readJsonFile<ProblemResponse[]>(getProblemsFilePath());
  }
  return cachedProblems;
}

export function getProblemById(problemId: string): ProblemResponse | undefined {
  return getProblems().find((problem) => problem.problem_id === problemId);
}
