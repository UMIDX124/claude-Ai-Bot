/**
 * Slice 4 — faker-driven seed for SLAs, Tickets, TicketMessages, TicketWatchers, TicketActivity.
 *
 * Deterministic: faker.seed(44). Idempotent via natural-key finds.
 * Depends on: Slice 1 employees + Slice 3 clients (run `pnpm db:seed` then `pnpm db:seed:slice3` first).
 *
 * Run:
 *   pnpm dotenv -e .env.local -- tsx prisma/seed.slice4.ts
 */
import {
  PrismaClient,
  Prisma,
  TicketStatus,
  TicketPriority,
  TicketChannel,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

faker.seed(44);

const db = new PrismaClient();

const SLA_POLICIES = [
  {
    name: "P1 Critical",
    description: "Highest severity — customer-facing outage or data loss.",
    responseMinutes: 15,
    resolutionMinutes: 4 * 60,
    businessHoursOnly: false,
    appliesToPriority: "CRITICAL" as TicketPriority,
  },
  {
    name: "P2 High",
    description: "Significant impact on a client workflow; workaround may exist.",
    responseMinutes: 60,
    resolutionMinutes: 8 * 60,
    businessHoursOnly: false,
    appliesToPriority: "URGENT" as TicketPriority,
  },
  {
    name: "P3 Standard",
    description: "Non-blocking issue, question, or feature request.",
    responseMinutes: 4 * 60,
    resolutionMinutes: 3 * 24 * 60,
    businessHoursOnly: true,
    appliesToPriority: "NORMAL" as TicketPriority,
  },
];

const SUBJECT_TEMPLATES = [
  "Unable to access dashboard",
  "Login flow redirects to 500",
  "API rate limit surprise",
  "Invoice rendering shows wrong tax",
  "Data export stuck at 99%",
  "Bulk import hangs on row 4000",
  "Webhook retries loop for 20 min",
  "Customer portal logo missing",
  "Permission error on new role",
  "Password reset email not delivering",
  "Multi-factor setup flow",
  "Audit log export request",
  "DNS propagation question",
  "Feature request: dark mode toggle",
  "CSV encoding corrupt for Arabic",
  "OAuth redirect URI mismatch",
  "Backup completed but alert fired",
  "Retention policy clarification",
  "SSL certificate expiry warning",
  "Scheduled downtime question",
];

const CATEGORIES = [
  "authentication",
  "billing",
  "platform",
  "integration",
  "export",
  "onboarding",
  "performance",
  "notifications",
  "data-integrity",
  "account",
];

const ACTIVITY_KINDS = [
  "CREATED",
  "STATUS_CHANGED",
  "ASSIGNED",
  "PRIORITY_CHANGED",
  "NOTE_ADDED",
  "ESCALATED",
];

async function seedSlas() {
  let count = 0;
  for (const p of SLA_POLICIES) {
    await db.sLA.upsert({
      where: { name: p.name },
      update: {
        description: p.description,
        responseMinutes: p.responseMinutes,
        resolutionMinutes: p.resolutionMinutes,
        businessHoursOnly: p.businessHoursOnly,
        appliesToPriority: p.appliesToPriority,
        isActive: true,
      },
      create: {
        name: p.name,
        description: p.description,
        responseMinutes: p.responseMinutes,
        resolutionMinutes: p.resolutionMinutes,
        businessHoursOnly: p.businessHoursOnly,
        appliesToPriority: p.appliesToPriority,
        isActive: true,
      },
    });
    count += 1;
  }
  console.log(`  seeded ${count} SLA policies`);
}

async function seedTickets() {
  const slas = await db.sLA.findMany({
    where: { deletedAt: null, isActive: true },
  });
  const slasByPriority = new Map(slas.map((s) => [s.appliesToPriority, s]));

  const companies = await db.company.findMany({ select: { id: true, type: true } });
  const clients = await db.client.findMany({
    where: { deletedAt: null },
    select: { id: true, companyId: true, name: true },
  });
  const clientsByCompany = new Map<string, typeof clients>();
  for (const c of clients) {
    const list = clientsByCompany.get(c.companyId) ?? [];
    list.push(c);
    clientsByCompany.set(c.companyId, list);
  }

  const employees = await db.employee.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    include: { user: { select: { id: true, email: true } } },
  });
  if (employees.length === 0) {
    throw new Error("No active employees — run the main seed first.");
  }
  const employeesByCompany = new Map<string, typeof employees>();
  for (const e of employees) {
    const list = employeesByCompany.get(e.companyId) ?? [];
    list.push(e);
    employeesByCompany.set(e.companyId, list);
  }

  const owner = await db.user.findFirstOrThrow({ where: { role: "OWNER" } });

  let tickets = 0;
  let messages = 0;
  let activities = 0;
  let watchers = 0;

  const total = faker.number.int({ min: 35, max: 50 });
  for (let i = 0; i < total; i += 1) {
    const company = companies[i % companies.length];
    if (!company) continue;
    const companyClients = clientsByCompany.get(company.id) ?? [];
    const client = companyClients.length
      ? faker.helpers.arrayElement(companyClients)
      : null;
    const companyEmployees = employeesByCompany.get(company.id) ?? employees;
    const assignee = faker.datatype.boolean({ probability: 0.85 })
      ? faker.helpers.arrayElement(companyEmployees)
      : null;

    const priority = faker.helpers.weightedArrayElement<TicketPriority>([
      { value: "LOW", weight: 1 },
      { value: "NORMAL", weight: 5 },
      { value: "HIGH", weight: 3 },
      { value: "URGENT", weight: 2 },
      { value: "CRITICAL", weight: 1 },
    ]);
    const status = faker.helpers.weightedArrayElement<TicketStatus>([
      { value: "OPEN", weight: 4 },
      { value: "ACKNOWLEDGED", weight: 3 },
      { value: "IN_PROGRESS", weight: 4 },
      { value: "WAITING_CUSTOMER", weight: 2 },
      { value: "RESOLVED", weight: 3 },
      { value: "CLOSED", weight: 3 },
    ]);
    const channel = faker.helpers.arrayElement<TicketChannel>([
      "EMAIL",
      "WEB",
      "CHAT",
      "PHONE",
      "INTERNAL",
    ]);

    const sla =
      slasByPriority.get(priority) ??
      slas.find((s) => !s.appliesToPriority) ??
      slas[slas.length - 1];

    const createdDaysAgo = faker.number.int({ min: 0, max: 30 });
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - createdDaysAgo);

    const responseDueAt = new Date(
      createdAt.getTime() + sla.responseMinutes * 60_000,
    );
    const resolutionDueAt = new Date(
      createdAt.getTime() + sla.resolutionMinutes * 60_000,
    );
    const now = new Date();
    const responded =
      status !== "OPEN" ||
      faker.datatype.boolean({ probability: 0.7 });
    const firstResponseAt = responded
      ? new Date(
          createdAt.getTime() +
            faker.number.int({
              min: Math.max(1, Math.floor(sla.responseMinutes * 0.2)),
              max: sla.responseMinutes * 2,
            }) *
              60_000,
        )
      : null;
    const responseBreachedAt =
      firstResponseAt && firstResponseAt > responseDueAt
        ? responseDueAt
        : !firstResponseAt && now > responseDueAt
          ? responseDueAt
          : null;
    const resolvedAt =
      status === "RESOLVED" || status === "CLOSED"
        ? new Date(
            createdAt.getTime() +
              faker.number.int({
                min: sla.responseMinutes,
                max: sla.resolutionMinutes * 2,
              }) *
                60_000,
          )
        : null;
    const closedAt = status === "CLOSED" && resolvedAt
      ? new Date(resolvedAt.getTime() + faker.number.int({ min: 60, max: 600 }) * 60_000)
      : null;
    const resolutionBreachedAt =
      resolvedAt && resolvedAt > resolutionDueAt
        ? resolutionDueAt
        : !resolvedAt && now > resolutionDueAt
          ? resolutionDueAt
          : null;
    const acknowledgedAt =
      firstResponseAt && status !== "OPEN"
        ? new Date(firstResponseAt.getTime() - faker.number.int({ min: 0, max: 30 }) * 60_000)
        : null;

    const subject = faker.helpers.arrayElement(SUBJECT_TEMPLATES);
    const category = faker.helpers.arrayElement(CATEGORIES);

    const existing = await db.ticket.findFirst({
      where: {
        companyId: company.id,
        subject,
        createdAt,
      },
    });
    const ticket = existing
      ? await db.ticket.update({
          where: { id: existing.id },
          data: {
            status,
            priority,
            channel,
            category,
            clientId: client?.id ?? null,
            assigneeEmployeeId: assignee?.id ?? null,
            assignedToId: assignee?.user.id ?? null,
            slaId: sla.id,
            responseDueAt,
            resolutionDueAt,
            acknowledgedAt,
            firstResponseAt,
            resolvedAt,
            closedAt,
            responseBreachedAt,
            resolutionBreachedAt,
            escalationLevel: priority === "CRITICAL" ? 2 : priority === "URGENT" ? 1 : 0,
            tags: faker.helpers.arrayElements(
              ["vip", "regression", "billing", "p1", "needs-engineering"],
              { min: 0, max: 3 },
            ),
            satisfactionScore:
              status === "CLOSED" && faker.datatype.boolean({ probability: 0.6 })
                ? faker.number.int({ min: 3, max: 5 })
                : null,
          },
        })
      : await db.ticket.create({
          data: {
            companyId: company.id,
            clientId: client?.id ?? null,
            reporterId: owner.id,
            assignedToId: assignee?.user.id ?? null,
            assigneeEmployeeId: assignee?.id ?? null,
            slaId: sla.id,
            subject,
            description: faker.lorem.paragraphs({ min: 1, max: 3 }),
            status,
            priority,
            channel,
            category,
            tags: faker.helpers.arrayElements(
              ["vip", "regression", "billing", "p1", "needs-engineering"],
              { min: 0, max: 3 },
            ),
            escalationLevel: priority === "CRITICAL" ? 2 : priority === "URGENT" ? 1 : 0,
            responseDueAt,
            resolutionDueAt,
            acknowledgedAt,
            firstResponseAt,
            resolvedAt,
            closedAt,
            responseBreachedAt,
            resolutionBreachedAt,
            satisfactionScore:
              status === "CLOSED" && faker.datatype.boolean({ probability: 0.6 })
                ? faker.number.int({ min: 3, max: 5 })
                : null,
            createdAt,
            updatedAt: closedAt ?? resolvedAt ?? firstResponseAt ?? createdAt,
          },
        });
    tickets += 1;

    // Messages — 2 to 6 per ticket; first from reporter, alternating with assignee
    const msgCount = faker.number.int({ min: 2, max: 6 });
    for (let m = 0; m < msgCount; m += 1) {
      const isInitial = m === 0;
      const fromAgent = !isInitial && m % 2 === 1 && assignee;
      const authorId = fromAgent ? assignee!.user.id : owner.id;
      const offsetMin = isInitial
        ? 0
        : faker.number.int({ min: 15, max: 240 }) * m;
      const msgCreated = new Date(createdAt.getTime() + offsetMin * 60_000);
      const existingMsg = await db.ticketMessage.findFirst({
        where: { ticketId: ticket.id, authorId, createdAt: msgCreated },
      });
      if (existingMsg) continue;
      await db.ticketMessage.create({
        data: {
          ticket: { connect: { id: ticket.id } },
          author: { connect: { id: authorId } },
          content: isInitial
            ? faker.lorem.paragraph()
            : fromAgent
              ? `Thanks for reporting. ${faker.lorem.sentence({ min: 5, max: 12 })}`
              : faker.lorem.sentence({ min: 5, max: 18 }),
          isInternal: Boolean(fromAgent && faker.datatype.boolean({ probability: 0.2 })),
          createdAt: msgCreated,
          updatedAt: msgCreated,
        },
      });
      messages += 1;
    }

    // Activity — 3 to 6 entries, deterministic
    const actCount = faker.number.int({ min: 3, max: 6 });
    for (let a = 0; a < actCount; a += 1) {
      const kind = faker.helpers.arrayElement(ACTIVITY_KINDS);
      const at = new Date(
        createdAt.getTime() + faker.number.int({ min: 0, max: 48 * 60 }) * 60_000,
      );
      const existingAct = await db.ticketActivity.findFirst({
        where: { ticketId: ticket.id, kind, createdAt: at },
      });
      if (existingAct) continue;
      await db.ticketActivity.create({
        data: {
          ticketId: ticket.id,
          actorId: assignee?.user.id ?? owner.id,
          kind,
          fromValue: kind === "STATUS_CHANGED" ? "OPEN" : null,
          toValue:
            kind === "STATUS_CHANGED"
              ? status
              : kind === "ASSIGNED"
                ? assignee?.user.email ?? null
                : null,
          metadata: { note: faker.lorem.sentence({ min: 4, max: 10 }) } satisfies Prisma.InputJsonValue,
          createdAt: at,
        },
      });
      activities += 1;
    }

    // Watchers — 0 to 2 per ticket
    const watcherCount = faker.number.int({ min: 0, max: 2 });
    const watcherPool = companyEmployees.filter((e) => e.id !== assignee?.id);
    for (let w = 0; w < Math.min(watcherCount, watcherPool.length); w += 1) {
      const emp = watcherPool[w];
      await db.ticketWatcher.upsert({
        where: { ticketId_userId: { ticketId: ticket.id, userId: emp.user.id } },
        update: {},
        create: { ticketId: ticket.id, userId: emp.user.id },
      });
      watchers += 1;
    }
  }

  console.log(
    `  seeded ${tickets} tickets · ${messages} messages · ${activities} activities · ${watchers} watchers`,
  );
}

async function main() {
  console.log("→ seeding Slice 4 (SLAs, tickets, messages, activity, watchers)");
  await seedSlas();
  await seedTickets();

  const [slas, tickets, messages, activities, watchers, breaches] =
    await Promise.all([
      db.sLA.count({ where: { deletedAt: null } }),
      db.ticket.count({ where: { deletedAt: null } }),
      db.ticketMessage.count({ where: { deletedAt: null } }),
      db.ticketActivity.count(),
      db.ticketWatcher.count(),
      db.ticket.count({
        where: {
          deletedAt: null,
          OR: [
            { responseBreachedAt: { not: null } },
            { resolutionBreachedAt: { not: null } },
          ],
        },
      }),
    ]);

  console.log("\n--- Slice 4 counts ---");
  console.log(`  slas:       ${slas}`);
  console.log(`  tickets:    ${tickets}`);
  console.log(`  messages:   ${messages}`);
  console.log(`  activities: ${activities}`);
  console.log(`  watchers:   ${watchers}`);
  console.log(`  breaches:   ${breaches}`);
  console.log("✔ Slice 4 seed complete");
}

main()
  .catch((err) => {
    console.error("seed.slice4 failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
