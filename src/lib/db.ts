import { PrismaClient } from "@prisma/client";
import { log } from "@/lib/logger";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const SLOW_QUERY_MS = Number.parseInt(process.env.PRISMA_SLOW_MS ?? "250", 10);

function createClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ]
        : [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "error" },
          ],
  });

  // Slow query logging — observability instrumentation required by mandate.
  client.$on("query", (e) => {
    if (e.duration >= SLOW_QUERY_MS) {
      log.warn("prisma.slow_query", {
        durationMs: e.duration,
        query: e.query.slice(0, 400),
        params: e.params.slice(0, 400),
      });
    }
  });

  return client;
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
