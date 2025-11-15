import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrderModifiers() {
  try {
    const orderId = '44125a73-1168-40a2-b889-58682c3abd4c';
    
    console.log(`🔍 Checking order ${orderId} modifiers`);
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });
    
    if (order) {
      console.log('\nOrder Items:');
      order.items.forEach((item, index) => {
        console.log(`\nItem ${index + 1}:`);
        console.log(`- Name: ${item.name}`);
        console.log(`- Quantity: ${item.quantity}`);
        console.log(`- Price: $${item.price}`);
        console.log(`- Tax Rate: ${item.taxRate}%`);
        console.log(`- Tax: $${item.tax}`);
        console.log(`- Total: $${item.total}`);
        
        if (item.modifiers) {
          let modifiersData;
          if (typeof item.modifiers === 'string') {
            modifiersData = JSON.parse(item.modifiers);
          } else {
            modifiersData = item.modifiers;
          }
          
          console.log('- Modifiers:');
          if (Array.isArray(modifiersData)) {
            modifiersData.forEach((mod, modIndex) => {
              console.log(`  ${modIndex + 1}. ${mod.name}: $${mod.price} × ${mod.quantity} = $${mod.total}`);
            });
          } else {
            console.log('  Invalid modifiers data');
          }
        }
      });
    } else {
      console.log('Order not found!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrderModifiers();
