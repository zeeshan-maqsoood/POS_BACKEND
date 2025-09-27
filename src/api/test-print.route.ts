import { Router } from 'express';
import { printReceipt } from '../services/receipt.service';
import { authenticateJwt } from '../middleware/auth.middleware';
import ApiResponse from '../utils/apiResponse';

export const testPrintRouter = Router();

// Test receipt printing endpoint
// GET /api/orders/test-print/:orderId
testPrintRouter.get(
  '/test-print/:orderId',
  authenticateJwt,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        return ApiResponse.send(res, ApiResponse.badRequest('Order ID is required'));
      }

      console.log(`🖨️  Test print request received for order ${orderId}`);
      
      const success = await printReceipt(orderId);
      
      if (success) {
        return ApiResponse.send(res, ApiResponse.success(
          { orderId },
          'Receipt sent to printer successfully'
        ));
      } else {
        return ApiResponse.send(res, ApiResponse.error('Failed to print receipt', 500));
      }
    } catch (error: any) {
      console.error('Error in test print endpoint:', error);
      return ApiResponse.send(res, ApiResponse.error(
        error.message || 'Internal server error',
        500
      ));
    }
  }
);

export default testPrintRouter;
