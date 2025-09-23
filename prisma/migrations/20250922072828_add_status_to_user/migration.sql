/*
  Warnings:

  - The values [USER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'KITCHEN_STAFF', 'CUSTOMER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
COMMIT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
