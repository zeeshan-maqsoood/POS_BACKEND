// services/inventory.service.ts
import { PrismaClient, InventoryStatus } from "@prisma/client";
const prisma = new PrismaClient();

export const inventoryService = {
  /**
   * Update inventory status based on current quantity
   */
  async updateInventoryStatus(inventoryItemId: string) {
    try {
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId }
      });

      if (!inventoryItem) {
        throw new Error(`Inventory item ${inventoryItemId} not found`);
      }

      let newStatus: InventoryStatus;

      if (inventoryItem.quantity <= 0) {
        newStatus = InventoryStatus.OUT_OF_STOCK;
      } else if (inventoryItem.quantity <= inventoryItem.minStock) {
        newStatus = InventoryStatus.LOW_STOCK;
      } else {
        newStatus = InventoryStatus.IN_STOCK;
      }

      // Only update if status has changed
      if (inventoryItem.status !== newStatus) {
        await prisma.inventoryItem.update({
          where: { id: inventoryItemId },
          data: {
            status: newStatus,
            lastUpdated: new Date()
          }
        });

        console.log(`Updated ${inventoryItem.name} status from ${inventoryItem.status} to ${newStatus}`);
        
        // Create status change transaction
        await prisma.inventoryTransaction.create({
          data: {
            inventoryItemId: inventoryItemId,
            type: 'ADJUSTMENT',
            quantity: 0, // Status change only
            reason: `Status changed from ${inventoryItem.status} to ${newStatus}`,
            referenceType: 'STATUS_UPDATE',
            branchName: inventoryItem.branchName,
            previousQuantity: inventoryItem.quantity,
            newQuantity: inventoryItem.quantity
          }
        });
      }

      return newStatus;
    } catch (error) {
      console.error('Error updating inventory status:', error);
      throw new Error(`Failed to update inventory status: ${error.message}`);
    }
  },

  /**
   * Deduct inventory for an order (branch-based using main inventory)
   */
  async deductInventoryForOrder(order: any) {
    try {
      console.log(`Starting inventory deduction for order ${order.orderNumber} in branch ${order.branchName}`);
      
      if (!order.branchName) {
        throw new Error('Order branch name is required for inventory deduction');
      }

      // Get all menu items from the order with their ingredients
      const menuItemIds = order.items
        .map((item: any) => item.menuItemId)
        .filter((id: string | null) => id !== null);

      if (menuItemIds.length === 0) {
        console.log('No valid menu items found for inventory deduction');
        return;
      }

      const menuItemsWithIngredients = await prisma.menuItem.findMany({
        where: { 
          id: { in: menuItemIds } 
        },
        include: {
          menuItemIngredients: {
            include: {
              inventoryItem: true
            }
          },
          modifiers: {
            include: {
              modifier: {
                include: {
                  modifierIngredients: {
                    include: {
                      inventoryItem: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Create a map for easy lookup
      const menuItemMap = new Map(
        menuItemsWithIngredients.map(item => [item.id, item])
      );

      // Calculate total ingredients needed
      const ingredientDeductions = new Map();

      for (const orderItem of order.items) {
        const menuItem = menuItemMap.get(orderItem.menuItemId);
        if (!menuItem) {
          console.warn(`Menu item ${orderItem.menuItemId} not found for order item ${orderItem.id}`);
          continue;
        }

        // Process main item ingredients
        for (const ingredient of menuItem.menuItemIngredients) {
          const key = ingredient.inventoryItemId;
          const currentData = ingredientDeductions.get(key) || {
            inventoryItemId: ingredient.inventoryItemId,
            quantity: 0,
            inventoryItem: ingredient.inventoryItem
          };
          const quantityToDeduct = ingredient.quantity * orderItem.quantity;
          
          ingredientDeductions.set(key, {
            ...currentData,
            quantity: currentData.quantity + quantityToDeduct
          });
        }

        // Process modifier ingredients if any
        if (orderItem.modifiers && Array.isArray(orderItem.modifiers)) {
          for (const modifierData of orderItem.modifiers) {
            const menuItemModifier = menuItem.modifiers.find(
              (m: any) => m.modifier.id === modifierData.id
            );
            
            if (menuItemModifier && menuItemModifier.modifier.modifierIngredients) {
              for (const modifierIngredient of menuItemModifier.modifier.modifierIngredients) {
                const key = modifierIngredient.inventoryItemId;
                const currentData = ingredientDeductions.get(key) || {
                  inventoryItemId: modifierIngredient.inventoryItemId,
                  quantity: 0,
                  inventoryItem: modifierIngredient.inventoryItem
                };
                const quantityToDeduct = modifierIngredient.quantity * orderItem.quantity;
                
                ingredientDeductions.set(key, {
                  ...currentData,
                  quantity: currentData.quantity + quantityToDeduct
                });
              }
            }
          }
        }
      }

      // Process deductions in a transaction
      await prisma.$transaction(async (tx) => {
        const updatedInventoryItems = [];

        for (const [inventoryItemId, deductionData] of ingredientDeductions) {
          const { quantity: totalQuantity, inventoryItem } = deductionData;

          // Get current inventory with locking to prevent race conditions
          const currentInventoryItem = await tx.inventoryItem.findUnique({
            where: { id: inventoryItemId }
          });

          if (!currentInventoryItem) {
            throw new Error(`Inventory item ${inventoryItemId} not found`);
          }

          if (currentInventoryItem.quantity < totalQuantity) {
            throw new Error(
              `Insufficient inventory for ${inventoryItem.name} in branch ${order.branchName}. ` +
              `Required: ${totalQuantity}, Available: ${currentInventoryItem.quantity}`
            );
          }

          const newQuantity = currentInventoryItem.quantity - totalQuantity;
          let newStatus: InventoryStatus;

          // Determine new status based on updated quantity
          if (newQuantity <= 0) {
            newStatus = InventoryStatus.OUT_OF_STOCK;
          } else if (newQuantity <= currentInventoryItem.minStock) {
            newStatus = InventoryStatus.LOW_STOCK;
          } else {
            newStatus = InventoryStatus.IN_STOCK;
          }

          // Update main inventory with new status
          await tx.inventoryItem.update({
            where: { id: inventoryItemId },
            data: {
              quantity: {
                decrement: totalQuantity
              },
              status: newStatus,
              lastUpdated: new Date()
            }
          });

          // Create inventory transaction record with branch info
          await tx.inventoryTransaction.create({
            data: {
              inventoryItemId: inventoryItemId,
              type: 'OUTGOING',
              quantity: totalQuantity,
              reason: `Order #${order.orderNumber}`,
              referenceId: order.id,
              referenceType: 'ORDER',
              branchName: order.branchName,
              previousQuantity: currentInventoryItem.quantity,
              newQuantity: newQuantity,
              createdById: order.createdById
            }
          });

          updatedInventoryItems.push({
            id: inventoryItemId,
            name: inventoryItem.name,
            previousQuantity: currentInventoryItem.quantity,
            newQuantity: newQuantity,
            previousStatus: currentInventoryItem.status,
            newStatus: newStatus
          });

          console.log(`Deducted ${totalQuantity} of ${inventoryItem.name} for order ${order.orderNumber} in branch ${order.branchName}. Status: ${currentInventoryItem.status} -> ${newStatus}`);
        }

        return updatedInventoryItems;
      });

      console.log(`Successfully deducted inventory for order ${order.orderNumber} in branch ${order.branchName}`);
    } catch (error) {
      console.error('Error deducting inventory:', error);
      throw new Error(`Failed to deduct inventory: ${error.message}`);
    }
  },

  /**
   * Restore inventory when order is cancelled (branch-based using main inventory)
   */
  async restoreInventoryForOrder(order: any) {
    try {
      console.log(`Starting inventory restoration for order ${order.orderNumber} in branch ${order.branchName}`);
      
      if (!order.branchName) {
        throw new Error('Order branch name is required for inventory restoration');
      }

      // Get all menu items from the order with their ingredients
      const menuItemIds = order.items
        .map((item: any) => item.menuItemId)
        .filter((id: string | null) => id !== null);

      if (menuItemIds.length === 0) {
        console.log('No valid menu items found for inventory restoration');
        return;
      }

      const menuItemsWithIngredients = await prisma.menuItem.findMany({
        where: { 
          id: { in: menuItemIds } 
        },
        include: {
          menuItemIngredients: {
            include: {
              inventoryItem: true
            }
          },
          modifiers: {
            include: {
              modifier: {
                include: {
                  modifierIngredients: {
                    include: {
                      inventoryItem: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      const menuItemMap = new Map(
        menuItemsWithIngredients.map(item => [item.id, item])
      );

      const ingredientRestorations = new Map();

      for (const orderItem of order.items) {
        const menuItem = menuItemMap.get(orderItem.menuItemId);
        if (!menuItem) continue;

        // Process main item ingredients
        for (const ingredient of menuItem.menuItemIngredients) {
          const key = ingredient.inventoryItemId;
          const currentData = ingredientRestorations.get(key) || {
            inventoryItemId: ingredient.inventoryItemId,
            quantity: 0,
            inventoryItem: ingredient.inventoryItem
          };
          const quantityToRestore = ingredient.quantity * orderItem.quantity;
          
          ingredientRestorations.set(key, {
            ...currentData,
            quantity: currentData.quantity + quantityToRestore
          });
        }

        // Process modifier ingredients if any
        if (orderItem.modifiers && Array.isArray(orderItem.modifiers)) {
          for (const modifierData of orderItem.modifiers) {
            const menuItemModifier = menuItem.modifiers.find(
              (m: any) => m.modifier.id === modifierData.id
            );
            
            if (menuItemModifier && menuItemModifier.modifier.modifierIngredients) {
              for (const modifierIngredient of menuItemModifier.modifier.modifierIngredients) {
                const key = modifierIngredient.inventoryItemId;
                const currentData = ingredientRestorations.get(key) || {
                  inventoryItemId: modifierIngredient.inventoryItemId,
                  quantity: 0,
                  inventoryItem: modifierIngredient.inventoryItem
                };
                const quantityToRestore = modifierIngredient.quantity * orderItem.quantity;
                
                ingredientRestorations.set(key, {
                  ...currentData,
                  quantity: currentData.quantity + quantityToRestore
                });
              }
            }
          }
        }
      }

      await prisma.$transaction(async (tx) => {
        for (const [inventoryItemId, restorationData] of ingredientRestorations) {
          const { quantity: totalQuantity, inventoryItem } = restorationData;

          const currentInventoryItem = await tx.inventoryItem.findUnique({
            where: { id: inventoryItemId }
          });

          if (!currentInventoryItem) continue;

          const newQuantity = currentInventoryItem.quantity + totalQuantity;
          let newStatus: InventoryStatus;

          // Determine new status based on updated quantity
          if (newQuantity <= 0) {
            newStatus = InventoryStatus.OUT_OF_STOCK;
          } else if (newQuantity <= currentInventoryItem.minStock) {
            newStatus = InventoryStatus.LOW_STOCK;
          } else {
            newStatus = InventoryStatus.IN_STOCK;
          }

          // Restore inventory with updated status
          await tx.inventoryItem.update({
            where: { id: inventoryItemId },
            data: {
              quantity: {
                increment: totalQuantity
              },
              status: newStatus,
              lastUpdated: new Date()
            }
          });

          // Create restoration transaction record
          await tx.inventoryTransaction.create({
            data: {
              inventoryItemId: inventoryItemId,
              type: 'INCOMING',
              quantity: totalQuantity,
              reason: `Order cancellation #${order.orderNumber}`,
              referenceId: order.id,
              referenceType: 'ORDER_CANCELLATION',
              branchName: order.branchName,
              previousQuantity: currentInventoryItem.quantity,
              newQuantity: newQuantity,
              createdById: order.createdById
            }
          });

          console.log(`Restored ${totalQuantity} of ${inventoryItem.name} for cancelled order ${order.orderNumber} in branch ${order.branchName}. Status: ${currentInventoryItem.status} -> ${newStatus}`);
        }
      });

      console.log(`Successfully restored inventory for cancelled order ${order.orderNumber} in branch ${order.branchName}`);
    } catch (error) {
      console.error('Error restoring inventory:', error);
      throw new Error(`Failed to restore inventory: ${error.message}`);
    }
  },

  /**
   * Check if there's sufficient inventory for an order (branch-based awareness)
   */
  async checkInventoryAvailability(orderData: any) {
    try {
      if (!orderData.branchName) {
        throw new Error('Branch name is required for inventory check');
      }

      const menuItemIds = orderData.items
        .map((item: any) => item.menuItemId)
        .filter((id: string | null) => id !== null);

      if (menuItemIds.length === 0) {
        return { available: true, issues: [] };
      }

      const menuItemsWithIngredients = await prisma.menuItem.findMany({
        where: { 
          id: { in: menuItemIds } 
        },
        include: {
          menuItemIngredients: {
            include: {
              inventoryItem: true
            }
          },
          modifiers: {
            include: {
              modifier: {
                include: {
                  modifierIngredients: {
                    include: {
                      inventoryItem: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      const menuItemMap = new Map(
        menuItemsWithIngredients.map(item => [item.id, item])
      );

      const inventoryIssues = [];

      for (const orderItem of orderData.items) {
        const menuItem = menuItemMap.get(orderItem.menuItemId);
        if (!menuItem) continue;

        // Check main item ingredients
        for (const ingredient of menuItem.menuItemIngredients) {
          const availableQuantity = ingredient.inventoryItem.quantity;
          const requiredQuantity = ingredient.quantity * orderItem.quantity;
          
          if (availableQuantity < requiredQuantity) {
            inventoryIssues.push({
              itemName: menuItem.name,
              ingredientName: ingredient.inventoryItem.name,
              required: requiredQuantity,
              available: availableQuantity,
              branch: orderData.branchName,
              message: `Insufficient ${ingredient.inventoryItem.name} in branch ${orderData.branchName}`,
              currentStatus: ingredient.inventoryItem.status
            });
          }
        }

        // Check modifier ingredients
        if (orderItem.modifiers && Array.isArray(orderItem.modifiers)) {
          for (const modifierData of orderItem.modifiers) {
            const menuItemModifier = menuItem.modifiers.find(
              (m: any) => m.modifier.id === modifierData.id
            );
            
            if (menuItemModifier && menuItemModifier.modifier.modifierIngredients) {
              for (const modifierIngredient of menuItemModifier.modifier.modifierIngredients) {
                const availableQuantity = modifierIngredient.inventoryItem.quantity;
                const requiredQuantity = modifierIngredient.quantity * orderItem.quantity;
                
                if (availableQuantity < requiredQuantity) {
                  inventoryIssues.push({
                    itemName: `${menuItem.name} (${menuItemModifier.modifier.name})`,
                    ingredientName: modifierIngredient.inventoryItem.name,
                    required: requiredQuantity,
                    available: availableQuantity,
                    branch: orderData.branchName,
                    message: `Insufficient ${modifierIngredient.inventoryItem.name} for modifier in branch ${orderData.branchName}`,
                    currentStatus: modifierIngredient.inventoryItem.status
                  });
                }
              }
            }
          }
        }
      }

      return {
        available: inventoryIssues.length === 0,
        issues: inventoryIssues
      };
    } catch (error) {
      console.error('Error checking inventory availability:', error);
      throw new Error(`Failed to check inventory: ${error.message}`);
    }
  },

  /**
   * Get branch-specific inventory levels (using transactions for tracking)
   */
  async getBranchInventory(branchName: string) {
    try {
      if (!branchName) {
        throw new Error('Branch name is required');
      }

      // Get all inventory items with their transactions for this branch
      const inventoryItems = await prisma.inventoryItem.findMany({
        include: {
          InventoryTransaction: {
            where: {
              branchName: branchName
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10 // Last 10 transactions
          },
          category: true,
          subcategory: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Calculate effective branch inventory based on transactions
      const branchInventory = inventoryItems.map(item => {
        const branchTransactions = item.InventoryTransaction;
        const netChange = branchTransactions.reduce((sum, transaction) => {
          if (transaction.type === 'INCOMING') {
            return sum + transaction.quantity;
          } else {
            return sum - transaction.quantity;
          }
        }, 0);

        return {
          ...item,
          branchQuantity: item.quantity, // Using main inventory quantity
          branchNetChange: netChange,
          lastBranchTransaction: branchTransactions[0] || null,
          // Add status indicators
          isLowStock: item.quantity <= item.minStock,
          isOutOfStock: item.quantity <= 0,
          needsRestock: item.quantity <= item.minStock
        };
      });

      return branchInventory;
    } catch (error) {
      console.error('Error getting branch inventory:', error);
      throw new Error(`Failed to get branch inventory: ${error.message}`);
    }
  },

  /**
   * Get inventory consumption report by branch
   */
  async getBranchInventoryReport(branchName: string, startDate?: Date, endDate?: Date) {
    try {
      if (!branchName) {
        throw new Error('Branch name is required');
      }

      const where: any = {
        branchName: branchName,
        referenceType: 'ORDER'
      };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          where.createdAt.lte = endOfDay;
        }
      }

      const transactions = await prisma.inventoryTransaction.groupBy({
        by: ['inventoryItemId', 'type'],
        where: where,
        _sum: {
          quantity: true
        },
        _count: {
          id: true
        }
      });

      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          id: {
            in: transactions.map(t => t.inventoryItemId)
          }
        },
        select: {
          id: true,
          name: true,
          unit: true,
          status: true,
          minStock: true,
          quantity: true
        }
      });

      const itemMap = new Map(inventoryItems.map(item => [item.id, item]));

      const report = transactions.map(transaction => {
        const item = itemMap.get(transaction.inventoryItemId);
        return {
          inventoryItemId: transaction.inventoryItemId,
          inventoryItemName: item?.name || 'Unknown',
          unit: item?.unit || '',
          type: transaction.type,
          totalQuantity: transaction._sum.quantity || 0,
          transactionCount: transaction._count.id,
          currentStatus: item?.status,
          currentQuantity: item?.quantity,
          minStock: item?.minStock,
          isLowStock: item ? item.quantity <= item.minStock : false,
          isOutOfStock: item ? item.quantity <= 0 : false
        };
      });

      return report;
    } catch (error) {
      console.error('Error getting branch inventory report:', error);
      throw new Error(`Failed to get branch inventory report: ${error.message}`);
    }
  },

  /**
   * Get low stock alerts for a branch
   */
  async getLowStockAlerts(branchName?: string) {
    try {
      const where: any = {
        OR: [
          { status: InventoryStatus.LOW_STOCK },
          { status: InventoryStatus.OUT_OF_STOCK }
        ]
      };

      if (branchName) {
        where.branchName = branchName;
      }

      const lowStockItems = await prisma.inventoryItem.findMany({
        where: where,
        include: {
          category: true,
          subcategory: true
        },
        orderBy: [
          { status: 'desc' }, // OUT_OF_STOCK first
          { quantity: 'asc' } // Lowest quantity first
        ]
      });

      return lowStockItems.map(item => ({
        ...item,
        needsImmediateAttention: item.status === InventoryStatus.OUT_OF_STOCK,
        restockUrgency: item.quantity <= 0 ? 'CRITICAL' : 
                       item.quantity <= item.minStock ? 'HIGH' : 'NORMAL'
      }));
    } catch (error) {
      console.error('Error getting low stock alerts:', error);
      throw new Error(`Failed to get low stock alerts: ${error.message}`);
    }
  },

  /**
   * Bulk update inventory status for all items (useful for migration or cleanup)
   */
  async bulkUpdateInventoryStatus() {
    try {
      const allItems = await prisma.inventoryItem.findMany();
      let updatedCount = 0;

      for (const item of allItems) {
        let newStatus: InventoryStatus;

        if (item.quantity <= 0) {
          newStatus = InventoryStatus.OUT_OF_STOCK;
        } else if (item.quantity <= item.minStock) {
          newStatus = InventoryStatus.LOW_STOCK;
        } else {
          newStatus = InventoryStatus.IN_STOCK;
        }

        if (item.status !== newStatus) {
          await prisma.inventoryItem.update({
            where: { id: item.id },
            data: { status: newStatus }
          });
          updatedCount++;
        }
      }

      console.log(`Bulk updated ${updatedCount} inventory items`);
      return { updatedCount, totalCount: allItems.length };
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw new Error(`Failed to bulk update inventory status: ${error.message}`);
    }
  }
};