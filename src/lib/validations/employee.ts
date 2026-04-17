import { z } from "zod";
import { CompanyType, EmployeeStatus, UserRole } from "@prisma/client";

export const EmployeeStatusEnum = z.nativeEnum(EmployeeStatus);
export const UserRoleEnum = z.nativeEnum(UserRole);
export const CompanyTypeEnum = z.nativeEnum(CompanyType);

export const EmploymentTypeEnum = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
]);
export type EmploymentType = z.infer<typeof EmploymentTypeEnum>;

export const WorkLocationEnum = z.enum(["REMOTE", "HYBRID", "ONSITE"]);
export type WorkLocation = z.infer<typeof WorkLocationEnum>;

const AddressSchema = z
  .object({
    line1: z.string().max(200).optional(),
    line2: z.string().max(200).optional(),
    city: z.string().max(120).optional(),
    state: z.string().max(120).optional(),
    postalCode: z.string().max(40).optional(),
    country: z.string().max(120).optional(),
  })
  .partial();

const EmergencyContactSchema = z
  .object({
    name: z.string().max(120).optional(),
    relation: z.string().max(60).optional(),
    phone: z.string().max(40).optional(),
    email: z.string().email().optional().or(z.literal("")),
  })
  .partial();

export const EmployeeCreateSchema = z.object({
  email: z.string().email().max(200),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().max(40).optional().nullable(),
  userRole: UserRoleEnum.default("EMPLOYEE"),
  companyType: CompanyTypeEnum,
  departmentId: z.string().cuid().optional().nullable(),
  roleId: z.string().cuid().optional().nullable(),
  managerId: z.string().cuid().optional().nullable(),
  position: z.string().max(160).optional().nullable(),
  employmentType: EmploymentTypeEnum.optional().nullable(),
  workLocation: WorkLocationEnum.optional().nullable(),
  hireDate: z.coerce.date().optional().nullable(),
  probationEndDate: z.coerce.date().optional().nullable(),
  birthday: z.coerce.date().optional().nullable(),
  salary: z.coerce.number().nonnegative().max(1_000_000).optional().nullable(),
  salaryCurrency: z.string().length(3).default("USD"),
  timezone: z.string().max(80).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  linkedinUrl: z.string().url().max(400).optional().nullable().or(z.literal("")),
  githubUrl: z.string().url().max(400).optional().nullable().or(z.literal("")),
  skills: z.array(z.string().max(60)).max(40).default([]),
  address: AddressSchema.optional().nullable(),
  emergencyContact: EmergencyContactSchema.optional().nullable(),
  status: EmployeeStatusEnum.default("ACTIVE"),
  sendInvite: z.boolean().default(false),
});
export type EmployeeCreateInput = z.infer<typeof EmployeeCreateSchema>;

export const EmployeeUpdateSchema = EmployeeCreateSchema.partial().extend({
  email: z.string().email().optional(),
});
export type EmployeeUpdateInput = z.infer<typeof EmployeeUpdateSchema>;

export const EmployeeListQuerySchema = z.object({
  q: z.string().max(200).optional(),
  company: z
    .union([CompanyTypeEnum, z.array(CompanyTypeEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  departmentId: z
    .union([z.string().cuid(), z.array(z.string().cuid())])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  roleId: z
    .union([z.string().cuid(), z.array(z.string().cuid())])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  status: z
    .union([EmployeeStatusEnum, z.array(EmployeeStatusEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  employmentType: z
    .union([EmploymentTypeEnum, z.array(EmploymentTypeEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  workLocation: z
    .union([WorkLocationEnum, z.array(WorkLocationEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  managerId: z.string().cuid().optional(),
  includeDeleted: z.coerce.boolean().default(false),
  onlyDeleted: z.coerce.boolean().default(false),
  sort: z
    .enum([
      "name",
      "-name",
      "hireDate",
      "-hireDate",
      "status",
      "-status",
      "createdAt",
      "-createdAt",
    ])
    .default("-createdAt"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type EmployeeListQuery = z.infer<typeof EmployeeListQuerySchema>;

export const EmployeeBulkUpdateSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(200),
  patch: z
    .object({
      status: EmployeeStatusEnum.optional(),
      departmentId: z.string().cuid().nullable().optional(),
      roleId: z.string().cuid().nullable().optional(),
      managerId: z.string().cuid().nullable().optional(),
      employmentType: EmploymentTypeEnum.nullable().optional(),
      workLocation: WorkLocationEnum.nullable().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "patch must have at least one field",
    }),
});
export type EmployeeBulkUpdateInput = z.infer<typeof EmployeeBulkUpdateSchema>;

export const EmployeeBulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(200),
});
export type EmployeeBulkDeleteInput = z.infer<typeof EmployeeBulkDeleteSchema>;

export const EmployeeInviteSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  companyType: CompanyTypeEnum,
  departmentId: z.string().cuid().optional().nullable(),
  roleId: z.string().cuid().optional().nullable(),
  userRole: UserRoleEnum.default("EMPLOYEE"),
});
export type EmployeeInviteInput = z.infer<typeof EmployeeInviteSchema>;

export const EmployeeImportRowSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyType: CompanyTypeEnum,
  departmentCode: z.string().optional(),
  roleName: z.string().optional(),
  position: z.string().optional(),
  employmentType: EmploymentTypeEnum.optional(),
  workLocation: WorkLocationEnum.optional(),
  hireDate: z.coerce.date().optional(),
  salary: z.coerce.number().nonnegative().optional(),
});
export type EmployeeImportRow = z.infer<typeof EmployeeImportRowSchema>;
