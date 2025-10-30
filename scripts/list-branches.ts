import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listBranches() {
  try {
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
        isActive: true,
        _count: {
          select: {
            modifiers: true
        }}
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('Available branches:');
    console.table(branches);
  } catch (error) {
    console.error('Error listing branches:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listBranches();
