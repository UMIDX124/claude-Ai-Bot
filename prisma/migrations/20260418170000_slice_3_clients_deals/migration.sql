-- DropIndex
DROP INDEX "stages_pipelineId_position_key";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "accountTier" TEXT,
ADD COLUMN     "healthScore" INTEGER,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "ownerEmployeeId" TEXT,
ADD COLUMN     "renewalDate" TIMESTAMP(3),
ADD COLUMN     "slackChannel" TEXT;

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "department" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "lostCompetitor" TEXT,
ADD COLUMN     "lostReasonCategory" TEXT,
ADD COLUMN     "nextStep" TEXT,
ADD COLUMN     "nextStepAt" TIMESTAMP(3),
ADD COLUMN     "ownerEmployeeId" TEXT,
ADD COLUMN     "position" DECIMAL(19,10) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "pipelines" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "stages" ALTER COLUMN "position" SET DEFAULT 0,
ALTER COLUMN "position" SET DATA TYPE DECIMAL(19,10);

-- CreateTable
CREATE TABLE "deal_activities" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "actorId" TEXT,
    "kind" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deal_activities_dealId_idx" ON "deal_activities"("dealId");

-- CreateIndex
CREATE INDEX "deal_activities_actorId_idx" ON "deal_activities"("actorId");

-- CreateIndex
CREATE INDEX "deal_activities_createdAt_idx" ON "deal_activities"("createdAt");

-- CreateIndex
CREATE INDEX "clients_ownerEmployeeId_idx" ON "clients"("ownerEmployeeId");

-- CreateIndex
CREATE INDEX "clients_renewalDate_idx" ON "clients"("renewalDate");

-- CreateIndex
CREATE INDEX "contacts_isPrimary_idx" ON "contacts"("isPrimary");

-- CreateIndex
CREATE INDEX "deals_ownerEmployeeId_idx" ON "deals"("ownerEmployeeId");

-- CreateIndex
CREATE INDEX "deals_pipelineId_stageId_position_idx" ON "deals"("pipelineId", "stageId", "position");

-- CreateIndex
CREATE INDEX "pipelines_companyId_idx" ON "pipelines"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "stages_pipelineId_name_key" ON "stages"("pipelineId", "name");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_activities" ADD CONSTRAINT "deal_activities_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

