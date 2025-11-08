declare module 'node-cups' {
  interface PrintJobOptions {
    data: string | Buffer;
    type?: string;
    success?: (jobId: number) => void;
    error?: (err: Error) => void;
  }

  interface PrinterInfo {
    name: string;
    isDefault: boolean;
    state: string;
    stateReasons: string[];
  }

  interface PrinterInstance {
    getPrinters(callback: (err: Error | null, printers: PrinterInfo[]) => void): void;
    getPrinterAttributes(printerName: string, callback: (err: Error | null, attributes: any) => void): void;
    getJobs(printerName: string, myJobs: boolean, whichJobs: string, callback: (err: Error | null, jobs: any[]) => void): void;
    printDirect(options: PrintJobOptions): void;
  }

  function Printer(host?: string, port?: number): PrinterInstance;
  
  export = Printer;
}
