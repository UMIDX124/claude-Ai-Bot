import type {
  ClientHealth,
  ClientStatus,
  CompanyType,
  ContactKind,
} from "@prisma/client";

export type ClientRow = {
  id: string;
  companyId: string;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  country: string | null;
  city: string | null;
  status: ClientStatus;
  health: ClientHealth;
  healthScore: number | null;
  accountTier: string | null;
  logoUrl: string | null;
  slackChannel: string | null;
  mrr: string | null;
  arr: string | null;
  lifetimeValue: string | null;
  signupDate: string | null;
  renewalDate: string | null;
  churnDate: string | null;
  ownerEmployeeId: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  company: { id: string; type: CompanyType; name: string };
  ownerEmployee: {
    id: string;
    employeeCode: string | null;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      fullName: string | null;
      avatarUrl: string | null;
    };
  } | null;
  _count: { contacts: number; deals: number; notesLog: number };
};

export type ClientListResponse = {
  items: ClientRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type ContactRow = {
  id: string;
  clientId: string;
  kind: ContactKind;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  department: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  birthday: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientNoteRow = {
  id: string;
  clientId: string;
  authorId: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export type ClientFilters = {
  q?: string;
  company?: CompanyType[];
  status?: ClientStatus[];
  health?: ClientHealth[];
  tier?: string;
  ownerEmployeeId?: string;
  renewalBefore?: string | Date;
  renewalAfter?: string | Date;
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export type ClientPermissions = {
  create: boolean;
  update: boolean;
  updateAny: boolean;
  delete: boolean;
  bulk: boolean;
  export: boolean;
};
