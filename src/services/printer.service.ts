import { printer as ThermalPrinter } from "node-thermal-printer";
import { Order } from "@prisma/client";
import { printerConfig, testPrinterConnection } from "../config/printer.config";

export class PrinterService {
  private printer: InstanceType<typeof ThermalPrinter>;
  private isConnected = false;

  constructor() {
    this.printer = new ThermalPrinter(printerConfig);
    this.initializePrinter();
  }

  private async initializePrinter() {
    this.isConnected = await testPrinterConnection(this.printer);
    if (!this.isConnected) {
      console.warn("Printer is not connected. Receipts will not be printed.");
    }
  }

  public async printReceipt(order: Order & { items: any[] }): Promise<boolean> {
    if (!this.isConnected) {
      console.warn("Cannot print receipt: Printer is not connected");
      return false;
    }

    try {
      // ----- HEADER -----
      this.printer.alignCenter();
      this.printer.setTypeFontB();
      this.printer.bold(true);
      this.printer.println("RESTAURANT NAME");
      this.printer.bold(false);
      this.printer.setTypeFontA();
      this.printer.println("123 Restaurant St.");
      this.printer.println("City, Country");
      this.printer.println("Tel: +123 456 7890");
      this.printer.drawLine();

      // ----- ORDER INFO -----
      this.printer.alignLeft();
      this.printer.println(`Order #: ${order.orderNumber}`);
      this.printer.println(`Date: ${new Date(order.createdAt).toLocaleString()}`);
      if (order.tableNumber) this.printer.println(`Table: ${order.tableNumber}`);
      if (order.customerName) this.printer.println(`Customer: ${order.customerName}`);
      this.printer.drawLine();

      // ----- ITEMS -----
      this.printer.tableCustom([
        { text: "Item", align: "LEFT", width: 0.5 },
        { text: "Qty", align: "CENTER", width: 0.15 },
        { text: "Price", align: "RIGHT", width: 0.35 },
      ]);

      order.items.forEach((item) => {
        this.printer.tableCustom([
          { text: item.name, align: "LEFT", width: 0.5 },
          { text: item.quantity.toString(), align: "CENTER", width: 0.15 },
          { text: item.price.toFixed(2), align: "RIGHT", width: 0.35 },
        ]);
      });

      // ----- TOTALS -----
      this.printer.drawLine();
      this.printer.tableCustom([
        { text: "SUBTOTAL", align: "LEFT", width: 0.5 },
        { text: order.subtotal.toFixed(2), align: "RIGHT", width: 0.5 },
      ]);

      if (order.tax > 0) {
        this.printer.tableCustom([
          { text: "TAX", align: "LEFT", width: 0.5 },
          { text: order.tax.toFixed(2), align: "RIGHT", width: 0.5 },
        ]);
      }

      if (order.discount && order.discount > 0) {
        this.printer.tableCustom([
          { text: "DISCOUNT", align: "LEFT", width: 0.5 },
          { text: `-${order.discount.toFixed(2)}`, align: "RIGHT", width: 0.5 },
        ]);
      }

      this.printer.bold(true);
      this.printer.tableCustom([
        { text: "TOTAL", align: "LEFT", width: 0.5 },
        { text: order.total.toFixed(2), align: "RIGHT", width: 0.5 },
      ]);
      this.printer.bold(false);

      // ----- FOOTER -----
      this.printer.println(`\nPayment: ${order.paymentMethod}`);
      this.printer.drawLine();
      this.printer.alignCenter();
      this.printer.println("Thank you for dining with us!");
      this.printer.println("Please come again!");
      this.printer.cut();

      // ----- EXECUTE -----
      await this.printer.execute();
      console.log("✅ Receipt printed successfully");
      return true;
    } catch (err) {
      console.error("❌ Print error:", err);
      this.isConnected = await testPrinterConnection(this.printer);
      return false;
    }
  }
}

export const printerService = new PrinterService();