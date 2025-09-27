import { types, PrinterTypes, CharacterSet } from "node-thermal-printer";
import dotenv from "dotenv";

dotenv.config();

// Default configuration
const defaultConfig = {
  PRINTER_TYPE: "EPSON",
  PRINTER_INTERFACE: "tcp://192.168.1.100",
  PRINTER_WIDTH: 42,
  PRINTER_CHARACTER_SET: "SLOVENIA",
  PRINTER_TIMEOUT: 3000,
};

// Get printer type from environment or use default
const getPrinterType = (): PrinterTypes => {
  const type = process.env.PRINTER_TYPE || defaultConfig.PRINTER_TYPE;
  return types[type as keyof typeof types] || types.EPSON;
};

export const printerConfig = {
  type: getPrinterType(),
  interface: process.env.PRINTER_INTERFACE || defaultConfig.PRINTER_INTERFACE,
  width: parseInt(process.env.PRINTER_WIDTH || defaultConfig.PRINTER_WIDTH.toString(), 10),
  characterSet: (process.env.PRINTER_CHARACTER_SET || defaultConfig.PRINTER_CHARACTER_SET) as CharacterSet,
  removeSpecialCharacters: true,
  lineCharacter: "=",
  options: {
    timeout: parseInt(process.env.PRINTER_TIMEOUT || defaultConfig.PRINTER_TIMEOUT.toString(), 10),
  },
};

// Log printer configuration (without sensitive data)
console.log("Printer configured with:", {
  type: printerConfig.type,
  width: printerConfig.width,
  characterSet: printerConfig.characterSet,
  timeout: printerConfig.options?.timeout,
});

import { printer as ThermalPrinter } from "node-thermal-printer";

export const testPrinterConnection = async (
  printer: InstanceType<typeof ThermalPrinter>
): Promise<boolean> => {
  try {
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.error("Printer is not connected");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Printer connection error:", error);
    return false;
  }
};