import { Prisma } from "@prisma/client";
import type { ClientStatus, User } from "@prisma/client";
import { db } from "@/lib/db";
import { audit, diff as auditDiff } from "@/lib/audit";
import { assertCan, can } from "@/lib/rbac";
import type {
  ClientBulkActionInput,
  ClientCreateInput,
  ClientListQuery,
  ClientNoteCreateInput,
  ClientUpdateInput,
  ContactCreateInput,
  ContactUpdateInput,
} from "@/lib/validations/client";

const CLIENT_INCLUDE = {
  company: { select: { id: true, type: true, name: true } },
  ownerEmployee: {
    select: {
      id: true,
      employeeCode: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  },
  _count: {
    select: {
      contacts: { where: { deletedAt: null } },
      deals: { where: { deletedAt: null } },
      notesLog: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.ClientInclude;

export type ClientWithRelations = Prisma.ClientGetPayload<{
  include: typeof CLIENT_INCLUDE;
}>;

export type ClientListResult = {
  items: ClientWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

type RequestMeta = { ipAddress?: string | null; userAgent?: string | null };

function statusError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

function employeeOwnerEmail(client: ClientWithRelations): string | null {
  return client.ownerEmployee?.user.email ?? null;
}

async function resolveCompanyId(companyType: string): Promise<string> {
  const company = await db.company.findUnique({
    where: { type: companyType as never },
  });
  if (!company) throw statusError(400, `Unknown company: ${companyType}`);
  return company.id;
}

export async function listClients(
  viewer: User,
  query: ClientListQuery,
): Promise<ClientListResult> {
  assertCan(viewer, "clients.read");

  const where: Prisma.ClientWhereInput = {};
  if (query.onlyDeleted) where.deletedAt = { not: null };
  else if (!query.includeDeleted) where.deletedAt = null;

  if (query.company?.length) {
    where.company = { type: { in: query.company } };
  }
  if (query.status?.length) where.status = { in: query.status };
  if (query.health?.length) where.health = { in: query.health };
  if (query.tier) where.accountTier = query.tier;
  if (query.ownerEmployeeId) where.ownerEmployeeId = query.ownerEmployeeId;

  if (query.renewalBefore || query.renewalAfter) {
    const filter: Prisma.DateTimeFilter = {};
    if (query.renewalBefore) filter.lte = query.renewalBefore;
    if (query.renewalAfter) filter.gte = query.renewalAfter;
    where.renewalDate = filter;
  }

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { legalName: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } },
      { industry: { contains: query.q, mode: "insensitive" } },
      { city: { contains: query.q, mode: "insensitive" } },
      { country: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const orderBy = parseSort(query.sort);
  const skip = (query.page - 1) * query.pageSize;

  const [total, rows] = await db.$transaction([
    db.client.count({ where }),
    db.client.findMany({
      where,
      include: CLIENT_INCLUDE,
      orderBy,
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    items: rows,
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

function parseSort(
  sort: ClientListQuery["sort"],
): Prisma.ClientOrderByWithRelationInput | Prisma.ClientOrderByWithRelationInput[] {
  const dir = sort.startsWith("-") ? "desc" : "asc";
  const key = sort.replace(/^-/, "");
  switch (key) {
    case "name":
      return { name: dir };
    case "mrr":
      return { mrr: { sort: dir, nulls: "last" } };
    case "arr":
      return { arr: { sort: dir, nulls: "last" } };
    case "healthScore":
      return { healthScore: { sort: dir, nulls: "last" } };
    case "renewalDate":
      return { renewalDate: { sort: dir, nulls: "last" } };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}

export async function getClient(viewer: User, id: string) {
  assertCan(viewer, "clients.read");
  return db.client.findUnique({ where: { id }, include: CLIENT_INCLUDE });
}

export async function createClient(
  actor: User,
  input: ClientCreateInput,
  meta: RequestMeta = {},
): Promise<ClientWithRelations> {
  assertCan(actor, "clients.create");
  const companyId = await resolveCompanyId(input.companyType);

  const created = await db.client.create({
    data: {
      companyId,
      name: input.name,
      legalName: input.legalName ?? null,
      email: input.email ? input.email : null,
      phone: input.phone ?? null,
      website: input.website ? input.website : null,
      industry: input.industry ?? null,
      country: input.country ?? null,
      city: input.city ?? null,
      status: input.status,
      health: input.health,
      healthScore: input.healthScore ?? null,
      accountTier: input.accountTier ?? null,
      logoUrl: input.logoUrl ? input.logoUrl : null,
      slackChannel: input.slackChannel ?? null,
      mrr: input.mrr ?? null,
      arr: input.arr ?? null,
      lifetimeValue: input.lifetimeValue ?? null,
      signupDate: input.signupDate ?? null,
      renewalDate: input.renewalDate ?? null,
      churnDate: input.churnDate ?? null,
      ownerEmployeeId: input.ownerEmployeeId ?? null,
      notes: input.notes ?? null,
      tags: input.tags ?? [],
    },
    include: CLIENT_INCLUDE,
  });

  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "Client",
    resourceId: created.id,
    after: auditShape(created),
    ...meta,
  });
  return created;
}

export async function updateClient(
  actor: User,
  id: string,
  input: ClientUpdateInput,
  meta: RequestMeta = {},
): Promise<ClientWithRelations> {
  const before = await db.client.findUnique({ where: { id }, include: CLIENT_INCLUDE });
  if (!before) throw statusError(404, "Client not found");
  await assertCanEditClient(actor, before);

  const data: Prisma.ClientUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.legalName !== undefined) data.legalName = input.legalName;
  if (input.email !== undefined) data.email = input.email || null;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.website !== undefined) data.website = input.website || null;
  if (input.industry !== undefined) data.industry = input.industry;
  if (input.country !== undefined) data.country = input.country;
  if (input.city !== undefined) data.city = input.city;
  if (input.status !== undefined) data.status = input.status;
  if (input.health !== undefined) data.health = input.health;
  if (input.healthScore !== undefined) data.healthScore = input.healthScore;
  if (input.accountTier !== undefined) data.accountTier = input.accountTier;
  if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl || null;
  if (input.slackChannel !== undefined) data.slackChannel = input.slackChannel;
  if (input.mrr !== undefined) data.mrr = input.mrr ?? null;
  if (input.arr !== undefined) data.arr = input.arr ?? null;
  if (input.lifetimeValue !== undefined) data.lifetimeValue = input.lifetimeValue ?? null;
  if (input.signupDate !== undefined) data.signupDate = input.signupDate;
  if (input.renewalDate !== undefined) data.renewalDate = input.renewalDate;
  if (input.churnDate !== undefined) data.churnDate = input.churnDate;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.ownerEmployeeId !== undefined) {
    data.ownerEmployee = input.ownerEmployeeId
      ? { connect: { id: input.ownerEmployeeId } }
      : { disconnect: true };
  }
  if (input.companyType !== undefined) {
    const companyId = await resolveCompanyId(input.companyType);
    data.company = { connect: { id: companyId } };
  }

  const updated = await db.client.update({
    where: { id },
    data,
    include: CLIENT_INCLUDE,
  });

  const changed = auditDiff(auditShape(before), auditShape(updated));
  await audit({
    actorId: actor.id,
    action: "UPDATE",
    resourceType: "Client",
    resourceId: id,
    before: changed.before,
    after: changed.after,
    metadata: employeeOwnerEmail(updated)
      ? { ownerEmail: employeeOwnerEmail(updated) }
      : undefined,
    ...meta,
  });
  return updated;
}

export async function softDeleteClient(
  actor: User,
  id: string,
  meta: RequestMeta = {},
): Promise<void> {
  assertCan(actor, "clients.delete");
  const before = await db.client.findUnique({ where: { id } });
  if (!before) throw statusError(404, "Client not found");
  await db.client.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "Client",
    resourceId: id,
    before: { name: before.name, status: before.status },
    ...meta,
  });
}

export async function restoreClient(
  actor: User,
  id: string,
  meta: RequestMeta = {},
): Promise<ClientWithRelations> {
  assertCan(actor, "clients.delete");
  const before = await db.client.findUnique({ where: { id } });
  if (!before) throw statusError(404, "Client not found");
  const restored = await db.client.update({
    where: { id },
    data: { deletedAt: null },
    include: CLIENT_INCLUDE,
  });
  await audit({
    actorId: actor.id,
    action: "RESTORE",
    resourceType: "Client",
    resourceId: id,
    ...meta,
  });
  return restored;
}

export async function bulkClientAction(
  actor: User,
  input: ClientBulkActionInput,
  meta: RequestMeta = {},
): Promise<{ affected: number }> {
  assertCan(actor, "clients.bulk");

  let result: { count: number };
  switch (input.action) {
    case "delete":
      assertCan(actor, "clients.delete");
      result = await db.client.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      break;
    case "assign":
      assertCan(actor, "clients.update.any");
      result = await db.client.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: { ownerEmployeeId: input.ownerEmployeeId },
      });
      break;
    case "updateStatus":
      assertCan(actor, "clients.update.any");
      result = await db.client.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: { status: input.status as ClientStatus },
      });
      break;
    case "updateTier":
      assertCan(actor, "clients.update.any");
      result = await db.client.updateMany({
        where: { id: { in: input.ids }, deletedAt: null },
        data: { accountTier: input.accountTier },
      });
      break;
  }

  await audit({
    actorId: actor.id,
    action: input.action === "delete" ? "DELETE" : "UPDATE",
    resourceType: "Client",
    metadata: { action: input.action, ids: input.ids, affected: result.count },
    ...meta,
  });
  return { affected: result.count };
}

