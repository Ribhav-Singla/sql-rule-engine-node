import type { EvaluateResponse, SchemaName } from "../../types/index.js";
import { normalizeSql } from "../normalization/query-normalizer.js";
import { generateFingerprint } from "../utils/fingerprint.js";
import { getCache, setCache } from "../cache/redis-cache.js";
import { runRules } from "../rules/rule-engine.js";
import { executeQuery } from "../database/query-executor.js";
import { normalizeResult } from "../utils/result-normalizer.js";
import { hashAndCompare } from "../utils/comparator.js";
import { generateFeedback } from "../feedback/feedback-generator.js";
import { getExpectedHash } from "./expected-results-repository.js";

export async function evaluateQuery(sql: string, schemaName: SchemaName, problemId: string): Promise<EvaluateResponse> {
  const expectedHash = await getExpectedHash(problemId);
  if (!expectedHash) {
    return { error: `Problem '${problemId}' not found in expected_results.` };
  }

  const parsed = normalizeSql(sql);
  if (parsed.error || !parsed.normalized_sql) {
    return { error: `Parse error: ${parsed.error}` };
  }

  const normalizedSql = parsed.normalized_sql;
  const fingerprint = generateFingerprint(problemId, schemaName, normalizedSql);

  try {
    const cached = await getCache(fingerprint);
    if (cached) {
      return {
        cached: true,
        fingerprint,
        ...cached,
      };
    }
  } catch {
    // Continue with pipeline when cache is unavailable.
  }

  const ruleResults = runRules(parsed.ast);
  const execution = await executeQuery(normalizedSql, schemaName);
  if (execution.error) {
    return { error: `Execution error: ${execution.error}` };
  }

  const normalizedResult = normalizeResult(execution.rows);
  const comparison = hashAndCompare(normalizedResult, expectedHash);
  const feedback = generateFeedback({
    isCorrect: comparison.correct,
    ruleIssues: ruleResults,
  });

  const cacheEntry: EvaluateResponse = {
    result_hash: comparison.result_hash,
    correct: comparison.correct,
    rule_results: ruleResults,
    question_attempt: {
      problem_id: problemId,
      raw_sql: sql,
      normalized_sql: normalizedSql,
      runtime_status: "success",
      preview_columns: execution.columns,
      preview_rows: execution.rows.slice(0, 20),
      row_count: execution.rows.length,
    },
  };

  try {
    await setCache(fingerprint, cacheEntry);
  } catch {
    // Cache failures should not fail evaluation.
  }

  return {
    cached: false,
    fingerprint,
    feedback,
    ...cacheEntry,
  };
}
