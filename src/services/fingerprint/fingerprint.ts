import { createHash } from "crypto";

export function generateFingerprint(problemId: string, schemaName: string, normalizedSql: string): string {
  const hash = generateSha256Hash(normalizedSql);
  return `${problemId}:${schemaName}:${hash}`;
}

export function generateSha256Hash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
