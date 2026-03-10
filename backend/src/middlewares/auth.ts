import { Request, Response, NextFunction } from 'express';
import { extractToken, verifyToken } from '../utils/jwt';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    roles: string[];
    permissions: string[];
  };
}

/**
 * Authentication middleware
 */
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        code: 401,
        message: '未登录',
        data: null
      });
      return;
    }
    
    const payload = verifyToken(token);
    
    if (!payload) {
      res.status(401).json({
        code: 401,
        message: '登录已过期',
        data: null
      });
      return;
    }
    
    // Validate user exists
    const user = await User.findById(payload.userId);
    
    if (!user) {
      res.status(401).json({
        code: 401,
        message: '用户不存在',
        data: null
      });
      return;
    }
    
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      code: 401,
      message: '认证失败',
      data: null
    });
  }
};

/**
 * Role-based access control middleware
 */
export const roleMiddleware = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: '未登录',
        data: null
      });
      return;
    }
    
    const hasRole = req.user.roles.some(role => roles.includes(role));
    
    if (!hasRole) {
      res.status(403).json({
        code: 403,
        message: '权限不足',
        data: null
      });
      return;
    }
    
    next();
  };
};

/**
 * Permission-based access control middleware
 */
export const permissionMiddleware = (permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: '未登录',
        data: null
      });
      return;
    }
    
    const hasPermission = req.user.permissions.some(permission => 
      permissions.includes(permission) || permission === '*:*:*'
    );
    
    if (!hasPermission) {
      res.status(403).json({
        code: 403,
        message: '权限不足',
        data: null
      });
      return;
    }
    
    next();
  };
};