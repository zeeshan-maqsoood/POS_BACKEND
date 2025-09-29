"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printReceipt = exports.generateReceipt = void 0;
const client_1 = require("@prisma/client");
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
        paymentStatus: order.paymentStatus, // Add payment status to receipt data
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
    receipt += `Payment: ${data.paymentMethod} (${data.paymentStatus || 'PENDING'})${newLine}`;
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
    console.log(`\n=== START printReceipt for order ${orderId} ===`);
    try {
        if (!orderId) {
            console.error('❌ No order ID provided');
            return false;
        }
        console.log('Fetching order from database...');
        // Get the latest version of the order with its items
        const order = await prisma.order.findFirst({
            where: { id: orderId },
            include: {
                items: true,
            },
            orderBy: {
                updatedAt: 'desc' // Get the most recent version of the order
            }
        });
        if (!order) {
            console.error('❌ Order not found in database');
            return false;
        }
        console.log('✅ Order found:', {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            itemCount: order.items?.length || 0
        });
        // Generate and log the receipt content
        console.log('Generating receipt content...');
        const receiptContent = (0, exports.generateReceipt)(order);
        // Log order details for debugging
        console.log('\n=== RECEIPT DETAILS ===');
        console.log(`Order #${order.orderNumber}`);
        console.log(`Status: ${order.status}`);
        console.log(`Payment Status: ${order.paymentStatus}`);
        console.log(`Payment Method: ${order.paymentMethod || 'Not specified'}`);
        console.log(`Total: £${order.total?.toFixed(2) || '0.00'}`);
        // Log the receipt content
        console.log('\n--- RECEIPT CONTENT ---');
        console.log(receiptContent);
        console.log('--- END OF RECEIPT ---\n');
        console.log('✅ Receipt generated successfully');
        return true;
    }
    catch (error) {
        console.error('Error printing receipt:', error);
        return false;
    }
};
exports.printReceipt = printReceipt;
//# sourceMappingURL=receipt.service.js.map