import { db } from "../../db/index.js";
import { AppError } from "../../utils/app_error.js";

export interface StartInterviewInput {
  mode?: string;
  readinessCheckPassed?: boolean;
  questions: Array<{
    problemId: string;
    timerEnabled?: boolean;
    timeLimitSeconds?: number;
  }>;
}

type TransactionClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

async function activateNextQuestion(tx: TransactionClient, sessionId: string) {
  const next = await tx.sessionQuestion.findFirst({
    where: { sessionId, status: "pending" },
    orderBy: { orderIndex: "asc" },
  });

  if (!next) {
    await tx.interviewSession.update({
      where: { id: sessionId },
      data: { status: "completed", endedAt: new Date() },
    });
    return null;
  }

  const startedAt = new Date();
  const selected = await tx.sessionQuestion.findUnique({
    where: { id: next.id },
    include: { problem: true },
  });
  const deadlineAt = selected?.timerEnabled && selected.timeLimitSeconds
    ? new Date(startedAt.getTime() + selected.timeLimitSeconds * 1000)
    : null;

  await tx.sessionQuestion.update({
    where: { id: next.id },
    data: { status: "active", startedAt, deadlineAt },
  });

  if (!selected) return null;
  return {
    id: selected.id,
    sessionId: selected.sessionId,
    problemId: selected.problemId,
    title: selected.problem.title,
    questionText: selected.problem.questionText,
    difficulty: selected.problem.difficulty,
    orderIndex: selected.orderIndex,
    timerEnabled: selected.timerEnabled,
    timeLimitSeconds: selected.timeLimitSeconds,
    status: "active",
    startedAt,
    deadlineAt,
  };
}

export async function startInterview(userId: string, input: StartInterviewInput) {
  if (input.questions.length === 0) {
    throw new AppError("At least one interview question is required", 400, "QUESTIONS_REQUIRED");
  }

  return db.$transaction(async (tx) => {
    const session = await tx.interviewSession.create({
      data: {
        userId,
        mode: input.mode ?? "interview",
        readinessCheckPassed: input.readinessCheckPassed ?? false,
        questions: {
          create: input.questions.map((question, orderIndex) => ({
            problemId: question.problemId,
            orderIndex,
            timerEnabled: question.timerEnabled ?? false,
            timeLimitSeconds: question.timerEnabled ? question.timeLimitSeconds ?? null : null,
          })),
        },
      },
    });

    const currentQuestion = await activateNextQuestion(tx, session.id);
    return { session, currentQuestion };
  });
}

export async function getCurrentQuestion(sessionId: string, userId: string) {
  return db.$transaction(async (tx) => {
    const session = await tx.interviewSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new AppError("Interview session not found", 404, "SESSION_NOT_FOUND");

    const active = await tx.sessionQuestion.findFirst({
      where: { sessionId, status: "active" },
      include: { problem: true },
    });

    if (active?.deadlineAt && active.deadlineAt <= new Date()) {
      await tx.sessionQuestion.update({ where: { id: active.id }, data: { status: "timed_out" } });
      return { session, currentQuestion: null, timedOutQuestionId: active.id };
    }

    if (!active) return { session, currentQuestion: await activateNextQuestion(tx, sessionId) };
    return { session, currentQuestion: {
      id: active.id,
      sessionId: active.sessionId,
      problemId: active.problemId,
      title: active.problem.title,
      questionText: active.problem.questionText,
      difficulty: active.problem.difficulty,
      orderIndex: active.orderIndex,
      timerEnabled: active.timerEnabled,
      timeLimitSeconds: active.timeLimitSeconds,
      status: active.status,
      startedAt: active.startedAt,
      deadlineAt: active.deadlineAt,
    } };
  });
}

export async function advanceInterview(sessionId: string, userId: string) {
  return db.$transaction(async (tx) => {
    const session = await tx.interviewSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new AppError("Interview session not found", 404, "SESSION_NOT_FOUND");

    await tx.sessionQuestion.updateMany({
      where: { sessionId, status: "active" },
      data: { status: "completed", usedAt: new Date() },
    });

    const currentQuestion = await activateNextQuestion(tx, sessionId);
    return { sessionId, currentQuestion };
  });
}
