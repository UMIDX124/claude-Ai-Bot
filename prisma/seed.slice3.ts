/**
 * Slice 3 — faker-driven seed for Clients, Contacts, Pipelines, Stages, Deals, Notes, DealActivity.
 *
 * Deterministic: faker.seed(42). Re-running is idempotent thanks to stable natural-key upserts
 * (company+name for clients, pipelineId+name for stages, etc.). Multi-currency
 * (USD / GBP / EUR / PKR) distributed across deals so the pipeline value view can demo FX.
 *
 * Run:
 *   pnpm dotenv -e .env.local -- tsx prisma/seed.slice3.ts
 */
import {
  PrismaClient,
  CompanyType,
  ClientHealth,
  ClientStatus,
  ContactKind,
  DealStatus,
  DealStage,
  Prisma,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

faker.seed(42);

const db = new PrismaClient();

const COMPANY_EMPLOYEE_ACCOUNT_OWNERS: Record<CompanyType, string[]> = {
  DPL: [
    "nora.ahmed@digitalpointllc.com",
    "umer@digitalpointllc.com",
    "sarah.khan@digitalpointllc.com",
  ],
  VCS: [
    "anita.patel@virtualcustomersolution.com",
    "ravi.mehta@virtualcustomersolution.com",
  ],
  BSL: [
    "daniel.park@backupsolutions.com",
    "mahnoor.ali@backupsolutions.com",
  ],
};

const STAGES_TEMPLATE: Array<{
  name: string;
  probability: number;
  isWon?: boolean;
  isLost?: boolean;
  color: string;
  stageEnum: DealStage;
}> = [
  { name: "Discovery", probability: 10, color: "#71717A", stageEnum: "PROSPECT" },
  { name: "Qualification", probability: 25, color: "#3B82F6", stageEnum: "QUALIFIED" },
  { name: "Proposal", probability: 50, color: "#F59E0B", stageEnum: "PROPOSAL" },
  { name: "Negotiation", probability: 75, color: "#A855F7", stageEnum: "NEGOTIATION" },
  { name: "Closed Won", probability: 100, isWon: true, color: "#22C55E", stageEnum: "CLOSED_WON" },
  { name: "Closed Lost", probability: 0, isLost: true, color: "#EF4444", stageEnum: "CLOSED_LOST" },
];

const INDUSTRIES_BY_COMPANY: Record<CompanyType, string[]> = {
  DPL: ["SaaS", "Marketing Tech", "E-commerce", "AI Platform", "DevTools", "Fintech"],
  VCS: ["E-commerce", "Travel", "Healthcare", "SaaS", "Logistics", "Retail"],
  BSL: ["Healthcare", "Legal", "Financial Services", "Manufacturing", "Government", "Media"],
};

const ACCOUNT_TIERS = ["Enterprise", "Growth", "Starter", "Strategic"];
const CURRENCIES = ["USD", "USD", "USD", "USD", "GBP", "EUR", "PKR"];
const LOST_REASON_CATEGORIES = [
  "No budget",
  "Lost to competitor",
  "Timing",
  "No decision",
  "Feature gap",
  "Pricing",
];
const COMPETITORS = ["Salesforce", "HubSpot", "Zoho", "Pipedrive", "Close", "Internal build"];

const DEAL_ACTIVITY_KINDS = [
  "STAGE_CHANGED",
  "ASSIGNED",
  "NOTE_ADDED",
  "EMAIL_SENT",
  "CALL_LOGGED",
  "MEETING_BOOKED",
];

type Ctx = {
  companies: Map<CompanyType, { id: string }>;
  ownersByCompany: Map<
    CompanyType,
    Array<{ userId: string; employeeId: string; email: string }>
  >;
  allOwners: Array<{ userId: string; employeeId: string; email: string }>;
};

async function loadContext(): Promise<Ctx> {
  const companies = await db.company.findMany({ select: { id: true, type: true } });
  const companyMap = new Map<CompanyType, { id: string }>();
  for (const c of companies) companyMap.set(c.type, { id: c.id });

  const ownersByCompany = new Map<
    CompanyType,
    Array<{ userId: string; employeeId: string; email: string }>
  >();
  const allOwners: Array<{ userId: string; employeeId: string; email: string }> = [];

  for (const type of ["DPL", "VCS", "BSL"] as CompanyType[]) {
    const emails = COMPANY_EMPLOYEE_ACCOUNT_OWNERS[type];
    const users = await db.user.findMany({
      where: { email: { in: emails } },
      include: { employee: { select: { id: true } } },
    });
    const list = users
      .filter((u) => u.employee)
      .map((u) => ({
        userId: u.id,
        employeeId: u.employee!.id,
        email: u.email,
      }));
    ownersByCompany.set(type, list);
    allOwners.push(...list);
  }

  return { companies: companyMap, ownersByCompany, allOwners };
}

async function seedPipelines(ctx: Ctx): Promise<Map<string, { id: string; companyType: CompanyType; stages: Array<{ id: string; name: string; probability: number; isWon: boolean; isLost: boolean; stageEnum: DealStage }> }>> {
  const out = new Map<
    string,
    {
      id: string;
      companyType: CompanyType;
      stages: Array<{ id: string; name: string; probability: number; isWon: boolean; isLost: boolean; stageEnum: DealStage }>;
    }
  >();

  for (const type of ["DPL", "VCS", "BSL"] as CompanyType[]) {
    const company = ctx.companies.get(type);
    if (!company) continue;

    const pipelineName = `${type} Sales Pipeline`;
    const existing = await db.pipeline.findFirst({
      where: { companyId: company.id, name: pipelineName },
    });
    const pipeline = existing
      ? await db.pipeline.update({
          where: { id: existing.id },
          data: { isDefault: true, description: `Default sales pipeline for ${type}` },
        })
      : await db.pipeline.create({
          data: {
            companyId: company.id,
            name: pipelineName,
            description: `Default sales pipeline for ${type}`,
            isDefault: true,
          },
        });

    const stages: Array<{ id: string; name: string; probability: number; isWon: boolean; isLost: boolean; stageEnum: DealStage }> = [];
    for (let i = 0; i < STAGES_TEMPLATE.length; i += 1) {
      const tpl = STAGES_TEMPLATE[i];
      const position = new Prisma.Decimal((i + 1) * 65536);
      const stage = await db.stage.upsert({
        where: { pipelineId_name: { pipelineId: pipeline.id, name: tpl.name } },
        update: {
          position,
          probability: tpl.probability,
          isWon: tpl.isWon ?? false,
          isLost: tpl.isLost ?? false,
          color: tpl.color,
        },
        create: {
          pipelineId: pipeline.id,
          name: tpl.name,
          description: `${tpl.name} stage`,
          position,
          probability: tpl.probability,
          isWon: tpl.isWon ?? false,
          isLost: tpl.isLost ?? false,
          color: tpl.color,
        },
      });
      stages.push({
        id: stage.id,
        name: tpl.name,
        probability: tpl.probability,
        isWon: tpl.isWon ?? false,
        isLost: tpl.isLost ?? false,
        stageEnum: tpl.stageEnum,
      });
    }

    out.set(type, { id: pipeline.id, companyType: type, stages });
  }

  console.log(`  seeded ${out.size} pipelines with ${STAGES_TEMPLATE.length} stages each`);
  return out;
}

async function seedClientsAndContacts(ctx: Ctx): Promise<string[]> {
  const totalClients = faker.number.int({ min: 18, max: 25 });
  const companyTypes: CompanyType[] = ["DPL", "VCS", "BSL"];
  const clientIds: string[] = [];
  let clientCount = 0;
  let contactCount = 0;
  let noteCount = 0;

  for (let i = 0; i < totalClients; i += 1) {
    const type = companyTypes[i % companyTypes.length];
    const company = ctx.companies.get(type);
    if (!company) continue;

    const name = faker.company.name().replace(/,? (Inc|LLC|Ltd)\.?$/i, "");
    const industries = INDUSTRIES_BY_COMPANY[type];
    const owners = ctx.ownersByCompany.get(type) ?? [];
    const owner = owners.length
      ? owners[faker.number.int({ min: 0, max: owners.length - 1 })]
      : null;

    const mrr = faker.number.int({ min: 500, max: 25_000 });
    const arr = mrr * 12;
    const ltv = arr * faker.number.float({ min: 1.2, max: 3.5, fractionDigits: 2 });
    const healthScore = faker.number.int({ min: 35, max: 98 });
    const health: ClientHealth =
      healthScore >= 80 ? "HEALTHY" : healthScore >= 55 ? "AT_RISK" : healthScore >= 30 ? "CHURNING" : "UNKNOWN";
    const status: ClientStatus = faker.helpers.weightedArrayElement([
      { value: "ACTIVE" as ClientStatus, weight: 6 },
      { value: "PROSPECT" as ClientStatus, weight: 3 },
      { value: "PAUSED" as ClientStatus, weight: 1 },
      { value: "CHURNED" as ClientStatus, weight: 1 },
    ]);
    const signupDate = faker.date.between({ from: "2023-06-01", to: "2026-01-01" });
    const renewalDate = new Date(signupDate);
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    const existing = await db.client.findFirst({
      where: { companyId: company.id, name },
    });

    const client = existing
      ? await db.client.update({
          where: { id: existing.id },
          data: {
            legalName: `${name} ${faker.helpers.arrayElement(["Inc.", "LLC", "Ltd.", "GmbH"])}`,
            email: faker.internet.email({ firstName: name.toLowerCase().replace(/\s/g, "") }),
            phone: faker.phone.number(),
            website: faker.internet.url(),
            industry: faker.helpers.arrayElement(industries),
            country: faker.location.country(),
            city: faker.location.city(),
            status,
            health,
            healthScore,
            accountTier: faker.helpers.arrayElement(ACCOUNT_TIERS),
            logoUrl: `https://logo.clearbit.com/${faker.internet.domainName()}`,
            slackChannel: `#${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}`,
            mrr,
            arr,
            lifetimeValue: ltv,
            signupDate,
            renewalDate,
            ownerId: owner?.userId ?? null,
            ownerEmployeeId: owner?.employeeId ?? null,
            tags: faker.helpers.arrayElements(
              ["strategic", "renewal-risk", "vip", "expansion-ready", "self-serve", "enterprise"],
              { min: 1, max: 3 },
            ),
          },
        })
      : await db.client.create({
          data: {
            companyId: company.id,
            name,
            legalName: `${name} ${faker.helpers.arrayElement(["Inc.", "LLC", "Ltd.", "GmbH"])}`,
            email: faker.internet.email({ firstName: name.toLowerCase().replace(/\s/g, "") }),
            phone: faker.phone.number(),
            website: faker.internet.url(),
            industry: faker.helpers.arrayElement(industries),
            country: faker.location.country(),
            city: faker.location.city(),
            status,
            health,
            healthScore,
            accountTier: faker.helpers.arrayElement(ACCOUNT_TIERS),
            logoUrl: `https://logo.clearbit.com/${faker.internet.domainName()}`,
            slackChannel: `#${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}`,
            mrr,
            arr,
            lifetimeValue: ltv,
            signupDate,
            renewalDate,
            ownerId: owner?.userId ?? null,
            ownerEmployeeId: owner?.employeeId ?? null,
            tags: faker.helpers.arrayElements(
              ["strategic", "renewal-risk", "vip", "expansion-ready", "self-serve", "enterprise"],
              { min: 1, max: 3 },
            ),
          },
        });
    clientIds.push(client.id);
    clientCount += 1;

    // Contacts — 2 to 4 per client
    const contactTotal = faker.number.int({ min: 2, max: 4 });
    for (let c = 0; c < contactTotal; c += 1) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();
      const isPrimary = c === 0;
      const kind: ContactKind = isPrimary
        ? "PRIMARY"
        : faker.helpers.arrayElement(["BILLING", "TECHNICAL", "EXECUTIVE", "OTHER"] as ContactKind[]);
      const existingContact = await db.contact.findFirst({
        where: { clientId: client.id, email },
      });
      if (existingContact) continue;
      await db.contact.create({
        data: {
          clientId: client.id,
          kind,
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
          email,
          phone: faker.phone.number(),
          title: faker.person.jobTitle(),
          department: faker.commerce.department(),
          linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${faker.number.int({ min: 100, max: 999 })}`,
          avatarUrl: faker.image.avatar(),
          timezone: faker.helpers.arrayElement([
            "America/Los_Angeles",
            "America/New_York",
            "Europe/London",
            "Asia/Karachi",
            "Asia/Singapore",
          ]),
          isPrimary,
        },
      });
      contactCount += 1;
    }

    // Client notes — 3 to 5 per client
    const noteTotal = faker.number.int({ min: 3, max: 5 });
    for (let n = 0; n < noteTotal; n += 1) {
      if (!owner) break;
      const content = faker.lorem.paragraph({ min: 1, max: 3 });
      const existingNote = await db.clientNote.findFirst({
        where: { clientId: client.id, authorId: owner.userId, content },
      });
      if (existingNote) continue;
      await db.clientNote.create({
        data: {
          clientId: client.id,
          authorId: owner.userId,
          content,
          isPinned: n === 0 && faker.datatype.boolean({ probability: 0.3 }),
          createdAt: faker.date.between({
            from: signupDate,
            to: new Date(),
          }),
        },
      });
      noteCount += 1;
    }
  }

  console.log(`  seeded ${clientCount} clients · ${contactCount} contacts · ${noteCount} notes`);
  return clientIds;
}

async function seedDeals(
  ctx: Ctx,
  clientIds: string[],
  pipelines: Map<string, { id: string; companyType: CompanyType; stages: Array<{ id: string; name: string; probability: number; isWon: boolean; isLost: boolean; stageEnum: DealStage }> }>,
): Promise<void> {
  const dealTotal = faker.number.int({ min: 35, max: 50 });
  let dealCount = 0;
  let activityCount = 0;

  const clients = await db.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, companyId: true, name: true, mrr: true },
  });
  const clientByCompany = new Map<
    string,
    Array<{ id: string; name: string; mrr: Prisma.Decimal | null; companyId: string }>
  >();
  for (const c of clients) {
    const key = c.companyId;
    const arr = clientByCompany.get(key) ?? [];
    arr.push(c);
    clientByCompany.set(key, arr);
  }

  for (let i = 0; i < dealTotal; i += 1) {
    const type = (["DPL", "VCS", "BSL"] as CompanyType[])[i % 3];
    const company = ctx.companies.get(type);
    const pipelineEntry = pipelines.get(type);
    if (!company || !pipelineEntry) continue;

    const companyClients = clientByCompany.get(company.id) ?? [];
    const client = companyClients.length
      ? companyClients[faker.number.int({ min: 0, max: companyClients.length - 1 })]
      : null;

    const stage = faker.helpers.weightedArrayElement([
      { value: pipelineEntry.stages[0], weight: 3 }, // Discovery
      { value: pipelineEntry.stages[1], weight: 4 }, // Qualification
      { value: pipelineEntry.stages[2], weight: 4 }, // Proposal
      { value: pipelineEntry.stages[3], weight: 3 }, // Negotiation
      { value: pipelineEntry.stages[4], weight: 3 }, // Closed Won
      { value: pipelineEntry.stages[5], weight: 2 }, // Closed Lost
    ]);

    const owners = ctx.ownersByCompany.get(type) ?? [];
    const owner = owners.length
      ? owners[faker.number.int({ min: 0, max: owners.length - 1 })]
      : ctx.allOwners[0];

    const currency = faker.helpers.arrayElement(CURRENCIES);
    const baseValue = faker.number.int({ min: 5_000, max: 250_000 });
    const value =
      currency === "PKR" ? baseValue * 280 : currency === "GBP" ? baseValue * 0.8 : currency === "EUR" ? baseValue * 0.92 : baseValue;

    const status: DealStatus = stage.isWon ? "WON" : stage.isLost ? "LOST" : "OPEN";
    const expectedClose = faker.date.soon({ days: 45 });
    const closedAt = stage.isWon || stage.isLost ? faker.date.recent({ days: 30 }) : null;
    const dealAgeDays = faker.number.int({ min: 0, max: 40 });
    const stageEnteredAt = new Date();
    stageEnteredAt.setDate(stageEnteredAt.getDate() - dealAgeDays);

    const title = `${client?.name ?? faker.company.name()} — ${faker.helpers.arrayElement([
      "Q2 expansion",
      "New logo",
      "Renewal uplift",
      "Platform migration",
      "Enterprise plan",
      "Add-on modules",
      "Multi-year commitment",
    ])}`;

    const existing = await db.deal.findFirst({
      where: {
        companyId: company.id,
        pipelineId: pipelineEntry.id,
        title,
      },
    });

    const deal = existing
      ? await db.deal.update({
          where: { id: existing.id },
          data: {
            stageId: stage.id,
            stageEnum: stage.stageEnum,
            ownerId: owner?.userId ?? null,
            ownerEmployeeId: owner?.employeeId ?? null,
            value: new Prisma.Decimal(value.toFixed(2)),
            currency,
            probability: stage.probability,
            status,
            expectedClose,
            closedAt,
            clientId: client?.id ?? null,
            position: new Prisma.Decimal((i + 1) * 65536),
            nextStepAt: stage.isWon || stage.isLost ? null : faker.date.soon({ days: 14 }),
            nextStep: stage.isWon || stage.isLost ? null : faker.lorem.sentence({ min: 5, max: 10 }),
            lostReason: stage.isLost ? faker.lorem.sentence({ min: 5, max: 12 }) : null,
            lostReasonCategory: stage.isLost ? faker.helpers.arrayElement(LOST_REASON_CATEGORIES) : null,
            lostCompetitor: stage.isLost ? faker.helpers.arrayElement(COMPETITORS) : null,
            source: faker.helpers.arrayElement([
              "Referral",
              "Outbound",
              "Inbound",
              "Event",
              "Partner",
              "LinkedIn",
            ]),
            tags: faker.helpers.arrayElements(
              ["priority", "multi-year", "enterprise", "referral", "expansion"],
              { min: 0, max: 2 },
            ),
          },
        })
      : await db.deal.create({
          data: {
            companyId: company.id,
            pipelineId: pipelineEntry.id,
            stageId: stage.id,
            stageEnum: stage.stageEnum,
            clientId: client?.id ?? null,
            ownerId: owner?.userId ?? null,
            ownerEmployeeId: owner?.employeeId ?? null,
            createdById: owner?.userId ?? ctx.allOwners[0]?.userId,
            title,
            description: faker.lorem.paragraph({ min: 1, max: 2 }),
            value: new Prisma.Decimal(value.toFixed(2)),
            currency,
            probability: stage.probability,
            status,
            expectedClose,
            closedAt,
            position: new Prisma.Decimal((i + 1) * 65536),
            nextStepAt: stage.isWon || stage.isLost ? null : faker.date.soon({ days: 14 }),
            nextStep: stage.isWon || stage.isLost ? null : faker.lorem.sentence({ min: 5, max: 10 }),
            lostReason: stage.isLost ? faker.lorem.sentence({ min: 5, max: 12 }) : null,
            lostReasonCategory: stage.isLost ? faker.helpers.arrayElement(LOST_REASON_CATEGORIES) : null,
            lostCompetitor: stage.isLost ? faker.helpers.arrayElement(COMPETITORS) : null,
            source: faker.helpers.arrayElement([
              "Referral",
              "Outbound",
              "Inbound",
              "Event",
              "Partner",
              "LinkedIn",
            ]),
            tags: faker.helpers.arrayElements(
              ["priority", "multi-year", "enterprise", "referral", "expansion"],
              { min: 0, max: 2 },
            ),
          },
        });
    dealCount += 1;

    // Activity history — 3 to 6 entries per deal, spread over days
    const activityTotal = faker.number.int({ min: 3, max: 6 });
    for (let a = 0; a < activityTotal; a += 1) {
      const kind = faker.helpers.arrayElement(DEAL_ACTIVITY_KINDS);
      const createdAt = faker.date.between({
        from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
        to: new Date(),
      });
      // Skip if similar activity already exists for idempotency
      const existingAct = await db.dealActivity.findFirst({
        where: { dealId: deal.id, kind, createdAt },
      });
      if (existingAct) continue;
      await db.dealActivity.create({
        data: {
          dealId: deal.id,
          actorId: owner?.userId ?? null,
          kind,
          fromValue:
            kind === "STAGE_CHANGED"
              ? pipelineEntry.stages[Math.max(0, faker.number.int({ min: 0, max: 2 }))].name
              : null,
          toValue:
            kind === "STAGE_CHANGED"
              ? stage.name
              : kind === "ASSIGNED"
                ? owner?.email ?? null
                : null,
          metadata: {
            note: faker.lorem.sentence({ min: 4, max: 12 }),
          } satisfies Prisma.InputJsonValue,
          createdAt,
        },
      });
      activityCount += 1;
    }
  }

  console.log(`  seeded ${dealCount} deals · ${activityCount} deal activities`);
}

async function main() {
  console.log("→ seeding Slice 3 (pipelines, stages, clients, contacts, deals, notes, activities)");
  const ctx = await loadContext();
  if (ctx.allOwners.length === 0) {
    throw new Error(
      "No employee account owners found — run the Slice 1 employees seed first (pnpm db:seed).",
    );
  }
  const pipelines = await seedPipelines(ctx);
  const clientIds = await seedClientsAndContacts(ctx);
  await seedDeals(ctx, clientIds, pipelines);

  // Verification counts
  const [clients, contacts, pipelineCount, stageCount, deals, activities, notes] = await Promise.all([
    db.client.count({ where: { deletedAt: null } }),
    db.contact.count({ where: { deletedAt: null } }),
    db.pipeline.count({ where: { deletedAt: null } }),
    db.stage.count({ where: { deletedAt: null } }),
    db.deal.count({ where: { deletedAt: null } }),
    db.dealActivity.count(),
    db.clientNote.count({ where: { deletedAt: null } }),
  ]);

  console.log("\n--- Slice 3 counts ---");
  console.log(`  clients:         ${clients}`);
  console.log(`  contacts:        ${contacts}`);
  console.log(`  pipelines:       ${pipelineCount}`);
  console.log(`  stages:          ${stageCount}`);
  console.log(`  deals:           ${deals}`);
  console.log(`  deal activities: ${activities}`);
  console.log(`  client notes:    ${notes}`);
  console.log("✔ Slice 3 seed complete");
}

main()
  .catch((err) => {
    console.error("seed.slice3 failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
