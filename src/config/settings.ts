import "@dotenvx/dotenvx/config";
import { envSchema } from "../zod/index.js";

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment configuration: ${parsedEnv.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
  );
}

export const settings = parsedEnv.data;
