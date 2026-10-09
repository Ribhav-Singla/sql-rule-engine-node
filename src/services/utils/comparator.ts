import { generateSha256Hash } from "../fingerprint/fingerprint.js";


export function hashAndCompare(
  normalizedResult: string,
  expectedHash: string,
): { correct: boolean; result_hash: string; expected_hash: string } {
  const resultHash = generateSha256Hash(normalizedResult).toLowerCase();
  const expected = expectedHash.toLowerCase();

  return {
    correct: resultHash === expected,
    result_hash: resultHash,
    expected_hash: expected,
  };
}
