import { Router } from "express";
import {
  normalize,
  generateFingerprintController,
  runRulesController,
  evaluateQueryController,
  finalSubmitController,
  evaluateFollowupController,
} from "../controllers/api.controller.js";
import { interviewRouter } from "../controllers/interview.controller.js";

// Protected rule-engine routes. Problem browsing lives in the public
// problemsRouter; everything here runs behind authMiddleware (see index.ts).
export const apiRouter = Router();

// SQL normalization
apiRouter.post("/normalize", normalize);

// Fingerprint generation
apiRouter.post("/fingerprint", generateFingerprintController);

// Rules execution
apiRouter.post("/rules", runRulesController);

// Query evaluation
apiRouter.post("/evaluate", evaluateQueryController);

// Final Submit
apiRouter.post("/sql/session-questions/:sessionQuestionId/submit", finalSubmitController);

// Standalone Followup Evaluation
apiRouter.post("/sql/attempts/:attemptId/evaluate-followup", evaluateFollowupController);

// Interview Sessions
apiRouter.use("/sql/interview-sessions", interviewRouter);
