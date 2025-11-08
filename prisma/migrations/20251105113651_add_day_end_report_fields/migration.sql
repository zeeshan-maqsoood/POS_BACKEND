-- AlterTable
ALTER TABLE "public"."DayEndReport" ALTER COLUMN "paymentMethods" SET DEFAULT '[]',
ALTER COLUMN "discountSummary" SET DEFAULT '{}',
ALTER COLUMN "hourlySales" SET DEFAULT '[]',
ALTER COLUMN "orderTypes" SET DEFAULT '[]',
ALTER COLUMN "salesByCategory" SET DEFAULT '[]',
ALTER COLUMN "taxSummary" SET DEFAULT '{}',
ALTER COLUMN "topSellingItems" SET DEFAULT '[]';
