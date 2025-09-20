import { PrinterTypes, CharacterSet } from "node-thermal-printer";
export declare const printerConfig: {
    type: PrinterTypes;
    interface: string;
    width?: number;
    characterSet?: CharacterSet;
    removeSpecialCharacters?: boolean;
    lineCharacter?: string;
    options?: {
        timeout?: number;
    };
};
import { printer as ThermalPrinter } from "node-thermal-printer";
export declare const testPrinterConnection: (printer: InstanceType<typeof ThermalPrinter>) => Promise<boolean>;
