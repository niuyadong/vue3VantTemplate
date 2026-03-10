import { Response } from 'express';

/**
 * Success response
 */
export const successResponse = (res: Response, data: any = null, message: string = '操作成功'): void => {
  res.json({
    code: 200,
    message,
    data
  });
};

/**
 * Error response
 */
export const errorResponse = (res: Response, status: number, message: string = '操作失败', data: any = null): void => {
  res.status(status).json({
    code: status,
    message,
    data
  });
};

/**
 * Validation error response
 */
export const validationErrorResponse = (res: Response, message: string = '参数错误'): void => {
  res.status(400).json({
    code: 400,
    message,
    data: null
  });
};

/**
 * Unauthorized response
 */
export const unauthorizedResponse = (res: Response, message: string = '未登录'): void => {
  res.status(401).json({
    code: 401,
    message,
    data: null
  });
};

/**
 * Forbidden response
 */
export const forbiddenResponse = (res: Response, message: string = '权限不足'): void => {
  res.status(403).json({
    code: 403,
    message,
    data: null
  });
};

/**
 * Not found response
 */
export const notFoundResponse = (res: Response, message: string = '资源不存在'): void => {
  res.status(404).json({
    code: 404,
    message,
    data: null
  });
};

/**
 * Server error response
 */
export const serverErrorResponse = (res: Response, message: string = '服务器错误'): void => {
  res.status(500).json({
    code: 500,
    message,
    data: null
  });
};