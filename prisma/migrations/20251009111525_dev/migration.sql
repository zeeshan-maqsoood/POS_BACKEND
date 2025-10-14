/*
  Warnings:

  - You are about to drop the `InventoryTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."InventoryTransaction" DROP CONSTRAINT "InventoryTransaction_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."InventoryTransaction" DROP CONSTRAINT "InventoryTransaction_inventoryItemId_fkey";

-- DropTable
DROP TABLE "public"."InventoryTransaction";

-- DropEnum
DROP TYPE "public"."TransactionType";
