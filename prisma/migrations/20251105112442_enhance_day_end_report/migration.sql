-- AlterTable
ALTER TABLE "public"."DayEndReport" ADD COLUMN     "averageOrderValue" DECIMAL(10,2),
ADD COLUMN     "discountSummary" JSONB,
ADD COLUMN     "hourlySales" JSONB,
ADD COLUMN     "orderTypes" JSONB,
ADD COLUMN     "salesByCategory" JSONB,
ADD COLUMN     "taxSummary" JSONB,
ADD COLUMN     "topSellingItems" JSONB,
ALTER COLUMN "paymentMethods" DROP NOT NULL;
