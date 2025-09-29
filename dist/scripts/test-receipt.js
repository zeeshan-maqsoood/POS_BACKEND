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
// Path to a temporary file to store the receipt content
const filePath = path.join(process.cwd(), 'receipt.txt');
// Create the receipt content with proper formatting
const receiptContent = `
================================
         TEST RECEIPT         
================================
Date: ${new Date().toLocaleString()}
Printer: HP LaserJet P1005
================================
This is a test receipt to verify
that printing is working correctly
================================
`;
// Function to execute a command and return a promise
const execCommand = (command) => {
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
};
async function printReceipt() {
    try {
        // Write content to a temporary file
        fs.writeFileSync(filePath, receiptContent);
        console.log(`✅ Receipt file created at: ${filePath}`);
        // Method 1: Using PowerShell to print
        console.log('🖨️  Sending print job to default printer using PowerShell...');
        // PowerShell command to print the text file
        const printCommand = `powershell -Command "Get-Content -Path '${filePath}' | Out-Printer -Name 'HP LaserJet P1005'"`;
        console.log('Executing PowerShell command...');
        const result = await execCommand(printCommand);
        console.log('✅ Print job sent successfully');
        // Clean up the temporary file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('✅ Temporary file cleaned up');
        }
    }
    catch (error) {
        console.error('❌ Error:', error);
        // Fallback to Notepad method if PowerShell fails
        console.log('\n⚠️  Trying alternative printing method...');
        try {
            const notepadCommand = `start /wait notepad /p "${filePath}"`;
            console.log('Executing Notepad print command...');
            await execCommand(notepadCommand);
            console.log('✅ Print dialog should be open now');
        }
        catch (fallbackError) {
            console.error('❌ Fallback method failed:', fallbackError);
        }
        // Clean up the temporary file in case of error
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('✅ Temporary file cleaned up');
            }
            catch (e) {
                console.error('Failed to clean up temporary file:', e);
            }
        }
    }
}
// Run the print job
printReceipt();
//# sourceMappingURL=test-receipt.js.map