export async function exportClientsCsv(
  actor: User,
  query: ClientListQuery,
): Promise<string> {
  assertCan(actor, "clients.export");
  const list = await listClients(actor, {
    ...query,
    page: 1,
    pageSize: 1000,
  });
  const header = [
    "id",
    "name",
    "legalName",
    "company",
    "email",
    "phone",
    "website",
    "industry",
    "country",
    "city",
    "status",
    "health",
    "healthScore",
    "accountTier",
    "mrr",
    "arr",
    "signupDate",
    "renewalDate",
    "ownerEmail",
    "tags",
  ];
  const rows = list.items.map((c) =>
    [
      c.id,
      c.name,
      c.legalName ?? "",
      c.company.type,
      c.email ?? "",
      c.phone ?? "",
      c.website ?? "",
      c.industry ?? "",
      c.country ?? "",
      c.city ?? "",
      c.status,
      c.health,
      c.healthScore?.toString() ?? "",
      c.accountTier ?? "",
      c.mrr?.toString() ?? "",
      c.arr?.toString() ?? "",
      c.signupDate ? c.signupDate.toISOString().slice(0, 10) : "",
      c.renewalDate ? c.renewalDate.toISOString().slice(0, 10) : "",
      employeeOwnerEmail(c) ?? "",
      (c.tags ?? []).join("|"),
    ].map(csvCell).join(","),
  );

  await audit({
    actorId: actor.id,
    action: "EXPORT",
    resourceType: "Client",
    metadata: { count: list.items.length },
  });

  return [header.join(","), ...rows].join("\n");
}

