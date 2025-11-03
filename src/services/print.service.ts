// import { exec } from 'child_process';
// import * as fs from 'fs';
// import * as path from 'path';

// class PrintService {
//     /**
//      * Print order details
//      * @param order Order details to print
//      */
// //     static async printOrderReceipt(order: any): Promise<boolean> {
// //         const filePath = path.join(process.cwd(), 'temp', `order_${order.id}_receipt.txt`);
        
// //         // Format the receipt content
// //         const receiptContent = this.formatReceipt(order);
        
// //         // Log receipt to console for debugging
// //         console.log('\n=== RECEIPT START ===');
// //         console.log(receiptContent);
// //         console.log('=== RECEIPT END ===\n');
        
// //         try {
// //             // Ensure temp directory exists
// //             const tempDir = path.dirname(filePath);
            
// //             if (!fs.existsSync(tempDir)) {
// //                 fs.mkdirSync(tempDir, { recursive: true });
// //             }
            
// //             // Write content to a temporary file
// //             fs.writeFileSync(filePath, receiptContent);
            
// //             // Print using a different approach that handles special characters better
// //             const printerName = 'HP LaserJet P1005'; // Replace with your actual printer name if different
            
// //             // Method 1: First try with UTF-8 encoding
// //             try {
// //                 // Write file with UTF-8 encoding
// //                 fs.writeFileSync(filePath, receiptContent, 'utf8');
                
// //                 // Try with PowerShell using UTF-8 encoding first
// //                 const printCommand = `powershell -Command "Get-Content -Path '${filePath.replace(/\//g, '\\')}' -Encoding UTF8 | Out-Printer -Name '${printerName}'"`;
// //                 console.log(`Print command (UTF-8): ${printCommand}`);
// //                 await this.execCommand(printCommand);
// //             } catch (error) {
// //                 console.warn('UTF-8 print method failed, trying alternative encodings...', error);
                
// //                 // Fallback 1: Try with Windows-1252 encoding (common for receipt printers)
// //                 try {
// //                     // Replace £ with GBP to avoid encoding issues
// //                     const win1252Content = receiptContent.replace(/£/g, 'GBP ');
// //                     fs.writeFileSync(filePath, win1252Content, 'utf8');
                    
// //                     const printCommand = `print /D:"${printerName}" "${filePath.replace(/\//g, '\\')}"`;
// //                     console.log(`Fallback print command (Windows-1252): ${printCommand}`);
// //                     await this.execCommand(printCommand);
// //                 } catch (innerError) {
// //                     console.warn('Windows-1252 print method failed, trying ASCII fallback...', innerError);
                    
// //                     // Final fallback: Use ASCII (will remove special characters)
// //                     const safeContent = receiptContent.replace(/[^\x00-\x7F]/g, '');
// //                     fs.writeFileSync(filePath, safeContent, 'ascii');
                    
// //                     const printCommand = `print /D:"${printerName}" "${filePath.replace(/\//g, '\\')}"`;
// //                     console.log(`Fallback print command (ASCII): ${printCommand}`);
// //                     await this.execCommand(printCommand);
// //                 }
// //             }
            
// //             // Clean up the temporary file
// //             if (fs.existsSync(filePath)) {
// //                 fs.unlinkSync(filePath);
// //             }
            
// //             return true;
// //         } catch (error) {
// //             console.error('❌ Error printing receipt:', error);
// //             // Clean up the temporary file in case of error
// //             if (fs.existsSync(filePath)) {
// //                 try {
// //                     fs.unlinkSync(filePath);
// //                 } catch (e) {
// //                     console.error('Failed to clean up temporary file:', e);
// //                 }
// //             }
// //             return false;
// //         }
// //     }
    
