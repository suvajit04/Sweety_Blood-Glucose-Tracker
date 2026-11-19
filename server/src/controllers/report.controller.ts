import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getDailyReport, getMonthToDateReport, getPreviousMonthReport, getMonthlyChart } from '../services/report.service.js';
import { AppError } from '../utils/app-error.js';

function userId(req: Request): string {
  const id = (req as AuthenticatedRequest).user?.id;
  if (!id) throw new AppError(401, 'Please log in to continue.');
  return id;
}

function queryDate(req: Request): string | undefined {
  const date = req.query.date;
  if (date === undefined) return undefined;
  if (typeof date !== 'string') throw new AppError(400, 'Date must be a single YYYY-MM-DD value.');
  return date;
}

export async function daily(req: Request, res: Response) {
  const report = await getDailyReport(userId(req), queryDate(req));
  res.status(200).json({ success: true, data: report });
}

export async function monthToDate(req: Request, res: Response) {
  const report = await getMonthToDateReport(userId(req), queryDate(req));
  res.status(200).json({ success: true, data: report });
}

export async function previousMonth(req: Request, res: Response) {
  const report = await getPreviousMonthReport(userId(req), queryDate(req));
  res.status(200).json({ success: true, data: report });
}

export async function monthlyChart(req: Request, res: Response) {
  const chart = await getMonthlyChart(userId(req), queryDate(req));
  res.status(200).json({ success: true, data: chart });
}
