// services/printer.service.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const printerService = {
  // ==================== PRINTER MANAGEMENT ====================
  async create(data: any, user?: any) {
    // Extract the body from the data
    const { body: requestBody } = data;
    const { categories, ...printerData } = requestBody || {};
    
    console.log('Creating printer with data:', data);
    console.log('User context:', { 
      userId: user?.id, 
      userRole: user?.role, 
      userBranch: user?.branch,
      hasBranchId: !!printerData.branchId,
      printerData: JSON.stringify(printerData, null, 2)
    });

    // Handle branch assignment for managers
    if (user?.role === 'MANAGER' && user?.branch) {
      const branchId = typeof user.branch === 'string' 
        ? user.branch 
        : user.branch.id || user.branch._id;

      if (!branchId) {
        throw new Error('Unable to determine manager\'s branch');
      }

      console.log('Manager branch ID:', branchId);

      // Verify the branch exists
      const branch = await prisma.branch.findUnique({
        where: { id: branchId }
      });

      if (!branch) {
        throw new Error(`Branch with ID ${branchId} not found`);
      }

      console.log('Branch found:', branch);

      printerData.branchId = branch.id;
    }
    // For admins, require branchId
    else if (user?.role === 'ADMIN') {
      const branchId = printerData.branchId;
      
      console.log('Admin user - checking branch ID:', { 
        hasBranchId: !!branchId,
        branchId: branchId,
        printerData: JSON.stringify(printerData, null, 2)
      });
      
      if (!branchId) {
        throw new Error('Branch ID is required for admin users');
      }
      
      // Verify the branch exists
      const branch = await prisma.branch.findUnique({
        where: { id: branchId }
      });

      if (!branch) {
        throw new Error(`Branch with ID ${branchId} not found`);
      }
      
      console.log('Branch found:', branch);

    }

    const createData: any = {
      ...printerData,
      branch: {
        connect: { id: printerData.branchId }
      }
    };

    // Handle category assignments for kitchen printers
    if (categories && categories.connect && printerData.type === 'KITCHEN') {
      createData.categories = {
        create: categories.connect.map(({ id }: { id: string }) => ({
          category: { connect: { id } }
        }))
      };
    }

    delete createData.branchId;

    console.log('Final printer create data:', createData);

    return prisma.printer.create({
      data: createData,
      include: {
        branch: true,
        categories: {
          include: {
            category: true
          }
        },
        printJobs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });
  },

  async list(user?: any, queryParams?: any) {
    const where: any = {};

    console.log('PrinterService.list called with:', {
      userRole: user?.role,
      userBranch: user?.branch,
      queryParams: queryParams
    });

    // For managers, only show printers from their branch
    if (user?.role === 'MANAGER' && user?.branch) {
      const branchId = typeof user.branch === 'string' 
        ? user.branch 
        : user.branch.id || user.branch._id;

      if (branchId) {
        where.branchId = branchId;
      } else {
        console.error('Manager has no branch assigned');
        return [];
      }
    }
    // For admins, filter by branch if provided
    else if (user?.role === 'ADMIN' && queryParams?.branchId) {
      where.branchId = queryParams.branchId;
    }

    // Filter by type if provided
    if (queryParams?.type) {
      where.type = queryParams.type;
    }

    // Filter by status if provided
    if (queryParams?.status) {
      where.status = queryParams.status;
    }

    // Only show active printers unless specified
    if (queryParams?.includeInactive !== 'true') {
      where.isActive = true;
    }

    console.log('Final where clause for printers:', where);

    const printers = await prisma.printer.findMany({
      where,
      include: {
        branch: true,
        categories: {
          include: {
            category: true
          }
        },
        printJobs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('Found printers:', printers.length);
    return printers;
  },

  async get(id: string, user?: any) {
    const where: any = { id };

    // For managers, only allow access to printers from their branch
    if (user?.role === 'MANAGER' && user?.branch) {
      const branchId = typeof user.branch === 'string' 
        ? user.branch 
        : user.branch.id || user.branch._id;

      if (branchId) {
        where.branchId = branchId;
      }
    }

    return prisma.printer.findUnique({
      where,
      include: {
        branch: true,
        categories: {
          include: {
            category: true
          }
        },
        printJobs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        }
      }
    });
  },

  async update(id: string, data: any, user?: any) {
    const { categories, ...printerData } = data;
    
    console.log('Update printer - User data:', JSON.stringify(user, null, 2));
    
    // First verify the printer exists and user has access
    const existing = await prisma.printer.findUnique({
      where: { id },
      include: {
        branch: true
      }
    });

    if (!existing) {
      throw new Error('Printer not found');
    }

    // For managers, verify they can only update printers from their branch
    if (user?.role === 'MANAGER' && user?.branch) {
      const branchId = typeof user.branch === 'string' 
        ? user.branch 
        : user.branch.id || user.branch._id;

      if (branchId && existing.branchId !== branchId) {
        throw new Error('You do not have permission to update this printer');
      }
      
      // Prevent changing the branch
      if (printerData.branchId && printerData.branchId !== existing.branchId) {
        throw new Error('You cannot change the branch of a printer');
      }
    }

    const updateData: any = { ...printerData };

    // Handle category assignments for kitchen printers
    if (categories && existing.type === 'KITCHEN') {
      updateData.categories = {
        deleteMany: {},
        ...(categories.connect && {
          create: categories.connect.map(({ id }: { id: string }) => ({
            category: { connect: { id } }
          }))
        })
      };
    }

    return prisma.printer.update({
      where: { id },
      data: updateData,
      include: {
        branch: true,
        categories: {
          include: {
            category: true
          }
        },
        printJobs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });
  },

  async remove(id: string, user?: any) {
    console.log('Remove printer - User data:', JSON.stringify(user, null, 2));
    
    // First verify the printer exists and the user has access to it
    const existing = await prisma.printer.findUnique({
      where: { id },
      select: { branchId: true }
    });

    if (!existing) {
      throw new Error('Printer not found');
    }

    // For managers, ensure they can only delete printers from their branch
    if (user?.role === 'MANAGER' && user?.branch) {
      const branchId = typeof user.branch === 'string' 
        ? user.branch 
        : user.branch.id || user.branch._id;

      if (branchId && existing.branchId !== branchId) {
        throw new Error('You do not have permission to delete this printer');
      }
    }

    // Soft delete by setting isActive to false
    return prisma.printer.update({
      where: { id },
      data: { isActive: false },
      include: {
        branch: true
      }
    });
  },

  async updateStatus(id: string, status: string, user?: any) {
    // First verify the printer exists and user has access
    await this.get(id, user);

    return prisma.printer.update({
      where: { id },
      data: { status },
      include: {
        branch: true
      }
    });
  },

  async getStats(branchId?: string, user?: any) {
    const where: any = { isActive: true };

    // Apply branch filter
    if (user?.role === 'MANAGER' && user?.branch) {
      where.branchId = typeof user.branch === 'string' 
        ? user.branch 
        : user.branch.id || user.branch._id;
    } else if (branchId) {
      where.branchId = branchId;
    }

    const printers = await prisma.printer.findMany({
      where,
      include: {
        printJobs: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }
      }
    });

    const stats = {
      total: printers.length,
      byStatus: {
        ONLINE: printers.filter(p => p.status === 'ONLINE').length,
        OFFLINE: printers.filter(p => p.status === 'OFFLINE').length,
        ERROR: printers.filter(p => p.status === 'ERROR').length,
        MAINTENANCE: printers.filter(p => p.status === 'MAINTENANCE').length
      },
      byType: {
        KITCHEN: printers.filter(p => p.type === 'KITCHEN').length,
        RECEIPT: printers.filter(p => p.type === 'RECEIPT').length,
        BAR: printers.filter(p => p.type === 'BAR').length,
        LABEL: printers.filter(p => p.type === 'LABEL').length,
        REPORT: printers.filter(p => p.type === 'REPORT').length
      },
      totalJobs24h: printers.reduce((acc, printer) => acc + printer.printJobs.length, 0),
      failedJobs24h: printers.reduce((acc, printer) => 
        acc + printer.printJobs.filter(job => job.status === 'FAILED').length, 0
      )
    };

    return stats;
  },

  // ==================== PRINT OPERATIONS ====================
  async testPrint(id: string, user?: any) {
    const printer = await this.get(id, user);
    
    if (!printer) {
      throw new Error('Printer not found');
    }

    // Create a test print job
    const testContent = {
      type: 'TEST',
      header: 'TEST PRINT',
      content: [
        'Printer Test',
        '=============',
        `Printer: ${printer.name}`,
        `Branch: ${printer.branch.name}`,
        `Type: ${printer.type}`,
        `Time: ${new Date().toLocaleString()}`,
        '',
        'This is a test print.',
        'If you can read this,',
        'your printer is working correctly.',
        '',
        '=============',
        'END OF TEST'
      ],
      footer: 'Test completed successfully'
    };

    return prisma.printJob.create({
      data: {
        printerId: id,
        jobType: 'TEST',
        content: testContent,
        rawContent: testContent.content.join('\n'),
        status: 'PENDING'
      },
      include: {
        printer: true
      }
    });
  },

  async printOrder(order: any, user?: any) {
    try {
      const branchId = user?.branch?.id || user?.branch;
      
      // Get receipt printers for the branch
      const receiptPrinters = await prisma.printer.findMany({
        where: {
          branchId: branchId,
          type: 'RECEIPT',
          isActive: true,
          status: 'ONLINE'
        }
      });

      // Get kitchen printers for each order item category
      const kitchenPrintJobs = [];
      
      for (const item of order.items) {
        if (item.menuItem?.categoryId) {
          const kitchenPrinters = await prisma.printer.findMany({
            where: {
              branchId: branchId,
              type: 'KITCHEN',
              isActive: true,
              status: 'ONLINE',
              OR: [
                {
                  categories: {
                    some: {
                      categoryId: item.menuItem.categoryId
                    }
                  }
                },
                {
                  categories: {
                    none: {} // Printers with no specific category assignments
                  }
                }
              ]
            },
            include: {
              categories: true
            }
          });

          for (const printer of kitchenPrinters) {
            const printJob = await this.createKitchenPrintJob(printer, order, item);
            kitchenPrintJobs.push(printJob);
          }
        }
      }

      // Create receipt print jobs
      const receiptPrintJobs = [];
      for (const printer of receiptPrinters) {
        const printJob = await this.createReceiptPrintJob(printer, order);
        receiptPrintJobs.push(printJob);
      }

      return {
        receiptPrintJobs,
        kitchenPrintJobs,
        totalJobs: receiptPrintJobs.length + kitchenPrintJobs.length
      };

    } catch (error: any) {
      console.error('Error in printOrder:', error);
      throw new Error(`Failed to create print jobs: ${error.message}`);
    }
  },

  async createReceiptPrintJob(printer: any, order: any) {
    const receiptContent = this.generateReceiptContent(order, printer);
    
    return prisma.printJob.create({
      data: {
        printerId: printer.id,
        jobType: 'RECEIPT',
        referenceId: order.id,
        content: receiptContent.structured,
        rawContent: receiptContent.raw,
        status: 'PENDING'
      },
      include: {
        printer: true
      }
    });
  },

  async createKitchenPrintJob(printer: any, order: any, item: any) {
    const kitchenContent = this.generateKitchenContent(order, item, printer);
    
    return prisma.printJob.create({
      data: {
        printerId: printer.id,
        jobType: 'KITCHEN',
        referenceId: order.id,
        content: kitchenContent.structured,
        rawContent: kitchenContent.raw,
        status: 'PENDING'
      },
      include: {
        printer: true
      }
    });
  },

  generateReceiptContent(order: any, printer: any) {
    const header = printer.headerText || 'RESTAURANT RECEIPT';
    const footer = printer.footerText || 'Thank you for your business!';
    
    const content = [
      header,
      '='.repeat(printer.characterPerLine || 42),
      `Order: ${order.orderNumber}`,
      `Date: ${new Date(order.createdAt).toLocaleString()}`,
      `Table: ${order.tableNumber || 'Takeaway'}`,
      '='.repeat(printer.characterPerLine || 42),
      ''
    ];

    // Add items
    order.items.forEach((item: any) => {
      content.push(`${item.quantity}x ${item.name}`);
      content.push(`   $${item.total.toFixed(2)}`);
      if (item.notes) {
        content.push(`   Notes: ${item.notes}`);
      }
      content.push('');
    });

    // Add totals
    content.push('='.repeat(printer.characterPerLine || 42));
    content.push(`Subtotal: $${order.subtotal.toFixed(2)}`);
    content.push(`Tax: $${order.tax.toFixed(2)}`);
    if (order.discount) {
      content.push(`Discount: -$${order.discount.toFixed(2)}`);
    }
    content.push(`TOTAL: $${order.total.toFixed(2)}`);
    content.push('');
    content.push(footer);

    return {
      structured: {
        type: 'RECEIPT',
        header: header,
        orderInfo: {
          orderNumber: order.orderNumber,
          date: order.createdAt,
          table: order.tableNumber
        },
        items: order.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.total,
          notes: item.notes
        })),
        totals: {
          subtotal: order.subtotal,
          tax: order.tax,
          discount: order.discount,
          total: order.total
        },
        footer: footer
      },
      raw: content.join('\n')
    };
  },

  generateKitchenContent(order: any, item: any, printer: any) {
    const content = [
      'KITCHEN ORDER',
      '='.repeat(printer.characterPerLine || 42),
      `Order: ${order.orderNumber}`,
      `Time: ${new Date().toLocaleTimeString()}`,
      `Table: ${order.tableNumber || 'Takeaway'}`,
      '='.repeat(printer.characterPerLine || 42),
      '',
      `${item.quantity}x ${item.name}`,
      ''
    ];

    if (item.notes) {
      content.push(`NOTES: ${item.notes}`);
      content.push('');
    }

    if (item.modifiers && item.modifiers.length > 0) {
      content.push('Modifiers:');
      item.modifiers.forEach((modifier: any) => {
        content.push(`- ${modifier.name}`);
      });
      content.push('');
    }

    content.push('='.repeat(printer.characterPerLine || 42));
    content.push('END OF KITCHEN ORDER');

    return {
      structured: {
        type: 'KITCHEN',
        orderNumber: order.orderNumber,
        item: {
          name: item.name,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: item.modifiers
        },
        table: order.tableNumber,
        timestamp: new Date()
      },
      raw: content.join('\n')
    };
  },

  async printReport(reportType: string, data: any, printerId?: string, user?: any) {
    try {
      let printers = [];
      
      if (printerId) {
        // Print to specific printer
        const printer = await prisma.printer.findUnique({
          where: { id: printerId }
        });
        if (printer) printers.push(printer);
      } else {
        // Find report printers for the branch
        const branchId = user?.branch?.id || user?.branch;
        printers = await prisma.printer.findMany({
          where: {
            branchId: branchId,
            type: 'REPORT',
            isActive: true,
            status: 'ONLINE'
          }
        });
      }

      if (printers.length === 0) {
        throw new Error('No suitable printers found for report');
      }

      const printJobs = [];
      for (const printer of printers) {
        const reportContent = this.generateReportContent(reportType, data, printer);
        const printJob = await prisma.printJob.create({
          data: {
            printerId: printer.id,
            jobType: 'REPORT',
            referenceId: `REPORT_${reportType}_${Date.now()}`,
            content: reportContent.structured,
            rawContent: reportContent.raw,
            status: 'PENDING'
          },
          include: {
            printer: true
          }
        });
        printJobs.push(printJob);
      }

      return printJobs;

    } catch (error: any) {
      console.error('Error in printReport:', error);
      throw new Error(`Failed to create report print jobs: ${error.message}`);
    }
  },

  generateReportContent(reportType: string, data: any, printer: any) {
    const header = `${reportType.replace('_', ' ').toUpperCase()} REPORT`;
    const content = [
      header,
      '='.repeat(printer.characterPerLine || 42),
      `Generated: ${new Date().toLocaleString()}`,
      `Branch: ${printer.branch?.name || 'N/A'}`,
      '='.repeat(printer.characterPerLine || 42),
      ''
    ];

    // Add report-specific content
    switch (reportType) {
      case 'DAILY_SALES':
        content.push(...this.generateDailySalesContent(data));
        break;
      case 'INVENTORY':
        content.push(...this.generateInventoryContent(data));
        break;
      case 'SHIFT_REPORT':
        content.push(...this.generateShiftReportContent(data));
        break;
      default:
        content.push('Report data not available');
    }

    content.push('');
    content.push('='.repeat(printer.characterPerLine || 42));
    content.push('END OF REPORT');

    return {
      structured: {
        type: 'REPORT',
        reportType: reportType,
        header: header,
        data: data,
        generatedAt: new Date()
      },
      raw: content.join('\n')
    };
  },

  generateDailySalesContent(data: any): string[] {
    const content = [];
    content.push(`Date: ${data.date}`);
    content.push(`Total Sales: $${data.totalSales?.toFixed(2) || '0.00'}`);
    content.push(`Total Orders: ${data.totalOrders || 0}`);
    content.push(`Average Order: $${data.averageOrder?.toFixed(2) || '0.00'}`);
    content.push('');
    
    if (data.ordersByType) {
      content.push('Orders by Type:');
      Object.entries(data.ordersByType).forEach(([type, count]) => {
        content.push(`  ${type}: ${count}`);
      });
      content.push('');
    }

    return content;
  },

  // ==================== PRINT JOB MANAGEMENT ====================
  async getPrintJobs(printerId: string, user?: any, queryParams?: any) {
    // First verify the printer exists and user has access
    await this.get(printerId, user);

    const where: any = { printerId };

    if (queryParams?.status) {
      where.status = queryParams.status;
    }

    if (queryParams?.jobType) {
      where.jobType = queryParams.jobType;
    }

    if (queryParams?.startDate && queryParams?.endDate) {
      where.createdAt = {
        gte: new Date(queryParams.startDate),
        lte: new Date(queryParams.endDate)
      };
    }

    return prisma.printJob.findMany({
      where,
      include: {
        printer: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: queryParams?.limit ? parseInt(queryParams.limit) : 50
    });
  },

  async getPrintQueue(branchId?: string, status?: string) {
    const where: any = {};

    if (branchId) {
      where.printer = {
        branchId: branchId
      };
    }

    if (status) {
      where.status = status;
    }

    return prisma.printJob.findMany({
      where,
      include: {
        printer: {
          include: {
            branch: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });
  },

  async markJobAsPrinted(jobId: string) {
    return prisma.printJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        printedAt: new Date()
      }
    });
  },

  async markJobAsFailed(jobId: string, error: string) {
    return prisma.printJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: error,
        attempts: { increment: 1 }
      }
    });
  },

  async retryFailedJobs(printerId?: string) {
    const where: any = {
      status: 'FAILED',
      attempts: { lt: 3 } // Max 3 attempts
    };

    if (printerId) {
      where.printerId = printerId;
    }

    const failedJobs = await prisma.printJob.findMany({
      where,
      include: {
        printer: true
      }
    });

    const results = [];
    for (const job of failedJobs) {
      try {
        const updatedJob = await prisma.printJob.update({
          where: { id: job.id },
          data: {
            status: 'PENDING',
            attempts: { increment: 1 }
          }
        });
        results.push(updatedJob);
      } catch (error) {
        console.error(`Failed to retry job ${job.id}:`, error);
      }
    }

    return results;
  },

  async clearOldJobs(days: number = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return prisma.printJob.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        status: {
          in: ['COMPLETED', 'FAILED']
        }
      }
    });
  },

  // ==================== UTILITY METHODS ====================
  async getPrintersForOrder(orderType: string, categoryId?: string, branchId?: string) {
    const where: any = {
      isActive: true,
      status: 'ONLINE'
    };

    if (branchId) {
      where.branchId = branchId;
    }

    // For kitchen orders, find printers assigned to the category
    if (orderType === 'KITCHEN' && categoryId) {
      where.OR = [
        {
          type: 'KITCHEN',
          categories: {
            some: {
              categoryId: categoryId
            }
          }
        },
        {
          type: 'KITCHEN',
          categories: {
            none: {} // Printers with no specific category assignments
          }
        }
      ];
    }
    // For receipt printers
    else if (orderType === 'RECEIPT') {
      where.type = 'RECEIPT';
    }

    return prisma.printer.findMany({
      where,
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
  }
};