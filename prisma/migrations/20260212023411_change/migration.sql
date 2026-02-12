/*
  Warnings:

  - You are about to drop the column `workspaceId` on the `Category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,userId,type]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_workspaceId_fkey";

-- DropIndex
DROP INDEX "Category_name_workspaceId_type_key";

-- DropIndex
DROP INDEX "Category_workspaceId_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "workspaceId",
ADD COLUMN     "userId" UUID;

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_userId_type_key" ON "Category"("name", "userId", "type");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
