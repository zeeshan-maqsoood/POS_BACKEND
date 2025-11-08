import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPaymentMethods() {
  try {
    // Get all payment methods from the database
    const paymentMethods = await prisma.$queryRaw`
      SELECT DISTINCT method 
      FROM "Payment"
      WHERE "method" IS NOT NULL
      ORDER BY method;
    `;

    console.log('Available payment methods in database:');
    console.log(paymentMethods);

    // Check if any payments exist
    const paymentCount = await prisma.payment.count();
    console.log(`\nTotal payments in database: ${paymentCount}`);

    // Check recent payments
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true
          }
        }
      }
    });

    console.log('\nMost recent payments:');
    console.log(JSON.stringify(recentPayments, null, 2));

  } catch (error) {
    console.error('Error checking payment methods:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaymentMethods();
