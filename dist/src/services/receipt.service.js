"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printReceipt = exports.generateReceipt = void 0;
const client_1 = require("@prisma/client");
const printer_service_1 = require("./printer.service");
const prisma = new client_1.PrismaClient();
const generateReceipt = (order) => {
    const data = {
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt).toLocaleString(),
        items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        paymentMethod: order.paymentMethod,
        branchName: order.branchName || 'Main Branch',
        tableNumber: order.tableNumber,
        customerName: order.customerName,
    };
    return formatReceipt(data);
};
exports.generateReceipt = generateReceipt;
const formatReceipt = (data) => {
    const line = '--------------------------------';
    const newLine = '\n';
    const indent = '  ';
    // Format currency helper function
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };
    let receipt = `${newLine}${line}${newLine}`;
    receipt += `${indent}${data.branchName}${newLine}`;
    receipt += `${indent}Order #${data.orderNumber}${newLine}`;
    receipt += `${indent}${data.date}${newLine}`;
    receipt += line + newLine;
    // Add items
    data.items.forEach(item => {
        const name = item.name.substring(0, 20);
        const qty = `x${item.quantity}`.padEnd(5);
        const price = formatCurrency(item.price).padStart(12);
        const total = formatCurrency(item.total).padStart(12);
        receipt += `${name.padEnd(20)}${qty}${price}${total}${newLine}`;
    });
    // Add totals
    receipt += line + newLine;
    receipt += `Subtotal:${''.padStart(20)}${formatCurrency(data.subtotal).padStart(12)}${newLine}`;
    receipt += `Tax:${''.padStart(24)}${formatCurrency(data.tax).padStart(12)}${newLine}`;
    receipt += `TOTAL:${''.padStart(21)}${formatCurrency(data.total).padStart(12)}${newLine}`;
    receipt += line + newLine;
    // Add payment info
    receipt += `Payment: ${data.paymentMethod}${newLine}`;
    if (data.tableNumber) {
        receipt += `Table: ${data.tableNumber}${newLine}`;
    }
    if (data.customerName) {
        receipt += `Customer: ${data.customerName}${newLine}`;
    }
    receipt += line + newLine;
    receipt += 'Thank you for your business!\n';
    receipt += 'Please come again!\n';
    return receipt;
};
const printReceipt = async (orderId) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order) {
            console.error('Order not found');
            return false;
        }
        // Print the receipt using the printer service
        const printSuccess = await printer_service_1.printerService.printReceipt(order);
        if (!printSuccess) {
            console.error('Failed to print receipt');
            return false;
        }
        return true;
    }
    catch (error) {
        console.error('Error printing receipt:', error);
        return false;
    }
};
exports.printReceipt = printReceipt;
//# sourceMappingURL=receipt.service.js.map