// //     /**
// //      * Format the receipt content
// //      */
// //     private static formatReceipt(order: any): string {
// //         // Using the Pound symbol (£) consistently
// //         const pound = '£';
// //         return `
// // ================================
// //          ORDER RECEIPT         
// // ================================
// // Order #: ${order.orderNumber}
// // Date: ${new Date(order.createdAt).toLocaleString()}
// // Status: ${order.paymentStatus || order.status}
// // --------------------------------
// // Table: ${order.tableNumber || 'Takeaway'}
// // Customer: ${order.customerName || 'Walk-in'}
// // Payment Method: ${order.paymentMethod || 'Not Specified'}
// // --------------------------------
// // ${this.formatOrderItems(order.items)}
// // --------------------------------
// // Subtotal: ${pound}${order.subtotal.toFixed(2)}
// // Tax: ${pound}${order.tax?.toFixed(2) || '0.00'}
// // Total: ${pound}${order.total.toFixed(2)}
// // ================================
// // Thank you for your order!
// // ================================
// // `;
// //     }

// private static formatManagerReceipt(order: any): string {
//     let receipt = `=== ORDER RECEIPT (MANAGER) ===\n\n`;
//     receipt += `Order #: ${order.orderNumber}\n`;
//     receipt += `Date: ${new Date(order.createdAt).toLocaleString()}\n`;
//     receipt += `Branch: ${order.branchName || 'N/A'}\n`;
//     receipt += `Customer: ${order.customerName || 'Walk-in'}\n`;
//     receipt += `Type: ${order.orderType}\n`;
//     receipt += `Status: ${order.status}\n\n`;
//     receipt += `--- ITEMS ---\n`;
    
//     order.items.forEach((item: any, index: number) => {
//         receipt += `${index + 1}. ${item.name} x${item.quantity}\n`;
//         receipt += `   Price: $${item.price.toFixed(2)} each\n`;
//         receipt += `   Subtotal: $${(item.price * item.quantity).toFixed(2)}\n`;
//         if (item.modifiers) {
//             receipt += `   Modifiers: ${JSON.stringify(item.modifiers)}\n`;
//         }
//         receipt += '\n';
//     });
    
//     receipt += `\n--- TOTALS ---\n`;
//     receipt += `Subtotal: $${order.subtotal.toFixed(2)}\n`;
//     receipt += `Tax: $${order.tax.toFixed(2)}\n`;
//     receipt += `Total: $${order.total.toFixed(2)}\n\n`;
//     receipt += `Payment Method: ${order.paymentMethod || 'Not specified'}\n`;
//     receipt += `Notes: ${order.notes || 'None'}\n`;
    
//     return receipt;
// }

// private static formatKitchenReceipt(order: any): string {
//     let receipt = `=== KITCHEN ORDER TICKET ===\n\n`;
//     receipt += `Order #: ${order.orderNumber}\n`;
//     receipt += `Time: ${new Date(order.createdAt).toLocaleTimeString()}\n`;
//     receipt += `Type: ${order.orderType}\n\n`;
//     receipt += `--- ITEMS ---\n`;
    
//     const itemsByCategory: {[key: string]: any[]} = {};
    
//     // Group items by category for better kitchen organization
//     order.items.forEach((item: any) => {
//         const category = item.category || 'Other';
//         if (!itemsByCategory[category]) {
//             itemsByCategory[category] = [];
//         }
//         itemsByCategory[category].push(item);
//     });
    
//     // Print items by category
//     for (const [category, items] of Object.entries(itemsByCategory)) {
//         receipt += `\n[${category.toUpperCase()}]\n`;
//         items.forEach((item: any) => {
//             receipt += `- ${item.quantity}x ${item.name}\n`;
//             if (item.notes) {
//                 receipt += `  (${item.notes})\n`;
//             }
//             if (item.modifiers) {
//                 try {
//                     // Handle both string and object modifiers
//                     const mods = typeof item.modifiers === 'string' 
//                         ? JSON.parse(item.modifiers)
//                         : item.modifiers;
                    
//                     if (Array.isArray(mods) && mods.length > 0) {
//                         receipt += `  Mods: ${mods.join(', ')}\n`;
//                     } else if (typeof mods === 'object' && mods !== null) {
//                         // Handle object case
//                         const modStrings = Object.entries(mods).map(([key, value]) => 
//                             `${key}: ${value}`
//                         );
//                         if (modStrings.length > 0) {
//                             receipt += `  Mods: ${modStrings.join(', ')}\n`;
//                         }
//                     }
//                 } catch (e) {
//                     console.warn('Error parsing modifiers:', e, 'Modifiers:', item.modifiers);
//                     // If parsing fails, try to display as string
//                     receipt += `  Mods: ${String(item.modifiers)}\n`;
//                 }
//             }
//         });
//     }
    
