-- AlterTable
ALTER TABLE "public"."MenuCategory" ADD COLUMN     "branch" TEXT;

-- AlterTable
ALTER TABLE "public"."MenuItem" ADD COLUMN     "branch" TEXT;

-- CreateIndex
CREATE INDEX "MenuCategory_branch_idx" ON "public"."MenuCategory"("branch");

-- CreateIndex
CREATE INDEX "MenuItem_branch_idx" ON "public"."MenuItem"("branch");
