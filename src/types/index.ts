import { loginSchema, registerSchema } from "../zod";
import { z } from "zod";

export const SCHEMA_NAMES = [
  "ecommerce"
] as const;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;


export type SchemaName = (typeof SCHEMA_NAMES)[number];

export type RuleCategory =
  | "logic"
  | "performance"
  | "best_practice"
  | "readability";

export interface RuleResult {
  triggered: boolean;
  issue: string;
  category: RuleCategory;
  explanation: string;
}

export interface AccessTokenPayload {
  userId: string;
}


export interface PublicUser {
  id: string;
  email: string;
  role: string;
}

export interface UserRow {
  id: string;
  email: string;
  role: string;
  passwordHash: string;
  deletedAt: Date | null;
}

export interface ApiSuccessResponse<T = unknown> {
  response: true;
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  response: false;
  error: string;
  error_code?: string;
  details?: unknown;
}

export interface NormalizeRequest {
  sql: string;
}

export interface NormalizeResponse {
  normalized_sql: string | null;
  error: string | null;
}

export interface FingerprintRequest {
  sql: string;
  schema_name: SchemaName;
  problem_id?: string;
}

export interface FingerprintResponse {
  fingerprint: string;
  normalized_sql: string;
}

export interface RulesRequest {
  sql: string;
}

export interface RuleIssue {
  triggered: boolean;
  issue: string;
  category: string;
  explanation: string;
}

export interface RulesResponse {
  normalized_sql: string;
  issues_count: number;
  issues: RuleIssue[];
}

export interface EvaluateRequest {
  sql: string;
  schema_name: SchemaName;
  problem_id: string;
}

export interface QuestionAttempt {
  problem_id?: string;
  raw_sql?: string;
  normalized_sql?: string;
  runtime_status?: string;
  preview_columns?: string[];
  preview_rows?: Record<string, unknown>[];
  row_count?: number;
}

export interface EvaluateResponse {
  cached?: boolean;
  fingerprint?: string;
  result_hash?: string;
  correct?: boolean;
  rule_results?: RuleIssue[];
  feedback?: {
    is_correct: boolean;
    score: number;
    rule_issues: RuleIssue[];
    messages: string[];
  };
  question_attempt?: QuestionAttempt;
  error?: string;
}

export interface ProblemResponse {
  problem_id: string;
  title: string;
  pattern: string;
  schema: string;
  query: string;
}

// Final Submit + Debrief Module Types
export type ApprovedRuleCode =
  | "MISSING_GROUP_BY"
  | "WRONG_JOIN_TYPE"
  | "WRONG_JOIN_KEY"
  | "MISSING_FILTER"
  | "WRONG_AGGREGATION"
  | "MISSING_HAVING"
  | "WINDOW_TIE_HANDLING_ERROR"
  | "ORDER_BY_MISSING"
  | "DUPLICATE_ROW_INFLATION"
  | "NULL_HANDLING_ISSUE"
  | "UNSAFE_SQL_BLOCKED";

export type ReadinessLabel =
  | "Not Ready"
  | "Building"
  | "Almost Ready"
  | "Ready";

export interface RuleResultDebrief {
  ruleCode: ApprovedRuleCode;
  passed: boolean;
  message: string;
}

export interface RubricScores {
  correctOutput: number;
  sqlLogic: number;
  edgeCase: number;
  readability: number;
  explanationQuality: null;
}

// 3 possible states for evaluation
export type EvaluationStatus = "completed" | "not_required" | "failed";

// The 5 scoring dimensions (total = 100)
export interface ExplanationEvaluationScores {
  conceptualAccuracy: number; // max 30
  depth: number; // max 25
  exampleQuality: number; // max 20
  edgeCaseAwareness: number; // max 15
  communicationClarity: number; // max 10
}

// Metadata about the evaluator itself (helps future Qwen swap)
export interface EvaluatorMetadata {
  domain: string;
  questionType: string;
  evaluatorType: string;
  promptVersion: string;
  rubricVersion: string;
}

// The full evaluator result returned by the evaluator service
export interface ExplanationEvaluation {
  evaluationStatus: EvaluationStatus;
  readiness?: ReadinessLabel;
  scores?: ExplanationEvaluationScores;
  strengths?: string[];
  missingPoints?: string[];
  nextStep?: string;
  evaluatorMetadata: EvaluatorMetadata;
}

// Input shape for the evaluator function
export interface EvaluateSqlFollowupInput {
  questionId: string;
  attemptId: string;
  followupQuestion: string;
  answer: string;
}

// Combined debrief returned after a final SQL submission.
export interface CombinedDebriefResponse {
  attemptId: string;
  sessionQuestionId: string;
  question_attempt?: QuestionAttempt;
  feedback?: EvaluateResponse["feedback"];
}

export interface DebriefResponse {
  success: boolean;
  attemptId: string;
  sessionQuestionId: string;
  isCorrect: boolean;
  score: number;
  readiness: ReadinessLabel;
  feedbackSummary: string;
  strengths: string[];
  mistakes: string[];
  nextStep: string;
  rubricScores: RubricScores;
  ruleResults: RuleResultDebrief[];
}

export interface ComparisonResult {
  isCorrect: boolean;
  matchedExpectedOutput: boolean;
  detectedRules: Array<{ ruleCode: ApprovedRuleCode; passed: boolean }>;
}

export interface FeedbackInput {
  isCorrect: boolean;
  ruleIssues: Array<{
    triggered: boolean;
    issue: string;
    category: string;
    explanation: string;
  }>;
}


export interface RelevantTableLink {
  schemaTable: {
    id: string;
    tableName: string;
    columns: Array<{
      id: string;
      columnName: string;
      dataType: string;
      isPk: boolean;
      isFk: boolean;
      fkReference: string | null;
      isNullable: boolean;
    }>;
  };
};


export interface StartInterviewInput {
  mode?: string;
  readinessCheckPassed?: boolean;
  questions: Array<{
    problemId: string;
    timerEnabled?: boolean;
    timeLimitSeconds?: number;
  }>;
}
