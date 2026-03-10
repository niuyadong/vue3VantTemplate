import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getOrderList,
  getOrderDetail,
  createOrder,
  payOrder,
  cancelOrder,
  confirmOrder,
  refundOrder,
  getOrderStatistics,
  createOrderValidation,
  payOrderValidation,
  cancelOrderValidation,
  refundOrderValidation
} from '../controllers/orderController';

const router = express.Router();

// All order routes require authentication
router.use(authMiddleware);

router.get('/list', getOrderList);
router.get('/:id', getOrderDetail);
router.post('/', createOrderValidation, createOrder);
router.post('/:id/pay', payOrderValidation, payOrder);
router.post('/:id/cancel', cancelOrderValidation, cancelOrder);
router.post('/:id/confirm', confirmOrder);
router.post('/:id/refund', refundOrderValidation, refundOrder);
router.get('/statistics', getOrderStatistics);

export default router;