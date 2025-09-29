"use strict";
// import { Printer } from 'pdf-to-printer';
// import prisma from '../loaders/prisma';
// export default class PrintService {
//   /**
//    * Get all printers
//    */
//   static async getPrinters(): Promise<Printer[]> {
//     return prisma.printer.findMany();
//   }
//   /**
//    * Get a printer by ID
//    */
//   static async getPrinterById(id: string): Promise<Printer | null> {
//     return prisma.printer.findUnique({
//       where: { id },
//     });
//   }
//   /**
//    * Create a new printer
//    */
//   static async createPrinter(data: Omit<Printer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Printer> {
//     return prisma.printer.create({
//       data,
//     });
//   }
//   /**
//    * Update a printer
//    */
//   static async updatePrinter(
//     id: string,
//     data: Partial<Omit<Printer, 'id' | 'createdAt' | 'updatedAt'>>
//   ): Promise<Printer> {
//     return prisma.printer.update({
//       where: { id },
//       data: {
//         ...data,
//         updatedAt: new Date(),
//       },
//     });
//   }
//   /**
//    * Delete a printer
//    */
//   static async deletePrinter(id: string): Promise<void> {
//     await prisma.printer.delete({
//       where: { id },
//     });
//   }
// }
// export default PrintService;
console.log("printer");
//# sourceMappingURL=printer.service.js.map