import type { CompanyType, DealStatus } from "@prisma/client";

export type DealRow = {
  id: string;
  companyId: string;
  clientId: string | null;
  pipelineId: string;
  stageId: string;
  ownerEmployeeId: string | null;
  title: string;
  description: string | null;
  value: string;
  currency: string;
  probability: number;
  status: DealStatus;
  position: string;
  expectedClose: string | null;
  nextStepAt: string | null;
  nextStep: string | null;
  closedAt: string | null;
  lostReason: string | null;
  lostReasonCategory: string | null;
  lostCompetitor: string | null;
  source: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  company: { id: string; type: CompanyType; name: string };
  client: {
    id: string;
    name: string;
    logoUrl: string | null;
    accountTier: string | null;
    companyId: string;
  } | null;
  pipeline: { id: string; name: string; companyId: string | null };
  stage: {
    id: string;
    name: string;
    color: string | null;
    probability: number;
    isWon: boolean;
    isLost: boolean;
  };
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
  createdBy: { id: string; email: string; fullName: string | null };
  _count: { activities: number };
};

export type StageRow = {
  id: string;
  pipelineId: string;
  name: string;
  description: string | null;
  position: string;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  color: string | null;
};

export type PipelineRow = {
  id: string;
  companyId: string | null;
  name: string;
  description: string | null;
  isDefault: boolean;
  company: { id: string; type: CompanyType; name: string } | null;
  stages: StageRow[];
  _count: { deals: number };
};

export type DealListResponse = {
  items: DealRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type DealPermissions = {
  create: boolean;
  update: boolean;
  updateAny: boolean;
  delete: boolean;
  bulk: boolean;
  pipelines: boolean;
};
