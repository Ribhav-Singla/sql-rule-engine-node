import bcrypt from "bcrypt";
import { db } from "../../db/index.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import { AppError } from "../../utils/app_error.js";
import { settings } from "../../config/settings.js";
import { PublicUser, UserRow } from "../../types/index.js";

const toPublicUser = (user: UserRow): PublicUser => ({
  id: user.id,
  email: user.email,
  role: user.role,
});

// Issues a fresh access + refresh token pair and records the refresh token as
// an active session row (what makes logout/revocation possible).
async function issueSession(user: UserRow) {
  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);
  await db.authSession.create({ data: { userId: user.id, refreshToken } });
  return { user: toPublicUser(user), accessToken, refreshToken };
}

export const registerUser = async (email: string, password: string) => {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("User already exists", 409, "USER_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, settings.BCRYPT_ROUNDS);
  const user = await db.user.create({ data: { email, passwordHash } });
  return issueSession(user as UserRow);
};

export const loginUser = async (email: string, password: string) => {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) {
    throw new AppError("Invalid credentials", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("Invalid credentials", 401);
  }
  return issueSession(user);
};

// Stateful refresh with rotation. The token must be (a) validly signed and
// unexpired and (b) present in auth_sessions. A validly-signed token that is NOT
// in the DB is a reuse/revocation signal — drop every session for that user.
export const rotateSession = async (oldRefreshToken: string) => {
  let payload: { userId: string };

  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new AppError("Unauthorized", 401, "UNAUTHENTICATED");
  }

  const session = await db.authSession.findUnique({
    where: { refreshToken: oldRefreshToken },
  });

  if (!session) {
    await db.authSession.deleteMany({ where: { userId: payload.userId } });
    throw new AppError("Unauthorized", 401, "UNAUTHENTICATED");
  }

  const accessToken = createAccessToken(payload.userId);
  const refreshToken = createRefreshToken(payload.userId);

  await db.authSession.update({
    where: { id: session.id },
    data: { refreshToken },
  });
  
  return { accessToken, refreshToken };
};

// Invalidates a single refresh token (this device/session only). Idempotent.
export const logoutSession = async (refreshToken: string) => {
  await db.authSession.deleteMany({ where: { refreshToken } });
};

export const getUserById = async (userId: string): Promise<PublicUser> => {
  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user || user.deletedAt) {
    throw new AppError("User not found", 404);
  }

  return toPublicUser(user);
};
