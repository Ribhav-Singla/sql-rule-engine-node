import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { pool } from "../db/index.js";
import { normalizeResult } from "../services/utils/result-normalizer.js";
import { generateSha256Hash } from "../services/utils/fingerprint.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const expectedResultsPath = resolve(__dirname, "expected-results.json");
const problemsPath = resolve(__dirname, "problems.json");

interface ProblemRecord {
  problem_id: string;
  schema: string;
  query: string;
}

interface ExpectedResultRecord {
  problem_id: string;
  result_hash: string;
  result_rows: string;
}

async function updateHashes() {
  const problems = JSON.parse(readFileSync(problemsPath, "utf-8")) as ProblemRecord[];
  const expectedResults = JSON.parse(readFileSync(expectedResultsPath, "utf-8")) as ExpectedResultRecord[];

  const client = await pool.connect();

  try {
    for (const problem of problems) {
      await client.query(`SET search_path TO "${problem.schema}"`);
      const res = await client.query(problem.query);
      const rows = res.rows;
      
      const normalizedString = normalizeResult(rows);
      const newHash = generateSha256Hash(normalizedString);

      const expected = expectedResults.find((e) => e.problem_id === problem.problem_id);
      if (expected) {
        expected.result_hash = newHash;
        expected.result_rows = normalizedString;
      }
    }

    writeFileSync(expectedResultsPath, JSON.stringify(expectedResults, null, 2), "utf-8");
    console.log("Hashes updated successfully!");
  } finally {
    client.release();
    await pool.end();
  }
}

updateHashes().catch(console.error);
