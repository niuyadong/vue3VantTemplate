import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order';
import Product from '../models/Product';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

/**
 * Generate order number
 */
const generateOrderNo = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${timestamp}${random}`;
};

/**
 * Get order list
 */
export const getOrderList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status = '', keyword = '' } = req.query;
    
    if (!req.user) {
      errorResponse(res, 401, '未登录', null);
      return;
    }
    
    const query: any = {
      userId: req.user.userId
    };
    
    if (status) {
      query.status = status;
    }
    
    if (keyword) {
      query.orderNo = { $regex: keyword, $options: 'i' };
    }
    
    const skip = (Number(page) - 1) * Number(pageSize);
    
    const [list, total] = await Promise.all([
      Order.find(query).skip(skip).limit(Number(pageSize)).sort({ createdAt: -1 }),
      Order.countDocuments(query)
    ]);
    
    const formattedList = list.map(order => ({
      id: order._id.toString(),
      orderNo: order.orderNo,
      totalPrice: order.totalPrice,
      status: order.status,
      paymentMethod: order.paymentMethod,
      items: order.items,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));
    
    successResponse(res, {
      list: formattedList,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    }, '获取成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', null);
  }
};

/**
 * Get order detail
 */
export const getOrderDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      errorResponse(res, 401, '未登录', null);
      return;
    }
    
    const order = await Order.findOne({ $or: [{ _id: id }, { orderNo: id }], userId: req.user.userId });
    
    if (!order) {
      errorResponse(res, 404, '订单不存在', null);
      return;
    }
    
    successResponse(res, {
      id: order._id.toString(),
      orderNo: order.orderNo,
      totalPrice: order.totalPrice,
      status: order.status,
      paymentMethod: order.paymentMethod,
      address: order.address,
      items: order.items,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }, '获取成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', null);
  }
};

/**
 * Create order
 */
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      validationErrorResponse(res, errors.array()[0].msg);
      return;
    }
    
    if (!req.user) {
      errorResponse(res, 401, '未登录', null);
      return;
    }
    
    const { address, items, paymentMethod } = req.body;
    
    // Validate items
    if (!items || items.length === 0) {
      errorResponse(res, 400, '订单商品不能为空', null);
      return;
    }
    
    // Validate products and calculate total price
    let totalPrice = 0;
    const validatedItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        errorResponse(res, 400, `商品 ${item.name} 不存在`, null);
        return;
      }
      
      if (product.stock < item.quantity) {
        errorResponse(res, 400, `商品 ${product.name} 库存不足`, null);
        return;
      }
      
      totalPrice += product.price * item.quantity;
      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: item.image || product.images[0] || ''
      });
    }
    
    // Create order
    const order = new Order({
      orderNo: generateOrderNo(),
      userId: req.user.userId,
      totalPrice,
      status: 'pending',
      paymentMethod,
      address,
      items: validatedItems
    });
    
    // Update product stock
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }
    
    await order.save();
    
    successResponse(res, {
      id: order._id.toString(),
      orderNo: order.orderNo,
      totalPrice: order.totalPrice,
      status: order.status,
      paymentMethod: order.paymentMethod,
      address: order.address,
      items: order.items,
      createdAt: order.createdAt
    }, '创建成功');
  } catch (error) {
    errorResponse(res, 500, '创建失败', null);
  }
};

/**
 * Pay order
 */
export const payOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    
    if (!req.user) {
      errorResponse(res, 401, '未登录', null);
      return;
    }
    
    const order = await Order.findOne({ $or: [{ _id: id }, { orderNo: id }], userId: req.user.userId });
    
    if (!order) {
      errorResponse(res, 404, '订单不存在', null);
      return;
    }
    
    if (order.status !== 'pending') {
      errorResponse(res, 400, '订单状态错误', null);
      return;
    }
    
    // Update order status
    order.status = 'payment';
    order.paymentMethod = paymentMethod || order.paymentMethod;
    
    await order.save();
    
    successResponse(res, {
      id: order._id.toString(),
      orderNo: order.orderNo,
      status: order.status,
      paymentMethod: order.paymentMethod
    }, '支付成功');
  } catch (error) {
    errorResponse(res, 500, '支付失败', null);
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!req.user) {
      errorResponse(res, 401, '未登录', null);
      return;
    }
    
    const order = await Order.findOne({ $or: [{ _id: id }, { orderNo: id }], userId: req.user.userId });
    
    if (!order) {
      errorResponse(res, 404, '订单不存在', null);
      return;
    }
    
    if (order.status !== 'pending' && order.status !== 'payment') {
      errorResponse(res, 400, '订单状态错误', null);
      return;
    }
    
    // Update order status
    order.status = 'cancelled';
    
    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }
    
    await order.save();
    
    successResponse(res, {
      id: order._id.toString(),
      orderNo: order.orderNo,
      status: order.status
    }, '取消成功');
  } catch (error) {
    errorResponse(res, 500, '取消失败', null);
  }
};

/**
 * Confirm order receipt
 */
export const confirmOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      errorResponse(res, 401, '未登录', null);
      return;
    }
    
    const order = await Order.findOne({ $or: [{ _id: id }, { orderNo: id }], userId: req.user.userId });
    
    if (!order) {
      errorResponse(res, 404, '订单不存在', null);
      return;
    }
    
    if (order.status !== 'shipped') {
      errorResponse(res, 400, '订单状态错误', null);
      return;
    }
    
    // Update order status
    order.status = 'delivered';
    
    await order.save();
    
    successResponse(res, {
      id: order._id.toString(),
      orderNo: order.orderNo,
      status: order.status
    }, '确认收货成功');
  } catch (error) {
    errorResponse(res, 500, '确认失败', null);
  }
};

/**
 * Refund order
 */
export const refundOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, amount } = req.body;
    
    if (!req.user) {
      errorResponse(res, 401, '未登录', null);
      return;
    }
    
    const order = await Order.findOne({ $or: [{ _id: id }, { orderNo: id }], userId: req.user.userId });
    
    if (!order) {
      errorResponse(res, 404, '订单不存在', null);
      return;
    }
    
    if (order.status !== 'delivered') {
      errorResponse(res, 400, '订单状态错误', null);
      return;
    }
    
    // Update order status
    order.status = 'refunded';
    
    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }
    
    await order.save();
    
    successResponse(res, {
      id: order._id.toString(),
      orderNo: order.orderNo,
      status: order.status
    }, '退款申请成功');
  } catch (error) {
    errorResponse(res, 500, '退款失败', null);
  }
};

/**
 * Get order statistics
 */
export const getOrderStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 401, '未登录', null);
      return;
    }
    
    const statusCounts = await Order.aggregate([
      { $match: { userId: req.user.userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const statistics = {
      pending: 0,
      payment: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0
    };
    
    statusCounts.forEach(item => {
      statistics[item._id as keyof typeof statistics] = item.count;
    });
    
    successResponse(res, statistics, '获取成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', null);
  }
};

// Validation rules
export const createOrderValidation = [
  body('address').notEmpty().withMessage('收货地址不能为空'),
  body('items').notEmpty().withMessage('订单商品不能为空'),
  body('paymentMethod').notEmpty().withMessage('支付方式不能为空').isIn(['alipay', 'wechat', 'card']).withMessage('支付方式无效')
];

export const payOrderValidation = [
  body('paymentMethod').notEmpty().withMessage('支付方式不能为空').isIn(['alipay', 'wechat', 'card']).withMessage('支付方式无效')
];

export const cancelOrderValidation = [
  body('reason').notEmpty().withMessage('取消原因不能为空')
];

export const refundOrderValidation = [
  body('reason').notEmpty().withMessage('退款原因不能为空'),
  body('amount').notEmpty().withMessage('退款金额不能为空').isNumeric().withMessage('退款金额必须是数字')
];