import type {
  CompanyType,
  TicketChannel,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";

export type TicketRow = {
  id: string;
  number: number;
  companyId: string;
  clientId: string | null;
  reporterId: string;
  assignedToId: string | null;
  assigneeEmployeeId: string | null;
  slaId: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  channel: TicketChannel;
  category: string | null;
  tags: string[];
  escalationLevel: number;
  satisfactionScore: number | null;
  satisfactionComment: string | null;
  dueAt: string | null;
  acknowledgedAt: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  responseDueAt: string | null;
  resolutionDueAt: string | null;
  responseBreachedAt: string | null;
  resolutionBreachedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  company: { id: string; type: CompanyType; name: string };
  client: {
    id: string;
    name: string;
    logoUrl: string | null;
    accountTier: string | null;
  } | null;
  reporter: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  assignedTo: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  assigneeEmployee: {
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
  sla: {
    id: string;
    name: string;
    responseMinutes: number;
    resolutionMinutes: number;
  } | null;
  watchers: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      email: string;
      fullName: string | null;
      avatarUrl: string | null;
    };
  }>;
  _count: { messages: number; activities: number; watchers: number };
};

export type TicketListResponse = {
  items: TicketRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type TicketMessageRow = {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export type TicketActivityRow = {
  id: string;
  ticketId: string;
  actorId: string | null;
  kind: string;
  fromValue: string | null;
  toValue: string | null;
  metadata: unknown;
  createdAt: string;
};

export type SlaRow = {
  id: string;
  name: string;
  description: string | null;
  responseMinutes: number;
  resolutionMinutes: number;
  businessHoursOnly: boolean;
  appliesToPriority: TicketPriority | null;
  isActive: boolean;
};

export type TicketFilters = {
  q?: string;
  company?: CompanyType[];
  status?: TicketStatus[];
  priority?: TicketPriority[];
  channel?: TicketChannel[];
  clientId?: string;
  assigneeEmployeeId?: string | "me" | "unassigned";
  slaBreaching?: boolean;
  includeClosed?: boolean;
  includeDeleted?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export type TicketPermissions = {
  create: boolean;
  update: boolean;
  updateAny: boolean;
  delete: boolean;
  bulk: boolean;
  reply: boolean;
  replyInternal: boolean;
  slaManage: boolean;
};
