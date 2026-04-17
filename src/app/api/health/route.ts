import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = { ok: boolean; ms?: number; error?: string };

export async function GET() {
  const started = Date.now();
  const checks: Record<string, Check> = {};

  try {
    const t0 = Date.now();
    await db.$queryRaw`SELECT 1`;
    checks.db = { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    checks.db = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  const clerkOk =
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !!process.env.CLERK_SECRET_KEY;
  checks.clerk = clerkOk
    ? { ok: true }
    : { ok: false, error: "Clerk env missing" };

  const groqOk = !!process.env.GROQ_API_KEY;
  checks.groq = groqOk
    ? { ok: true }
    : { ok: false, error: "GROQ_API_KEY missing" };

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
