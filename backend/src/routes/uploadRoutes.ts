import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import { uploadSingle, uploadMultiple } from '../middlewares/upload';
import { uploadFile, uploadFiles } from '../controllers/uploadController';

const router = express.Router();

// Protected routes (require authentication)
router.use(authMiddleware);

// Upload single file
router.post('/single', uploadSingle('file'), uploadFile);

// Upload multiple files
router.post('/multiple', uploadMultiple('files', 10), uploadFiles);

// Upload avatar
router.post('/avatar', uploadSingle('avatar'), uploadFile);

// Upload product images
router.post('/product', uploadMultiple('images', 5), uploadFiles);

// Upload activity images
router.post('/activity', uploadSingle('image'), uploadFile);

export default router;