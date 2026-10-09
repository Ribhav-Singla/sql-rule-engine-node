import type { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  rotateSession,
  logoutSession,
  getUserById,
} from "../services/auth/auth.js";
import { ApiSuccess } from "../utils/api_response.js";
import { AppError } from "../utils/app_error.js";
import { settings } from "../config/settings.js";
import type { AuthenticatedRequest } from "../middlewares/auth.js";

export const handleRegister = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  const result = await registerUser(email, password);

  res.cookie(settings.REFRESH_COOKIE_NAME, result.refreshToken, {
    ...settings.REFRESH_COOKIE_OPTIONS,
    maxAge: settings.REFRESH_COOKIE_MAX_AGE_MS,
  });

  ApiSuccess(res, "Registration successful", 201, {
    accessToken: result.accessToken,
    user: result.user,
  });
};

export const handleLogin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  const result = await loginUser(email, password);

  res.cookie(settings.REFRESH_COOKIE_NAME, result.refreshToken, {
    ...settings.REFRESH_COOKIE_OPTIONS,
    maxAge: settings.REFRESH_COOKIE_MAX_AGE_MS,
  });

  ApiSuccess(res, "Login successful", 200, {
    accessToken: result.accessToken,
    user: result.user,
  });
};

export const handleRefresh = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken as string | undefined;

  if (!refreshToken) {
    throw new AppError("Unauthorized", 401, "UNAUTHENTICATED");
  }

  const result = await rotateSession(refreshToken);

  res.cookie(settings.REFRESH_COOKIE_NAME, result.refreshToken, {
    ...settings.REFRESH_COOKIE_OPTIONS,
    maxAge: settings.REFRESH_COOKIE_MAX_AGE_MS,
  });

  ApiSuccess(res, "Token refreshed", 200, { accessToken: result.accessToken });
};

export const handleLogout = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken as string | undefined;

  if (refreshToken) {
    await logoutSession(refreshToken);
  }

  res.clearCookie(
    settings.REFRESH_COOKIE_NAME,
    settings.REFRESH_COOKIE_OPTIONS,
  );

  ApiSuccess(res, "Logged out", 200);
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", 401, "UNAUTHENTICATED");
  }

  const user = await getUserById(userId);

  ApiSuccess(res, "Current user", 200, { user });
};
