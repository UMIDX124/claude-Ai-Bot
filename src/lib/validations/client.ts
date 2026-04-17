import { z } from "zod";
import { ClientHealth, ClientStatus, CompanyType, ContactKind } from "@prisma/client";

export const ClientStatusEnum = z.nativeEnum(ClientStatus);
export const ClientHealthEnum = z.nativeEnum(ClientHealth);
export const CompanyTypeEnum = z.nativeEnum(CompanyType);
export const ContactKindEnum = z.nativeEnum(ContactKind);

export const CLIENT_TAGS_MAX = 20;
export const CURRENCY_REGEX = /^[A-Z]{3}$/;

export const ClientCreateSchema = z.object({
  companyType: CompanyTypeEnum,
  name: z.string().min(1).max(200),
  legalName: z.string().max(200).optional().nullable(),
  email: z.string().email().max(320).optional().nullable().or(z.literal("")),
  phone: z.string().max(40).optional().nullable(),
  website: z.string().url().max(400).optional().nullable().or(z.literal("")),
  industry: z.string().max(120).optional().nullable(),
  country: z.string().max(120).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  status: ClientStatusEnum.default("PROSPECT"),
  health: ClientHealthEnum.default("UNKNOWN"),
  healthScore: z.coerce.number().int().min(0).max(100).optional().nullable(),
  accountTier: z.string().max(60).optional().nullable(),
  logoUrl: z.string().url().max(600).optional().nullable().or(z.literal("")),
  slackChannel: z.string().max(120).optional().nullable(),
  mrr: z.coerce.number().nonnegative().max(10_000_000).optional().nullable(),
  arr: z.coerce.number().nonnegative().max(100_000_000).optional().nullable(),
  lifetimeValue: z.coerce.number().nonnegative().max(1_000_000_000).optional().nullable(),
  signupDate: z.coerce.date().optional().nullable(),
  renewalDate: z.coerce.date().optional().nullable(),
  churnDate: z.coerce.date().optional().nullable(),
  ownerEmployeeId: z.string().cuid().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string().max(40)).max(CLIENT_TAGS_MAX).default([]),
});
export type ClientCreateInput = z.infer<typeof ClientCreateSchema>;

export const ClientUpdateSchema = ClientCreateSchema.partial();
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;

export const ClientListQuerySchema = z.object({
  q: z.string().max(200).optional(),
  company: z
    .union([CompanyTypeEnum, z.array(CompanyTypeEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  status: z
    .union([ClientStatusEnum, z.array(ClientStatusEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  health: z
    .union([ClientHealthEnum, z.array(ClientHealthEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  tier: z.string().max(60).optional(),
  ownerEmployeeId: z.string().cuid().optional(),
  renewalBefore: z.coerce.date().optional(),
  renewalAfter: z.coerce.date().optional(),
  includeDeleted: z.coerce.boolean().default(false),
  onlyDeleted: z.coerce.boolean().default(false),
  sort: z
    .enum([
      "name",
      "-name",
      "mrr",
      "-mrr",
      "arr",
      "-arr",
      "healthScore",
      "-healthScore",
      "renewalDate",
      "-renewalDate",
      "createdAt",
      "-createdAt",
    ])
    .default("-createdAt"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type ClientListQuery = z.infer<typeof ClientListQuerySchema>;

export const ContactCreateSchema = z.object({
  kind: ContactKindEnum.default("PRIMARY"),
  firstName: z.string().max(120).optional().nullable(),
  lastName: z.string().max(120).optional().nullable(),
  email: z.string().email().max(320).optional().nullable().or(z.literal("")),
  phone: z.string().max(40).optional().nullable(),
  title: z.string().max(160).optional().nullable(),
  department: z.string().max(120).optional().nullable(),
  linkedinUrl: z.string().url().max(400).optional().nullable().or(z.literal("")),
  avatarUrl: z.string().url().max(600).optional().nullable().or(z.literal("")),
  timezone: z.string().max(80).optional().nullable(),
  birthday: z.coerce.date().optional().nullable(),
  isPrimary: z.boolean().default(false),
  notes: z.string().max(3000).optional().nullable(),
});
export type ContactCreateInput = z.infer<typeof ContactCreateSchema>;

export const ContactUpdateSchema = ContactCreateSchema.partial();
export type ContactUpdateInput = z.infer<typeof ContactUpdateSchema>;

export const ClientNoteCreateSchema = z.object({
  content: z.string().min(1).max(10_000),
  isPinned: z.boolean().default(false),
});
export type ClientNoteCreateInput = z.infer<typeof ClientNoteCreateSchema>;

export const ClientNoteUpdateSchema = ClientNoteCreateSchema.partial();

export const ClientBulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("delete"),
    ids: z.array(z.string().cuid()).min(1).max(200),
  }),
  z.object({
    action: z.literal("assign"),
    ids: z.array(z.string().cuid()).min(1).max(200),
    ownerEmployeeId: z.string().cuid().nullable(),
  }),
  z.object({
    action: z.literal("updateStatus"),
    ids: z.array(z.string().cuid()).min(1).max(200),
    status: ClientStatusEnum,
  }),
  z.object({
    action: z.literal("updateTier"),
    ids: z.array(z.string().cuid()).min(1).max(200),
    accountTier: z.string().max(60),
  }),
]);
export type ClientBulkActionInput = z.infer<typeof ClientBulkActionSchema>;
