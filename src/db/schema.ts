import { index, pgTable, text, uniqueIndex, jsonb, boolean, integer, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";

// ============================================================
// Auth: users
// ============================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("user"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refreshToken: text("refresh_token").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("auth_sessions_refresh_token_idx").on(table.refreshToken)],
);

// ============================================================
// Problems
// ============================================================

export const problems = pgTable(
  "problems",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    questionText: text("question_text").notNull(),
    difficulty: text("difficulty").notNull(),
    isFree: boolean("is_free").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_problems_difficulty").on(table.difficulty)],
);

// ============================================================
// Problem Solutions
// ============================================================

export const problemSolutions = pgTable(
  "problem_solutions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    referenceSolutionQuery: text("reference_solution_query").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_problem_solutions_problem_id").on(table.problemId)],
);

// ============================================================
// Expected Results
// ============================================================

export const expectedResults = pgTable(
  "expected_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    solutionId: uuid("solution_id"),
    rows: jsonb("rows"),
    rowsHash: text("rows_hash").notNull(),
    ruleVersionSnapshot: integer("rule_version_snapshot"),
    isActive: boolean("is_active").notNull().default(true),
    generatedAt: timestamp("generated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_expected_results_problem_id").on(table.problemId),
    index("idx_expected_results_is_active").on(table.isActive),
  ],
);

// ============================================================
// Interview Sessions
// ============================================================

export const interviewSessions = pgTable(
  "interview_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mode: text("mode").notNull().default("interview"),
    status: text("status").notNull().default("active"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    endedAt: timestamp("ended_at"),
    readinessCheckPassed: boolean("readiness_check_passed").notNull().default(false),
  },
  (table) => [
    index("idx_interview_sessions_user_id").on(table.userId),
    index("idx_interview_sessions_status").on(table.status),
  ],
);

// ============================================================
// Session Questions
// ============================================================

export const sessionQuestions = pgTable(
  "session_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => interviewSessions.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(),
    timerEnabled: boolean("timer_enabled").notNull().default(false),
    timeLimitSeconds: integer("time_limit_seconds"),
    status: text("status").notNull().default("pending"),
    startedAt: timestamp("started_at"),
    deadlineAt: timestamp("deadline_at"),
    usedAt: timestamp("used_at"),
  },
  (table) => [
    index("idx_session_questions_session_id").on(table.sessionId),
    index("idx_session_questions_problem_id").on(table.problemId),
  ],
);

// ============================================================
// Attempts
// ============================================================

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionQuestionId: uuid("session_question_id")
      .notNull()
      .references(() => sessionQuestions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    finalQuery: text("final_query"),
    status: text("status").notNull().default("pending"),
    score: integer("score"),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_attempts_session_question_id").on(table.sessionQuestionId),
    index("idx_attempts_user_id").on(table.userId),
  ],
);

// ============================================================
// Attempt Runs
// ============================================================

export const attemptRuns = pgTable(
  "attempt_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id").references(() => attempts.id, { onDelete: "cascade" }),
    sessionQuestionId: uuid("session_question_id")
      .notNull()
      .references(() => sessionQuestions.id, { onDelete: "cascade" }),
    queryText: text("query_text").notNull(),
    queryHash: text("query_hash").notNull(),
    output: jsonb("output"),
    errorText: text("error_text"),
    runtimeMs: integer("runtime_ms"),
    ruleVersionUsed: integer("rule_version_used"),
    ranAt: timestamp("ran_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_attempt_runs_attempt_id").on(table.attemptId),
    index("idx_attempt_runs_session_question_id").on(table.sessionQuestionId),
    index("idx_attempt_runs_query_hash").on(table.queryHash),
  ],
);
