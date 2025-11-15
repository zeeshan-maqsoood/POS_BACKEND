import { Order, OrderItem, Branch, PrismaClient } from '@prisma/client';
import { getSocketService } from '../config/socket';

const prisma = new PrismaClient();

export interface PrintOrderData {
  orderId: string;
  orderNumber: string;
  branchId: string;
  branchName: string;
  customerName: string | null;
  tableNumber: string | null;
  orderType: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    taxRate: number;
    tax: number;
    total: number;
    notes: string | null;
    modifiers?: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      total: number;
      notes?: string;
    }>;
  }>;
  // Additional fields for status updates
  isStatusReceipt?: boolean;
  previousStatus?: string;
  newStatus?: string;
  updatedBy?: string;
}

/**
 * Service to handle printing operations
 */
class PrintService {
  /**
   * Print a receipt for an order
   */
  async printReceipt(order: Order & { 
    items: OrderItem[],
    branch?: Branch | null 
  }) {
    try {
      const branchId = order.branchId || 'default';
      const branchName = order.branch?.name || 'Unknown Branch';
      
      console.log(`\n🖨️ [PrintService] Preparing to print order ${order.orderNumber}`);
      console.log(`🏢 Branch: ${branchName} (${branchId})`);
      
      // Format the order data for printing
      const printData: PrintOrderData = {
        orderId: order.id,
        orderNumber: order.orderNumber || `ORDER-${order.id.substring(0, 8).toUpperCase()}`,
        branchId: branchId,
        branchName: branchName,
        customerName: order.customerName || 'Walk-in Customer',
        tableNumber: order.tableNumber,
        orderType: order.orderType,
        status: order.status,
        paymentStatus: order.paymentStatus || 'PENDING',
        paymentMethod: order.paymentMethod,
        subtotal: Number(order.subtotal) || 0,
        tax: Number(order.tax) || 0,
        total: Number(order.total) || 0,
        discount: Number(order.discount) || 0,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: await Promise.all(order.items.map(async (item) => {
          // Parse modifiers from the JSON field
          let modifiers: Array<{
            id: string;
            name: string;
            price: number;
            quantity: number;
            total: number;
            notes?: string;
          }> = [];

          console.log(`🔍 [PrintService] Processing item ${item.id} (${item.name})`);
          console.log(`   - Modifiers raw data:`, item.modifiers);
          
          if (item.modifiers) {
            let modifiersData;
            
            // Handle different formats of modifiers
            if (typeof item.modifiers === 'string') {
              try {
                modifiersData = JSON.parse(item.modifiers);
                console.log('   - Parsed modifiers from JSON string:', modifiersData);
              } catch (e) {
                console.error('❌ Error parsing modifiers JSON:', e);
                modifiersData = [];
              }
            } else if (Array.isArray(item.modifiers)) {
              modifiersData = item.modifiers;
              console.log('   - Modifiers is already an array:', modifiersData);
            } else if (typeof item.modifiers === 'object' && item.modifiers !== null) {
              // Handle case where modifiers is a single object
              modifiersData = [item.modifiers];
              console.log('   - Single modifier object converted to array:', modifiersData);
            } else {
              modifiersData = [];
            }

            // Process the modifiers if we have valid data
            if (Array.isArray(modifiersData)) {
              modifiers = modifiersData
                .filter((mod: any) => mod) // Filter out any null/undefined modifiers
                .map((mod: any) => ({
                  id: mod.id || `mod-${Math.random().toString(36).substr(2, 9)}`,
                  name: mod.name || 'Modifier',
                  price: Number(mod.price) || 0,
                  quantity: Number(mod.quantity) || 1,
                  total: (Number(mod.price) || 0) * (Number(mod.quantity) || 1),
                  notes: mod.notes || undefined
                }));
              
              console.log(`   - Processed ${modifiers.length} modifiers`);
            }
          }

          // Calculate the base price - item.total is the base item total (without modifiers and tax)
          // We need to extract the base price from it
          const modifiersTotal = modifiers.reduce((sum, mod) => sum + (mod.total || 0), 0);
          const baseItemTotal = Number(item.total) || 0;
          const basePrice = baseItemTotal / (item.quantity || 1);
          
          console.log(`   - Base item total: $${baseItemTotal.toFixed(2)}, Modifiers: $${modifiersTotal.toFixed(2)}, Tax Rate: ${Number(item.taxRate) || 0}%`);
          console.log(`   - Base price: $${basePrice.toFixed(2)} (Base item total divided by quantity ${item.quantity})`);
          
          return {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: basePrice, // Send base price without modifiers
            taxRate: Number(item.taxRate) || 0,
            tax: Number(item.tax) || 0,
            total: baseItemTotal, // Total for base item only (without modifiers)
            notes: item.notes,
            modifiers
          };
        }))
      };

      console.log(`📤 [PrintService] Sending print job for order ${order.orderNumber}`);
      console.log(`   - Items: ${printData.items.length}`);
      console.log(`   - Total: $${printData.total.toFixed(2)}`);
      
      // Emit the print event to the agent
      console.log(`🔌 [PrintService] Sending to branchId: ${branchId}`);
      console.log('📡 Print data:', JSON.stringify(printData, null, 2));
      
      // Get socket service and emit to all connected printer agents in the branch
      const socketService = getSocketService();
      socketService.emitToPrinter(branchId, 'print:receipt', printData);
      console.log('✅ [PrintService] Print job sent to printer agents');

      return { success: true };
    } catch (error) {
      console.error('Error in printReceipt:', error);
      return { success: false, error: 'Failed to send print job' };
    }
  }
}

export const printService = new PrintService();