import { RuleResult } from "../../types";
import { getStatementAst } from "./rule-utils.js";

const LARGE_TABLES = new Set(["orders", "transactions", "events", "logs", "customers"]);

export function ruleMissingWhere(ast: any): RuleResult {
  const statement = getStatementAst(ast);
  const tableNames = new Set<string>();
  for (const node of statement?.from ?? []) {
    const table = node?.table;
    if (typeof table === "string") {
      tableNames.add(table.toLowerCase());
    }
  }

  const hasLargeTable = [...tableNames].some((table) => LARGE_TABLES.has(table));

  return {
    triggered: !statement?.where && hasLargeTable,
    issue: "missing_where",
    category: "performance",
    explanation: "Query has no WHERE clause — may scan the entire table.",
  };
}