//     receipt += `\n--- SPECIAL INSTRUCTIONS ---\n`;
//     receipt += `${order.notes || 'None'}\n\n`;
//     receipt += `Order ID: ${order.id}\n`;
//     receipt += `Time: ${new Date(order.createdAt).toLocaleTimeString()}\n`;
    
//     return receipt;
// }

// static async printOrderReceipt(order: any): Promise<{manager: boolean, kitchen: boolean}> {
//     try {
//         // Print manager receipt
//         const managerContent = this.formatManagerReceipt(order);
//         console.log('\n=== MANAGER RECEIPT ===\n');
//         console.log(managerContent);
//         console.log('=== END MANAGER RECEIPT ===\n');
//         const managerPrinted = await this.printContent(managerContent, 'manager');
        
//         // Print kitchen receipt
//         const kitchenContent = this.formatKitchenReceipt(order);
//         console.log('\n=== KITCHEN RECEIPT ===\n');
//         console.log(kitchenContent);
//         console.log('=== END KITCHEN RECEIPT ===\n');
//         const kitchenPrinted = await this.printContent(kitchenContent, 'kitchen');
        
//         return {
//             manager: managerPrinted,
//             kitchen: kitchenPrinted
//         };
//     } catch (error) {
//         console.error('Error in printOrderReceipt:', error);
//         return {
//             manager: false,
//             kitchen: false
//         };
//     }
// }

// private static async printContent(content: string, type: 'manager' | 'kitchen'): Promise<boolean> {
//     const filePath = path.join(process.cwd(), 'temp', `order_${type}_${Date.now()}.txt`);
    
//     try {
//         // Ensure temp directory exists
//         const tempDir = path.dirname(filePath);
//         if (!fs.existsSync(tempDir)) {
//             fs.mkdirSync(tempDir, { recursive: true });
//         }
        
//         // Write content to file
//         fs.writeFileSync(filePath, content, 'utf8');
        
//         // Determine printer based on type
//         const printerName = type === 'manager' 
//             ? 'HP LaserJet P1005'  // Manager's printer
//             : 'Kitchen_Printer';    // Kitchen printer - update this to your kitchen printer name
            
//         // Print using PowerShell with UTF-8 encoding
//         const printCommand = `powershell -Command "Get-Content -Path '${filePath.replace(/\//g, '\\')}' -Encoding UTF8 | Out-Printer -Name '${printerName}'"`;
//         await this.execCommand(printCommand);
        
//         return true;
//     } catch (error) {
//         console.error(`Error printing ${type} receipt:`, error);
//         return false;
//     } finally {
//         // Clean up the temporary file
//         if (fs.existsSync(filePath)) {
//             try {
//                 fs.unlinkSync(filePath);
//             } catch (e) {
//                 console.error('Failed to clean up temporary file:', e);
//             }
//         }
//     }
// }
    
//     /**
//      * Format order items for the receipt
//      */
//     private static formatOrderItems(items: any[]): string {
//         if (!items?.length) return 'No items';
//         const pound = '£';
        
//         return items.map(item => {
//             return `${item.quantity}x ${item.name}${item.variant ? ` (${item.variant})` : ''} - ${pound}${item.price.toFixed(2)}`;
//         }).join('\n');
//     }
    
//     /**
//      * Execute a shell command
//      */
//     private static execCommand(command: string): Promise<string> {
//         return new Promise((resolve, reject) => {
//             exec(command, { windowsHide: true }, (error, stdout, stderr) => {
//                 if (error) {
//                     reject(`Error: ${error.message}`);
//                     return;
//                 }
//                 if (stderr) {
//                     reject(`Stderr: ${stderr}`);
//                     return;
//                 }
//                 resolve(stdout);
//             });
//         });
//     }
// }

// export default PrintService;

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
type BranchName = 'Bradford' | 'Leeds' | 'default';

