-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONTRACT_TO_HIRE');

-- AlterTable
ALTER TABLE "Placement" ADD COLUMN     "employmentType" "EmploymentType" NOT NULL DEFAULT 'CONTRACT';

