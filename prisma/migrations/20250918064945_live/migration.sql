-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Permission" ADD VALUE 'POS_CREATE';
ALTER TYPE "public"."Permission" ADD VALUE 'POS_READ';
ALTER TYPE "public"."Permission" ADD VALUE 'POS_UPDATE';
ALTER TYPE "public"."Permission" ADD VALUE 'POS_DELETE';
