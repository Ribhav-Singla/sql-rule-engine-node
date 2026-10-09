import type { Request, Response } from "express";
import { getProblemById, getProblems } from "../services/problems/problems.js";
import { ApiError, ApiSuccess } from "../utils/api_response.js";
import { problemIdParamSchema } from "./../zod/index.js";

export const getAllProblems = async (_req: Request, res: Response): Promise<void> => {
  const problems = await getProblems();
  ApiSuccess(res, "Problems fetched successfully", 200, problems);
};

export const getProblemByIdController = async (req: Request, res: Response): Promise<void> => {
  const validation = problemIdParamSchema.safeParse(req.params);

  if (!validation.success) {
    ApiError(res, validation.error.message, 400);
    return;
  }

  const { problemId } = validation.data;
  const problem = await getProblemById(problemId);

  if (!problem) {
    ApiError(res, `Problem '${problemId}' not found`, 404);
    return;
  }

  ApiSuccess(res, "Problem fetched successfully", 200, problem);
};