class PrintService {
    // Default printer configuration
    private static readonly PRINTER_CONFIG = {
        // Default to empty to force printer detection
        manager: '',
        kitchen: '',
        fallback: ''
    };

    // Branch-specific printer configuration
    private static readonly BRANCH_PRINTERS: Record<BranchName, { manager: string; kitchen: string }> = {
        'Bradford': {
            manager: 'HP LaserJet P1005',
            kitchen: 'HP LaserJet P1005'
        },
        'Leeds': {
            manager: 'HP LaserJet P1005',
            kitchen: 'HP LaserJet P1005'
        },
        'default': {
            // Default to empty to use first available printer
            manager: '',
            kitchen: ''
        }
    };
    /**
     * Print order receipt for both manager and kitchen
     */
    static async printOrderReceipt(order: any) {
        try {
            const branchName: BranchName = (['Bradford', 'Leeds'].includes(order.branchName || '') 
                ? order.branchName 
                : 'default') as BranchName;
            
            console.log(`\n=== Printing receipt for ${branchName} branch ===`);
            
            // Determine receipt type and format content accordingly
            let managerContent: string;
            let kitchenContent: string | null = null;
    
            if (order.isPaymentReceipt) {
                // Payment receipt format
                managerContent = this.formatPaymentReceipt(order);
                console.log('Payment receipt generated');
            } else if (order.isStatusReceipt) {
                // Status change receipt
                managerContent = this.formatStatusReceipt(order);
                console.log('Status change receipt generated');
            } else if (order.isPartialUpdate) {
                // Partial update receipt - show only new/updated items
                managerContent = this.formatPartialUpdateReceipt(order);
                console.log('Partial update receipt generated for manager');
            } else {
                // Standard order receipt
                managerContent = this.formatManagerReceipt(order);
                kitchenContent = this.formatKitchenReceipt(order);
                console.log('Standard order receipt generated');
            }
    
            // Print manager receipt
            const managerResult = await this.printContent(
                managerContent,
                'manager',
                branchName
            );
    
            // Only print kitchen receipt for standard orders
            let kitchenResult = true;
            if (kitchenContent) {
                kitchenResult = await this.printContent(
                    kitchenContent,
                    'kitchen',
                    branchName
                );
            }
    
            return {
                manager: managerResult,
                kitchen: kitchenResult
            };
        } catch (error) {
            console.error('Print error:', error);
            return { manager: false, kitchen: false };
        }
    }
    private static formatPaymentReceipt(order: any): string {
        const receipt: string[] = [
            '=== PAYMENT RECEIPT ===',
            '',
            `Order #: ${order.orderNumber}`,
            `Date: ${new Date().toLocaleString()}`,
            `Branch: ${order.branchName || 'N/A'}`,
            `Table: ${order.tableNumber || 'N/A'}`,
            `Customer: ${order.customerName || 'Walk-in'}`,
            `Previous Status: ${order.previousPaymentStatus || 'N/A'}`,
            `New Status: ${order.paymentStatus}`,
            `Payment Method: ${order.paymentMethod || 'N/A'}`,
            `Processed By: ${order.updatedBy || 'System'}`,
            '',
            '--- ORDER ITEMS ---'
        ];
    
        // Check if items exist and is an array
        if (Array.isArray(order.items) && order.items.length > 0) {
            // Add all ordered items with their details
            order.items.forEach((item: any, index: number) => {
                const quantity = Number(item.quantity) || 1;
                const price = parseFloat(item.price) || 0;
                const subtotal = quantity * price;
    
                // Add item details
                receipt.push(
                    `${index + 1}. ${item.name || 'Unnamed Item'}`,
                    `   Quantity: ${quantity}`,
                    `   Price: $${price.toFixed(2)} each`,
                    `   Subtotal: $${subtotal.toFixed(2)}`
                );
    
                // Add modifiers if any
                if (item.modifiers && Object.keys(item.modifiers).length > 0) {
                    const mods = this.parseModifiers(item.modifiers);
                    if (mods.length > 0) {
                        receipt.push(`   Modifiers: ${mods.join(', ')}`);
                    }
                }
    
                // Add notes if any
                if (item.notes) {
                    receipt.push(`   Notes: ${item.notes}`);
                }
                
                receipt.push(''); // Add empty line between items
            });
    
            // Calculate totals if not provided
            const subtotal = order.subtotal || order.items.reduce((sum: number, item: any) => {
                return sum + ((item.price || 0) * (item.quantity || 1));
            }, 0);
            
            const tax = order.tax || 0;
            const total = order.total || (subtotal + tax);
    
            // Add payment summary
            receipt.push(
                '--- PAYMENT SUMMARY ---',
                `Subtotal: $${subtotal.toFixed(2)}`,
                `Tax: $${tax.toFixed(2)}`,
                `Total: $${total.toFixed(2)}`,
                `Amount Paid: $${order.amountPaid ? order.amountPaid.toFixed(2) : total.toFixed(2)}`,
                `Change: $${(order.amountPaid && order.amountPaid > total) 
                    ? (order.amountPaid - total).toFixed(2) 
                    : '0.00'}`,
                '',
                '--- TRANSACTION DETAILS ---',
                `Transaction ID: ${order.transactionId || 'N/A'}`,
                `Payment Method: ${order.paymentMethod || 'N/A'}`,
                order.cardLast4 ? `Card Last 4: ${order.cardLast4}` : '',
                order.authCode ? `Auth Code: ${order.authCode}` : '',
                '',
                'Thank you for your payment!',
                '==========================='
            );
        } else {
            // If no items, show a message
            receipt.push(
                'No items found in this order.',
                '',
                '--- PAYMENT SUMMARY ---',
                'Subtotal: $0.00',
                'Tax: $0.00',
                'Total: $0.00',
                '',
                '==========================='
            );
        }
    
        return receipt.filter(line => line !== '').join('\n');
    }
    
