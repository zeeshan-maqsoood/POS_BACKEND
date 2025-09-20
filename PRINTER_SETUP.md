# Receipt Printer Setup Guide

This guide explains how to set up and configure the receipt printing functionality in the POS system.

## Prerequisites

1. A compatible thermal receipt printer (Epson, Star, or ESC/POS compatible)
2. Network connectivity between the server and printer
3. Node.js installed on the server

## Installation

1. Install the required npm package:
   ```bash
   npm install node-thermal-printer
   ```

## Configuration

Edit the printer configuration file at `src/config/printer.config.ts` with your printer's details:

```typescript
export const printerConfig: PrinterConfig = {
  type: 'epson', // or 'star' or 'escpos' depending on your printer
  interface: 'tcp://192.168.1.100', // Replace with your printer's IP
  options: {
    timeout: 3000,
    characterSet: 'SLOVENIA', // Adjust based on your region
    removeSpecialCharacters: true,
    lineCharacter: '=',
  },
  width: 42 // Standard 80mm receipt printer width
};
```

### Configuration Options

- `type`: The type of printer (epson, star, or escpos)
- `interface`: The connection string for the printer (TCP/IP, USB, or serial)
  - TCP/IP: `tcp://<printer-ip>:<port>` (default port is 9100)
  - USB: `usb://<vendor-id>/<product-id>`
  - Serial: `serial:/dev/ttyUSB0` (Linux) or `COM3` (Windows)
- `options.timeout`: Connection timeout in milliseconds
- `options.characterSet`: Character set for special characters
- `options.removeSpecialCharacters`: Whether to remove unsupported characters
- `width`: Width of the receipt in characters

## Testing the Printer

1. Make sure your printer is powered on and connected to the network
2. Update the printer configuration with the correct IP address
3. The system will automatically test the connection on startup
4. Check the server logs for any connection errors

## Troubleshooting

### Printer Not Found
- Verify the printer's IP address is correct
- Ensure the printer is on the same network as the server
- Check if the printer's network interface is enabled

### Connection Timeout
- Verify the printer is powered on and connected
- Check for any firewall rules blocking the connection
- Try pinging the printer's IP from the server

### Garbled Text
- Try a different character set in the configuration
- Ensure the printer supports the selected character set
- Check if `removeSpecialCharacters` is set to `true`

## Customizing Receipts

To modify the receipt layout, edit the `printReceipt` method in `src/services/printer.service.ts`.

## Security Considerations

- Keep the printer on a secure, isolated network if possible
- Change the default password if your printer has one
- Regularly update the printer's firmware for security patches
