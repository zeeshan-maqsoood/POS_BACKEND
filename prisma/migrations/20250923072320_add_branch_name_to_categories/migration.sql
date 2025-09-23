/*
  Warnings:

  - You are about to drop the column `branch` on the `MenuCategory` table. All the data in the column will be lost.
  - You are about to drop the column `branch` on the `MenuItem` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."MenuCategory_branch_idx";

-- DropIndex
DROP INDEX "public"."MenuItem_branch_idx";

-- AlterTable
ALTER TABLE "public"."MenuCategory" DROP COLUMN "branch",
ADD COLUMN     "branchName" TEXT;

-- AlterTable
ALTER TABLE "public"."MenuItem" DROP COLUMN "branch",
ADD COLUMN     "branchName" TEXT;

-- CreateIndex
CREATE INDEX "MenuCategory_branchName_idx" ON "public"."MenuCategory"("branchName");

-- CreateIndex
CREATE INDEX "MenuItem_branchName_idx" ON "public"."MenuItem"("branchName");
