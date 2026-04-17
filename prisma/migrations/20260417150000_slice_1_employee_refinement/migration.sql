-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "code" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "address" JSONB,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "probationEndDate" TIMESTAMP(3),
ADD COLUMN     "salary" DECIMAL(12,2),
ADD COLUMN     "salaryCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "terminationReason" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "workLocation" TEXT;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "seniority" TEXT;

-- CreateIndex
CREATE INDEX "departments_isActive_idx" ON "departments"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "departments_companyId_code_key" ON "departments"("companyId", "code");

-- CreateIndex
CREATE INDEX "employees_employmentType_idx" ON "employees"("employmentType");

-- CreateIndex
CREATE INDEX "employees_hireDate_idx" ON "employees"("hireDate");

-- CreateIndex
CREATE INDEX "roles_isActive_idx" ON "roles"("isActive");
