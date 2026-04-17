-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'COMPLETED', 'ON_HOLD');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaskActivityKind" ADD VALUE 'SUBTASK_COMPLETED';
ALTER TYPE "TaskActivityKind" ADD VALUE 'LABEL_ADDED';
ALTER TYPE "TaskActivityKind" ADD VALUE 'LABEL_REMOVED';
ALTER TYPE "TaskActivityKind" ADD VALUE 'DEPENDENCY_ADDED';
ALTER TYPE "TaskActivityKind" ADD VALUE 'DEPENDENCY_REMOVED';
ALTER TYPE "TaskActivityKind" ADD VALUE 'MOVED';
ALTER TYPE "TaskActivityKind" ADD VALUE 'DELETED';
ALTER TYPE "TaskActivityKind" ADD VALUE 'RESTORED';
ALTER TYPE "TaskActivityKind" ADD VALUE 'ESTIMATE_CHANGED';

-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELLED');
ALTER TABLE "public"."tasks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "public"."TaskStatus_old";
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'TODO';
COMMIT;

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "estimateHours",
ADD COLUMN     "assigneeEmployeeId" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "estimatedHours" DECIMAL(8,2),
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "reporterEmployeeId" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ALTER COLUMN "position" SET DEFAULT 0,
ALTER COLUMN "position" SET DATA TYPE DECIMAL(19,10);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "leadEmployeeId" TEXT,
    "color" TEXT,
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_labels" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#F59E0B',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "task_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_label_assignments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_label_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_dependencies" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnTaskId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_companyId_idx" ON "projects"("companyId");

-- CreateIndex
CREATE INDEX "projects_leadEmployeeId_idx" ON "projects"("leadEmployeeId");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_deletedAt_idx" ON "projects"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "projects_companyId_code_key" ON "projects"("companyId", "code");

-- CreateIndex
CREATE INDEX "task_labels_companyId_idx" ON "task_labels"("companyId");

-- CreateIndex
CREATE INDEX "task_labels_projectId_idx" ON "task_labels"("projectId");

-- CreateIndex
CREATE INDEX "task_labels_deletedAt_idx" ON "task_labels"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "task_labels_companyId_projectId_name_key" ON "task_labels"("companyId", "projectId", "name");

-- CreateIndex
CREATE INDEX "task_label_assignments_taskId_idx" ON "task_label_assignments"("taskId");

-- CreateIndex
CREATE INDEX "task_label_assignments_labelId_idx" ON "task_label_assignments"("labelId");

-- CreateIndex
CREATE UNIQUE INDEX "task_label_assignments_taskId_labelId_key" ON "task_label_assignments"("taskId", "labelId");

-- CreateIndex
CREATE INDEX "task_dependencies_taskId_idx" ON "task_dependencies"("taskId");

-- CreateIndex
CREATE INDEX "task_dependencies_dependsOnTaskId_idx" ON "task_dependencies"("dependsOnTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_taskId_dependsOnTaskId_key" ON "task_dependencies"("taskId", "dependsOnTaskId");

-- CreateIndex
CREATE INDEX "tasks_companyId_idx" ON "tasks"("companyId");

-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "tasks"("projectId");

-- CreateIndex
CREATE INDEX "tasks_reporterEmployeeId_idx" ON "tasks"("reporterEmployeeId");

-- CreateIndex
CREATE INDEX "tasks_assigneeEmployeeId_idx" ON "tasks"("assigneeEmployeeId");

-- CreateIndex
CREATE INDEX "tasks_projectId_status_position_idx" ON "tasks"("projectId", "status", "position");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_leadEmployeeId_fkey" FOREIGN KEY ("leadEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reporterEmployeeId_fkey" FOREIGN KEY ("reporterEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeEmployeeId_fkey" FOREIGN KEY ("assigneeEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_label_assignments" ADD CONSTRAINT "task_label_assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_label_assignments" ADD CONSTRAINT "task_label_assignments_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "task_labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

