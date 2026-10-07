import { ruleAggregateNoGroup } from "./rule-aggregate-no-group.js";
import { ruleCartesianJoin } from "./rule-cartesian-join.js";
import { ruleMissingWhere } from "./rule-missing-where.js";
import { ruleRightJoin } from "./rule-right-join.js";
import { ruleSelectStar } from "./rule-select-star.js";
import { RuleResult } from "../../types";

export function runRules(ast: any): RuleResult[] {
  const results = [
    ruleSelectStar(ast),
    ruleMissingWhere(ast),
    ruleCartesianJoin(ast),
    ruleAggregateNoGroup(ast),
    ruleRightJoin(ast),
  ];
  return results.filter((r) => r.triggered);
}
