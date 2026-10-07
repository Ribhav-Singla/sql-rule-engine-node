import { RuleResult } from "../../types";

export function ruleAggregateNoGroup(ast: any): RuleResult {
  const aggregateFns = ["COUNT", "SUM", "AVG", "MIN", "MAX"];
  const columns = ast.columns || [];
  const hasAggregate = columns.some(
    (col: any) => col?.expr?.type === "aggr_func" && aggregateFns.includes(col?.expr?.name?.toUpperCase()),
  );
  const hasGroupBy = !!ast.groupby;
  return {
    triggered: hasAggregate && !hasGroupBy,
    issue: "missing_group_by",
    category: "logic",
    explanation: "Aggregate function used without GROUP BY — may return unintended results.",
  };
}
