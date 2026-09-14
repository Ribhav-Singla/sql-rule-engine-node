import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { ApiError, ApiSuccess } from "../utils/api-response.utils.js";
import { advanceInterview, getCurrentQuestion, startInterview } from "../services/interview/session-service.js";
import { AppError } from "../utils/app-error.utils.js";

export const interviewRouter = Router();

const startSchema = z.object({
  mode: z.string().min(1).max(50).optional(),
  readinessCheckPassed: z.boolean().optional(),
  questions: z.array(z.object({
    problemId: z.string().uuid(),
    timerEnabled: z.boolean().optional(),
    timeLimitSeconds: z.number().int().positive().max(86400).optional(),
  }).refine((question) => !question.timerEnabled || question.timeLimitSeconds !== undefined, {
    message: "timeLimitSeconds is required when timerEnabled is true",
  })).min(1),
});

function userIdFrom(req: AuthenticatedRequest): string {
  if (!req.user?.userId) throw new Error("Unauthenticated");
  return req.user.userId;
}

interviewRouter.post("/start/:userId", async (req, res) => {
  try {
    const userId = userIdFrom(req as AuthenticatedRequest);
    if (req.params.userId !== userId) {
      ApiError(res, "You cannot start an interview for another user", 403, undefined, "FORBIDDEN");
      return;
    }

    const input = startSchema.safeParse(req.body);
    if (!input.success) {
      ApiError(res, input.error.issues[0]?.message ?? "Invalid interview request", 400);
      return;
    }

    const result = await startInterview(userId, input.data);
    ApiSuccess(res, "Interview started successfully", 201, result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthenticated") {
      ApiError(res, "User is not authenticated", 401, undefined, "UNAUTHENTICATED");
      return;
    }
    if (error instanceof AppError) {
      ApiError(res, error.message, error.statusCode, error.details, error.errorCode);
      return;
    }
    ApiError(res, error instanceof Error ? error.message : "Failed to start interview", 500);
  }
});

interviewRouter.get("/:sessionId/current", async (req, res) => {
  try {
    const result = await getCurrentQuestion(req.params.sessionId, userIdFrom(req as AuthenticatedRequest));
    ApiSuccess(res, "Current interview question fetched successfully", 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      ApiError(res, error.message, error.statusCode, error.details, error.errorCode);
      return;
    }
    ApiError(res, error instanceof Error ? error.message : "Failed to fetch current question", 500);
  }
});

interviewRouter.post("/:sessionId/next", async (req, res) => {
  try {
    const result = await advanceInterview(req.params.sessionId, userIdFrom(req as AuthenticatedRequest));
    ApiSuccess(res, "Interview advanced successfully", 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      ApiError(res, error.message, error.statusCode, error.details, error.errorCode);
      return;
    }
    ApiError(res, error instanceof Error ? error.message : "Failed to advance interview", 500);
  }
});