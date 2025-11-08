import { types, printer as ThermalPrinter, Printer as ThermalPrinterType } from "node-thermal-printer";
import dotenv from "dotenv";
import { PrismaClient, Printer as DbPrinter, PrinterType, PrinterConnectionType, PrinterStatus } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

// Default configuration
const defaultConfig = {
  PRINTER_TIMEOUT: 3000,
  PRINTER_RECONNECT_INTERVAL: 5000, // 5 seconds
  PRINTER_MAX_RETRIES: 3,
  PRINTER_CHARACTER_SET: "SLOVENIA",
  PRINTER_WIDTH: 42,
};

// Map printer types to node-thermal-printer types
const PRINTER_TYPE_MAP: Record<string, any> = {
  [PrinterType.RECEIPT]: types.EPSON,
  [PrinterType.KITCHEN]: types.EPSON,
  [PrinterType.BAR]: types.EPSON,
  [PrinterType.LABEL]: types.STAR,
  [PrinterType.REPORT]: types.EPSON,
};

export interface PrinterConnection {
  id: string;
  name: string;
  type: PrinterType;
  connectionType: PrinterConnectionType;
  status: PrinterStatus;
  ipAddress?: string | null;
  port?: number | null;
  devicePath?: string | null;
  macAddress?: string | null;
  characterPerLine: number;
  autoCut: boolean;
  openCashDrawer: boolean;
  isConnected: boolean;
  lastStatusCheck: Date | null;
  error: string | null;
  instance: ThermalPrinterType | null;
}

class PrinterManager {
  private printers: Map<string, PrinterConnection> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load printers from database
      const dbPrinters = await prisma.printer.findMany({
        where: { isActive: true },
      });

      for (const printer of dbPrinters) {
        await this.addPrinter(printer);
      }

