import { Router } from "express";
import { asyncHandler } from "../middlewares/async_handler.js";
import { validate } from "../middlewares/zod.js";
import { authMiddleware } from "../middlewares/auth.js";
import { registerSchema, loginSchema } from "../zod/index.js";
import {
  handleRegister,
  handleLogin,
  handleRefresh,
  handleLogout,
  getMe,
} from "../controllers/auth.controller.js";

export const authRouter = Router();

// Public — no access token required (login/register/refresh/logout).
authRouter.post("/register", validate(registerSchema), asyncHandler(handleRegister));
authRouter.post("/login", validate(loginSchema), asyncHandler(handleLogin));
authRouter.post("/refresh", asyncHandler(handleRefresh));
authRouter.post("/logout", asyncHandler(handleLogout));

// Protected — requires a valid access token.
authRouter.get("/me", authMiddleware, asyncHandler(getMe));

export default authRouter;
