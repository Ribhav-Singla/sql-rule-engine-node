export type RuleAst = Record<string, any>;

export function getStatementAst(ast: unknown): RuleAst | null {
  const statement = Array.isArray(ast) ? ast[0] : ast;
  return statement && typeof statement === "object" ? (statement as RuleAst) : null;
}
