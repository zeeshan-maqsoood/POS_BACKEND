import { types, PrinterTypes, CharacterSet } from "node-thermal-printer";

export const printerConfig: {
  type: PrinterTypes;
  interface: string;
  width?: number;
  characterSet?: CharacterSet;
  removeSpecialCharacters?: boolean;
  lineCharacter?: string;
  options?: { timeout?: number };
} = {
  type: types.EPSON, // use enum from library
  interface: "tcp://192.168.1.100", // replace with your printer IP
  width: 42, // standard 80mm paper width
  characterSet: "SLOVENIA" as CharacterSet, // ✅ assert to CharacterSet type
  removeSpecialCharacters: true,
  lineCharacter: "=",
  options: {
    timeout: 3000,
  },
};

// ✅ test if printer is reachable
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