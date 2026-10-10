import { RuleResult } from "../../types";
import { getStatementAst } from "./rule-utils.js";

export function ruleSelectStar(ast: any): RuleResult {
  const statement = getStatementAst(ast);
  const columns = Array.isArray(statement?.columns) ? statement.columns : [];
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
