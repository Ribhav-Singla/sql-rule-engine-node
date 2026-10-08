import "@dotenvx/dotenvx/config";
import { envSchema } from "../zod/index.js";
import { durationToMilliseconds } from "../utils/helpers.js";

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment configuration: ${parsedEnv.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
  );
}

export const settings = {
  ...parsedEnv.data,
  REFRESH_COOKIE_OPTIONS: {
    httpOnly: true,
    secure: parsedEnv.data.NODE_ENV === "production",
    sameSite: "lax" as const,
  },
  REFRESH_COOKIE_MAX_AGE_MS: durationToMilliseconds(
    parsedEnv.data.REFRESH_TOKEN_TTL,
  ),
};
