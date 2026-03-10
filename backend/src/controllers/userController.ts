import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

/**
 * User login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      validationErrorResponse(res, errors.array()[0].msg);
      return;
    }
    
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    
    if (!user) {
      errorResponse(res, 400, '用户名或密码错误', null);
      return;
    }
    
    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      errorResponse(res, 400, '用户名或密码错误', null);
      return;
    }
    
    // Generate tokens
    const payload = {
      userId: user._id.toString(),
      username: user.username,
      roles: user.roles,
      permissions: user.permissions
    };
    
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    successResponse(res, {
      token,
      userInfo: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        roles: user.roles
      }
    }, '登录成功');
  } catch (error) {
    errorResponse(res, 500, '登录失败', null);
  }
};

/**
 * Get user info
 */
export const getUserInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 401, '未登录', null);
      return;
    }
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      errorResponse(res, 404, '用户不存在', null);
      return;
    }
    
    successResponse(res, {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      roles: user.roles,
      permissions: user.permissions
    }, '获取成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', null);
  }
};

/**
 * User logout
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // In a real-world scenario, you might want to blacklist the token
    // For simplicity, we'll just return success
    successResponse(res, null, '登出成功');
  } catch (error) {
    errorResponse(res, 500, '登出失败', null);
  }
};

/**
 * Update user info
 */
export const updateUserInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 401, '未登录', null);
      return;
    }
    
    const { email, avatar } = req.body;
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      errorResponse(res, 404, '用户不存在', null);
      return;
    }
    
    // Update user info
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;
    
    await user.save();
    
    successResponse(res, {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      roles: user.roles,
      updateTime: new Date().toISOString()
    }, '更新成功');
  } catch (error) {
    errorResponse(res, 500, '更新失败', null);
  }
};

/**
 * Change password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 401, '未登录', null);
      return;
    }
    
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      validationErrorResponse(res, '参数错误');
      return;
    }
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      errorResponse(res, 404, '用户不存在', null);
      return;
    }
    
    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);
    
    if (!isPasswordValid) {
      errorResponse(res, 400, '旧密码错误', null);
      return;
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    successResponse(res, null, '密码修改成功');
  } catch (error) {
    errorResponse(res, 500, '修改失败', null);
  }
};

/**
 * Refresh token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      errorResponse(res, 401, 'Token 不存在', null);
      return;
    }
    
    const payload = verifyRefreshToken(token);
    
    if (!payload) {
      errorResponse(res, 401, 'Token 无效', null);
      return;
    }
    
    // Validate user exists
    const user = await User.findById(payload.userId);
    
    if (!user) {
      errorResponse(res, 401, '用户不存在', null);
      return;
    }
    
    // Generate new tokens
    const newPayload = {
      userId: user._id.toString(),
      username: user.username,
      roles: user.roles,
      permissions: user.permissions
    };
    
    const newToken = generateToken(newPayload);
    
    successResponse(res, {
      token: newToken
    }, 'Token 刷新成功');
  } catch (error) {
    errorResponse(res, 500, '刷新失败', null);
  }
};

/**
 * Get user list (admin only)
 */
export const getUserList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, keyword = '' } = req.query;
    
    const query: any = {};
    
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const skip = (Number(page) - 1) * Number(pageSize);
    
    const [list, total] = await Promise.all([
      User.find(query).skip(skip).limit(Number(pageSize)),
      User.countDocuments(query)
    ]);
    
    const formattedList = list.map(user => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      roles: user.roles,
      status: user.status || 'active',
      createTime: user.createdAt
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

// Validation rules
export const loginValidation = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
];

export const updateInfoValidation = [
  body('email').optional().isEmail().withMessage('邮箱格式错误')
];

export const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('旧密码不能为空'),
  body('newPassword').notEmpty().withMessage('新密码不能为空').isLength({ min: 6 }).withMessage('新密码至少6位')
];