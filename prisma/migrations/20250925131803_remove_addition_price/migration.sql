/*
  Warnings:

  - You are about to drop the column `price` on the `Modifier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Modifier" DROP COLUMN "price",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'SINGLE';

-- CreateTable
CREATE TABLE "public"."ModifierOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "modifierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModifierOption_pkey" PRIMARY KEY ("id")
);
