// import fetch from 'node-fetch';
// import { Order, OrderItem } from '@prisma/client';
// import { getSocketService } from '../config/socket';

// type OrderWithItems = Order & {
//   items: Array<OrderItem & {
//     modifiers?: Array<{
//       name: string;
//       price: number;
//     }>;
//   }>;
// };

// class PrintService {
//   private apiKey: string;
//   private baseUrl = 'https://api.printnode.com';

//   constructor() {
//     this.apiKey = process.env.PRINTNODE_API_KEY || '';
//     if (!this.apiKey) {
//       console.warn('PRINTNODE_API_KEY is not set. Printing will be disabled.');
//     }
//   }

//   private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
//     if (!this.apiKey) {
//       console.warn('PrintNode API key not configured');
//       return null;
//     }

//     try {
//       const url = `${this.baseUrl}${endpoint}`;
//       const response = await fetch(url, {
//         method,
//         headers: {
//           'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
//           'Content-Type': 'application/json',
//           'Accept': 'application/json; charset=utf-8',
//         },
//         body: body ? JSON.stringify(body) : undefined,
//       });

//       if (!response.ok) {
//         const error = await response.text();
//         throw new Error(`PrintNode API error: ${error}`);
//       }

//       return response.json();
//     } catch (error) {
//       console.error('PrintNode API request failed:', error);
//       return null;
//     }
//   }

//   private async getPrinters() {
//     try {
//       const response = await this.makeRequest('/printers');
//       if (!response || !Array.isArray(response)) {
//         console.error('Invalid printers response:', response);
//         return [];
//       }
      
//       // Log all available printers for debugging
//       console.log('Available printers:');
//       response.forEach((printer: any) => {
//         console.log(`- ${printer.name} (${printer.id})`);
//       });
      
//       return response;
//     } catch (error) {
//       console.error('Error fetching printers:', error);
//       return [];
//     }
//   }
  
//   // Helper method to identify virtual printers
//   private isVirtualPrinter(printerName: string): boolean {
//     const virtualPrinters = [
//       'microsoft xps',
//       'microsoft print to pdf',
//       'fax',
//       'onenote',
//       'adobe pdf',
//       'foxit reader pdf printer',
//       'send to onenote',
//       'pdf',
//       'xps',
//       'document writer'
//     ];
    
//     return virtualPrinters.some(vp => 
//       printerName.toLowerCase().includes(vp)
//     );
//   }

//   async printOrderReceipt(order: OrderWithItems, printerName?: string) {
//     if (!this.apiKey) {
//       const errorMsg = 'PrintNode not configured, skipping receipt printing';
//       console.warn(errorMsg);
//       this.notifyPrintStatus(order, 'error', errorMsg);
//       return null;
//     }

//     try {
//       // If no printer name is provided, use the first available printer
//       let printers = await this.getPrinters();
//       if (!printers || printers.length === 0) {
//         const errorMsg = 'No printers available';
//         this.notifyPrintStatus(order, 'error', errorMsg);
//         throw new Error(errorMsg);
//       }

//       // Log all available printers for debugging
//       console.log('Available printers:');
//       printers.forEach((p: any) => {
//         console.log(`- ${p.name} (${p.id})`);
//       });

//       let printer = null;
      
//       // If a specific printer is requested, try to find it
//       if (printerName) {
//         printer = printers.find((p: { name: string }) => 
//           p.name.toLowerCase().includes(printerName.toLowerCase())
//         );
        
//         if (!printer) {
//           console.warn(`Requested printer '${printerName}' not found. Falling back to first available printer.`);
//         }
//       }
      
//       // If no specific printer was requested or found, find the first non-virtual printer
//       if (!printer) {
//         // First try to find a non-virtual printer
//         printer = printers.find((p: { name: string }) => !this.isVirtualPrinter(p.name));
        
