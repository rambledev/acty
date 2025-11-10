/*
  Warnings:

  - You are about to drop the `Activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QRCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivityGroup" AS ENUM ('CENTRAL', 'FACULTY', 'FREE');

-- CreateEnum
CREATE TYPE "QRType" AS ENUM ('SINGLE_USE', 'MULTI_USE', 'LIMITED_USE');

-- DropForeignKey
ALTER TABLE "ActivityHistory" DROP CONSTRAINT "ActivityHistory_activityId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityHistory" DROP CONSTRAINT "ActivityHistory_qrCodeId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityHistory" DROP CONSTRAINT "ActivityHistory_studentId_fkey";

-- DropForeignKey
ALTER TABLE "QRCode" DROP CONSTRAINT "QRCode_activityId_fkey";

-- DropForeignKey
ALTER TABLE "QRCode" DROP CONSTRAINT "QRCode_usedBy_fkey";

-- AlterTable
ALTER TABLE "tb_student" ADD COLUMN     "centralHours" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "facultyHours" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "freeHours" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Activity";

-- DropTable
DROP TABLE "ActivityHistory";

-- DropTable
DROP TABLE "QRCode";

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "group" "ActivityGroup" NOT NULL DEFAULT 'CENTRAL',
    "hours" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT,
    "organizer" TEXT,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_codes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,
    "usedBy" INTEGER,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "type" "QRType" NOT NULL DEFAULT 'SINGLE_USE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_histories" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "qrCodeId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hoursEarned" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "activity_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_requirements" (
    "id" SERIAL NOT NULL,
    "faculty" TEXT NOT NULL,
    "centralMin" INTEGER NOT NULL DEFAULT 90,
    "facultyMin" INTEGER NOT NULL DEFAULT 90,
    "freeMin" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "faculty_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_code_key" ON "qr_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "activity_histories_qrCodeId_studentId_key" ON "activity_histories"("qrCodeId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_requirements_faculty_key" ON "faculty_requirements"("faculty");

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "tb_student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_histories" ADD CONSTRAINT "activity_histories_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_histories" ADD CONSTRAINT "activity_histories_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "qr_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_histories" ADD CONSTRAINT "activity_histories_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "tb_student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
