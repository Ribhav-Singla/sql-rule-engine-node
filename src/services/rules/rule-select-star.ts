import { RuleResult } from "../../types";

export function ruleSelectStar(ast: any): RuleResult {
  const columns = Array.isArray(ast?.columns) ? ast.columns : [];
  const hasStar = columns.some(
    (column: any) => column?.expr?.type === "star" || column?.expr?.column === "*" || column === "*",
  );

  return {
    triggered: hasStar,
    issue: "select_star",
    category: "best_practice",
    explanation: "SELECT * fetches every column. Specify only the columns you need.",
  };
}