    /**
     * Format status change receipt
     */
    private static formatStatusReceipt(order: any): string {
        const receipt: string[] = [
            '=== ORDER STATUS UPDATE ===',
            '',
            `Order #: ${order.orderNumber}`,
            `Date: ${new Date().toLocaleString()}`,
            `Branch: ${order.branchName || 'N/A'}`,
            `Customer: ${order.customerName || 'Walk-in'}`,
            `Previous Status: ${order.previousStatus || 'N/A'}`,
            `New Status: ${order.newStatus || order.status || 'N/A'}`,
            `Updated By: ${order.updatedBy || 'System'}`,
            `Reason: ${order.statusChangeReason || 'N/A'}`,
            '',
            '--- ORDER SUMMARY ---'
        ];
    
        // Add order items
        order.items?.forEach((item: any, index: number) => {
            const quantity = item.quantity || 1;
            const price = parseFloat(item.price) || 0;
            const subtotal = quantity * price;
    
            receipt.push(
                `${index + 1}. ${item.name} x${quantity}`,
                `   Price: $${price.toFixed(2)} each`,
                `   Subtotal: $${subtotal.toFixed(2)}`
            );
        });
    
        // Add order totals
        receipt.push(
            '',
            '--- TOTALS ---',
            `Subtotal: $${order.subtotal?.toFixed(2) || '0.00'}`,
            `Tax: $${order.tax?.toFixed(2) || '0.00'}`,
            `Total: $${order.total?.toFixed(2) || '0.00'}`,
            '',
            '--- STATUS HISTORY ---',
            ...(order.statusHistory || []).map((status: any) => 
                `- ${status.status} (${new Date(status.timestamp).toLocaleString()})`
            ),
            '',
            'Thank you for your business!',
            '==========================='
        );
    
        return receipt.join('\n');
    }

