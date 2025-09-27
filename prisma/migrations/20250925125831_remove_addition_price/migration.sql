/*
  Warnings:

  - You are about to drop the column `maxSelection` on the `Modifier` table. All the data in the column will be lost.
  - You are about to drop the column `minSelection` on the `Modifier` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Modifier` table. All the data in the column will be lost.
  - You are about to drop the `ModifierOption` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ModifierOption" DROP CONSTRAINT "ModifierOption_modifierId_fkey";

-- AlterTable
ALTER TABLE "public"."Modifier" DROP COLUMN "maxSelection",
DROP COLUMN "minSelection",
DROP COLUMN "type",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."ModifierOption";
