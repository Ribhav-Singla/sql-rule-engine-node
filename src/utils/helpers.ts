export const durationToMilliseconds = (duration: string): number => {
  const match = /^(\d+)([smhdw])$/.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  } as const;

  return value * multipliers[match[2] as keyof typeof multipliers];
};