/*
  Warnings:

  - You are about to drop the `Student` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActivityHistory" DROP CONSTRAINT "ActivityHistory_studentId_fkey";

-- DropForeignKey
ALTER TABLE "QRCode" DROP CONSTRAINT "QRCode_usedBy_fkey";

-- DropTable
DROP TABLE "Student";

-- CreateTable
CREATE TABLE "tb_student" (
    "id" SERIAL NOT NULL,
    "std_code" TEXT NOT NULL,
    "title" TEXT,
    "name" TEXT NOT NULL,
    "faculty" TEXT,
    "program" TEXT,

    CONSTRAINT "tb_student_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_student_std_code_key" ON "tb_student"("std_code");

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "tb_student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityHistory" ADD CONSTRAINT "ActivityHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "tb_student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
