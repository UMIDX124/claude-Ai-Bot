import type {
  CompanyType,
  EmployeeStatus,
  UserRole,
} from "@prisma/client";

export type EmployeeRow = {
  id: string;
  userId: string;
  employeeCode: string | null;
  position: string | null;
  status: EmployeeStatus;
  employmentType: string | null;
  workLocation: string | null;
  hireDate: string | null;
  probationEndDate: string | null;
  terminationDate: string | null;
  terminationReason: string | null;
  salary: string | null;
  salaryCurrency: string;
  salaryVisible: boolean;
  timezone: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  skills: string[];
  address: { city?: string; country?: string; state?: string; line1?: string } | null;
  emergencyContact: { name?: string; relation?: string; phone?: string; email?: string } | null;
  deletedAt: string | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    role: UserRole;
  };
  company: { id: string; type: CompanyType; name: string };
  department: { id: string; name: string; code: string | null; color: string | null } | null;
  role: { id: string; name: string; seniority: string | null } | null;
  manager: {
    id: string;
    employeeCode: string | null;
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
      fullName: string | null;
    };
  } | null;
};

export type EmployeeListResponse = {
  items: EmployeeRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type DepartmentOption = {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
  company: { id: string; type: CompanyType; name: string };
  _count: { employees: number; roles: number };
};

export type RoleOption = {
  id: string;
  name: string;
  seniority: string | null;
  department: { id: string; name: string; companyId: string } | null;
  _count: { employees: number };
};

export type EmployeeFilters = {
  q?: string;
  company?: CompanyType[];
  departmentId?: string[];
  roleId?: string[];
  status?: EmployeeStatus[];
  employmentType?: string[];
  workLocation?: string[];
  managerId?: string | null;
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};
