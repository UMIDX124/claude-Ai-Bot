import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";

export const CORRELATION_HEADER = "x-correlation-id";

/**
 * Extract or generate a correlation ID for a request. Inbound clients that
 * already carry one (e.g. from an upstream edge) are honored; anything else
 * gets a freshly-minted UUID.
 */
export function correlationIdFrom(req: NextRequest): string {
  const existing = req.headers.get(CORRELATION_HEADER);
  if (existing && /^[A-Za-z0-9._-]{8,128}$/.test(existing)) return existing;
  return randomUUID();
}
