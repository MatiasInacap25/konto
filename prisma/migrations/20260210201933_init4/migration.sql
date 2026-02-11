/*
  Warnings:

  - You are about to drop the column `userId` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `workSpaceId` on the `Account` table. All the data in the column will be lost.
  - You are about to alter the column `balance` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `scope` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `workSpaceId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `workSpaceId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `workSpaceId` on the `Transaction` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `WorkSpace` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `profiles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,workspaceId,type]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workspaceId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_workSpaceId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_userId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_workSpaceId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_workSpaceId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_workSpaceId_fkey";

-- DropForeignKey
ALTER TABLE "WorkSpace" DROP CONSTRAINT "WorkSpace_userId_fkey";

-- DropIndex
DROP INDEX "Category_name_userId_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "userId",
DROP COLUMN "workSpaceId",
ADD COLUMN     "workspaceId" TEXT NOT NULL,
ALTER COLUMN "balance" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "scope",
DROP COLUMN "userId",
DROP COLUMN "workSpaceId",
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "type" "TransactionType" NOT NULL,
ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "userId",
DROP COLUMN "workSpaceId",
ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "userId",
DROP COLUMN "workSpaceId",
ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE',
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "WorkSpace";

-- DropTable
DROP TABLE "profiles";

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WorkspaceType" NOT NULL DEFAULT 'BUSINESS',
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Category_workspaceId_idx" ON "Category"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_workspaceId_type_key" ON "Category"("name", "workspaceId", "type");

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