    /**
     * Format receipt for manager
     */
    private static formatManagerReceipt(order: any): string {
        const receipt: string[] = [
            '=== ORDER RECEIPT (MANAGER) ===',
            '',
            `Order #: ${order.orderNumber}`,
            `Date: ${new Date(order.createdAt).toLocaleString()}`,
            `Branch: ${order.branchName || 'N/A'}`,
            `Customer: ${order.customerName || 'Walk-in'}`,
            `Type: ${order.orderType}`,
            `Status: ${order.status}`,
            '',
            '--- ITEMS ---'
        ];

        order.items?.forEach((item: any, index: number) => {
            const quantity = item.quantity || 1;
            const price = parseFloat(item.price) || 0;
            const subtotal = quantity * price;

            receipt.push(
                `${index + 1}. ${item.name} x${quantity}`,
                `   Price: $${price.toFixed(2)} each`,
                `   Subtotal: $${subtotal.toFixed(2)}`
            );

            if (item.modifiers) {
                const mods = this.parseModifiers(item.modifiers);
                if (mods.length > 0) {
                    receipt.push(`   Modifiers: ${mods.join(', ')}`);
                }
            }
            receipt.push('');
        });

        receipt.push(
            '--- TOTALS ---',
            `Subtotal: $${order.subtotal?.toFixed(2) || '0.00'}`,
            `Tax: $${order.tax?.toFixed(2) || '0.00'}`,
            `Total: $${order.total?.toFixed(2) || '0.00'}`,
            '',
            `Payment Method: ${order.paymentMethod || 'Not specified'}`,
            `Notes: ${order.notes || 'None'}`
        );

        return receipt.join('\n');
    }

