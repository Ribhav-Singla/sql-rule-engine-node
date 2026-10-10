import { RuleResult } from "../../types";
import { getStatementAst } from "./rule-utils.js";

export function ruleCartesianJoin(ast: any): RuleResult {
  const from = getStatementAst(ast)?.from ?? [];
  const hasMultipleTables = from.length > 1;
  const hasJoin = from.some((f: any) => f.join);
  const triggered = hasMultipleTables && !hasJoin;
  return {
    triggered,
    issue: "cartesian_join",
    category: "performance",
    explanation: "Query joins multiple tables without an explicit JOIN condition — results in a Cartesian product.",
  };
}
