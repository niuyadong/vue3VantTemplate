import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Activity from '../models/Activity';
import ActivityEnrollment from '../models/ActivityEnrollment';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

/**
 * Update activity status based on time
 */
const updateActivityStatus = async (activity: any): Promise<void> => {
  const now = new Date();
  let newStatus: string;
  
  if (now < activity.startTime) {
    newStatus = 'upcoming';
  } else if (now >= activity.startTime && now <= activity.endTime) {
    newStatus = 'ongoing';
  } else {
    newStatus = 'ended';
  }
  
  if (activity.status !== newStatus) {
    activity.status = newStatus;
    await activity.save();
  }
};

/**
 * Get activity list
 */
export const getActivityList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status = '', keyword = '' } = req.query;
    
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { location: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const skip = (Number(page) - 1) * Number(pageSize);
    
    const [list, total] = await Promise.all([
      Activity.find(query).skip(skip).limit(Number(pageSize)).sort({ createdAt: -1 }),
      Activity.countDocuments(query)
    ]);
    
    // Update activity status
    for (const activity of list) {
      await updateActivityStatus(activity);
    }
    
    const formattedList = list.map(activity => ({
      id: activity._id.toString(),
      title: activity.title,
      description: activity.description,
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.location,
      image: activity.image,
      status: activity.status,
      createdAt: activity.createdAt
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
 * Get activity detail
 */
export const getActivityDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const activity = await Activity.findById(id);
    
    if (!activity) {
      errorResponse(res, 404, '活动不存在', null);
      return;
    }
    
    // Update activity status
    await updateActivityStatus(activity);
    
    successResponse(res, {
      id: activity._id.toString(),
      title: activity.title,
      description: activity.description,
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.location,
      image: activity.image,
      status: activity.status,
      createdAt: activity.createdAt
    }, '获取成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', null);
  }
};

/**
 * Join activity
 */
export const joinActivity = async (req: AuthRequest, res: Response): Promise<void> => {
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
    
    const { activityId } = req.body;
    
    // Validate activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      errorResponse(res, 404, '活动不存在', null);
      return;
    }
    
    // Update activity status
    await updateActivityStatus(activity);
    
    // Check if activity is available for joining
    if (activity.status === 'ended') {
      errorResponse(res, 400, '活动已结束', null);
      return;
    }
    
    // Check if user already joined
    const existingEnrollment = await ActivityEnrollment.findOne({
      activityId,
      userId: req.user.userId
    });
    
    if (existingEnrollment) {
      if (existingEnrollment.status === 'joined') {
        errorResponse(res, 400, '您已报名该活动', null);
        return;
      } else if (existingEnrollment.status === 'cancelled') {
        // Rejoin the activity
        existingEnrollment.status = 'joined';
        await existingEnrollment.save();
        
        successResponse(res, {
          id: existingEnrollment._id.toString(),
          activityId: existingEnrollment.activityId.toString(),
          status: existingEnrollment.status,
          createdAt: existingEnrollment.createdAt
        }, '报名成功');
        return;
      }
    }
    
    // Create new enrollment
    const enrollment = new ActivityEnrollment({
      activityId,
      userId: req.user.userId,
      status: 'joined'
    });
    
    await enrollment.save();
    
    successResponse(res, {
      id: enrollment._id.toString(),
      activityId: enrollment.activityId.toString(),
      status: enrollment.status,
      createdAt: enrollment.createdAt
    }, '报名成功');
  } catch (error) {
    errorResponse(res, 500, '报名失败', null);
  }
};

/**
 * Get my activities
 */
export const getMyActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status = '' } = req.query;
    
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
    
    const skip = (Number(page) - 1) * Number(pageSize);
    
    const [enrollments, total] = await Promise.all([
      ActivityEnrollment.find(query).populate('activityId').skip(skip).limit(Number(pageSize)).sort({ createdAt: -1 }),
      ActivityEnrollment.countDocuments(query)
    ]);
    
    // Update activity status
    for (const enrollment of enrollments) {
      if (enrollment.activityId) {
        await updateActivityStatus(enrollment.activityId);
      }
    }
    
    const formattedList = enrollments.map(enrollment => ({
      id: enrollment._id.toString(),
      activityId: enrollment.activityId?._id.toString(),
      activityTitle: (enrollment.activityId as any)?.title,
      activityStartTime: (enrollment.activityId as any)?.startTime,
      activityEndTime: (enrollment.activityId as any)?.endTime,
      activityLocation: (enrollment.activityId as any)?.location,
      activityStatus: (enrollment.activityId as any)?.status,
      enrollmentStatus: enrollment.status,
      createdAt: enrollment.createdAt
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
 * Cancel activity enrollment
 */
export const cancelActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      errorResponse(res, 401, '未登录', null);
      return;
    }
    
    const enrollment = await ActivityEnrollment.findById(id);
    
    if (!enrollment) {
      errorResponse(res, 404, '报名记录不存在', null);
      return;
    }
    
    // Check if enrollment belongs to user
    if (enrollment.userId.toString() !== req.user.userId) {
      errorResponse(res, 403, '无权操作', null);
      return;
    }
    
    // Check if already cancelled
    if (enrollment.status === 'cancelled') {
      errorResponse(res, 400, '已取消报名', null);
      return;
    }
    
    // Validate activity exists
    const activity = await Activity.findById(enrollment.activityId);
    if (activity) {
      // Update activity status
      await updateActivityStatus(activity);
      
      // Check if activity is already ended
      if (activity.status === 'ended') {
        errorResponse(res, 400, '活动已结束，无法取消', null);
        return;
      }
    }
    
    // Update enrollment status
    enrollment.status = 'cancelled';
    await enrollment.save();
    
    successResponse(res, {
      id: enrollment._id.toString(),
      activityId: enrollment.activityId.toString(),
      status: enrollment.status
    }, '取消成功');
  } catch (error) {
    errorResponse(res, 500, '取消失败', null);
  }
};

// Validation rules
export const joinActivityValidation = [
  body('activityId').notEmpty().withMessage('活动ID不能为空')
];

export const createActivityValidation = [
  body('title').notEmpty().withMessage('活动标题不能为空').isLength({ max: 100 }).withMessage('活动标题不能超过100个字符'),
  body('description').notEmpty().withMessage('活动描述不能为空'),
  body('startTime').notEmpty().withMessage('活动开始时间不能为空').isISO8601().withMessage('活动开始时间格式错误'),
  body('endTime').notEmpty().withMessage('活动结束时间不能为空').isISO8601().withMessage('活动结束时间格式错误'),
  body('location').notEmpty().withMessage('活动地点不能为空')
];