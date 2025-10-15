-- CreateEnum
CREATE TYPE "public"."SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "public"."SupplierRating" AS ENUM ('EXCELLENT', 'GOOD', 'AVERAGE', 'POOR', 'VERY_POOR');

-- CreateEnum
CREATE TYPE "public"."PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."PurchaseOrderItemStatus" AS ENUM ('PENDING', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'BACKORDERED');

-- CreateEnum
CREATE TYPE "public"."ReceivingStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentTerm" AS ENUM ('NET_15', 'NET_30', 'NET_45', 'NET_60', 'DUE_ON_RECEIPT', 'ADVANCE');

-- CreateEnum
CREATE TYPE "public"."DeliveryMethod" AS ENUM ('SUPPLIER_DELIVERY', 'PICKUP', 'THIRD_PARTY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Permission" ADD VALUE 'SUPPLIER_CREATE';
ALTER TYPE "public"."Permission" ADD VALUE 'SUPPLIER_READ';
ALTER TYPE "public"."Permission" ADD VALUE 'SUPPLIER_UPDATE';
ALTER TYPE "public"."Permission" ADD VALUE 'SUPPLIER_DELETE';
ALTER TYPE "public"."Permission" ADD VALUE 'PURCHASE_ORDER_CREATE';
ALTER TYPE "public"."Permission" ADD VALUE 'PURCHASE_ORDER_READ';
ALTER TYPE "public"."Permission" ADD VALUE 'PURCHASE_ORDER_UPDATE';
ALTER TYPE "public"."Permission" ADD VALUE 'PURCHASE_ORDER_DELETE';
ALTER TYPE "public"."Permission" ADD VALUE 'INVENTORY_CREATE';
ALTER TYPE "public"."Permission" ADD VALUE 'INVENTORY_READ';
ALTER TYPE "public"."Permission" ADD VALUE 'INVENTORY_UPDATE';
ALTER TYPE "public"."Permission" ADD VALUE 'INVENTORY_DELETE';

-- AlterEnum
ALTER TYPE "public"."UserRole" ADD VALUE 'SUPPLIER_MANAGER';

-- AlterTable
ALTER TABLE "public"."InventoryTransaction" ADD COLUMN     "goodsReceiptId" TEXT;

-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "description" TEXT,
    "taxNumber" TEXT,
    "registrationNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "postalCode" TEXT,
    "businessType" TEXT,
    "industry" TEXT,
    "establishedYear" INTEGER,
    "employeeCount" INTEGER,
    "status" "public"."SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "rating" "public"."SupplierRating" DEFAULT 'AVERAGE',
    "creditLimit" DOUBLE PRECISION,
    "paymentTerms" "public"."PaymentTerm" NOT NULL DEFAULT 'NET_30',
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankRouting" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierContact" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "department" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierProduct" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "supplierCode" TEXT,
    "supplierName" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "minOrderQuantity" DOUBLE PRECISION,
    "packSize" TEXT,
    "leadTime" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "previousPrice" DOUBLE PRECISION,
    "priceLastUpdated" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "branchName" TEXT,
    "status" "public"."PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "deliveryMethod" "public"."DeliveryMethod" DEFAULT 'SUPPLIER_DELIVERY',
    "shippingAddress" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentTerms" "public"."PaymentTerm" NOT NULL DEFAULT 'NET_30',
    "notes" TEXT,
    "termsConditions" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "supplierProductId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "receivedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "public"."PurchaseOrderItemStatus" NOT NULL DEFAULT 'PENDING',
    "lineTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expectedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseOrderApproval" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "approvedById" TEXT NOT NULL,
    "status" "public"."PurchaseOrderStatus" NOT NULL,
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrderApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoodsReceipt" (
    "id" TEXT NOT NULL,
    "grNumber" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "branchName" TEXT,
    "status" "public"."ReceivingStatus" NOT NULL DEFAULT 'PENDING',
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" TEXT NOT NULL,
    "inspectedBy" TEXT,
    "deliveryNote" TEXT,
    "vehicleNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoodsReceiptItem" (
    "id" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "purchaseOrderItemId" TEXT NOT NULL,
    "quantityOrdered" DOUBLE PRECISION NOT NULL,
    "quantityReceived" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "storageLocation" TEXT,
    "qualityStatus" TEXT,
    "qualityNotes" TEXT,
    "lineTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentTerms" "public"."PaymentTerm" NOT NULL DEFAULT 'NET_30',
    "invoiceFile" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierPayment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierEvaluation" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "evaluationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedById" TEXT NOT NULL,
    "qualityRating" INTEGER NOT NULL,
    "deliveryRating" INTEGER NOT NULL,
    "priceRating" INTEGER NOT NULL,
    "serviceRating" INTEGER NOT NULL,
    "communicationRating" INTEGER NOT NULL,
    "overallRating" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "recommendations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "public"."Supplier"("code");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "public"."Supplier"("name");

-- CreateIndex
CREATE INDEX "Supplier_status_idx" ON "public"."Supplier"("status");

-- CreateIndex
CREATE INDEX "Supplier_rating_idx" ON "public"."Supplier"("rating");

-- CreateIndex
CREATE INDEX "Supplier_createdById_idx" ON "public"."Supplier"("createdById");

-- CreateIndex
CREATE INDEX "SupplierContact_supplierId_idx" ON "public"."SupplierContact"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierContact_isPrimary_idx" ON "public"."SupplierContact"("isPrimary");

-- CreateIndex
CREATE INDEX "SupplierProduct_supplierId_idx" ON "public"."SupplierProduct"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierProduct_inventoryItemId_idx" ON "public"."SupplierProduct"("inventoryItemId");

-- CreateIndex
CREATE INDEX "SupplierProduct_isActive_idx" ON "public"."SupplierProduct"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProduct_supplierId_inventoryItemId_key" ON "public"."SupplierProduct"("supplierId", "inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "public"."PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "public"."PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "public"."PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_orderDate_idx" ON "public"."PurchaseOrder"("orderDate");

-- CreateIndex
CREATE INDEX "PurchaseOrder_branchName_idx" ON "public"."PurchaseOrder"("branchName");

-- CreateIndex
CREATE INDEX "PurchaseOrder_createdById_idx" ON "public"."PurchaseOrder"("createdById");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "public"."PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_supplierProductId_idx" ON "public"."PurchaseOrderItem"("supplierProductId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_status_idx" ON "public"."PurchaseOrderItem"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrderApproval_purchaseOrderId_idx" ON "public"."PurchaseOrderApproval"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderApproval_approvedById_idx" ON "public"."PurchaseOrderApproval"("approvedById");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_grNumber_key" ON "public"."GoodsReceipt"("grNumber");

-- CreateIndex
CREATE INDEX "GoodsReceipt_purchaseOrderId_idx" ON "public"."GoodsReceipt"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_receiptDate_idx" ON "public"."GoodsReceipt"("receiptDate");

-- CreateIndex
CREATE INDEX "GoodsReceipt_branchName_idx" ON "public"."GoodsReceipt"("branchName");

-- CreateIndex
CREATE INDEX "GoodsReceipt_receivedById_idx" ON "public"."GoodsReceipt"("receivedById");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_goodsReceiptId_idx" ON "public"."GoodsReceiptItem"("goodsReceiptId");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_purchaseOrderItemId_idx" ON "public"."GoodsReceiptItem"("purchaseOrderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoice_invoiceNumber_key" ON "public"."SupplierInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "SupplierInvoice_supplierId_idx" ON "public"."SupplierInvoice"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierInvoice_purchaseOrderId_idx" ON "public"."SupplierInvoice"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "SupplierInvoice_status_idx" ON "public"."SupplierInvoice"("status");

-- CreateIndex
CREATE INDEX "SupplierInvoice_dueDate_idx" ON "public"."SupplierInvoice"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPayment_paymentNumber_key" ON "public"."SupplierPayment"("paymentNumber");

-- CreateIndex
CREATE INDEX "SupplierPayment_supplierId_idx" ON "public"."SupplierPayment"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierPayment_invoiceId_idx" ON "public"."SupplierPayment"("invoiceId");

-- CreateIndex
CREATE INDEX "SupplierPayment_paymentDate_idx" ON "public"."SupplierPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "SupplierPayment_processedById_idx" ON "public"."SupplierPayment"("processedById");

-- CreateIndex
CREATE INDEX "SupplierEvaluation_supplierId_idx" ON "public"."SupplierEvaluation"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierEvaluation_evaluationDate_idx" ON "public"."SupplierEvaluation"("evaluationDate");

-- CreateIndex
CREATE INDEX "SupplierEvaluation_evaluatedById_idx" ON "public"."SupplierEvaluation"("evaluatedById");

-- CreateIndex
CREATE INDEX "InventoryTransaction_goodsReceiptId_idx" ON "public"."InventoryTransaction"("goodsReceiptId");

-- AddForeignKey
ALTER TABLE "public"."Supplier" ADD CONSTRAINT "Supplier_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierContact" ADD CONSTRAINT "SupplierContact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierProduct" ADD CONSTRAINT "SupplierProduct_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_supplierProductId_fkey" FOREIGN KEY ("supplierProductId") REFERENCES "public"."SupplierProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderApproval" ADD CONSTRAINT "PurchaseOrderApproval_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderApproval" ADD CONSTRAINT "PurchaseOrderApproval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "public"."GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "public"."PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierPayment" ADD CONSTRAINT "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierPayment" ADD CONSTRAINT "SupplierPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."SupplierInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierPayment" ADD CONSTRAINT "SupplierPayment_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierEvaluation" ADD CONSTRAINT "SupplierEvaluation_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierEvaluation" ADD CONSTRAINT "SupplierEvaluation_evaluatedById_fkey" FOREIGN KEY ("evaluatedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "public"."GoodsReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
