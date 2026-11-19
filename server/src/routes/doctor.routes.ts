import { Router } from 'express';
import { assign, daily, monthToDate, monthly, monthlyChart, patients, unassign } from '../controllers/doctor.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

export const doctorRouter = Router();
doctorRouter.use(requireAuth, requireRole('DOCTOR'));
doctorRouter.get('/patients', asyncHandler(patients));
doctorRouter.post('/patients', asyncHandler(assign));
doctorRouter.delete('/patients/:patientId', asyncHandler(unassign));
doctorRouter.get('/patients/:patientId/reports/daily', asyncHandler(daily));
doctorRouter.get('/patients/:patientId/reports/month-to-date', asyncHandler(monthToDate));
doctorRouter.get('/patients/:patientId/reports/monthly', asyncHandler(monthly));
doctorRouter.get('/patients/:patientId/reports/monthly-chart', asyncHandler(monthlyChart));
