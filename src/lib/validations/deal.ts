import { z } from "zod";
import { CompanyType, DealStage, DealStatus } from "@prisma/client";

export const DealStatusEnum = z.nativeEnum(DealStatus);
export const DealStageEnum = z.nativeEnum(DealStage);
const CompanyTypeEnum = z.nativeEnum(CompanyType);

export const DEAL_CURRENCY_CODES = ["USD", "EUR", "GBP", "PKR", "AED", "CAD", "AUD"] as const;

export const DealCreateSchema = z.object({
  companyType: CompanyTypeEnum,
  pipelineId: z.string().cuid(),
  stageId: z.string().cuid(),
  clientId: z.string().cuid().optional().nullable(),
  title: z.string().min(1).max(300),
  description: z.string().max(10_000).optional().nullable(),
  value: z.coerce.number().nonnegative().max(1_000_000_000).default(0),
  currency: z.enum(DEAL_CURRENCY_CODES).default("USD"),
  probability: z.coerce.number().int().min(0).max(100).optional(),
  status: DealStatusEnum.default("OPEN"),
  expectedClose: z.coerce.date().optional().nullable(),
  nextStepAt: z.coerce.date().optional().nullable(),
  nextStep: z.string().max(500).optional().nullable(),
  source: z.string().max(80).optional().nullable(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  ownerEmployeeId: z.string().cuid().optional().nullable(),
});
export type DealCreateInput = z.infer<typeof DealCreateSchema>;

export const DealUpdateSchema = DealCreateSchema.partial().extend({
  lostReason: z.string().max(500).optional().nullable(),
  lostReasonCategory: z.string().max(60).optional().nullable(),
  lostCompetitor: z.string().max(120).optional().nullable(),
  closedAt: z.coerce.date().optional().nullable(),
});
export type DealUpdateInput = z.infer<typeof DealUpdateSchema>;

export const DealMoveSchema = z.object({
  stageId: z.string().cuid(),
  prevId: z.string().cuid().optional().nullable(),
  nextId: z.string().cuid().optional().nullable(),
  expectedUpdatedAt: z.coerce.date().optional(),
});
export type DealMoveInput = z.infer<typeof DealMoveSchema>;

export const DealAssignSchema = z.object({
  ownerEmployeeId: z.string().cuid().nullable(),
});
export type DealAssignInput = z.infer<typeof DealAssignSchema>;

export const DealListQuerySchema = z.object({
  q: z.string().max(200).optional(),
  pipelineId: z.string().cuid().optional(),
  stageId: z
    .union([z.string().cuid(), z.array(z.string().cuid())])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  status: z
    .union([DealStatusEnum, z.array(DealStatusEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  clientId: z.string().cuid().optional(),
  ownerEmployeeId: z.string().cuid().optional(),
  minValue: z.coerce.number().nonnegative().optional(),
  maxValue: z.coerce.number().nonnegative().optional(),
  closingBefore: z.coerce.date().optional(),
  closingAfter: z.coerce.date().optional(),
  stuckDays: z.coerce.number().int().nonnegative().optional(),
  includeDeleted: z.coerce.boolean().default(false),
  onlyDeleted: z.coerce.boolean().default(false),
  sort: z
    .enum([
      "position",
      "-position",
      "value",
      "-value",
      "expectedClose",
      "-expectedClose",
      "createdAt",
      "-createdAt",
      "updatedAt",
      "-updatedAt",
    ])
    .default("position"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(200),
});
export type DealListQuery = z.infer<typeof DealListQuerySchema>;

export const DealBulkActionSchema = z.discriminatedUnion("action", [
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
    action: z.literal("moveStage"),
    ids: z.array(z.string().cuid()).min(1).max(200),
    stageId: z.string().cuid(),
  }),
  z.object({
    action: z.literal("close"),
    ids: z.array(z.string().cuid()).min(1).max(200),
    status: z.enum(["WON", "LOST"]),
    lostReason: z.string().max(500).optional(),
    lostReasonCategory: z.string().max(60).optional(),
  }),
]);
export type DealBulkActionInput = z.infer<typeof DealBulkActionSchema>;

export const PipelineCreateSchema = z.object({
  companyType: CompanyTypeEnum.optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  isDefault: z.boolean().default(false),
});
export type PipelineCreateInput = z.infer<typeof PipelineCreateSchema>;

export const PipelineUpdateSchema = PipelineCreateSchema.partial();
export type PipelineUpdateInput = z.infer<typeof PipelineUpdateSchema>;

export const StageCreateSchema = z.object({
  pipelineId: z.string().cuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  probability: z.coerce.number().int().min(0).max(100).default(0),
  isWon: z.boolean().default(false),
  isLost: z.boolean().default(false),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  prevId: z.string().cuid().optional().nullable(),
  nextId: z.string().cuid().optional().nullable(),
});
export type StageCreateInput = z.infer<typeof StageCreateSchema>;

export const StageUpdateSchema = StageCreateSchema.partial().omit({ pipelineId: true });
export type StageUpdateInput = z.infer<typeof StageUpdateSchema>;
