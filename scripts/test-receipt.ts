import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

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
const execCommand = (command: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        exec(command, { windowsHide: true }, (error, stdout, stderr) => {
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
        
    } catch (error) {
        console.error('❌ Error:', error);
        
        // Fallback to Notepad method if PowerShell fails
        console.log('\n⚠️  Trying alternative printing method...');
        try {
            const notepadCommand = `start /wait notepad /p "${filePath}"`;
            console.log('Executing Notepad print command...');
            await execCommand(notepadCommand);
            console.log('✅ Print dialog should be open now');
        } catch (fallbackError) {
            console.error('❌ Fallback method failed:', fallbackError);
        }
        
        // Clean up the temporary file in case of error
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('✅ Temporary file cleaned up');
            } catch (e) {
                console.error('Failed to clean up temporary file:', e);
            }
        }
    }
}

// Run the print job
printReceipt();