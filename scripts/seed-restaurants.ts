import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRestaurantsAndBranches() {
  try {
    console.log('🌱 Seeding restaurants and branches...');

    // Check if the restaurant already exists
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: '6076979f-c8ae-41b4-96cd-9440a359a327' }
    });

    if (!existingRestaurant) {
      // Create the main restaurant
      const restaurant = await prisma.restaurant.create({
        data: {
          id: '6076979f-c8ae-41b4-96cd-9440a359a327',
          name: 'Main Restaurant',
          description: 'A great restaurant for testing',
          address: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          country: 'US',
          postalCode: '12345',
          phone: '555-0123',
          email: 'main@restaurant.com',
          businessType: 'Restaurant',
          cuisine: ['American', 'Italian'],
          isActive: true,
        }
      });

      console.log('✅ Created restaurant:', restaurant.name);

      // Create the branch
      const branch = await prisma.branch.create({
        data: {
          id: '5e479787-838b-4dd4-80b6-64127db5b220',
          name: 'Main Branch',
          description: 'Main branch location',
          address: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          country: 'US',
          postalCode: '12345',
          phone: '555-0123',
          email: 'main@branch.com',
          manager: 'Branch Manager',
          restaurantId: restaurant.id,
          isActive: true,
        }
      });

      console.log('✅ Created branch:', branch.name);

      // Create a few more restaurants and branches for testing
      const additionalRestaurants = [
        {
          id: 'restaurant-2',
          name: 'Downtown Restaurant',
          description: 'Downtown location',
          address: '456 Downtown Ave',
          city: 'Test City',
          state: 'Test State',
          country: 'US',
          postalCode: '12346',
          phone: '555-0456',
          email: 'downtown@restaurant.com',
          businessType: 'Restaurant',
          cuisine: ['Mexican', 'American'],
          isActive: true,
        },
        {
          id: 'restaurant-3',
          name: 'Uptown Bistro',
          description: 'Uptown dining experience',
          address: '789 Uptown Blvd',
          city: 'Test City',
          state: 'Test State',
          country: 'US',
          postalCode: '12347',
          phone: '555-0789',
          email: 'uptown@restaurant.com',
          businessType: 'Bistro',
          cuisine: ['French', 'Italian'],
          isActive: true,
        }
      ];

      for (const restaurantData of additionalRestaurants) {
        const newRestaurant = await prisma.restaurant.create({
          data: restaurantData
        });

        // Create a branch for each additional restaurant
        await prisma.branch.create({
          data: {
            name: `${newRestaurant.name} Branch`,
            description: `Branch for ${newRestaurant.name}`,
            address: restaurantData.address,
            city: restaurantData.city,
            state: restaurantData.state,
            country: restaurantData.country,
            postalCode: restaurantData.postalCode,
            phone: restaurantData.phone,
            email: restaurantData.email,
            manager: 'Branch Manager',
            restaurantId: newRestaurant.id,
            isActive: true,
          }
        });

        console.log('✅ Created restaurant and branch:', newRestaurant.name);
      }

      console.log('🎉 Successfully seeded restaurants and branches!');
    } else {
      console.log('ℹ️  Restaurant already exists, skipping seed');
    }

  } catch (error) {
    console.error('❌ Error seeding restaurants and branches:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRestaurantsAndBranches();
