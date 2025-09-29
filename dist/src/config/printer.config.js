"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPrinterConnection = exports.printerConfig = void 0;
const node_thermal_printer_1 = require("node-thermal-printer");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Default configuration
const defaultConfig = {
    PRINTER_TYPE: "EPSON",
    PRINTER_INTERFACE: "tcp://192.168.1.100",
    PRINTER_WIDTH: 42,
    PRINTER_CHARACTER_SET: "SLOVENIA",
    PRINTER_TIMEOUT: 3000,
};
// Get printer type from environment or use default
const getPrinterType = () => {
    const type = process.env.PRINTER_TYPE || defaultConfig.PRINTER_TYPE;
    return node_thermal_printer_1.types[type] || node_thermal_printer_1.types.EPSON;
};
exports.printerConfig = {
    type: getPrinterType(),
    interface: process.env.PRINTER_INTERFACE || defaultConfig.PRINTER_INTERFACE,
    width: parseInt(process.env.PRINTER_WIDTH || defaultConfig.PRINTER_WIDTH.toString(), 10),
    characterSet: (process.env.PRINTER_CHARACTER_SET || defaultConfig.PRINTER_CHARACTER_SET),
    removeSpecialCharacters: true,
    lineCharacter: "=",
    options: {
        timeout: parseInt(process.env.PRINTER_TIMEOUT || defaultConfig.PRINTER_TIMEOUT.toString(), 10),
    },
};
// Log printer configuration (without sensitive data)
console.log("Printer configured with:", {
    type: exports.printerConfig.type,
    width: exports.printerConfig.width,
    characterSet: exports.printerConfig.characterSet,
    timeout: exports.printerConfig.options?.timeout,
});
const testPrinterConnection = async (printer) => {
    try {
        const isConnected = await printer.isPrinterConnected();
        if (!isConnected) {
            console.error("Printer is not connected");
            return false;
        }
        return true;
    }
    catch (error) {
        console.error("Printer connection error:", error);
        return false;
    }
};
exports.testPrinterConnection = testPrinterConnection;
//# sourceMappingURL=printer.config.js.map