      // Start monitoring printers
      this.startMonitoring();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize printer manager:', error);
    }
  }

  private getPrinterInterface(printer: DbPrinter): string {
    switch (printer.connectionType) {
      case 'NETWORK':
        return `tcp://${printer.ipAddress}:${printer.port || 9100}`;
      case 'USB':
        return printer.devicePath || '';
      case 'BLUETOOTH':
        return printer.macAddress || '';
      default:
        return '';
    }
  }

  async addPrinter(dbPrinter: DbPrinter): Promise<PrinterConnection> {
    const printerInterface = this.getPrinterInterface(dbPrinter);
    const printerType = PRINTER_TYPE_MAP[dbPrinter.type] || types.EPSON;
    
    const printerInstance = new ThermalPrinter({
      type: printerType,
      interface: printerInterface,
      options: {
        timeout: defaultConfig.PRINTER_TIMEOUT,
      },
    });

    const printer: PrinterConnection = {
      id: dbPrinter.id,
      name: dbPrinter.name,
      type: dbPrinter.type,
      connectionType: dbPrinter.connectionType,
      status: dbPrinter.status,
      ipAddress: dbPrinter.ipAddress,
      port: dbPrinter.port,
      devicePath: dbPrinter.devicePath,
      macAddress: dbPrinter.macAddress,
      characterPerLine: dbPrinter.characterPerLine,
      autoCut: dbPrinter.autoCut,
      openCashDrawer: dbPrinter.openCashDrawer,
      isConnected: false,
      lastStatusCheck: null,
      error: null,
      instance: printerInstance,
    };

    // Test connection
    await this.testConnection(printer);
    this.printers.set(dbPrinter.id, printer);
    return printer;
  }

  async testConnection(printer: PrinterConnection): Promise<boolean> {
    if (!printer.instance) {
      printer.error = 'Printer instance not initialized';
      return false;
    }

    try {
      const isConnected = await printer.instance.isPrinterConnected();
      printer.isConnected = isConnected;
      printer.lastStatusCheck = new Date();
      printer.status = isConnected ? 'ONLINE' : 'OFFLINE';
      printer.error = isConnected ? null : 'Printer not connected';
      
      // Update status in database
      await prisma.printer.update({
        where: { id: printer.id },
        data: { status: isConnected ? 'ONLINE' : 'OFFLINE' },
      });
      
      return isConnected;
    } catch (error: any) {
      console.error(`Error testing connection to printer ${printer.name}:`, error);
      printer.isConnected = false;
      printer.status = 'ERROR';
      printer.error = error.message;
      
      // Update status in database
      await prisma.printer.update({
        where: { id: printer.id },
        data: { status: 'ERROR' },
      });
      
      return false;
    }
  }

  getPrinter(id: string): PrinterConnection | undefined {
    return this.printers.get(id);
  }

  getPrintersByType(type: PrinterType): PrinterConnection[] {
    return Array.from(this.printers.values()).filter(p => p.type === type);
  }

  getConnectedPrinters(): PrinterConnection[] {
    return Array.from(this.printers.values()).filter(p => p.isConnected);
  }

  async print(printerId: string, content: string): Promise<boolean> {
    const printer = this.getPrinter(printerId);
    if (!printer) {
      throw new Error(`Printer with ID ${printerId} not found`);
    }

    if (!printer.instance) {
      throw new Error(`Printer ${printer.name} is not properly initialized`);
    }

    // Try to reconnect if not connected
    if (!printer.isConnected) {
      const isConnected = await this.testConnection(printer);
      if (!isConnected) {
        throw new Error(`Printer ${printer.name} is not connected`);
      }
    }

    try {
      // Create a print job in the database
      const printJob = await prisma.printJob.create({
        data: {
          printerId: printer.id,
          jobType: 'ORDER',
          content: { content },
          status: 'PENDING',
        },
      });

      // Prepare the printer
      printer.instance.clear();
      
      // Set printer settings
      printer.instance.setPrinterDriverType(printer.type);
      printer.instance.setCharacterSet(printer.characterPerLine);
      
      // Add content
      printer.instance.println(content);
      
      // Execute print job
      const success = await printer.instance.execute();
      
      // Update print job status
      await prisma.printJob.update({
        where: { id: printJob.id },
        data: {
          status: success ? 'COMPLETED' : 'FAILED',
          printedAt: success ? new Date() : undefined,
          errorMessage: success ? undefined : 'Print job failed',
        },
      });
      
      return success;
    } catch (error: any) {
      console.error(`Error printing to ${printer.name}:`, error);
      
      // Update print job status
      await prisma.printJob.update({
        where: { id: printJob.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
      
      // Update printer status
      printer.isConnected = false;
      printer.status = 'ERROR';
      printer.error = error.message;
      
      throw error;
    }
  }

  async printToAll(printers: string[], content: string): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    for (const printerId of printers) {
      try {
        const success = await this.print(printerId, content);
        results[printerId] = success;
      } catch (error: any) {
        console.error(`Error printing to printer ${printerId}:`, error);
        results[printerId] = false;
      }
    }
    
    return results;
  }

  async printToType(type: PrinterType, content: string): Promise<{ [key: string]: boolean }> {
    const printers = this.getPrintersByType(type);
    const results: { [key: string]: boolean } = {};
    
    for (const printer of printers) {
      try {
        const success = await this.print(printer.id, content);
        results[printer.id] = success;
      } catch (error: any) {
        console.error(`Error printing to printer ${printer.name}:`, error);
        results[printer.id] = false;
      }
    }
    
    return results;
  }

  private async checkAllPrinters() {
    const printers = Array.from(this.printers.values());
    for (const printer of printers) {
      await this.testConnection(printer);
    }
  }

  private startMonitoring() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    this.reconnectInterval = setInterval(async () => {
      await this.checkAllPrinters();
    }, defaultConfig.PRINTER_RECONNECT_INTERVAL);
  }

  stop() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  // Add a method to refresh printers from the database
  async refreshPrinters() {
    try {
      const dbPrinters = await prisma.printer.findMany({
        where: { isActive: true },
      });

      // Add or update printers
      for (const dbPrinter of dbPrinters) {
        if (this.printers.has(dbPrinter.id)) {
          // Update existing printer
          await this.addPrinter(dbPrinter);
        } else {
          // Add new printer
          await this.addPrinter(dbPrinter);
        }
      }

      // Remove printers that no longer exist
      const dbPrinterIds = new Set(dbPrinters.map(p => p.id));
      for (const printerId of this.printers.keys()) {
        if (!dbPrinterIds.has(printerId)) {
          this.printers.delete(printerId);
        }
      }
    } catch (error) {
      console.error('Error refreshing printers:', error);
    }
  }
}

// Create a singleton instance
export const printerManager = new PrinterManager();

// Handle process exit
process.on('SIGINT', () => {
  printerManager.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  printerManager.stop();
  process.exit(0);
});