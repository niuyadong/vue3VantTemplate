import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getProductList,
  getProductDetail,
  getCategories,
  getHotProducts,
  getRecommendedProducts,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  productValidation,
  updateProductValidation
} from '../controllers/productController';

const router = express.Router();

// Public routes
router.get('/list', getProductList);
router.get('/:id', getProductDetail);
router.get('/categories', getCategories);
router.get('/hot', getHotProducts);
router.get('/recommend', getRecommendedProducts);
router.get('/search', searchProducts);

// Protected routes (admin)
router.post('/', authMiddleware, productValidation, createProduct);
router.put('/:id', authMiddleware, updateProductValidation, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);

export default router;