    /**
     * Format receipt for kitchen
     */
    private static formatKitchenReceipt(order: any): string {
        const receipt: string[] = [
            '=== KITCHEN ORDER TICKET ===',
            '',
            `Order #: ${order.orderNumber}`,
            `Time: ${new Date(order.createdAt).toLocaleTimeString()}`,
            `Type: ${order.orderType}`,
            `Table: ${order.tableNumber || 'N/A'}`,
            '',
            '--- ITEMS ---'
        ];

        // Group items by category
        const itemsByCategory = (order.items || []).reduce((acc: any, item: any) => {
            const category = item.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {});

        // Add items by category
        Object.entries(itemsByCategory).forEach(([category, items]: [string, any[]]) => {
            receipt.push(`\n[${category.toUpperCase()}]`);
            items.forEach(item => {
                receipt.push(`- ${item.quantity}x ${item.name}`);
                if (item.notes) receipt.push(`  (${item.notes})`);
                
                if (item.modifiers) {
                    const mods = this.parseModifiers(item.modifiers);
                    if (mods.length > 0) {
                        receipt.push(`  Mods: ${mods.join(', ')}`);
                    }
                }
            });
        });

        receipt.push(
            '\n--- SPECIAL INSTRUCTIONS ---',
            order.notes || 'None',
            '',
            `Order ID: ${order.id}`,
            `Time: ${new Date(order.createdAt).toLocaleTimeString()}`
        );

        return receipt.join('\n');
    }

    /**
     * Parse modifiers from different formats
     */
    private static parseModifiers(modifiers: any): string[] {
        try {
            if (!modifiers) return [];
            
            // If it's already an array of strings
            if (Array.isArray(modifiers)) {
                return modifiers.map(String).filter(Boolean);
            }
            
            // If it's a string, try to parse it as JSON
            if (typeof modifiers === 'string') {
                try {
                    const parsed = JSON.parse(modifiers);
                    return this.parseModifiers(parsed);
                } catch (e) {
                    return [modifiers];
                }
            }
            
            // If it's an object, convert to key-value pairs
            if (typeof modifiers === 'object' && modifiers !== null) {
                return Object.entries(modifiers)
                    .map(([key, value]) => value ? `${key}: ${value}` : key)
                    .filter(Boolean);
            }
            
            return [String(modifiers)];
        } catch (error) {
            console.warn('Error parsing modifiers:', error);
            return [];
        }
    }

    /**
     * Print content to the specified printer type
     */

    private static async printContent(
        content: string, 
        type: 'manager' | 'kitchen',
        branchName: string = 'default'
    ): Promise<boolean> {
        const filePath = path.join(process.cwd(), 'temp', `order_${type}_${Date.now()}.txt`);
        
        try {
            console.log("print content")
            // Ensure temp directory exists
            const tempDir = path.dirname(filePath);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            // Write content to file
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(content,"content")
            // Get available printers
            const availablePrinters = await this.listPrinters();
            console.log('Available printers:', availablePrinters);
    
            // Clean printer names
            const cleanPrinters = availablePrinters.map(p => p.trim());
            console.log('Cleaned printer list:', cleanPrinters);
    
            // Get the appropriate printer for this branch and type
            const branchPrinters = this.BRANCH_PRINTERS[branchName as BranchName] || this.BRANCH_PRINTERS.default;
            let printerToUse = type === 'manager' ? branchPrinters.manager : branchPrinters.kitchen;
    
            console.log(`Attempting to print to ${printerToUse || 'first available printer'}...`);
    
            // If no specific printer is configured or it's not available, use the first available printer
            if (!printerToUse || !cleanPrinters.some(p => p.trim() === printerToUse.trim())) {
                if (cleanPrinters.length > 0) {
                    // Skip PDF printers if possible
                    const nonPdfPrinters = cleanPrinters.filter(p => 
                        !p.toLowerCase().includes('pdf') && 
                        !p.toLowerCase().includes('xps') && 
                        !p.toLowerCase().includes('microsoft print')
                    );
                    
                    printerToUse = nonPdfPrinters[0] || cleanPrinters[0];
                    console.log(`Using available printer: ${printerToUse}`);
                } else {
                    throw new Error('No printers available');
                }
            }
    
            // Print the file
            await this.printToPrinter(filePath, printerToUse);
            console.log(`Successfully printed ${type} receipt to ${printerToUse}`);
            return true;
        } catch (error) {
            console.error(`Error printing ${type} receipt:`, error);
            return false;
        } finally {
            // Clean up the temporary file
            this.cleanupFile(filePath);
        }
    }
    // static listPrinters() {
    //     throw new Error('Method not implemented.');
    // }
    // static cleanupFile(filePath: string) {
    //     throw new Error('Method not implemented.');
    // }

    /**
     * Print file to a specific printer
     */
    private static async printToPrinter(filePath: string, printerName: string): Promise<void> {
    try {
        // First try: Use PowerShell with direct printer name
        const printCommand = `powershell -Command "$ErrorActionPreference = 'Stop'; ` +
            `$printer = Get-Printer -Name '${printerName.replace(/'/g, "''")}' -ErrorAction SilentlyContinue; ` +
            `if (-not $printer) { throw 'Printer not found' }; ` +
            `Get-Content -Path '${filePath.replace(/'/g, "''")}' -Encoding UTF8 | ` +
            `Out-Printer -Name '${printerName.replace(/'/g, "''")}'"`;
        
        console.log(`Print command: ${printCommand}`);
        
        try {
            await this.execCommand(printCommand);
            return; // Success, exit the function
        } catch (psError) {
            console.log('PowerShell print method failed, trying alternative method...', psError);
        }

        // Fallback: Use the Windows 'print' command
        const altPrintCommand = `print /D:"${printerName.replace(/"/g, '\\"')}" "${filePath.replace(/\//g, '\\')}"`;
        console.log(`Trying alternative print command: ${altPrintCommand}`);
        
        await this.execCommand(altPrintCommand);
    } catch (error) {
        console.error(`Failed to print to ${printerName}:`, error);
        throw error;
    }
}
    /**
     * List all available printers
     */
    private static async listPrinters(): Promise<string[]> {
        try {
            const command = 'powershell -Command "Get-Printer | Select-Object -ExpandProperty Name | ConvertTo-Json"';
            const result = await this.execCommand(command);
            
            // Parse the JSON output
            try {
                // Try to parse as JSON array first
                return JSON.parse(result);
            } catch (e) {
                // If not valid JSON, split by newlines and clean up
                return result.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
            }
        } catch (error) {
            console.error('Error listing printers:', error);
            return [];
        }
    }

    /**
     * Execute a shell command
     */
    private static execCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(command, { windowsHide: true }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Command failed: ${command}`, error);
                    return reject(new Error(stderr || 'Command failed'));
                }
                resolve(stdout.trim());
            });
        });
    }
    /**
     * Clean up temporary file
     */
    private static cleanupFile(filePath: string): void {
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.error('Failed to clean up temporary file:', e);
            }
        }
    }
}

export default PrintService;