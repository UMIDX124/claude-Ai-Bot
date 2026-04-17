import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClerkEmail = {
  id: string;
  email_address: string;
  primary?: boolean;
};

type ClerkUserData = {
  id: string;
  email_addresses?: ClerkEmail[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  phone_numbers?: Array<{ phone_number: string; primary?: boolean }>;
};

type ClerkEvent = {
  type: string;
  data: ClerkUserData;
};

function primaryEmail(data: ClerkUserData): string | null {
  if (!data.email_addresses?.length) return null;
  if (data.primary_email_address_id) {
    const found = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id,
    );
    if (found) return found.email_address;
  }
  const primary = data.email_addresses.find((e) => e.primary);
  if (primary) return primary.email_address;
  return data.email_addresses[0]?.email_address ?? null;
}

function primaryPhone(data: ClerkUserData): string | null {
  if (!data.phone_numbers?.length) return null;
  const primary = data.phone_numbers.find((p) => p.primary);
  return (primary ?? data.phone_numbers[0])?.phone_number ?? null;
}

async function verify(req: NextRequest): Promise<ClerkEvent | null> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    log.error("clerk.webhook.no_secret");
    return null;
  }
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) return null;

  const payload = await req.text();
  try {
    const wh = new Webhook(secret);
    return wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch (err) {
    log.warn("clerk.webhook.verify_fail", {
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

async function handleUserCreated(data: ClerkUserData) {
  const email = primaryEmail(data);
  if (!email) {
    log.warn("clerk.webhook.user_created.no_email", { clerkId: data.id });
    return;
  }

  const fullName =
    [data.first_name, data.last_name].filter(Boolean).join(" ") || null;
  const phone = primaryPhone(data);

  const existingByEmail = await db.user.findUnique({
    where: { email },
    include: { employee: true },
  });

  const user = existingByEmail
    ? await db.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkId: data.id,
          firstName: data.first_name ?? existingByEmail.firstName,
          lastName: data.last_name ?? existingByEmail.lastName,
          fullName: fullName ?? existingByEmail.fullName,
          avatarUrl: data.image_url ?? existingByEmail.avatarUrl,
          phone: phone ?? existingByEmail.phone,
          lastLoginAt: new Date(),
        },
      })
    : await db.user.create({
        data: {
          clerkId: data.id,
          email,
          firstName: data.first_name ?? null,
          lastName: data.last_name ?? null,
          fullName,
          avatarUrl: data.image_url ?? null,
          phone,
        },
      });

  if (!existingByEmail?.employee) {
    const defaultCompany = await db.company.findUnique({ where: { type: "DPL" } });
    if (defaultCompany) {
      const code = await nextEmployeeCode("DPL");
      await db.employee.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          companyId: defaultCompany.id,
          employeeCode: code,
          status: "ACTIVE",
          employmentType: "FULL_TIME",
        },
      });
    }
  }

  await audit({
    actorId: user.id,
    action: "CREATE",
    resourceType: "User",
    resourceId: user.id,
    metadata: { source: "clerk.webhook", event: "user.created" },
  });
}

async function handleUserUpdated(data: ClerkUserData) {
  const email = primaryEmail(data);
  const existing = await db.user.findUnique({ where: { clerkId: data.id } });
  if (!existing) {
    if (!email) return;
    await handleUserCreated(data);
    return;
  }

  await db.user.update({
    where: { id: existing.id },
    data: {
      email: email ?? existing.email,
      firstName: data.first_name ?? existing.firstName,
      lastName: data.last_name ?? existing.lastName,
      fullName:
        [data.first_name, data.last_name].filter(Boolean).join(" ") ||
        existing.fullName,
      avatarUrl: data.image_url ?? existing.avatarUrl,
      phone: primaryPhone(data) ?? existing.phone,
      lastLoginAt: new Date(),
    },
  });
}

async function handleUserDeleted(data: ClerkUserData) {
  const existing = await db.user.findUnique({
    where: { clerkId: data.id },
    include: { employee: true },
  });
  if (!existing) return;
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), isActive: false },
    });
    if (existing.employee && !existing.employee.deletedAt) {
      await tx.employee.update({
        where: { id: existing.employee.id },
        data: {
          deletedAt: new Date(),
          status: "TERMINATED",
          terminationDate: new Date(),
          terminationReason: "Clerk user deleted",
        },
      });
    }
  });
}

async function nextEmployeeCode(prefix: string): Promise<string> {
  const rows = await db.employee.findMany({
    where: { employeeCode: { startsWith: `${prefix}-` } },
    select: { employeeCode: true },
    orderBy: { employeeCode: "desc" },
    take: 20,
  });
  let max = 0;
  for (const { employeeCode } of rows) {
    const m = employeeCode?.match(/-(\d+)$/);
    if (m) {
      const n = Number.parseInt(m[1], 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

export async function POST(req: NextRequest) {
  const event = await verify(req);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    switch (event.type) {
      case "user.created":
        await handleUserCreated(event.data);
        break;
      case "user.updated":
        await handleUserUpdated(event.data);
        break;
      case "user.deleted":
        await handleUserDeleted(event.data);
        break;
      default:
        log.debug("clerk.webhook.unhandled", { type: event.type });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error("clerk.webhook.fail", err, { type: event.type });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
