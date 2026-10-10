import { Prisma } from "@prisma/client";
import type {
  CombinedDebriefResponse,
  EvaluateResponse,
} from "../../types/index.js";
import { db } from "../../db/index.js";
import { evaluateQuery } from "../evaluation/evaluation.js";
import { normalizeSql } from "../normalization/query-normalizer.js";
import { generateSha256Hash } from "../fingerprint/fingerprint.js";
import { type SchemaName } from "../../types/index.js";

export async function submitSessionQuestion(
  sessionQuestionId: string,
  userId: string,
  finalQuery: string,
  explanationText: string,
  edgeCaseText: string,
): Promise<{
  success: boolean;
  data?: CombinedDebriefResponse;
  error?: string;
  errorCode?: string;
  statusCode?: number;
}> {
  const sessionRecord = await db.sessionQuestion.findFirst({
    where: { id: sessionQuestionId, status: "active", session: { userId } },
    select: {
      status: true,
      deadlineAt: true,
      problem: {
        select: {
          id: true,
          schema: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!sessionRecord) {
    return {
      success: false,
      error: "Interview question not found.",
      errorCode: "QUESTION_NOT_FOUND",
      statusCode: 404,
    };
  }
  const question = sessionRecord;
  if (
    question.status === "timed_out" ||
    (question.deadlineAt && question.deadlineAt <= new Date())
  ) {
    if (question.status !== "timed_out") {
      await db.sessionQuestion.update({
        where: { id: sessionQuestionId },
        data: { status: "timed_out" },
      });
    }
    return {
      success: false,
      error: "The time limit for this question has expired.",
      errorCode: "QUESTION_TIMED_OUT",
      statusCode: 409,
    };
  }

  // 3. Check if already submitted
  const existingAttempt = await db.attempt.findFirst({
    where: { sessionQuestionId },
  });

  if (existingAttempt?.status === "completed") {
    return {
      success: false,
      error: "Final submission already completed for this question.",
      errorCode: "SUBMIT_LIMIT_REACHED",
      statusCode: 409,
    };
  }
  try {
    const evaluationResult: EvaluateResponse = await evaluateQuery(
      finalQuery,
      question.problem.schema.name as SchemaName,
      question.problem.id,
    );
    if (evaluationResult.error) {
      return {
        success: false,
        error: evaluationResult.error,
        errorCode: "QUERY_EVALUATION_FAILED",
        statusCode: 400,
      };
    }
    const questionAttempt = evaluationResult.question_attempt;

    // 6. Save to DB
    const normalizedFinalQuery =
      questionAttempt?.normalized_sql ??
      normalizeSql(finalQuery).normalized_sql ??
      finalQuery;
    const submittedAttemptId = await db.$transaction(async (tx) => {
      let attempt = await tx.attempt.findFirst({
        where: { sessionQuestionId },
        select: { id: true, status: true },
      });
      if (attempt?.status === "completed") {
        throw new Prisma.PrismaClientKnownRequestError(
          "Final submission already completed for this question.",
          { code: "P2002", clientVersion: Prisma.prismaVersion.client },
        );
      }

      if (!attempt) {
        attempt = await tx.attempt.create({
          data: {
            sessionQuestionId,
            userId,
            status: "pending",
          },
          select: { id: true, status: true },
        });
      }

      await tx.attempt.update({
        where: { id: attempt.id },
        data: {
          finalQuery,
          status: "completed",
          score: evaluationResult.feedback?.score ?? 0,
        },
      });

      await tx.attemptRun.create({
        data: {
          attemptId: attempt.id,
          sessionQuestionId,
          queryText: normalizedFinalQuery,
          queryHash: generateSha256Hash(normalizedFinalQuery),
          output: (questionAttempt?.preview_rows ??
            []) as Prisma.InputJsonValue,
          errorText: null,
          runtimeMs: 0,
        },
      });

      return attempt.id;
    });

    await db.sessionQuestion.update({
      where: { id: sessionQuestionId },
      data: { status: "completed", usedAt: new Date() },
    });

    // 8. Return frontend-ready Combined Debrief JSON
    const debrief: CombinedDebriefResponse = {
      attemptId: submittedAttemptId,
      sessionQuestionId,
      question_attempt: questionAttempt,
      feedback: evaluationResult.feedback,
    };

    return { success: true, data: debrief };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Final submission already completed for this question.",
        errorCode: "SUBMIT_LIMIT_REACHED",
        statusCode: 409,
      };
    }

    console.error("Feedback generation/DB save failed:", error);
    return {
      success: false,
      error: "Failed to generate feedback for submission.",
      errorCode: "FEEDBACK_FAILED",
      statusCode: 500,
    };
  }
}

export async function evaluateBeforeSubmit(
  sessionQuestionId: string,
  userId: string,
  sql: string,
): Promise<{
  success: boolean;
  data?: {
    question_attempt: EvaluateResponse["question_attempt"];
    max_runs: number;
  };
  error?: string;
  errorCode?: string;
  statusCode?: number;
}> {
  const sessionRecord = await db.sessionQuestion.findFirst({
    where: { id: sessionQuestionId, status: "active", session: { userId } },
    select: {
      deadlineAt: true,
      maxRuns: true,
      problem: {
        select: {
          id: true,
          schema: { select: { name: true } },
        },
      },
    },
  });

  if (!sessionRecord) {
    return {
      success: false,
      error: "Interview question not found.",
      errorCode: "QUESTION_NOT_FOUND",
      statusCode: 404,
    };
  }

  if (sessionRecord.deadlineAt && sessionRecord.deadlineAt <= new Date()) {
    await db.sessionQuestion.update({
      where: { id: sessionQuestionId },
      data: { status: "timed_out" },
    });
    return {
      success: false,
      error: "The time limit for this question has expired.",
      errorCode: "QUESTION_TIMED_OUT",
      statusCode: 409,
    };
  }

  const runCount = await db.attemptRun.count({
    where: { sessionQuestionId },
  });
  if (runCount >= sessionRecord.maxRuns) {
    return {
      success: false,
      error:
        "Maximum query runs exhausted. Use the final submit endpoint to submit your answer.",
      errorCode: "MAX_RUNS_EXHAUSTED",
      statusCode: 409,
    };
  }

  const evaluationResult = await evaluateQuery(
    sql,
    sessionRecord.problem.schema.name as SchemaName,
    sessionRecord.problem.id,
  );
  if (evaluationResult.error || !evaluationResult.question_attempt) {
    return {
      success: false,
      error: evaluationResult.error ?? "Query evaluation failed.",
      errorCode: "QUERY_EVALUATION_FAILED",
      statusCode: 400,
    };
  }
  const questionAttempt = evaluationResult.question_attempt;

  const normalizedSql =
    questionAttempt.normalized_sql ?? normalizeSql(sql).normalized_sql ?? sql;

  await db.$transaction(async (tx) => {
    const existing = await tx.attempt.findFirst({
      where: { sessionQuestionId },
      select: { id: true, status: true },
    });
    const attempt =
      existing ??
      (await tx.attempt.create({
        data: { sessionQuestionId, userId, status: "pending" },
        select: { id: true, status: true },
      }));

    if (attempt.status === "completed") {
      throw new Prisma.PrismaClientKnownRequestError(
        "Final submission already completed for this question.",
        { code: "P2002", clientVersion: Prisma.prismaVersion.client },
      );
    }

    await tx.attemptRun.create({
      data: {
        attemptId: attempt.id,
        sessionQuestionId,
        queryText: normalizedSql,
        queryHash: generateSha256Hash(normalizedSql),
        output: (questionAttempt.preview_rows ?? []) as Prisma.InputJsonValue,
        errorText: null,
        runtimeMs: 0,
      },
    });
  });

  return {
    success: true,
    data: {
      question_attempt: questionAttempt,
      max_runs: sessionRecord.maxRuns,
    },
  };
}