function csvCell(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/* ------------------------------------------------------------------ */
/* Contacts                                                             */
/* ------------------------------------------------------------------ */

export async function listContacts(viewer: User, clientId: string) {
  assertCan(viewer, "clients.read");
  return db.contact.findMany({
    where: { clientId, deletedAt: null },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

export async function addContact(
  actor: User,
  clientId: string,
  input: ContactCreateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "clients.update");
  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) throw statusError(404, "Client not found");
  await assertCanEditClient(actor, client);

  const fullName = [input.firstName, input.lastName].filter(Boolean).join(" ") || null;
  const created = await db.contact.create({
    data: {
      clientId,
      kind: input.kind,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      fullName,
      email: input.email ? input.email : null,
      phone: input.phone ?? null,
      title: input.title ?? null,
      department: input.department ?? null,
      linkedinUrl: input.linkedinUrl ? input.linkedinUrl : null,
      avatarUrl: input.avatarUrl ? input.avatarUrl : null,
      timezone: input.timezone ?? null,
      birthday: input.birthday ?? null,
      isPrimary: input.isPrimary,
      notes: input.notes ?? null,
    },
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "Contact",
    resourceId: created.id,
    metadata: { clientId },
    ...meta,
  });
  return created;
}

export async function updateContact(
  actor: User,
  clientId: string,
  contactId: string,
  input: ContactUpdateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "clients.update");
  const contact = await db.contact.findUnique({ where: { id: contactId } });
  if (!contact || contact.clientId !== clientId) {
    throw statusError(404, "Contact not found");
  }
  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) throw statusError(404, "Client not found");
  await assertCanEditClient(actor, client);

  const data: Prisma.ContactUpdateInput = {};
  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName !== undefined) data.lastName = input.lastName;
  if (input.firstName !== undefined || input.lastName !== undefined) {
    const first = input.firstName ?? contact.firstName ?? "";
    const last = input.lastName ?? contact.lastName ?? "";
    data.fullName = [first, last].filter(Boolean).join(" ") || null;
  }
  if (input.email !== undefined) data.email = input.email || null;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.title !== undefined) data.title = input.title;
  if (input.department !== undefined) data.department = input.department;
  if (input.linkedinUrl !== undefined) data.linkedinUrl = input.linkedinUrl || null;
  if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl || null;
  if (input.timezone !== undefined) data.timezone = input.timezone;
  if (input.birthday !== undefined) data.birthday = input.birthday;
  if (input.isPrimary !== undefined) data.isPrimary = input.isPrimary;
  if (input.kind !== undefined) data.kind = input.kind;
  if (input.notes !== undefined) data.notes = input.notes;

  const updated = await db.contact.update({ where: { id: contactId }, data });
  await audit({
    actorId: actor.id,
    action: "UPDATE",
    resourceType: "Contact",
    resourceId: contactId,
    metadata: { clientId },
    ...meta,
  });
  return updated;
}

