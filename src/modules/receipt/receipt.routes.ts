import { Router } from 'express';
import { printReceipt } from '../../services/receipt.service';
import { ApiResponse } from '../../utils/apiResponse';

const router = Router();

/**
 * @route   POST /api/receipts/print/:orderId
 * @desc    Print a receipt for an order
 * @access  Private
 */
router.post('/print/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const success = await printReceipt(orderId);
    
    if (!success) {
      return ApiResponse.send(
        res, 
        ApiResponse.error('Failed to print receipt. The printer might be offline.', 500)
      );
    }
    
    ApiResponse.send(res, ApiResponse.success({}, 'Receipt sent to printer'));
  } catch (error: any) {
    console.error('Error printing receipt:', error);
    ApiResponse.send(
      res, 
      ApiResponse.error(error.message || 'Failed to print receipt', 500)
    );
  }
});

export default router;
