"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPrinterConnection = exports.printerConfig = void 0;
const node_thermal_printer_1 = require("node-thermal-printer");
exports.printerConfig = {
    type: node_thermal_printer_1.types.EPSON, // use enum from library
    interface: "tcp://192.168.1.100", // replace with your printer IP
    width: 42, // standard 80mm paper width
    characterSet: "SLOVENIA", // ✅ assert to CharacterSet type
    removeSpecialCharacters: true,
    lineCharacter: "=",
    options: {
        timeout: 3000,
    },
};
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