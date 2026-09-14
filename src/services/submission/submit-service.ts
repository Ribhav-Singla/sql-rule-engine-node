import { getMockedComparisonResult } from "./mock-comparison.js";
import { generateSqlFeedback } from "../feedback/feedback-generator.js";
import type { CombinedDebriefResponse } from "../../types/api.js";
import { db } from "../../db/index.js";
import { attemptRuns, attempts, interviewSessions, sessionQuestions } from "../../db/schema.js";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { evaluateSqlFollowup } from "../evaluator/sql-followup-evaluator.js";
import { normalizeSql } from "../normalization/query-normalizer.js";
import { generateSha256Hash } from "../utils/fingerprint.js";

export async function submitSessionQuestion(
  sessionQuestionId: string,
  userId: string,
  finalQuery: string,
  explanationText: string,
  edgeCaseText: string
): Promise<{ success: boolean; data?: CombinedDebriefResponse; error?: string; errorCode?: string; statusCode?: number }> {
  
  const [sessionRecord] = await db
    .select({ question: sessionQuestions, sessionUserId: interviewSessions.userId })
    .from(sessionQuestions)
    .innerJoin(interviewSessions, eq(interviewSessions.id, sessionQuestions.sessionId))
    .where(
      and(
        eq(sessionQuestions.id, sessionQuestionId),
        eq(interviewSessions.userId, userId),
        eq(sessionQuestions.status, "active"),
      ),
    )
    .limit(1);

  if (!sessionRecord) {
    return {
      success: false,
      error: "Interview question not found.",
      errorCode: "QUESTION_NOT_FOUND",
      statusCode: 404,
    };
  }

  const question = sessionRecord.question;
  if (question.status === "timed_out" || (question.deadlineAt && question.deadlineAt <= new Date())) {
    if (question.status !== "timed_out") {
      await db.update(sessionQuestions).set({ status: "timed_out" }).where(eq(sessionQuestions.id, sessionQuestionId));
    }
    return {
      success: false,
      error: "The time limit for this question has expired.",
      errorCode: "QUESTION_TIMED_OUT",
      statusCode: 409,
    };
  }

  // 3. Check if already submitted
  const existingAttempt = await db.query.attempts.findFirst({
    where: eq(attempts.sessionQuestionId, sessionQuestionId)
  });

  if (existingAttempt) {
    return {
      success: false,
      error: "Final submission already completed for this question.",
      errorCode: "SUBMIT_LIMIT_REACHED",
      statusCode: 409
    };
  }

  try {
    // 4. Get comparison result (mocked for now, replaceable later)
    const comparisonResult = getMockedComparisonResult(finalQuery);

    // 5. Generate Feedback
    const feedbackData = generateSqlFeedback({
      finalQuery,
      comparisonResult,
      ruleSignals: comparisonResult.detectedRules,
      explanationText,
      edgeCaseText
    });

    // 6. Save to DB using Drizzle
    const attemptId = randomUUID();
    const normalizedFinalQuery = normalizeSql(finalQuery).normalized_sql ?? finalQuery;
    await db.transaction(async (tx) => {
      await tx.insert(attempts).values({
        id: attemptId,
        sessionQuestionId,
        userId,
        finalQuery,
        status: "completed",
        score: feedbackData.score,
      });

      await tx.insert(attemptRuns).values({
        attemptId,
        sessionQuestionId,
        queryText: normalizedFinalQuery,
        queryHash: generateSha256Hash(normalizedFinalQuery),
        output: feedbackData,
        errorText: null,
        runtimeMs: 0,
      });
    });

    await db
      .update(sessionQuestions)
      .set({ status: "completed", usedAt: new Date() })
      .where(eq(sessionQuestions.id, sessionQuestionId));

    const explanationEvaluation = await evaluateSqlFollowup({
      questionId: question.problemId,
      attemptId: attemptId,
      followupQuestion: "Please explain your SQL query and logic.",
      answer: explanationText
    });

    // 8. Return frontend-ready Combined Debrief JSON
    const debrief: CombinedDebriefResponse = {
      success: true,
      attemptId: attemptId,
      sessionQuestionId,
      ...feedbackData,
      explanationEvaluation,
      overallNextStep: explanationEvaluation.nextStep || feedbackData.nextStep
    };

    return { success: true, data: debrief };

  } catch (error) {
    console.error("Feedback generation/DB save failed:", error);
    return {
      success: false,
      error: "Failed to generate feedback for submission.",
      errorCode: "FEEDBACK_FAILED",
      statusCode: 500
    };
  }
}
