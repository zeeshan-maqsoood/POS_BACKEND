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

 private async generatePdfReceipt(order: OrderWithItems & { subtotal?: number; tax?: number; total?: number }): Promise<Buffer> {
  // You'll need to implement PDF generation here
  // Example using pdfkit (install with: npm install pdfkit)
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  // Collect data into a buffer
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  
  // Generate PDF content
  doc.fontSize(20).text('YOUR RESTAURANT NAME', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text('123 Restaurant St.', { align: 'center' });
  doc.text('City, Country', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text('RECEIPT', { align: 'center' });
  doc.moveDown();
  
  // Add order details
  doc.fontSize(12);
  doc.text(`Order #: ${order.orderNumber}`);
  doc.text(`Date: ${new Date().toLocaleString()}`);
  doc.text(`Order Type: ${order.orderType || 'Dine-in'}`);
  doc.moveDown();
  
  // Add items table
  doc.font('Helvetica-Bold').text('ITEM', 50, doc.y);
  doc.text('QTY', 250, doc.y);
  doc.text('PRICE', 300, doc.y);
  doc.text('TOTAL', 350, doc.y);
  doc.moveTo(50, doc.y + 5).lineTo(400, doc.y + 5).stroke();
  doc.moveDown(5);
  
  // Add items
  doc.font('Helvetica');
  order.items.forEach((item: any) => {
    const itemTotal = (item.quantity * item.price).toFixed(2);
    doc.text(item.name.substring(0, 30), 50, doc.y);
    doc.text(item.quantity.toString(), 250, doc.y);
    doc.text(item.price.toFixed(2), 300, doc.y);
    doc.text(itemTotal, 350, doc.y);
    doc.moveDown(1);
    
    if (item.modifiers && item.modifiers.length > 0) {
      doc.font('Helvetica-Oblique').fontSize(10);
      item.modifiers.forEach((modifier: any) => {
        doc.text(`  - ${modifier.name}`, 70, doc.y);
        doc.text(modifier.price.toFixed(2), 350, doc.y);
        doc.moveDown(0.5);
      });
      doc.font('Helvetica').fontSize(12);
    }
    doc.moveDown(0.5);
  });
  
  // Add totals
  doc.moveTo(50, doc.y).lineTo(400, doc.y).stroke();
  doc.moveDown(1);
  doc.text(`Subtotal:`, 300, doc.y);
  doc.text((order.subtotal || 0).toFixed(2), 350, doc.y);
  doc.moveDown(1);
  doc.text(`Tax:`, 300, doc.y);
  doc.text((order.tax || 0).toFixed(2), 350, doc.y);
  doc.moveTo(300, doc.y + 5).lineTo(400, doc.y + 5).stroke();
  doc.moveDown(1);
  doc.font('Helvetica-Bold').text(`TOTAL:`, 300, doc.y);
  doc.text((order.total || 0).toFixed(2), 350, doc.y);
  doc.moveDown(2);
  
  // Add footer
  doc.font('Helvetica').fontSize(10).text('Thank you for dining with us!', { align: 'center' });
  doc.text('Please come again!', { align: 'center' });
  
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

  private formatReceiptThermal(order: OrderWithItems & { subtotal?: number; tax?: number; total?: number }): string {
    // Thermal printer ESC/POS commands
    const newLine = '\n';
    let receipt = '\x1B@'; // Initialize printer

    const centerText = (text: string, width = 32) => {
      if (text.length >= width) return text;
      const padding = Math.floor((width - text.length) / 2);
      return ' '.repeat(padding) + text;
    };

    const line = '-'.repeat(32);

    receipt += newLine.repeat(2);
    receipt += centerText('YOUR RESTAURANT NAME') + newLine;
    receipt += centerText('123 Restaurant St.') + newLine;
    receipt += centerText('City, Country') + newLine.repeat(1);
    receipt += centerText('RECEIPT') + newLine;
    receipt += line + newLine;

    receipt += `Order #: ${order.orderNumber}${newLine}`;
    receipt += `Date: ${new Date().toLocaleString()}${newLine}`;
    receipt += `Order Type: ${order.orderType || 'Dine-in'}${newLine}`;
    receipt += line + newLine;

    receipt += 'ITEM'.padEnd(20) + 'QTY  PRICE   TOTAL' + newLine;
    receipt += line + newLine;

    order.items.forEach((item: any) => {
      const itemTotal = (item.quantity * item.price).toFixed(2);
      receipt += `${item.name.substring(0, 18).padEnd(20)}${item.quantity.toString().padEnd(5)}${item.price.toFixed(2).padStart(6)}${itemTotal.padStart(8)}${newLine}`;

      if (item.modifiers && Array.isArray(item.modifiers)) {
        item.modifiers.forEach((modifier: any) => {
          receipt += `  - ${modifier.name}`.padEnd(21) + modifier.price.toFixed(2).padStart(14) + newLine;
        });
      }
    });

    receipt += line + newLine;
    receipt += `Subtotal:`.padEnd(15) + (order.subtotal || 0).toFixed(2).padStart(17) + newLine;
    receipt += `Tax:`.padEnd(15) + (order.tax || 0).toFixed(2).padStart(17) + newLine;
    receipt += line + newLine;
    receipt += `TOTAL:`.padEnd(15) + (order.total || 0).toFixed(2).padStart(17) + newLine;
    receipt += line + newLine.repeat(2);

    receipt += centerText('Thank you for dining with us!') + newLine;
    receipt += centerText('Please come again!') + newLine.repeat(2);

    receipt += '\x1DVA0'; // Cut paper

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