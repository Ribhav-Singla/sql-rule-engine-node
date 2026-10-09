import { createClient } from "redis";
import { settings } from "../../config/settings.js";

const client = createClient({ url: settings.REDIS_URL });
client.on("error", (err) => console.error("Redis error:", err));
let connectPromise: Promise<unknown> | null = null;

async function ensureRedisConnection(): Promise<void> {
  if (client.isOpen) {
    return;
  }

  if (!connectPromise) {
    connectPromise = client.connect();
  }

  await connectPromise;
}

export async function getCache(key: string): Promise<any | null> {
  await ensureRedisConnection();
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache(
  key: string,
  value: any,
  ttl = settings.CACHE_TTL_SECONDS,
): Promise<void> {
  await ensureRedisConnection();
  await client.set(key, JSON.stringify(value), { EX: ttl });
}