//         // If no non-virtual printer found, use the first available printer
//         if (!printer && printers.length > 0) {
//           console.warn('No non-virtual printers found. Using first available printer.');
//           printer = printers[0];
//         }
//       }

//       if (!printer) {
//         const errorMsg = 'No printers available for printing';
//         this.notifyPrintStatus(order, 'error', errorMsg);
//         throw new Error(errorMsg);
//       }
      
//       console.log(`Selected printer: ${printer.name} (${printer.id})`);

//       const receipt = this.formatReceipt(order);
      
//       const printJob = {
//         printerId: printer.id,
//         title: `Order #${order.orderNumber}`,
//         contentType: 'raw_base64',
//         content: Buffer.from(receipt).toString('base64'),
//         source: 'POS System',
//         // Ensure raw printing mode is used
//         options: {
//           media: 'A4',
//           nopdf: true
//         }
//       };

//       console.log(`Sending print job to printer: ${printer.name} (${printer.id})`);

//       // Notify that print job is being sent
//       this.notifyPrintStatus(order, 'sending', 'Sending to printer...');

//       const result = await this.makeRequest('/printjobs', 'POST', printJob);
      
//       // Notify that print job was sent successfully
//       this.notifyPrintStatus(order, 'success', 'Receipt sent to printer');
      
//       return result;
//     } catch (error) {
//       const errorMsg = error instanceof Error ? error.message : 'Failed to print receipt';
//       console.error('Print error:', errorMsg);
//       this.notifyPrintStatus(order, 'error', errorMsg);
//       throw error;
//     }
//   }

//   private formatReceipt(order: OrderWithItems & { subtotal?: number; tax?: number; total?: number }): string {
//     // Ensure we're using plain text with proper line endings
//     const line = '--------------------------------';
//     const newLine = '\n';
    
//     // Start with some blank lines to ensure the receipt starts printing at the right position
//     let receipt = newLine.repeat(5);
    
//     // Center the receipt content
//     const centerText = (text: string, width = 32) => {
//       if (text.length >= width) return text;
//       const padding = Math.floor((width - text.length) / 2);
//       return ' '.repeat(padding) + text;
//     };
    
//     // Add receipt header
//     receipt += centerText('YOUR RESTAURANT NAME') + newLine;
//     receipt += centerText('123 Restaurant St.') + newLine;
//     receipt += centerText('City, Country') + newLine.repeat(2);
//     receipt += centerText('RECEIPT') + newLine;
//     receipt += line + newLine;
    
//     // Add order info
//     receipt += `Order #: ${order.orderNumber}${newLine}`;
//     receipt += `Date: ${new Date().toLocaleString()}${newLine}`;
//     receipt += `Order Type: ${order.orderType || 'Dine-in'}${newLine}`;
//     receipt += line + newLine;
    
//     // Add items
//     receipt += 'ITEM'.padEnd(20) + 'QTY  PRICE   TOTAL' + newLine;
//     receipt += line + newLine;
    
//     order.items.forEach((item: any) => {
//       const itemTotal = (item.quantity * item.price).toFixed(2);
//       receipt += `${item.name.substring(0, 18).padEnd(20)}${item.quantity.toString().padEnd(5)}${item.price.toFixed(2).padStart(6)}${itemTotal.padStart(8)}${newLine}`;
      
//       // Add modifiers if any
//       if (item.modifiers && Array.isArray(item.modifiers)) {
//         item.modifiers.forEach((modifier: any) => {
//           receipt += `  - ${modifier.name}`.padEnd(21) + modifier.price.toFixed(2).padStart(14) + newLine;
//         });
//       }
//     });
    
//     // Add totals
//     receipt += line + newLine;
//     receipt += `Subtotal:`.padEnd(15) + (order.subtotal || 0).toFixed(2).padStart(17) + newLine;
//     receipt += `Tax:`.padEnd(15) + (order.tax || 0).toFixed(2).padStart(17) + newLine;
//     receipt += line + newLine;
//     receipt += `TOTAL:`.padEnd(15) + (order.total || 0).toFixed(2).padStart(17) + newLine;
//     receipt += line + newLine.repeat(2);
    
