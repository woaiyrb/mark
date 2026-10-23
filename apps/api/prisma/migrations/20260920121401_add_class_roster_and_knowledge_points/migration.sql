/*
  Warnings:

  - You are about to drop the column `version` on the `AssignmentAttempt` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ClassTeacherRole" AS ENUM ('OWNER', 'COLLABORATOR');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'TRANSFERRED_OUT', 'INACTIVE');

-- AlterTable
ALTER TABLE "AssignmentAttempt" DROP COLUMN "version";

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "progress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "result" JSONB,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradingJob" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER,
    "assignmentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" TEXT NOT NULL,
    "percentage" INTEGER,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publishJob" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "progress" TEXT,
    "percentage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "result" JSONB,

    CONSTRAINT "publishJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "classCode" TEXT,
    "subject" TEXT,
    "term" TEXT,
    "gradeLevel" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassTeacher" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClassTeacherRole" NOT NULL DEFAULT 'COLLABORATOR',
    "canEdit" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassEnrollment" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "studentNo" TEXT,
    "displayName" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "ClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentClass" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),

    CONSTRAINT "AssignmentClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePoint" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "parentId" INTEGER,
    "subject" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "ownerUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionKnowledgePoint" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "knowledgePointId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionKnowledgePoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradingJob_attemptId_idx" ON "GradingJob"("attemptId");

-- CreateIndex
CREATE INDEX "GradingJob_assignmentId_idx" ON "GradingJob"("assignmentId");

-- CreateIndex
CREATE INDEX "GradingJob_userId_idx" ON "GradingJob"("userId");

-- CreateIndex
CREATE INDEX "GradingJob_status_idx" ON "GradingJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Class_classCode_key" ON "Class"("classCode");

-- CreateIndex
CREATE INDEX "Class_ownerUserId_idx" ON "Class"("ownerUserId");

-- CreateIndex
CREATE INDEX "Class_isArchived_idx" ON "Class"("isArchived");

-- CreateIndex
CREATE INDEX "Class_subject_term_idx" ON "Class"("subject", "term");

-- CreateIndex
CREATE INDEX "ClassTeacher_userId_idx" ON "ClassTeacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTeacher_classId_userId_key" ON "ClassTeacher"("classId", "userId");

-- CreateIndex
CREATE INDEX "ClassEnrollment_classId_status_idx" ON "ClassEnrollment"("classId", "status");

-- CreateIndex
CREATE INDEX "ClassEnrollment_userId_idx" ON "ClassEnrollment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassEnrollment_classId_userId_key" ON "ClassEnrollment"("classId", "userId");

-- CreateIndex
CREATE INDEX "AssignmentClass_classId_idx" ON "AssignmentClass"("classId");

-- CreateIndex
CREATE INDEX "AssignmentClass_assignmentId_idx" ON "AssignmentClass"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentClass_assignmentId_classId_key" ON "AssignmentClass"("assignmentId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePoint_code_key" ON "KnowledgePoint"("code");

-- CreateIndex
CREATE INDEX "KnowledgePoint_parentId_idx" ON "KnowledgePoint"("parentId");

-- CreateIndex
CREATE INDEX "KnowledgePoint_subject_isActive_idx" ON "KnowledgePoint"("subject", "isActive");

-- CreateIndex
CREATE INDEX "KnowledgePoint_ownerUserId_idx" ON "KnowledgePoint"("ownerUserId");

-- CreateIndex
CREATE INDEX "QuestionKnowledgePoint_knowledgePointId_idx" ON "QuestionKnowledgePoint"("knowledgePointId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionKnowledgePoint_questionId_knowledgePointId_key" ON "QuestionKnowledgePoint"("questionId", "knowledgePointId");

-- AddForeignKey
ALTER TABLE "GradingJob" ADD CONSTRAINT "GradingJob_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssignmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingJob" ADD CONSTRAINT "GradingJob_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentClass" ADD CONSTRAINT "AssignmentClass_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentClass" ADD CONSTRAINT "AssignmentClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePoint" ADD CONSTRAINT "KnowledgePoint_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "KnowledgePoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionKnowledgePoint" ADD CONSTRAINT "QuestionKnowledgePoint_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionKnowledgePoint" ADD CONSTRAINT "QuestionKnowledgePoint_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "KnowledgePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
