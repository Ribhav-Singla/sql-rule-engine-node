import { Router } from "express";
import { asyncHandler } from "../middlewares/async_handler.js";
import { getAllProblems, getProblemByIdController } from "../controllers/problems.js";

// Public problem browsing — no authentication required.
export const problemsRouter = Router();

problemsRouter.get("/", asyncHandler(getAllProblems));
problemsRouter.get("/:problemId", asyncHandler(getProblemByIdController));

export default problemsRouter;
