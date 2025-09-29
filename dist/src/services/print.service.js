"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class PrintService {
    /**
     * Print order details
     * @param order Order details to print
     */
    static async printOrderReceipt(order) {
        const filePath = path.join(process.cwd(), 'temp', `order_${order.id}_receipt.txt`);
        // Format the receipt content
        const receiptContent = this.formatReceipt(order);
        // Log receipt to console for debugging
        console.log('\n=== RECEIPT START ===');
        console.log(receiptContent);
        console.log('=== RECEIPT END ===\n');
        try {
            // Ensure temp directory exists
            const tempDir = path.dirname(filePath);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            // Write content to a temporary file
            fs.writeFileSync(filePath, receiptContent);
            // Print using a different approach that handles special characters better
            const printerName = 'HP LaserJet P1005'; // Replace with your actual printer name if different
            // Method 1: First try with UTF-8 encoding
            try {
                // Write file with UTF-8 encoding
                fs.writeFileSync(filePath, receiptContent, 'utf8');
                // Try with PowerShell using UTF-8 encoding first
                const printCommand = `powershell -Command "Get-Content -Path '${filePath.replace(/\//g, '\\')}' -Encoding UTF8 | Out-Printer -Name '${printerName}'"`;
                console.log(`Print command (UTF-8): ${printCommand}`);
                await this.execCommand(printCommand);
            }
            catch (error) {
                console.warn('UTF-8 print method failed, trying alternative encodings...', error);
                // Fallback 1: Try with Windows-1252 encoding (common for receipt printers)
                try {
                    // Replace £ with GBP to avoid encoding issues
                    const win1252Content = receiptContent.replace(/£/g, 'GBP ');
                    fs.writeFileSync(filePath, win1252Content, 'utf8');
                    const printCommand = `print /D:"${printerName}" "${filePath.replace(/\//g, '\\')}"`;
                    console.log(`Fallback print command (Windows-1252): ${printCommand}`);
                    await this.execCommand(printCommand);
                }
                catch (innerError) {
                    console.warn('Windows-1252 print method failed, trying ASCII fallback...', innerError);
                    // Final fallback: Use ASCII (will remove special characters)
                    const safeContent = receiptContent.replace(/[^\x00-\x7F]/g, '');
                    fs.writeFileSync(filePath, safeContent, 'ascii');
                    const printCommand = `print /D:"${printerName}" "${filePath.replace(/\//g, '\\')}"`;
                    console.log(`Fallback print command (ASCII): ${printCommand}`);
                    await this.execCommand(printCommand);
                }
            }
            // Clean up the temporary file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return true;
        }
        catch (error) {
            console.error('❌ Error printing receipt:', error);
            // Clean up the temporary file in case of error
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                }
                catch (e) {
                    console.error('Failed to clean up temporary file:', e);
                }
            }
            return false;
        }
    }
    /**
     * Format the receipt content
     */
    static formatReceipt(order) {
        // Using the Pound symbol (£) consistently
        const pound = '£';
        return `
================================
         ORDER RECEIPT         
================================
Order #: ${order.orderNumber}
Date: ${new Date(order.createdAt).toLocaleString()}
Status: ${order.paymentStatus || order.status}
--------------------------------
Table: ${order.tableNumber || 'Takeaway'}
Customer: ${order.customerName || 'Walk-in'}
Payment Method: ${order.paymentMethod || 'Not Specified'}
--------------------------------
${this.formatOrderItems(order.items)}
--------------------------------
Subtotal: ${pound}${order.subtotal.toFixed(2)}
Tax: ${pound}${order.tax?.toFixed(2) || '0.00'}
Total: ${pound}${order.total.toFixed(2)}
================================
Thank you for your order!
================================
`;
    }
    /**
     * Format order items for the receipt
     */
    static formatOrderItems(items) {
        if (!items?.length)
            return 'No items';
        const pound = '£';
        return items.map(item => {
            return `${item.quantity}x ${item.name}${item.variant ? ` (${item.variant})` : ''} - ${pound}${item.price.toFixed(2)}`;
        }).join('\n');
    }
    /**
     * Execute a shell command
     */
    static execCommand(command) {
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(command, { windowsHide: true }, (error, stdout, stderr) => {
                if (error) {
                    reject(`Error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    reject(`Stderr: ${stderr}`);
                    return;
                }
                resolve(stdout);
            });
        });
    }
}
exports.default = PrintService;
//# sourceMappingURL=print.service.js.map