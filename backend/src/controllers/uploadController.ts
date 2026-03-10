import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import { uploadSingle, uploadMultiple, getFileUrl } from '../middlewares/upload';
import path from 'path';

/**
 * Upload single file
 */
export const uploadFile = (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      errorResponse(res, 400, '文件上传失败', null);
      return;
    }
    
    // Get relative path
    const relativePath = req.file.path.replace(path.resolve(__dirname, '../../uploads'), '').replace(/\\/g, '/').substring(1);
    const fileUrl = getFileUrl(req, relativePath);
    
    successResponse(res, {
      url: fileUrl,
      path: relativePath,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }, '上传成功');
  } catch (error) {
    errorResponse(res, 500, '上传失败', null);
  }
};

/**
 * Upload multiple files
 */
export const uploadFiles = (req: Request, res: Response): void => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      errorResponse(res, 400, '文件上传失败', null);
      return;
    }
    
    const files = req.files.map((file: any) => {
      const relativePath = file.path.replace(path.resolve(__dirname, '../../uploads'), '').replace(/\\/g, '/').substring(1);
      const fileUrl = getFileUrl(req, relativePath);
      
      return {
        url: fileUrl,
        path: relativePath,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      };
    });
    
    successResponse(res, files, '上传成功');
  } catch (error) {
    errorResponse(res, 500, '上传失败', null);
  }
};