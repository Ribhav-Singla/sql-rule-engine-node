import { z } from "zod";

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8000),
  DATABASE_URL: z
    .url()
    .default("postgresql://postgres:postgres@localhost:5432/sqlruleengine"),
  // Least-privilege, read-only connection used to run untrusted SQL. Optional so
  // existing setups keep working, but strongly recommended in production. When
  // absent, the executor falls back to DATABASE_URL and logs a warning.
  SANDBOX_DATABASE_URL: z.url().optional(),
  REDIS_URL: z.url().default("redis://localhost:6379"),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive(),
  // Sandbox execution guardrails (all applied per-query inside a read-only tx).
  SQL_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  SQL_LOCK_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
  SQL_IDLE_IN_TX_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  SQL_MAX_ROWS: z.coerce.number().int().positive().default(10000),
  // Max number of times a user may run (evaluate) the same problem.
  MAX_RUNS_PER_QUESTION: z.coerce.number().int().positive().default(3),
  // Auth / JWT
  NODE_ENV: z.enum(["development", "qa", "production"]).default("development"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  ACCESS_TOKEN_TTL: z
    .string()
    .regex(/^\d+[smhdw]$/)
    .default("15m"),
  REFRESH_TOKEN_TTL: z
    .string()
    .regex(/^\d+[smhdw]$/)
    .default("7d"),
  REFRESH_COOKIE_NAME: z.string().min(1).default("refreshToken"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(31).default(12),
});

export const registerSchema = z.object({
  email: z.email("A valid email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

export const loginSchema = z.object({
  email: z.email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

// ============================================
// Validation Result Type
// ============================================
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const validateSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): ValidationResult<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessages = result.error.issues
      .map((err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`)
      .join(", ");
    return { success: false, error: errorMessages };
  }
  return { success: true, data: result.data };
};

// ============================================
// API Validation Schemas
// ============================================

// Schema names validation
const schemaNameSchema = z.enum(["ecommerce"], {
  error:
    "schema_name must be one of: ecommerce, banking, social, inventory, analytics",
});

// Normalize endpoint schema
export const normalizeSchema = z.object({
  sql: z
    .string()
    .min(1, "SQL query is required")
    .max(5000, "SQL query cannot exceed 5000 characters"),
});

// Fingerprint endpoint schema
export const fingerprintSchema = z.object({
  sql: z
    .string()
    .min(1, "SQL query is required")
    .max(5000, "SQL query cannot exceed 5000 characters"),
  schema_name: schemaNameSchema,
  problem_id: z.string().optional(),
});

// Rules endpoint schema
export const rulesSchema = z.object({
  sql: z
    .string()
    .min(1, "SQL query is required")
    .max(5000, "SQL query cannot exceed 5000 characters"),
});

// Evaluate endpoint schema
export const evaluateSchema = z.object({
  sql: z
    .string()
    .min(1, "SQL query is required")
    .max(5000, "SQL query cannot exceed 5000 characters"),
  schema_name: schemaNameSchema,
  problem_id: z
    .string()
    .min(1, "Problem ID is required")
    .max(100, "Problem ID cannot exceed 100 characters"),
});

// Problem ID param schema
export const problemIdParamSchema = z.object({
  problemId: z
    .string()
    .min(1, "Problem ID is required")
    .max(100, "Problem ID cannot exceed 100 characters"),
});

// Final Submit body schema
export const finalSubmitSchema = z.object({
  finalQuery: z
    .string()
    .min(1, "Final SQL query is required")
    .max(5000, "SQL query cannot exceed 5000 characters"),
  explanationText: z
    .string()
    .max(2000, "Explanation cannot exceed 2000 characters")
    .optional()
    .default(""),
  edgeCaseText: z
    .string()
    .max(2000, "Edge case text cannot exceed 2000 characters")
    .optional()
    .default(""),
});

// Standalone Followup Evaluation body schema (Assignment 2)
export const evaluateFollowupSchema = z.object({
  questionId: z.string().min(1, "Question ID is required").max(100),
  followupQuestion: z
    .string()
    .min(1, "Followup question is required")
    .max(2000),
  answer: z
    .string()
    .max(2000, "Answer cannot exceed 2000 characters")
    .default(""),
});

// Session Question ID param schema
export const sessionQuestionIdParamSchema = z.object({
  sessionQuestionId: z
    .string()
    .min(1, "Session Question ID is required")
    .max(100),
});

export type NormalizeInput = z.infer<typeof normalizeSchema>;
export type FingerprintInput = z.infer<typeof fingerprintSchema>;
export type RulesInput = z.infer<typeof rulesSchema>;
export type EvaluateInput = z.infer<typeof evaluateSchema>;
export type ProblemIdParamInput = z.infer<typeof problemIdParamSchema>;
export type FinalSubmitInput = z.infer<typeof finalSubmitSchema>;
export type SessionQuestionIdParamInput = z.infer<
  typeof sessionQuestionIdParamSchema
>;
export type EvaluateFollowupInput = z.infer<typeof evaluateFollowupSchema>;
