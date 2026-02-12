/*
  Warnings:

  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_workspaceId_fkey";

-- Renombrar la tabla conservando los datos
ALTER TABLE "Subscription" RENAME TO "Recurring";

-- Opcional: Si cambiaste índices o llaves foráneas, Prisma a veces
-- genera código extra para renombrarlos. Mantenlo si no incluye "DROP TABLE".
-- AddForeignKey
ALTER TABLE "Recurring" ADD CONSTRAINT "Recurring_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurring" ADD CONSTRAINT "Recurring_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
