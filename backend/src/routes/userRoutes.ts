import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  login,
  getUserInfo,
  logout,
  updateUserInfo,
  changePassword,
  refreshToken,
  getUserList,
  loginValidation,
  updateInfoValidation,
  changePasswordValidation
} from '../controllers/userController';

const router = express.Router();

// Public routes
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/info', authMiddleware, getUserInfo);
router.post('/logout', authMiddleware, logout);
router.put('/info', authMiddleware, updateInfoValidation, updateUserInfo);
router.post('/password', authMiddleware, changePasswordValidation, changePassword);
router.get('/list', authMiddleware, getUserList);

export default router;