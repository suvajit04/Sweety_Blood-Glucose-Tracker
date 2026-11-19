import { Router } from 'express';
import { daily, monthToDate, monthlyChart, previousMonth } from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

export const reportRouter = Router();
reportRouter.use(requireAuth);
reportRouter.get('/daily', asyncHandler(daily));
reportRouter.get('/month-to-date', asyncHandler(monthToDate));
reportRouter.get('/monthly', asyncHandler(previousMonth));
reportRouter.get('/monthly-chart', asyncHandler(monthlyChart));
