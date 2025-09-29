// import PrintService from '../src/services/printer.service';

// async function setupPrinters() {
//   try {
//     // Initialize the printer service
//     await PrintService.initialize();
    
//     // Set up printers for Downtown Branch
//     const branchName = 'Downtown Branch';
    
//     // Set the receipt printer to HP LaserJet P1005
//     PrintService.updateBranchPrinter(branchName, 'receipt', 'HP LaserJet P1005');
    
//     // You can also set up other printer types if needed
//     // PrintService.updateBranchPrinter(branchName, 'kitchen', 'Kitchen Printer Name');
//     // PrintService.updateBranchPrinter(branchName, 'manager', 'Manager Printer Name');
    
//     console.log(`✅ Successfully set up printers for ${branchName}`);
    
//     // Verify the configuration
//     const receiptPrinter = PrintService.getBranchPrinter(branchName, 'receipt');
//     console.log(`Receipt printer for ${branchName}:`, receiptPrinter);
    
//   } catch (error) {
//     console.error('❌ Error setting up printers:', error);
//     process.exit(1);
//   } finally {
//     process.exit(0);
//   }
// }

// setupPrinters();
console.log("setup printer")