//     // Add footer
//     receipt += centerText('Thank you for dining with us!') + newLine;
//     receipt += centerText('Please come again!') + newLine.repeat(3);
    
//     // Add cut command (ESC/POS) - uncomment if your printer supports it
//     // receipt += '\x1B@\x1DV1\x00'; // Initialize, cut paper
    
//     return receipt;
//   }

//   private async notifyPrintStatus(order: OrderWithItems, status: 'sending' | 'success' | 'error', message: string) {
//     try {
//       const socketService = getSocketService();
//       const { io } = socketService;
      
//       // Emit to the branch room if branchName exists
//       if (order.branchName) {
//         io.to(`branch-${order.branchName}`).emit('print-status', {
//           orderId: order.id,
//           orderNumber: order.orderNumber,
//           status,
//           message,
//           timestamp: new Date().toISOString()
//         });
//       }
      
//       // Also emit a general notification
//       io.emit('print-notification', {
//         orderId: order.id,
//         orderNumber: order.orderNumber,
//         status,
//         message,
//         timestamp: new Date().toISOString()
//       });
//     } catch (error) {
//       console.error('Failed to send print status notification:', error);
//     }
//   }
// }

// export const printService = new PrintService();
import fetch from 'node-fetch';
import { Order, OrderItem } from '@prisma/client';
import { getSocketService } from '../config/socket';

type OrderWithItems = Order & {
  items: Array<OrderItem & {
    modifiers?: Array<{
      name: string;
      price: number;
    }>;
  }>;
};

class PrintService {
  private apiKey: string;
  private baseUrl = 'https://api.printnode.com';

  constructor() {
    this.apiKey = process.env.PRINTNODE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('PRINTNODE_API_KEY is not set. Printing will be disabled.');
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    if (!this.apiKey) {
      console.warn('PrintNode API key not configured');
      return null;
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json; charset=utf-8',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PrintNode API error: ${error}`);
      }

      return response.json();
    } catch (error) {
      console.error('PrintNode API request failed:', error);
      return null;
    }
  }

  private async getPrinters() {
    try {
      const response = await this.makeRequest('/printers');
      if (!response || !Array.isArray(response)) {
        console.error('Invalid printers response:', response);
        return [];
      }

      console.log('Available printers:');
      response.forEach((printer: any) => {
        console.log(`- ${printer.name} (${printer.id})`);
      });

      return response;
    } catch (error) {
      console.error('Error fetching printers:', error);
      return [];
    }
  }

  private isVirtualPrinter(printerName: string): boolean {
    const virtualPrinters = [
      'microsoft xps',
      'microsoft print to pdf',
      'fax',
      'onenote',
      'adobe pdf',
      'foxit reader pdf printer',
      'send to onenote',
      'pdf',
      'xps',
      'document writer'
    ];

    return virtualPrinters.some(vp =>
      printerName.toLowerCase().includes(vp)
    );
  }

  // private isThermalPrinter(printer: { name: string; type?: string }): boolean {
  //   const thermalKeywords = ['epson', 'thermal', 'pos', 'receipt', 'star'];
  //   return thermalKeywords.some(keyword => printer.name.toLowerCase().includes(keyword));
  // }

 async printOrderReceipt(order: OrderWithItems, printerName?: string) {
  if (!this.apiKey) {
    const errorMsg = 'PrintNode not configured, skipping receipt printing';
    console.warn(errorMsg);
    this.notifyPrintStatus(order, 'error', errorMsg);
    return null;
  }

  try {
    // Get available printers
    const printers = await this.getPrinters();
    if (!printers?.length) {
      const errorMsg = 'No printers available';
      this.notifyPrintStatus(order, 'error', errorMsg);
      throw new Error(errorMsg);
    }

    // Find the target printer
    let printer = this.findPrinter(printers, printerName);
    if (!printer) {
      const errorMsg = 'No suitable printer found';
      this.notifyPrintStatus(order, 'error', errorMsg);
      throw new Error(errorMsg);
    }

    console.log(`Selected printer: ${printer.name} (${printer.id})`);

    // Determine printer type and format receipt accordingly
    const isThermal = this.isThermalPrinter(printer);
    const printJob = isThermal
      ? await this.createThermalPrintJob(printer, order)
      : await this.createPdfPrintJob(printer, order);

    // Send print job
    console.log(`Sending ${isThermal ? 'thermal' : 'PDF'} print job to: ${printer.name}`);
    this.notifyPrintStatus(order, 'sending', 'Sending to printer...');

    const result = await this.makeRequest('/printjobs', 'POST', printJob);
    this.notifyPrintStatus(order, 'success', 'Receipt sent to printer');
    return result;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to print receipt';
    console.error('Print error:', errorMsg);
    this.notifyPrintStatus(order, 'error', errorMsg);
    throw error;
  }
}

