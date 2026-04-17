import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function stripEnvNoise(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let v = raw.trim();
  if (v.toUpperCase().startsWith("UPSTASH_REDIS_REST_") && v.includes("=")) {
    v = v.split("=").slice(1).join("=").trim();
  }
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v || undefined;
}

let redisInstance: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisInstance !== undefined) return redisInstance;
  const url = stripEnvNoise(process.env.UPSTASH_REDIS_REST_URL);
  const token = stripEnvNoise(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!url || !token || !url.startsWith("https://")) {
    redisInstance = null;
    return null;
  }
  try {
    redisInstance = new Redis({ url, token });
  } catch {
    redisInstance = null;
  }
  return redisInstance;
}

type Window = `${number} ${"s" | "m" | "h" | "d"}`;

function make(limit: number, window: Window, prefix: string): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `alpha:${prefix}`,
    analytics: true,
  });
}

let cache: { chat: Ratelimit | null; api: Ratelimit | null; auth: Ratelimit | null } | null = null;

export const limiters = {
  get chat() {
    cache ??= { chat: make(10, "1 m", "chat"), api: make(60, "1 m", "api"), auth: make(5, "1 m", "auth") };
    return cache.chat;
  },
  get api() {
    cache ??= { chat: make(10, "1 m", "chat"), api: make(60, "1 m", "api"), auth: make(5, "1 m", "auth") };
    return cache.api;
  },
  get auth() {
    cache ??= { chat: make(10, "1 m", "chat"), api: make(60, "1 m", "api"), auth: make(5, "1 m", "auth") };
    return cache.auth;
  },
};

export async function enforceLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ ok: boolean; remaining: number; reset: number }> {
  if (!limiter) return { ok: true, remaining: Infinity, reset: 0 };
  const r = await limiter.limit(identifier);
  return { ok: r.success, remaining: r.remaining, reset: r.reset };
}