export async function deleteContact(
  actor: User,
  clientId: string,
  contactId: string,
  meta: RequestMeta = {},
): Promise<void> {
  assertCan(actor, "clients.update");
  const contact = await db.contact.findUnique({ where: { id: contactId } });
  if (!contact || contact.clientId !== clientId) {
    throw statusError(404, "Contact not found");
  }
  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) throw statusError(404, "Client not found");
  await assertCanEditClient(actor, client);
  await db.contact.update({
    where: { id: contactId },
    data: { deletedAt: new Date() },
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "Contact",
    resourceId: contactId,
    metadata: { clientId },
    ...meta,
  });
}

/* ------------------------------------------------------------------ */
/* Notes                                                                */
/* ------------------------------------------------------------------ */

export async function listClientNotes(viewer: User, clientId: string) {
  assertCan(viewer, "clients.read");
  return db.clientNote.findMany({
    where: { clientId, deletedAt: null },
    include: {
      author: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
}

export async function addClientNote(
  actor: User,
  clientId: string,
  input: ClientNoteCreateInput,
  meta: RequestMeta = {},
) {
  assertCan(actor, "clients.update");
  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) throw statusError(404, "Client not found");

  const created = await db.clientNote.create({
    data: {
      clientId,
      authorId: actor.id,
      content: input.content,
      isPinned: input.isPinned,
    },
    include: {
      author: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
    },
  });
  await audit({
    actorId: actor.id,
    action: "CREATE",
    resourceType: "ClientNote",
    resourceId: created.id,
    metadata: { clientId },
    ...meta,
  });
  return created;
}

export async function deleteClientNote(
  actor: User,
  clientId: string,
  noteId: string,
  meta: RequestMeta = {},
): Promise<void> {
  const note = await db.clientNote.findUnique({ where: { id: noteId } });
  if (!note || note.clientId !== clientId) {
    throw statusError(404, "Note not found");
  }
  if (note.authorId !== actor.id) assertCan(actor, "clients.update.any");
  await db.clientNote.update({
    where: { id: noteId },
    data: { deletedAt: new Date() },
  });
  await audit({
    actorId: actor.id,
    action: "DELETE",
    resourceType: "ClientNote",
    resourceId: noteId,
    metadata: { clientId },
    ...meta,
  });
}

/* ------------------------------------------------------------------ */
/* RBAC helper                                                          */
/* ------------------------------------------------------------------ */

async function assertCanEditClient(
  actor: User,
  client: { ownerEmployeeId: string | null },
): Promise<void> {
  if (can(actor, "clients.update.any")) return;
  if (!can(actor, "clients.update")) {
    throw permissionError("clients.update");
  }
  // Employee-tier users can only edit clients they own
  const emp = await db.employee.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });
  if (emp && emp.id === client.ownerEmployeeId) return;
  throw permissionError("clients.update.any");
}

function permissionError(perm: string): Error & { status: number } {
  const err = new Error(`Permission denied: ${perm}`) as Error & { status: number };
  err.status = 403;
  return err;
}

function auditShape(c: ClientWithRelations) {
  return {
    id: c.id,
    name: c.name,
    companyId: c.companyId,
    status: c.status,
    health: c.health,
    healthScore: c.healthScore,
    accountTier: c.accountTier,
    ownerEmployeeId: c.ownerEmployeeId,
    mrr: c.mrr?.toString() ?? null,
    arr: c.arr?.toString() ?? null,
    renewalDate: c.renewalDate?.toISOString() ?? null,
    deletedAt: c.deletedAt?.toISOString() ?? null,
  };
}
