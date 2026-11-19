import { Router } from 'express';
import { create, getOne, list, remove, todaySummary, update } from '../controllers/reading.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

export const readingRouter = Router();
readingRouter.use(requireAuth, requireRole('PATIENT'));
readingRouter.post('/', asyncHandler(create));
readingRouter.get('/', asyncHandler(list));
readingRouter.get('/today-summary', asyncHandler(todaySummary));
readingRouter.get('/:id', asyncHandler(getOne));
readingRouter.put('/:id', asyncHandler(update));
readingRouter.delete('/:id', asyncHandler(remove));

