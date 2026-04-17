import type {
  CompanyType,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "@prisma/client";

export type TaskAssigneeLite = {
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
};

export type TaskLabelLite = {
  id: string;
  name: string;
  color: string;
  description?: string | null;
};

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string | null;
  companyId: string | null;
  assigneeEmployeeId: string | null;
  reporterEmployeeId: string | null;
  createdById: string;
  parentId: string | null;
  dueDate: string | null;
  startDate: string | null;
  completedAt: string | null;
  startedAt: string | null;
  position: string;
  estimatedHours: string | null;
  actualHours: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  project: {
    id: string;
    name: string;
    code: string;
    color: string | null;
    companyId: string;
  } | null;
  createdBy: {
    id: string;
    email: string;
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  assignee: TaskAssigneeLite | null;
  reporter: TaskAssigneeLite | null;
  labels: Array<{ id: string; label: TaskLabelLite }>;
  _count: {
    subtasks: number;
    comments: number;
    dependsOn: number;
    blocks: number;
  };
};

export type TaskListResponse = {
  items: TaskRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type ProjectRow = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description: string | null;
  status: ProjectStatus;
  leadEmployeeId: string | null;
  color: string | null;
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  company: { id: string; type: CompanyType; name: string };
  lead: TaskAssigneeLite | null;
  _count: { tasks: number; labels: number };
};

export type TaskFilters = {
  q?: string;
  projectId?: string[];
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeEmployeeId?: string | string[] | "me" | "unassigned";
  reporterEmployeeId?: string;
  labelIds?: string[];
  dueBefore?: string | Date;
  dueAfter?: string | Date;
  includeCompleted?: boolean;
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export type Permissions = {
  create: boolean;
  update: boolean;
  updateAny: boolean;
  delete: boolean;
  deleteAny: boolean;
  restore: boolean;
  bulk: boolean;
  comment: boolean;
  projectCreate: boolean;
};

export type ViewerContext = {
  userId: string;
  userRole: UserRole;
  employeeId: string | null;
};