private findPrinter(printers: any[], printerName?: string) {
  // If printer name is specified, try to find it
  if (printerName) {
    const found = printers.find(p => 
      p.name.toLowerCase().includes(printerName.toLowerCase())
    );
    if (found) return found;
    console.warn(`Printer '${printerName}' not found, falling back to default`);
  }

  // Otherwise, find first non-virtual printer
  const nonVirtual = printers.filter(p => !this.isVirtualPrinter(p.name));
  if (nonVirtual.length > 0) {
    return nonVirtual[0]; // Return first non-virtual printer
  }

  // If no non-virtual printers, return first available
  return printers.length > 0 ? printers[0] : null;
}

private async createThermalPrintJob(printer: any, order: OrderWithItems) {
  const receipt = this.formatReceiptThermal(order);
  return {
    printerId: printer.id,
    title: `Order #${order.orderNumber}`,
    contentType: 'raw_base64',
    content: Buffer.from(receipt).toString('base64'),
    source: 'POS System',
    options: {
      media: 'A4',
      nopdf: true
    }
  };
}

private async createPdfPrintJob(printer: any, order: OrderWithItems) {
  const pdfContent = await this.generatePdfReceipt(order);
  return {
    printerId: printer.id,
    title: `Order #${order.orderNumber}`,
    contentType: 'pdf_base64',
    content: pdfContent.toString('base64'),
    source: 'POS System',
    options: {
      copies: 1
    }
  };
}

private isThermalPrinter(printer: { name: string; type?: string }): boolean {
  // Check for common thermal printer indicators in the name
  const thermalKeywords = [
    'thermal', 'pos', 'receipt', 'ticket', 'tm-', 'sp-', 
    'epson', 'star', 'bixolon', 'zebra', 'zpl', 'epson'
  ];
  
  const name = printer.name.toLowerCase();
  return thermalKeywords.some(keyword => name.includes(keyword));
}

 

