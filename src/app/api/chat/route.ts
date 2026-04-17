import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { enforceLimit, limiters } from "@/lib/ratelimit";
import { redactObject } from "@/lib/redact";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const ContextSchema = z
  .object({
    userName: z.string().max(120).optional(),
    userRole: z.string().max(40).optional(),
    brand: z.enum(["DPL", "VCS", "BSL"]).optional(),
    focus: z.string().max(200).optional(),
  })
  .partial();

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
  context: ContextSchema.optional(),
});

const SYSTEM_PROMPT = `You are Alpha AI, the assistant for the Alpha Command Center CRM that runs operations for three sibling companies: DPL (Digital Point LLC), VCS (Virtual Customer Solution), and BSL (Backup Solutions LLC).

Ground rules:
- Be concise and specific. Prefer numbered steps or tables for structured answers.
- Only use data that has been explicitly provided in the message or sanitized context. Do not invent clients, employees, revenue, or tickets.
- Never repeat sensitive identifiers (emails, phones, tokens). If the user asks for one, respond "That information is redacted in this channel."
- Respond in the user's language (English / Urdu / Hinglish).`;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await enforceLimit(limiters.chat, userId);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded", resetMs: rl.reset },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))) },
      },
    );
  }

  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 },
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    log.error("Groq key missing");
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const context = parsed.data.context ? redactObject(parsed.data.context) : undefined;
  const contextLine = context
    ? `Sanitized context: ${JSON.stringify(context)}`
    : "No extra context provided.";

  const client = new Groq({ apiKey });
  const t0 = Date.now();
  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1024,
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\n${contextLine}` },
        ...parsed.data.messages,
      ],
    });
    const reply = completion.choices[0]?.message?.content ?? "";
    log.info("chat.ok", {
      userId,
      ms: Date.now() - t0,
      tokens: completion.usage?.total_tokens,
    });
    return NextResponse.json({ response: reply });
  } catch (err) {
    log.error("chat.fail", err, { userId, ms: Date.now() - t0 });
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
