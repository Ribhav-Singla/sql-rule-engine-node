import { RuleResult } from "../../types";

const LARGE_TABLES = new Set(["orders", "transactions", "events", "logs", "customers"]);

export function ruleMissingWhere(ast: any): RuleResult {
  const tableNames = new Set<string>();
  for (const node of ast?.from ?? []) {
    const table = node?.table;
    if (typeof table === "string") {
      tableNames.add(table.toLowerCase());
    }
  }

  const hasLargeTable = [...tableNames].some((table) => LARGE_TABLES.has(table));

  return {
    triggered: !ast?.where && hasLargeTable,
    issue: "missing_where",
    category: "performance",
    explanation: "Query has no WHERE clause — may scan the entire table.",
  };
}
