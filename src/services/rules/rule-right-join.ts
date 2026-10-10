import { RuleResult } from "../../types";
import { getStatementAst } from "./rule-utils.js";

export function ruleRightJoin(ast: any): RuleResult {
  const from = getStatementAst(ast)?.from ?? [];
  const hasRightJoin = from.some((f: any) => f.join?.toUpperCase() === "RIGHT JOIN");
  return {
    triggered: hasRightJoin,
    issue: "right_join_detected",
    category: "readability",
    explanation: "RIGHT JOIN can usually be rewritten as LEFT JOIN for better readability.",
  };
}
