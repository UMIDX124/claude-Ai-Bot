import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodTypeAny } from "zod";
import type { User } from "@prisma/client";
import { AuthError, ForbiddenError, requireUser } from "@/lib/auth";
import { enforceLimit, limiters } from "@/lib/ratelimit";
import { log } from "@/lib/logger";

type ApiCtx = {
  req: NextRequest;
  user: User;
  params: Record<string, string>;
};

type RouteHandler<T> = (ctx: ApiCtx) => Promise<T | NextResponse>;

type WithApiOptions = {
  rateLimit?: "api" | "chat" | "auth" | false;
};

export function withApi<T>(
  handler: RouteHandler<T>,
  options: WithApiOptions = {},
) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const started = Date.now();
    let user: User;
    try {
      user = await requireUser();
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      log.error("api.auth.unexpected", err);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (options.rateLimit !== false) {
      const key = options.rateLimit ?? "api";
      const limiter = limiters[key];
      const rl = await enforceLimit(limiter, user.id);
      if (!rl.ok) {
        return NextResponse.json(
          { error: "Rate limit exceeded", resetMs: rl.reset },
          {
            status: 429,
            headers: {
              "Retry-After": String(
                Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)),
              ),
            },
          },
        );
      }
    }

    const params = await context.params.catch(() => ({}));
    try {
      const result = await handler({ req, user, params });
      if (result instanceof NextResponse) return result;
      return NextResponse.json(result);
    } catch (err) {
      return handleApiError(err, req.nextUrl.pathname, Date.now() - started);
    }
  };
}

export function handleApiError(
  err: unknown,
  path: string,
  ms?: number,
): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: err.issues.slice(0, 10) },
      { status: 400 },
    );
  }
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err && typeof err === "object" && "status" in err) {
    const e = err as { status?: number; message?: string };
    if (typeof e.status === "number" && e.status >= 400 && e.status < 600) {
      return NextResponse.json(
        { error: e.message ?? "Request failed" },
        { status: e.status },
      );
    }
  }
  log.error("api.fail", err, { path, ms });
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 },
  );
}

export async function parseBody<T extends ZodTypeAny>(
  req: NextRequest,
  schema: T,
): Promise<ReturnType<T["parse"]>> {
  const json = await req.json().catch(() => null);
  return schema.parse(json);
}

export function parseQuery<T extends ZodTypeAny>(
  req: NextRequest,
  schema: T,
): ReturnType<T["parse"]> {
  const q: Record<string, string | string[]> = {};
  for (const [k, v] of req.nextUrl.searchParams.entries()) {
    const existing = q[k];
    if (existing === undefined) {
      q[k] = v;
    } else if (Array.isArray(existing)) {
      existing.push(v);
    } else {
      q[k] = [existing, v];
    }
  }
  return schema.parse(q);
}

export function requestMeta(req: NextRequest): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  return {
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null,
    userAgent: req.headers.get("user-agent"),
  };
}