private async generatePdfReceipt(order: OrderWithItems & { 
  subtotal?: number; 
  tax?: number; 
  total?: number;
  branch?: {
    name: string;
    address?: string;
    phone?: string;
  };
}): Promise<Buffer> {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ 
    size: [80 * 2.83465, 297], // 80mm width (common receipt width) in points
    margin: 10,
    bufferPages: true
  });
  
  // Collect data into a buffer
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  
  // Set up fonts (using standard fonts that work in PDFKit)
  const titleFont = 'Helvetica-Bold';
  const headerFont = 'Helvetica-Bold';
  const bodyFont = 'Helvetica';
  const smallFont = 'Helvetica-Oblique';
  
  // Colors
  const primaryColor = '#000000'; // Darker for better thermal printing
  const secondaryColor = '#333333';
  const accentColor = '#000000';
  
  // Layout constants
  const leftMargin = 5;
  const rightMargin = 5;
  const contentWidth = 80 * 2.83465 - leftMargin - rightMargin; // 80mm in points
  
  // Helper function to add line break
  const br = (height = 10) => doc.moveDown(height / 10);
  
  // Set document info
  doc.info.Title = `Receipt #${order.orderNumber}`;
  
  // Header
  doc
    .font(headerFont)
    .fontSize(14)
    .fillColor(accentColor)
    .text((order.branch?.name || 'YOUR RESTAURANT').toUpperCase(), { 
      align: 'center',
      underline: true
    });
  
  br(5);
  
  // Restaurant info
  doc
    .font(bodyFont)
    .fontSize(8)
    .fillColor(secondaryColor)
    .text(order.branch?.address || '123 Restaurant St.', { align: 'center' })
    .text(`Tel: ${order.branch?.phone || '(123) 456-7890'}`, { align: 'center' });
  
  br(10);
  
  // Order info
  doc
    .font(headerFont)
    .fontSize(10)
    .fillColor(primaryColor)
    .text('RECEIPT', { align: 'center', underline: true });
  
  br(5);
  
  // Order details
  doc
    .font(bodyFont)
    .fontSize(8)
    .fillColor(primaryColor)
    .text(`Order #: ${order.orderNumber}`, { align: 'left' })
    .text(`Date: ${new Date().toLocaleString()}`, { align: 'left' })
    .text(`Type: ${order.orderType || 'Dine-in'}`, { align: 'left' });
  
  br(10);
  
  // Items table header
  const startY = doc.y;
  const col1 = leftMargin + 5;  // Item name
  const col2 = contentWidth * 0.6;  // QTY
  const col3 = contentWidth * 0.8;  // Price
  const col4 = contentWidth - rightMargin;  // Total (right-aligned)
  
  // Draw header line
  doc
    .moveTo(leftMargin, startY + 8)
    .lineTo(contentWidth + leftMargin, startY + 8)
    .lineWidth(0.5)
    .stroke(primaryColor);
    
  // Header text
  doc
    .font(headerFont)
    .fontSize(7)
    .fillColor(primaryColor)
    .text('ITEM', col1, startY + 2)
    .text('QTY', col2, startY + 2)
    .text('PRICE', col3, startY + 2, { width: col4 - col3 - 5, align: 'right' })
    .text('TOTAL', col4, startY + 2, { align: 'right' });
  
  // Items
  let currentY = startY + 15;
  order.items.forEach((item: any) => {
    const itemTotal = (item.quantity * item.price).toFixed(2);
    const itemName = item.name || 'Unnamed Item';
    
    // Calculate item name height with word wrap
    const itemNameOptions = {
      width: col2 - col1 - 5,
      align: 'left' as const
    };
    
    // Get height of the item name with wrapping
    const itemHeight = Math.max(
      doc.font(bodyFont).fontSize(8).heightOfString(itemName, itemNameOptions),
      10  // Minimum height
    );
    
    // Draw item name with word wrap
    doc
      .font(bodyFont)
      .fontSize(8)
      .fillColor(primaryColor)
      .text(itemName, col1, currentY, itemNameOptions);
      
    // Draw quantity, price, and total in a single line
    doc
      .text(item.quantity.toString(), col2, currentY)
      .text(parseFloat(item.price).toFixed(2), col3, currentY, { 
        width: col4 - col3 - 5, 
        align: 'right' 
      })
      .text(itemTotal, col4, currentY, { 
        align: 'right' 
      });
    
    currentY += itemHeight + 2;
    
    // Modifiers
    if (item.modifiers?.length) {
      doc.font(smallFont).fontSize(7).fillColor(secondaryColor);
      
      item.modifiers.forEach((mod: any) => {
        currentY += 3;  // Small space before modifier
        doc
          .text(`  - ${mod.name}`, col1 + 5, currentY)
          .text(`+${parseFloat(mod.price).toFixed(2)}`, col4, currentY, {
            align: 'right'
          });
        currentY += 7;  // Line height for modifier
      });
      
      doc.font(bodyFont).fontSize(8).fillColor(primaryColor);
    }
    
    currentY += 5;  // Space after item
  });
  
  // Draw line before totals
  doc
    .moveTo(leftMargin, currentY)
    .lineTo(contentWidth + leftMargin, currentY)
    .lineWidth(0.5)
    .stroke(secondaryColor);
  
  currentY += 8;
  
  // Calculate column positions for totals (right-aligned)
  const totalLabelWidth = 50;  // Width for labels like 'Subtotal:', 'Tax:'
  const totalValueWidth = 50;  // Width for the values
  
  // Helper function to add a total line
  const addTotalLine = (label: string, value: number, isBold = false) => {
    doc
      .font(isBold ? headerFont : bodyFont)
      .fontSize(isBold ? 9 : 8)
      .fillColor(isBold ? accentColor : primaryColor)
      .text(label, col4 - totalLabelWidth - totalValueWidth, currentY, {
        width: totalLabelWidth,
        align: 'right'
      })
      .text(value.toFixed(2), col4, currentY, {
        align: 'right'
      });
    currentY += isBold ? 12 : 9;
  };
  
  // Add subtotal and tax
  if (order.subtotal !== undefined) {
    addTotalLine('Subtotal:', order.subtotal);
  }
  
  if (order.tax !== undefined) {
    addTotalLine('Tax:', order.tax);
  }
  
  // Add a line above total
  doc
    .moveTo(col4 - totalLabelWidth - totalValueWidth, currentY - 3)
    .lineTo(col4, currentY - 3)
    .lineWidth(0.5)
    .stroke(secondaryColor);
  
  // Add grand total
  if (order.total !== undefined) {
    addTotalLine('TOTAL:', order.total, true);
  }
  
  currentY += 5;
  
  // Payment info
  if (order.paymentStatus === 'PAID' && order.paymentMethod) {
    doc
      .font(bodyFont)
      .fontSize(8)
      .fillColor(secondaryColor)
      .text(`Paid with: ${order.paymentMethod}`, { align: 'right' });
    currentY += 10;
  }
  
  // Footer
  br(15);
  doc
    .font(bodyFont)
    .fontSize(8)
    .fillColor(secondaryColor)
    .text('Thank you for dining with us!', { align: 'center' })
    .text('Please come again!', { align: 'center' });
  
  // Finalize PDF
  doc.end();
  
  // Wait for PDF generation to complete
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);
  });
}
 private formatReceiptThermal(order: OrderWithItems & { 
  subtotal?: number; 
  tax?: number; 
  total?: number;
  branch?: {
    name: string;
    address?: string;
    phone?: string;
  };
}): string {
  // Common ESC/POS commands
  const ESC = '\x1B';
  const INIT = `${ESC}@`; // Initialize printer
  const ALIGN_CENTER = `${ESC}a1`; // Center alignment
  const ALIGN_LEFT = `${ESC}a0`; // Left alignment
  const BOLD_ON = `${ESC}E1`; // Bold on
  const BOLD_OFF = `${ESC}E0`; // Bold off
  const FONT_A = `${ESC}!0`; // Font A (small)
  const FONT_B = `${ESC}!1`; // Font B (medium)
  const CUT = `${ESC}d3`; // Cut paper (partial)
  const LINE_FEED = '\n';
  const PAPER_WIDTH = 32; // Characters per line (adjust based on your printer)

  let receipt = INIT; // Initialize printer
  
  // Helper functions
  const centerText = (text: string) => {
    const padding = Math.max(0, Math.floor((PAPER_WIDTH - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const line = '-'.repeat(PAPER_WIDTH);
  
  // Get restaurant info from order or use defaults
  const restaurantName = order.branch?.name || 'YOUR RESTAURANT';
  const address = order.branch?.address || '123 Restaurant St.';
  const phone = order.branch?.phone || 'Phone: (123) 456-7890';
  
  // Header
  receipt += `${ALIGN_CENTER}${BOLD_ON}${FONT_B}`;
  receipt += `${centerText(restaurantName.toUpperCase())}${LINE_FEED}`;
  receipt += `${FONT_A}${BOLD_OFF}`;
  receipt += `${centerText(address)}${LINE_FEED}`;
  if (phone) {
    receipt += `${centerText(phone)}${LINE_FEED}`;
  }
  receipt += `${LINE_FEED}`;
  
  // Order info
  receipt += `${ALIGN_LEFT}`;
  receipt += `Order #: ${order.orderNumber}${LINE_FEED}`;
  receipt += `Date: ${new Date().toLocaleString()}${LINE_FEED}`;
  receipt += `Type: ${order.orderType || 'Dine-in'}${LINE_FEED}`;
  receipt += `${LINE_FEED}${line}${LINE_FEED}`;
  
  // Items header
  receipt += `ITEM${' '.repeat(15)}QTY  PRICE  TOTAL${LINE_FEED}`;
  receipt += `${line}${LINE_FEED}`;
  
  // Items
  order.items.forEach((item: any) => {
    const itemTotal = (item.quantity * item.price).toFixed(2);
    const itemName = item.name.length > 15 ? `${item.name.substring(0, 12)}...` : item.name;
    const qty = item.quantity.toString().padStart(2);
    const price = parseFloat(item.price).toFixed(2).padStart(5);
    const total = itemTotal.padStart(6);
    
    receipt += `${itemName}${' '.repeat(18 - itemName.length)}${qty}   ${price}  ${total}${LINE_FEED}`;
    
    // Modifiers
    if (item.modifiers?.length) {
      item.modifiers.forEach((mod: any) => {
        const modName = `  - ${mod.name}`.substring(0, 15);
        const modPrice = `+${parseFloat(mod.price).toFixed(2)}`.padStart(6);
        receipt += `${modName}${' '.repeat(23 - modName.length)}${modPrice}${LINE_FEED}`;
      });
    }
  });
  
  // Totals
  receipt += `${line}${LINE_FEED}`;
  receipt += `Subtotal:${' '.repeat(19)}${(order.subtotal || 0).toFixed(2).padStart(8)}${LINE_FEED}`;
  receipt += `Tax:${' '.repeat(24)}${(order.tax || 0).toFixed(2).padStart(8)}${LINE_FEED}`;
  receipt += `${line}${LINE_FEED}`;
  receipt += `${BOLD_ON}TOTAL:${' '.repeat(19)}${(order.total || 0).toFixed(2).padStart(8)}${BOLD_OFF}${LINE_FEED}`;
  receipt += `${LINE_FEED}${LINE_FEED}`;
  
  // Payment info if available
  if (order.paymentStatus === 'PAID' && order.paymentMethod) {
    receipt += `Paid with: ${order.paymentMethod}${LINE_FEED}`;
  }
  
  // Footer
  receipt += `${ALIGN_CENTER}${LINE_FEED}`;
  receipt += `Thank you for dining with us!${LINE_FEED}`;
  receipt += `Please come again!${LINE_FEED}${LINE_FEED}${LINE_FEED}`;
  
  // Cut paper and add some space
  receipt += `${LINE_FEED}${LINE_FEED}${CUT}${LINE_FEED}`;
  
  return receipt;
}

  private async notifyPrintStatus(order: OrderWithItems, status: 'sending' | 'success' | 'error', message: string) {
    try {
      const socketService = getSocketService();
      const { io } = socketService;

      if (order.branchName) {
        io.to(`branch-${order.branchName}`).emit('print-status', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status,
          message,
          timestamp: new Date().toISOString()
        });
      }

      io.emit('print-notification', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status,
        message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send print status notification:', error);
    }
  }
}

export const printService = new PrintService();