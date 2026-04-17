import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};

  try {
    const t0 = Date.now();
    await db.$queryRaw`SELECT 1`;
    checks.db = { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    checks.db = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  const ok = Object.values(checks).every((c) => c.ok);
  return NextResponse.json(
    {
      ok,
      service: "alpha-command-center",
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
      region: process.env.VERCEL_REGION ?? "local",
      uptimeMs: Date.now() - started,
      checks,
    },
    { status: ok ? 200 : 503 },
  );
}
