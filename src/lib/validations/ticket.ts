import { z } from "zod";
import {
  CompanyType,
  TicketChannel,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";

export const TicketStatusEnum = z.nativeEnum(TicketStatus);
export const TicketPriorityEnum = z.nativeEnum(TicketPriority);
export const TicketChannelEnum = z.nativeEnum(TicketChannel);
const CompanyTypeEnum = z.nativeEnum(CompanyType);

export const TICKET_STATUS_ORDER: TicketStatus[] = [
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];

export const TicketCreateSchema = z.object({
  companyType: CompanyTypeEnum,
  clientId: z.string().cuid().optional().nullable(),
  subject: z.string().min(1).max(300),
  description: z.string().min(1).max(20_000),
  status: TicketStatusEnum.default("OPEN"),
  priority: TicketPriorityEnum.default("NORMAL"),
  channel: TicketChannelEnum.default("WEB"),
  category: z.string().max(120).optional().nullable(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  assigneeEmployeeId: z.string().cuid().optional().nullable(),
  slaId: z.string().cuid().optional().nullable(),
  dueAt: z.coerce.date().optional().nullable(),
});
export type TicketCreateInput = z.infer<typeof TicketCreateSchema>;

export const TicketUpdateSchema = TicketCreateSchema.partial().extend({
  satisfactionScore: z.coerce.number().int().min(1).max(5).optional().nullable(),
  satisfactionComment: z.string().max(2000).optional().nullable(),
  resolvedAt: z.coerce.date().optional().nullable(),
  closedAt: z.coerce.date().optional().nullable(),
});
export type TicketUpdateInput = z.infer<typeof TicketUpdateSchema>;

export const TicketListQuerySchema = z.object({
  q: z.string().max(200).optional(),
  company: z
    .union([CompanyTypeEnum, z.array(CompanyTypeEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  status: z
    .union([TicketStatusEnum, z.array(TicketStatusEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  priority: z
    .union([TicketPriorityEnum, z.array(TicketPriorityEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  channel: z
    .union([TicketChannelEnum, z.array(TicketChannelEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  clientId: z.string().cuid().optional(),
  assigneeEmployeeId: z
    .union([z.string().cuid(), z.literal("me"), z.literal("unassigned")])
    .optional(),
  reporterId: z.string().cuid().optional(),
  slaBreaching: z.coerce.boolean().default(false),
  includeClosed: z.coerce.boolean().default(true),
  includeDeleted: z.coerce.boolean().default(false),
  onlyDeleted: z.coerce.boolean().default(false),
  sort: z
    .enum([
      "createdAt",
      "-createdAt",
      "updatedAt",
      "-updatedAt",
      "priority",
      "-priority",
      "responseDueAt",
      "-responseDueAt",
      "resolutionDueAt",
      "-resolutionDueAt",
      "number",
      "-number",
    ])
    .default("-createdAt"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type TicketListQuery = z.infer<typeof TicketListQuerySchema>;

export const TicketAssignSchema = z.object({
  assigneeEmployeeId: z.string().cuid().nullable(),
});
export type TicketAssignInput = z.infer<typeof TicketAssignSchema>;

export const TicketMoveStatusSchema = z.object({
  status: TicketStatusEnum,
  note: z.string().max(2000).optional(),
});
export type TicketMoveStatusInput = z.infer<typeof TicketMoveStatusSchema>;

export const TicketBulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("delete"),
    ids: z.array(z.string().cuid()).min(1).max(200),
  }),
  z.object({
    action: z.literal("assign"),
    ids: z.array(z.string().cuid()).min(1).max(200),
    assigneeEmployeeId: z.string().cuid().nullable(),
  }),
  z.object({
    action: z.literal("updateStatus"),
    ids: z.array(z.string().cuid()).min(1).max(200),
    status: TicketStatusEnum,
  }),
  z.object({
    action: z.literal("updatePriority"),
    ids: z.array(z.string().cuid()).min(1).max(200),
    priority: TicketPriorityEnum,
  }),
]);
export type TicketBulkActionInput = z.infer<typeof TicketBulkActionSchema>;

export const TicketMessageCreateSchema = z.object({
  content: z.string().min(1).max(20_000),
  isInternal: z.boolean().default(false),
});
export type TicketMessageCreateInput = z.infer<typeof TicketMessageCreateSchema>;

export const TicketMessageUpdateSchema = z.object({
  content: z.string().min(1).max(20_000),
});
export type TicketMessageUpdateInput = z.infer<typeof TicketMessageUpdateSchema>;

export const TicketWatcherSchema = z.object({
  userId: z.string().cuid(),
});
export type TicketWatcherInput = z.infer<typeof TicketWatcherSchema>;

export const SlaCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  responseMinutes: z.coerce.number().int().min(1).max(60 * 24 * 30),
  resolutionMinutes: z.coerce.number().int().min(1).max(60 * 24 * 365),
  businessHoursOnly: z.boolean().default(true),
  appliesToPriority: TicketPriorityEnum.optional().nullable(),
  isActive: z.boolean().default(true),
});
export type SlaCreateInput = z.infer<typeof SlaCreateSchema>;

export const SlaUpdateSchema = SlaCreateSchema.partial();
export type SlaUpdateInput = z.infer<typeof SlaUpdateSchema>;
