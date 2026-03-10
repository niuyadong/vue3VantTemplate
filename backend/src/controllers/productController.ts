import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product';
import Category from '../models/Category';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

/**
 * Get product list
 */
export const getProductList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword = '', categoryId = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query: any = {};
    
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    if (status) {
      query.status = status;
    }
    
    const skip = (Number(page) - 1) * Number(pageSize);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
    
    const [list, total] = await Promise.all([
      Product.find(query).populate('categoryId').skip(skip).limit(Number(pageSize)).sort(sort),
      Product.countDocuments(query)
    ]);
    
    const formattedList = list.map(product => ({
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId?._id.toString(),
      categoryName: (product.categoryId as any)?.name,
      images: product.images,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
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
 * Get product detail
 */
export const getProductDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id).populate('categoryId');
    
    if (!product) {
      errorResponse(res, 404, '商品不存在', null);
      return;
    }
    
    successResponse(res, {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId?._id.toString(),
      categoryName: (product.categoryId as any)?.name,
      images: product.images,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }, '获取成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', null);
  }
};

/**
 * Get product categories
 */
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ sort: 1 });
    
    const formattedCategories = categories.map(category => ({
      id: category._id.toString(),
      name: category.name,
      parentId: category.parentId?.toString() || null,
      sort: category.sort
    }));
    
    successResponse(res, formattedCategories, '获取成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', null);
  }
};

/**
 * Get hot products
 */
export const getHotProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    
    // In a real-world scenario, you might have a 'isHot' field or use sales data
    // For simplicity, we'll just return the most recently created products
    const products = await Product.find({ status: 'active' })
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    
    const formattedProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      images: product.images
    }));
    
    successResponse(res, formattedProducts, '获取成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', null);
  }
};

/**
 * Get recommended products
 */
export const getRecommendedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    
    // In a real-world scenario, you might use user preferences or collaborative filtering
    // For simplicity, we'll just return random active products
    const products = await Product.find({ status: 'active' })
      .limit(Number(limit))
      .sort({ $natural: -1 });
    
    const formattedProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      images: product.images
    }));
    
    successResponse(res, formattedProducts, '获取成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', null);
  }
};

/**
 * Search products
 */
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword = '', page = 1, pageSize = 10 } = req.query;
    
    if (!keyword) {
      successResponse(res, {
        list: [],
        total: 0,
        page: Number(page),
        pageSize: Number(pageSize)
      }, '搜索成功');
      return;
    }
    
    const query: any = {
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ],
      status: 'active'
    };
    
    const skip = (Number(page) - 1) * Number(pageSize);
    
    const [list, total] = await Promise.all([
      Product.find(query).skip(skip).limit(Number(pageSize)),
      Product.countDocuments(query)
    ]);
    
    const formattedList = list.map(product => ({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      images: product.images
    }));
    
    successResponse(res, {
      list: formattedList,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    }, '搜索成功');
  } catch (error) {
    errorResponse(res, 500, '搜索失败', null);
  }
};

/**
 * Create product
 */
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      validationErrorResponse(res, errors.array()[0].msg);
      return;
    }
    
    const { name, description, price, stock, categoryId, images, status } = req.body;
    
    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      errorResponse(res, 400, '分类不存在', null);
      return;
    }
    
    const product = new Product({
      name,
      description,
      price,
      stock,
      categoryId,
      images,
      status
    });
    
    await product.save();
    
    successResponse(res, {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId.toString(),
      images: product.images,
      status: product.status,
      createdAt: product.createdAt
    }, '添加成功');
  } catch (error) {
    errorResponse(res, 500, '添加失败', null);
  }
};

/**
 * Update product
 */
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      validationErrorResponse(res, errors.array()[0].msg);
      return;
    }
    
    const { id } = req.params;
    const { name, description, price, stock, categoryId, images, status } = req.body;
    
    const product = await Product.findById(id);
    
    if (!product) {
      errorResponse(res, 404, '商品不存在', null);
      return;
    }
    
    // Validate category exists
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        errorResponse(res, 400, '分类不存在', null);
        return;
      }
      product.categoryId = categoryId;
    }
    
    // Update product
    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (images) product.images = images;
    if (status) product.status = status;
    
    await product.save();
    
    successResponse(res, {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId.toString(),
      images: product.images,
      status: product.status,
      updatedAt: product.updatedAt
    }, '更新成功');
  } catch (error) {
    errorResponse(res, 500, '更新失败', null);
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    
    if (!product) {
      errorResponse(res, 404, '商品不存在', null);
      return;
    }
    
    await product.deleteOne();
    
    successResponse(res, null, '删除成功');
  } catch (error) {
    errorResponse(res, 500, '删除失败', null);
  }
};

// Validation rules
export const productValidation = [
  body('name').notEmpty().withMessage('商品名称不能为空').isLength({ max: 100 }).withMessage('商品名称不能超过100个字符'),
  body('description').notEmpty().withMessage('商品描述不能为空'),
  body('price').notEmpty().withMessage('商品价格不能为空').isNumeric().withMessage('商品价格必须是数字').isFloat({ min: 0 }).withMessage('商品价格不能为负数'),
  body('stock').notEmpty().withMessage('商品库存不能为空').isNumeric().withMessage('商品库存必须是数字').isInt({ min: 0 }).withMessage('商品库存不能为负数'),
  body('categoryId').notEmpty().withMessage('商品分类不能为空'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('商品状态无效')
];

export const updateProductValidation = [
  body('name').optional().isLength({ max: 100 }).withMessage('商品名称不能超过100个字符'),
  body('price').optional().isNumeric().withMessage('商品价格必须是数字').isFloat({ min: 0 }).withMessage('商品价格不能为负数'),
  body('stock').optional().isNumeric().withMessage('商品库存必须是数字').isInt({ min: 0 }).withMessage('商品库存不能为负数'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('商品状态无效')
];