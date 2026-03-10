import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getActivityList,
  getActivityDetail,
  joinActivity,
  getMyActivities,
  cancelActivity,
  joinActivityValidation
} from '../controllers/activityController';

const router = express.Router();

// Public routes
router.get('/list', getActivityList);
router.get('/detail/:id', getActivityDetail);

// Protected routes
router.post('/join', authMiddleware, joinActivityValidation, joinActivity);
router.get('/my-activities', authMiddleware, getMyActivities);
router.post('/cancel/:id', authMiddleware, cancelActivity);

export default router;