import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificMenuItem() {
  try {
    // This is the menuItemId from the order
    const menuItemId = 'a20fd5a2-a654-4842-a90f-6e0640180b3a';
    
    console.log(`🔍 Checking menu item with ID: ${menuItemId}`);
    
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: {
        id: true,
        name: true,
        price: true,
        taxRate: true,
        taxExempt: true,
        category: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (menuItem) {
      console.log('Menu Item Details:');
      console.log(`- Name: ${menuItem.name}`);
      console.log(`- Price: $${menuItem.price}`);
      console.log(`- Tax Rate: ${menuItem.taxRate}%`);
      console.log(`- Tax Exempt: ${menuItem.taxExempt}`);
      console.log(`- Category: ${menuItem.category?.name || 'No category'}`);
      
      // Calculate what the price should be
      const expectedPrice = 30;
      const taxRate = 20;
      const expectedTotal = expectedPrice * (1 + taxRate / 100);
      
      console.log('\nExpected Calculation:');
      console.log(`- Expected Base Price: $${expectedPrice}`);
      console.log(`- Tax Rate: ${taxRate}%`);
      console.log(`- Expected Total per item: $${expectedTotal}`);
      
      console.log('\nActual Calculation:');
      const actualTotal = menuItem.price * (1 + (menuItem.taxRate || 0) / 100);
      console.log(`- Actual Base Price: $${menuItem.price}`);
      console.log(`- Tax Rate: ${menuItem.taxRate}%`);
      console.log(`- Actual Total per item: $${actualTotal}`);
      
      // Check if we need to update the price
      if (menuItem.price !== expectedPrice) {
        console.log(`\n⚠️  Price mismatch! Database has $${menuItem.price}, should be $${expectedPrice}`);
        console.log('Would you like to update it?');
      }
    } else {
      console.log('Menu item not found!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificMenuItem();
