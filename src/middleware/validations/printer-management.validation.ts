// middlewares/validations/printer.validation.js
import Joi from 'joi';

export const createPrinterSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).required().messages({
      "string.empty": "Printer name is required",
    }),
    description: Joi.string().optional(),
    type: Joi.string().valid('KITCHEN', 'RECEIPT', 'BAR', 'LABEL', 'REPORT').required(),
    connectionType: Joi.string().valid('USB', 'NETWORK', 'BLUETOOTH', 'SERIAL').required(),
    paperSize: Joi.string().valid('TWO_INCH', 'THREE_INCH', 'FOUR_INCH', 'A4', 'A5', 'LETTER').required(),
    devicePath: Joi.string().optional(),
    ipAddress: Joi.string().ip().optional(),
    port: Joi.number().min(1).max(65535).optional(),
    macAddress: Joi.string().optional(),
    characterPerLine: Joi.number().min(20).max(100).default(42),
    autoCut: Joi.boolean().default(true),
    openCashDrawer: Joi.boolean().default(false),
    copies: Joi.number().min(1).max(5).default(1),
    printLogo: Joi.boolean().default(true),
    headerText: Joi.string().optional(),
    footerText: Joi.string().optional(),
    branchId: Joi.string().guid({ version: ['uuidv4'] }).required().messages({
      'string.guid': 'Valid branch ID is required',
    }),
    categories: Joi.object({
      connect: Joi.array().items(Joi.object({
        id: Joi.string().guid({ version: ['uuidv4'] }).required(),
      })).optional()
    }).optional()
  })
});

export const updatePrinterSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).optional(),
    description: Joi.string().optional(),
    type: Joi.string().valid('KITCHEN', 'RECEIPT', 'BAR', 'LABEL', 'REPORT').optional(),
    connectionType: Joi.string().valid('USB', 'NETWORK', 'BLUETOOTH', 'SERIAL').optional(),
    status: Joi.string().valid('ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE').optional(),
    paperSize: Joi.string().valid('TWO_INCH', 'THREE_INCH', 'FOUR_INCH', 'A4', 'A5', 'LETTER').optional(),
    devicePath: Joi.string().optional(),
    ipAddress: Joi.string().ip().optional(),
    port: Joi.number().min(1).max(65535).optional(),
    macAddress: Joi.string().optional(),
    characterPerLine: Joi.number().min(20).max(100).optional(),
    autoCut: Joi.boolean().optional(),
    openCashDrawer: Joi.boolean().optional(),
    copies: Joi.number().min(1).max(5).optional(),
    printLogo: Joi.boolean().optional(),
    headerText: Joi.string().optional(),
    footerText: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    categories: Joi.object({
      connect: Joi.array().items(Joi.object({
        id: Joi.string().guid({ version: ['uuidv4'] }).required(),
      })).optional()
    }).optional()
  })
});