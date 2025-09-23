import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Import the Permission enum from @prisma/client
import { Permission } from '@prisma/client';

// Only include permissions that were successfully added in the previous run
const adminPermissions = [
  Permission.USER_CREATE,
  Permission.USER_READ,
  Permission.USER_UPDATE,
  Permission.USER_DELETE,
  Permission.MANAGER_CREATE,
  Permission.MANAGER_READ,
  Permission.MANAGER_UPDATE,
  Permission.ORDER_CREATE,
  Permission.ORDER_READ,
  Permission.ORDER_UPDATE,
  Permission.ORDER_DELETE,
  Permission.POS_CREATE,
  Permission.POS_READ,
  Permission.POS_UPDATE,
  Permission.POS_DELETE,
  Permission.MENU_CREATE,
  Permission.MENU_READ,
  Permission.MENU_UPDATE,
  Permission.MENU_DELETE
];

// Default categories for each branch
const defaultCategories = [
  { name: 'Appetizers', description: 'Starters and small plates', branchName: 'Main Branch' },
  { name: 'Main Courses', description: 'Entrees and main dishes', branchName: 'Main Branch' },
  { name: 'Desserts', description: 'Sweet treats and desserts', branchName: 'Main Branch' },
  { name: 'Beverages', description: 'Drinks and beverages', branchName: 'Main Branch' },

  { name: 'Appetizers', description: 'Starters and small plates', branchName: 'Downtown Branch' },
  { name: 'Main Courses', description: 'Entrees and main dishes', branchName: 'Downtown Branch' },
  { name: 'Desserts', description: 'Sweet treats and desserts', branchName: 'Downtown Branch' },
  { name: 'Beverages', description: 'Drinks and beverages', branchName: 'Downtown Branch' },

  { name: 'Appetizers', description: 'Starters and small plates', branchName: 'Uptown Branch' },
  { name: 'Main Courses', description: 'Entrees and main dishes', branchName: 'Uptown Branch' },
  { name: 'Desserts', description: 'Sweet treats and desserts', branchName: 'Uptown Branch' },
  { name: 'Beverages', description: 'Drinks and beverages', branchName: 'Uptown Branch' },

  { name: 'Appetizers', description: 'Starters and small plates', branchName: 'Westside Branch' },
  { name: 'Main Courses', description: 'Entrees and main dishes', branchName: 'Westside Branch' },
  { name: 'Desserts', description: 'Sweet treats and desserts', branchName: 'Westside Branch' },
  { name: 'Beverages', description: 'Drinks and beverages', branchName: 'Westside Branch' },

  { name: 'Appetizers', description: 'Starters and small plates', branchName: 'Eastside Branch' },
  { name: 'Main Courses', description: 'Entrees and main dishes', branchName: 'Eastside Branch' },
  { name: 'Desserts', description: 'Sweet treats and desserts', branchName: 'Eastside Branch' },
  { name: 'Beverages', description: 'Drinks and beverages', branchName: 'Eastside Branch' },
];

// Create manager users for each branch
const managerUsers = [
  {
    email: 'manager.main@example.com',
    password: 'manager123',
    name: 'Main Branch Manager',
    role: UserRole.MANAGER,
    branch: 'Main Branch'
  },
  {
    email: 'manager.downtown@example.com',
    password: 'manager123',
    name: 'Downtown Branch Manager',
    role: UserRole.MANAGER,
    branch: 'Downtown Branch'
  },
  {
    email: 'manager.uptown@example.com',
    password: 'manager123',
    name: 'Uptown Branch Manager',
    role: UserRole.MANAGER,
    branch: 'Uptown Branch'
  },
  {
    email: 'manager.westside@example.com',
    password: 'manager123',
    name: 'Westside Branch Manager',
    role: UserRole.MANAGER,
    branch: 'Westside Branch'
  },
  {
    email: 'manager.eastside@example.com',
    password: 'manager123',
    name: 'Eastside Branch Manager',
    role: UserRole.MANAGER,
    branch: 'Eastside Branch'
  }
];

async function main() {
  console.log('Starting seed...');
  
  // Log available Permission enum values for debugging
  console.log('Available Permission enum values:', Object.values(Permission));
  
  
  // Check if admin already exists
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
    include: { permissions: true }
  });

  if (!adminExists) {
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // First create the user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: UserRole.ADMIN,
      },
    });
    
    console.log('Admin user created, adding permissions...');
    
    // Then create the permissions one by one with error handling
    for (const permission of adminPermissions) {
      try {
        await prisma.userPermission.create({
          data: {
            userId: adminUser.id,
            permission: permission as any,
          },
        });
        console.log(`Added permission: ${permission}`);
      } catch (error) {
        console.error(`Error adding permission ${permission}:`, error);
      }
    }
    
    console.log('Admin user created successfully with all permissions');
  } else {
    console.log('Admin user already exists, checking permissions...');
    
    // Check if all permissions exist
    const existingPermissions = adminExists.permissions.map(p => p.permission);
    const missingPermissions = adminPermissions.filter(
      p => !existingPermissions.includes(p)
    );
    
    if (missingPermissions.length > 0) {
      console.log(`Adding ${missingPermissions.length} missing permissions...`);
      
      // Add missing permissions one by one with error handling
      for (const permission of missingPermissions) {
        try {
          await prisma.userPermission.create({
            data: {
              userId: adminExists.id,
              permission: permission as any,
            },
          });
          console.log(`Added missing permission: ${permission}`);
        } catch (error) {
          console.error(`Error adding missing permission ${permission}:`, error);
        }
      }
    } else {
      console.log('All permissions are already set up');
    }
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
