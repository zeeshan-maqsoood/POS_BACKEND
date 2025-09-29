"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkData() {
    try {
        // Get all users with their branches
        const users = await prisma.user.findMany({
            where: { role: 'KITCHEN_STAFF' },
            select: { id: true, name: true, email: true, branch: true, role: true }
        });
        console.log('Kitchen Staff Users:');
        users.forEach(user => console.log(`- ${user.name} (${user.email}): branch = '${user.branch}'`));
        // Get all orders with their branch names
        const orders = await prisma.order.findMany({
            select: { id: true, orderNumber: true, branchName: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        console.log('\nRecent Orders:');
        orders.forEach(order => console.log(`- ${order.orderNumber}: branchName = '${order.branchName}'`));
        // Count orders by branch
        const branchCounts = await prisma.order.groupBy({
            by: ['branchName'],
            _count: { id: true }
        });
        console.log('\nOrders by Branch:');
        branchCounts.forEach(branch => console.log(`- ${branch.branchName}: ${branch._count.id} orders`));
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
checkData();
//# sourceMappingURL=check-data.js.map