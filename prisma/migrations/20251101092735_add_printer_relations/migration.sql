-- CreateEnum
CREATE TYPE "public"."PrinterType" AS ENUM ('KITCHEN', 'RECEIPT', 'BAR', 'LABEL', 'REPORT');

-- CreateEnum
CREATE TYPE "public"."PrinterConnectionType" AS ENUM ('USB', 'NETWORK', 'BLUETOOTH', 'SERIAL');

-- CreateEnum
CREATE TYPE "public"."PrinterStatus" AS ENUM ('ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."PaperSize" AS ENUM ('TWO_INCH', 'THREE_INCH', 'FOUR_INCH', 'A4', 'A5', 'LETTER');

-- CreateTable
CREATE TABLE "public"."Printer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."PrinterType" NOT NULL DEFAULT 'RECEIPT',
    "connectionType" "public"."PrinterConnectionType" NOT NULL DEFAULT 'USB',
    "status" "public"."PrinterStatus" NOT NULL DEFAULT 'ONLINE',
    "paperSize" "public"."PaperSize" NOT NULL DEFAULT 'TWO_INCH',
    "devicePath" TEXT,
    "ipAddress" TEXT,
    "port" INTEGER,
    "macAddress" TEXT,
    "characterPerLine" INTEGER NOT NULL DEFAULT 42,
    "autoCut" BOOLEAN NOT NULL DEFAULT true,
    "openCashDrawer" BOOLEAN NOT NULL DEFAULT false,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "printLogo" BOOLEAN NOT NULL DEFAULT true,
    "headerText" TEXT,
    "footerText" TEXT,
    "branchId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Printer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PrinterCategory" (
    "id" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrinterCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PrintJob" (
    "id" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "referenceId" TEXT,
    "content" JSONB NOT NULL,
    "rawContent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "printedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Printer_branchId_idx" ON "public"."Printer"("branchId");

-- CreateIndex
CREATE INDEX "Printer_type_idx" ON "public"."Printer"("type");

-- CreateIndex
CREATE INDEX "Printer_status_idx" ON "public"."Printer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Printer_branchId_name_key" ON "public"."Printer"("branchId", "name");

-- CreateIndex
CREATE INDEX "PrinterCategory_printerId_idx" ON "public"."PrinterCategory"("printerId");

-- CreateIndex
CREATE INDEX "PrinterCategory_categoryId_idx" ON "public"."PrinterCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PrinterCategory_printerId_categoryId_key" ON "public"."PrinterCategory"("printerId", "categoryId");

-- CreateIndex
CREATE INDEX "PrintJob_printerId_idx" ON "public"."PrintJob"("printerId");

-- CreateIndex
CREATE INDEX "PrintJob_status_idx" ON "public"."PrintJob"("status");

-- CreateIndex
CREATE INDEX "PrintJob_createdAt_idx" ON "public"."PrintJob"("createdAt");

-- CreateIndex
CREATE INDEX "PrintJob_referenceId_idx" ON "public"."PrintJob"("referenceId");

-- AddForeignKey
ALTER TABLE "public"."Printer" ADD CONSTRAINT "Printer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrinterCategory" ADD CONSTRAINT "PrinterCategory_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "public"."Printer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrinterCategory" ADD CONSTRAINT "PrinterCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."MenuCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrintJob" ADD CONSTRAINT "PrintJob_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "public"."Printer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
