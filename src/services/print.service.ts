import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

class PrintService {
    // ... (rest of the class remains the same)

    /**
     * Print file to a specific printer
     */
    public static async printToPrinterDirect(content: string, printerName?: string): Promise<boolean> {
        const filePath = path.join(process.cwd(), 'temp', `receipt_${Date.now()}.txt`);
        
        try {
            console.log(`   • Creating temporary file at: ${filePath}`);
            
            // Ensure temp directory exists
            const tempDir = path.dirname(filePath);
            if (!fs.existsSync(tempDir)) {
                console.log(`   • Creating temp directory: ${tempDir}`);
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            // Write content to file with proper encoding
            console.log('   • Writing receipt content to file...');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`   ✅ Receipt file created at: ${filePath}`);
            
            // If no printer specified or it's a fax printer, try to find a better one
            if (!printerName || printerName.toLowerCase().includes('fax')) {
                console.log('   • No printer specified or fax printer detected, searching for better options...');
                const availablePrinters = await this.listPrinters();
                if (availablePrinters.length > 0) {
                    printerName = availablePrinters[0];
                    console.log(`   • Selected printer: ${printerName}`);
                } else if (!printerName) {
                    throw new Error('No printers available');
                }
            } else {
                console.log(`   • Using specified printer: ${printerName}`);
            }
            
            // Method 1: Try direct printing using msprint (works well with receipt printers)
            try {
                console.log(`   • Attempting to print using direct print method...`);
                
                // Double the backslashes for Windows paths
                const escapedPath = filePath.replace(/\\/g, '\\\\');
                const escapedPrinter = printerName.replace(/"/g, '\\"');
                
                // Use PowerShell to print the file directly
                const psCommand = `
                try {
                    # Check if printer exists
                    $printer = Get-Printer -Name "${escapedPrinter}" -ErrorAction Stop
                    Write-Output "Found printer: $($printer.Name) (Status: $($printer.PrinterStatus))"
                    
                    # Read the file content
                    $content = Get-Content -Path "${escapedPath}" -Raw -Encoding UTF8
                    if (-not $content) { 
                        throw "File is empty or could not be read"
                    }
                    
                    # Print the content
                    $content | Out-Printer -Name "${escapedPrinter}" -ErrorAction Stop
                    
                    # Verify the print job was queued
                    $job = Get-PrintJob -PrinterName "${escapedPrinter}" | 
                           Where-Object { $_.SubmittedTime -gt (Get-Date).AddMinutes(-1) } | 
                           Select-Object -First 1
                    
                    if ($job) {
                        Write-Output "Print job submitted successfully. Job ID: $($job.Id)"
                        exit 0
                    } else {
                        Write-Output "Warning: Print job may not have been queued"
                        exit 0  # Still consider this a success as the print command itself succeeded
                    }
                } catch {
                    Write-Error ("ERROR: " + $_.Exception.Message)
                    exit 1
                }
                `;
                
                // Create a temporary PowerShell script
                const psScriptPath = path.join(path.dirname(filePath), `print_${Date.now()}.ps1`);
                fs.writeFileSync(psScriptPath, psCommand, 'utf8');
                
                console.log(`   • Created PowerShell script at: ${psScriptPath}`);
                
                // Execute the PowerShell script
                const command = `powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`;
                console.log(`   • Executing: ${command}`);
                
                const result = await new Promise<string>((resolve, reject) => {
                    exec(command, { windowsHide: true, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
                        if (error) {
                            console.error('   ❌ Print command failed:', { error, stdout, stderr });
                            reject(stderr || 'Print command failed');
                        } else {
                            console.log('   ✅ Print command output:', stdout);
                            resolve(stdout);
                        }
                    });
                });
                
                // Clean up the PowerShell script
                try {
                    fs.unlinkSync(psScriptPath);
                } catch (e) {
                    console.error('   • Error cleaning up PowerShell script:', e);
                }
                
                if (result && result.includes('Print job submitted successfully')) {
                    console.log('   ✅ Print job submitted successfully');
                    return true;
                }
                
                throw new Error('Print command did not complete successfully');
                
            } catch (printError) {
                console.log('   • Windows print command failed, trying PowerShell method...', printError);
            }
            
            // Method 2: Use PowerShell with Out-Printer (more reliable for some printers)
            try {
                console.log(`   • Attempting to print using PowerShell...`);
                const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "
                    try {
                        # First check if printer exists and is online
                        $printer = Get-Printer -Name '${printerName.replace(/'/g, "''")}' -ErrorAction Stop;
                        Write-Output (\"Printer found: \" + $printer.Name + \" (Status: \" + $printer.PrinterStatus + \")\");
                        
                        if ($printer.PrinterStatus -ne 'Normal') {
                            throw (\"Printer is not ready. Status: \" + $printer.PrinterStatus);
                        }
                        
                        # Read the file content
                        $content = Get-Content -Path '${filePath.replace(/'/g, "''")}' -Raw -Encoding UTF8;
                        if (-not $content) { 
                            throw 'File content is empty or could not be read';
                        }
                        
                        # Try to print
                        $content | Out-Printer -Name '${printerName.replace(/'/g, "''")}' -ErrorAction Stop;
                        
                        # Verify job was queued
                        $job = Get-PrintJob -PrinterName '${printerName.replace(/'/g, "''")}' | 
                               Where-Object { $_.SubmittedTime -gt (Get-Date).AddMinutes(-1) } | 
                               Select-Object -First 1;
                        
                        if ($job) {
                            Write-Output (\"Print job submitted successfully. Job ID: \" + $job.Id);
                            exit 0;
                        } else {
                            Write-Output 'Warning: Print job may not have been queued';
                            exit 0;  # Still consider this a success as the print command itself succeeded
                        }
                    } catch {
                        Write-Error (\"ERROR: \" + $_.Exception.Message);
                        exit 1;
                    }
                "`;
                
                const result = await this.execCommand(psCommand);
                console.log('   ✅ Print job submitted via PowerShell');
                console.log('   • PowerShell output:', result);
                return true;
            } catch (psError) {
                console.error('   ❌ PowerShell print method failed:', psError);
            }
            
            // Method 3: Direct file copy (for network printers)
            try {
                console.log('   • Trying direct copy method...');
                const directCopyCommand = `copy /B "${filePath}" "\\\\${printerName}"`;
                console.log(`   • Command: ${directCopyCommand}`);
                await this.execCommand(directCopyCommand);
                console.log('   ✅ Print job sent via direct copy');
                return true;
            } catch (copyError) {
                console.error('   ❌ Direct copy method failed:', copyError);
            }
            
            console.error('❌ All print methods failed');
            return false;
            
        } catch (error) {
            console.error('❌ Error in printToPrinterDirect:', error);
            return false;
        } finally {
            // Clean up the temporary file
            if (fs.existsSync(filePath)) {
                try {
                    console.log(`   • Cleaning up temporary file: ${filePath}`);
                    fs.unlinkSync(filePath);
                } catch (cleanupError) {
                    console.error('   • Error cleaning up temporary file:', cleanupError);
                }
            }
        }
    }
    
    /**
     * List all available printers
     */
    public static async listPrinters(): Promise<string[]> {
        try {
            console.log('🔍 Detecting available printers...');
            
            // Try the simpler Get-Printer command first (more reliable on newer Windows versions)
            try {
                console.log('ℹ️ Using Get-Printer command...');
                const command = 'powershell -Command "Get-Printer | Select-Object Name, Type, PrinterStatus, PortName | ConvertTo-Json -Compress"';
                const result = await this.execCommand(command);
                
                if (!result) {
                    throw new Error('No output from Get-Printer command');
                }
                
                let printers;
                try {
                    printers = JSON.parse(result);
                    if (!Array.isArray(printers)) {
                        printers = [printers];
                    }
                } catch (e) {
                    console.error('Error parsing printer list:', e);
                    throw new Error('Failed to parse printer list');
                }
                
                // Log printer details for debugging
                console.log('📋 Available printers:');
                printers.forEach((printer: any) => {
                    console.log(`   • ${printer.Name} (Type: ${printer.Type}, Status: ${printer.PrinterStatus}, Port: ${printer.PortName})`);
                });
                
                // Common receipt printer name patterns to prioritize (case insensitive)
                const receiptPrinterPatterns = [
                    'receipt', 'pos', 'thermal', 'ticket', 'impact',
                    'epson', 'star', 'bixolon', 'zebra', 'citizen',
                    'boca', 'epos', 'tm-', 'tm ', 't88v', 't20', 't70',
                    '58mm', '80mm', 'usb', 'com', 'lpt', 'ethernet', 'network'
                ];
                
                // First, filter out any unwanted printers (like Fax)
                const filteredPrinters = printers.filter((p: any) => {
                    const name = (p.Name || '').toLowerCase();
                    return !name.includes('fax') && !name.includes('pdf') && !name.includes('xps');
                });
                
                if (filteredPrinters.length === 0) {
                    console.warn('⚠️ No suitable printers found after filtering. Will use all available printers.');
                    filteredPrinters.push(...printers);
                }
                
                // Sort printers - prioritize receipt printers, then by status, then by name
                const sortedPrinters = [...filteredPrinters].sort((a: any, b: any) => {
                    const aName = (a.Name || '').toLowerCase();
                    const bName = (b.Name || '').toLowerCase();
                    
                    // Check if either printer matches receipt printer patterns
                    const aIsReceiptPrinter = receiptPrinterPatterns.some(pattern => 
                        aName.includes(pattern)
                    );
                    const bIsReceiptPrinter = receiptPrinterPatterns.some(pattern => 
                        bName.includes(pattern)
                    );
                    
                    // Put receipt printers first
                    if (aIsReceiptPrinter && !bIsReceiptPrinter) return -1;
                    if (!aIsReceiptPrinter && bIsReceiptPrinter) return 1;
                    
                    // Then prioritize printers that are online/ready
                    const aStatus = (a.PrinterStatus || '').toString().toLowerCase();
                    const bStatus = (b.PrinterStatus || '').toString().toLowerCase();
                    
                    const aIsReady = aStatus.includes('ready') || aStatus.includes('online') || aStatus === 'normal';
                    const bIsReady = bStatus.includes('ready') || bStatus.includes('online') || bStatus === 'normal';
                    
                    if (aIsReady && !bIsReady) return -1;
                    if (!aIsReady && bIsReady) return 1;
                    
                    // Finally sort by name
                    return aName.localeCompare(bName);
                });
                
                // Extract just the names
                const printerNames = sortedPrinters.map((p: any) => p.Name);
                
                console.log(`✅ Found ${printerNames.length} printer(s)`);
                if (printerNames.length > 0) {
                    console.log(`   • Recommended printer (first in list): ${printerNames[0]}`);
                }
                return printerNames;
                
            } catch (e) {
                console.error('Error getting printers with Get-Printer, falling back to WMI:', e);
                
                // Fall back to WMI if the above fails
                console.log('ℹ️ Falling back to WMI query...');
                const wmiCommand = 'powershell -Command "Get-WmiObject -Query \"SELECT * FROM Win32_Printer\" | Select-Object Name, PrinterStatus, PortName | ConvertTo-Json -Compress"';
                const result = await this.execCommand(wmiCommand).catch(() => '');
                
                if (!result) {
                    console.error('❌ Failed to detect any printers');
                    return [];
                }
                
                try {
                    const printers = JSON.parse(result);
                    const printerList = Array.isArray(printers) ? printers : [printers];
                    
                    // Sort printers - HP LaserJet first, then by name
                    const sortedPrinters = [...printerList].sort((a: any, b: any) => {
                        const aName = a.Name || '';
                        const bName = b.Name || '';
                        
                        if (aName.includes('HP LaserJet')) return -1;
                        if (bName.includes('HP LaserJet')) return 1;
                        
                        return aName.localeCompare(bName);
                    });
                    
                    const printerNames = sortedPrinters.map((p: any) => p.Name);
                    console.log(`✅ Found ${printerNames.length} printer(s) via WMI`);
                    return printerNames;
                    
                } catch (e) {
                    console.error('Error parsing WMI printer list:', e);
                    return [];
                }
            }
            
        } catch (error) {
            console.error('❌ Error listing printers:', error);
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