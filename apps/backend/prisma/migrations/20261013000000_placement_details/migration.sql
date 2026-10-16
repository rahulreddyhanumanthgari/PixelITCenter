-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_UPDATE', 'APPROVED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RESUME', 'ID', 'VISA');

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "currentLocation" TEXT,
    "relocation" BOOLEAN,
    "relocationNote" TEXT,
    "visaStatus" TEXT,
    "contactNumber" TEXT,
    "email" TEXT,
    "skypeId" TEXT,
    "linkedinUrl" TEXT,
    "usExperienceYears" DOUBLE PRECISION,
    "relevantExperienceYears" DOUBLE PRECISION,
    "passportNumberEnc" TEXT,
    "ssnLast4Enc" TEXT,
    "dateOfBirthEnc" TEXT,
    "usEntryVisaType" TEXT,
    "usEntryYear" INTEGER,
    "bachelorsDegree" TEXT,
    "bachelorsUniversity" TEXT,
    "bachelorsYear" INTEGER,
    "mastersDegree" TEXT,
    "mastersUniversity" TEXT,
    "mastersYear" INTEGER,
    "availability" TEXT,
    "bestTimeForCalls" TEXT,
    "preferredInterviewLocation" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT,
    "role" TEXT,
    "location" TEXT,
    "email" TEXT,
    "phone" TEXT,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileDocument" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "type" "DocumentType" NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "scanStatus" TEXT NOT NULL DEFAULT 'SKIPPED',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileStatusHistory" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "fromStatus" "ProfileStatus",
    "toStatus" "ProfileStatus" NOT NULL,
    "comment" TEXT,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiiAccessLog" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "fields" TEXT[],
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PiiAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reference_profileId_position_key" ON "Reference"("profileId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileDocument_storageKey_key" ON "ProfileDocument"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileDocument_profileId_type_key" ON "ProfileDocument"("profileId", "type");

-- CreateIndex
CREATE INDEX "ProfileStatusHistory_profileId_createdAt_idx" ON "ProfileStatusHistory"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "PiiAccessLog_profileId_createdAt_idx" ON "PiiAccessLog"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "PiiAccessLog_actorUserId_createdAt_idx" ON "PiiAccessLog"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileDocument" ADD CONSTRAINT "ProfileDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileStatusHistory" ADD CONSTRAINT "ProfileStatusHistory_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiiAccessLog" ADD CONSTRAINT "PiiAccessLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

