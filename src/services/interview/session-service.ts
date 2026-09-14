import { and, asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { interviewSessions, problems, sessionQuestions } from "../../db/schema.js";
import { AppError } from "../../utils/app-error.utils.js";

export interface StartInterviewInput {
  mode?: string;
  readinessCheckPassed?: boolean;
  questions: Array<{
    problemId: string;
    timerEnabled?: boolean;
    timeLimitSeconds?: number;
  }>;
}

const questionSelection = {
  id: sessionQuestions.id,
  sessionId: sessionQuestions.sessionId,
  problemId: problems.id,
  title: problems.title,
  questionText: problems.questionText,
  difficulty: problems.difficulty,
  orderIndex: sessionQuestions.orderIndex,
  timerEnabled: sessionQuestions.timerEnabled,
  timeLimitSeconds: sessionQuestions.timeLimitSeconds,
  status: sessionQuestions.status,
  startedAt: sessionQuestions.startedAt,
  deadlineAt: sessionQuestions.deadlineAt,
};

async function activateNextQuestion(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], sessionId: string) {
  const [next] = await tx
    .select({ id: sessionQuestions.id })
    .from(sessionQuestions)
    .where(and(eq(sessionQuestions.sessionId, sessionId), eq(sessionQuestions.status, "pending")))
    .orderBy(asc(sessionQuestions.orderIndex))
    .limit(1);

  if (!next) {
    await tx
      .update(interviewSessions)
      .set({ status: "completed", endedAt: new Date() })
      .where(eq(interviewSessions.id, sessionId));
    return null;
  }

  const startedAt = new Date();
  const [selected] = await tx
    .select(questionSelection)
    .from(sessionQuestions)
    .innerJoin(problems, eq(problems.id, sessionQuestions.problemId))
    .where(eq(sessionQuestions.id, next.id))
    .limit(1);
  const deadlineAt = selected?.timerEnabled && selected.timeLimitSeconds
    ? new Date(startedAt.getTime() + selected.timeLimitSeconds * 1000)
    : null;

  await tx
    .update(sessionQuestions)
    .set({ status: "active", startedAt, deadlineAt })
    .where(eq(sessionQuestions.id, next.id));

  return { ...selected, status: "active", startedAt, deadlineAt };
}

export async function startInterview(userId: string, input: StartInterviewInput) {
  if (input.questions.length === 0) {
    throw new AppError("At least one interview question is required", 400, "QUESTIONS_REQUIRED");
  }

  return db.transaction(async (tx) => {
    const [session] = await tx
      .insert(interviewSessions)
      .values({
        userId,
        mode: input.mode ?? "interview",
        readinessCheckPassed: input.readinessCheckPassed ?? false,
      })
      .returning();

    await tx.insert(sessionQuestions).values(
      input.questions.map((question, orderIndex) => ({
        sessionId: session.id,
        problemId: question.problemId,
        orderIndex,
        timerEnabled: question.timerEnabled ?? false,
        timeLimitSeconds: question.timerEnabled ? question.timeLimitSeconds ?? null : null,
      })),
    );

    const currentQuestion = await activateNextQuestion(tx, session.id);
    return { session, currentQuestion };
  });
}

export async function getCurrentQuestion(sessionId: string, userId: string) {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(interviewSessions)
      .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, userId)))
      .limit(1);

    if (!session) throw new AppError("Interview session not found", 404, "SESSION_NOT_FOUND");

    const [active] = await tx
      .select(questionSelection)
      .from(sessionQuestions)
      .innerJoin(problems, eq(problems.id, sessionQuestions.problemId))
      .where(and(eq(sessionQuestions.sessionId, sessionId), eq(sessionQuestions.status, "active")))
      .limit(1);

    if (active?.deadlineAt && active.deadlineAt <= new Date()) {
      await tx
        .update(sessionQuestions)
        .set({ status: "timed_out" })
        .where(eq(sessionQuestions.id, active.id));
      return { session, currentQuestion: null, timedOutQuestionId: active.id };
    }

    return { session, currentQuestion: active ?? (await activateNextQuestion(tx, sessionId)) };
  });
}

export async function advanceInterview(sessionId: string, userId: string) {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(interviewSessions)
      .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, userId)))
      .limit(1);

    if (!session) throw new AppError("Interview session not found", 404, "SESSION_NOT_FOUND");

    await tx
      .update(sessionQuestions)
      .set({ status: "completed", usedAt: new Date() })
      .where(and(eq(sessionQuestions.sessionId, sessionId), eq(sessionQuestions.status, "active")));

    const currentQuestion = await activateNextQuestion(tx, sessionId);
    return { sessionId, currentQuestion };
  });
}