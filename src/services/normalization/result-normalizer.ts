function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

export function normalizeResult(rows: Record<string, unknown>[]): string {
  if (!rows?.length) {
    return JSON.stringify([]);
  }

  const normalized = rows.map((row) => {
    const normalizedRow: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      normalizedRow[key.toLowerCase()] = normalizeValue(value);
    }
    return normalizedRow;
  });

  const sorted = [...normalized].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

  return JSON.stringify(sorted);
}
