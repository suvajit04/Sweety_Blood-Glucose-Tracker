import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { assertAssignedPatient, assignPatientByEmail, listAssignedPatients, unassignPatient } from '../services/doctor.service.js';
import { getDailyReport, getMonthToDateReport, getMonthlyChart, getPreviousMonthReport } from '../services/report.service.js';
import { AppError } from '../utils/app-error.js';

const assignSchema = z.object({ email: z.string().email('Enter a valid patient email address.') });
function doctorId(req: Request): string {
  const id = (req as AuthenticatedRequest).user?.id;
  if (!id) throw new AppError(401, 'Please log in to continue.');
  return id;
}
function patientId(req: Request): string {
  const id = z.string().uuid().safeParse(req.params.patientId);
  if (!id.success) throw new AppError(400, 'Invalid patient ID.');
  return id.data;
}
function queryDate(req: Request): string | undefined {
  const date = req.query.date;
  if (date === undefined) return undefined;
  if (typeof date !== 'string') throw new AppError(400, 'Date must be a single YYYY-MM-DD value.');
  return date;
}

export async function patients(_req: Request, res: Response) {
  res.status(200).json({ success: true, data: await listAssignedPatients(doctorId(_req)) });
}
export async function assign(req: Request, res: Response) {
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0]?.message ?? 'Invalid patient email.');
  const patient = await assignPatientByEmail(doctorId(req), parsed.data.email);
  res.status(201).json({ success: true, message: 'Patient assigned successfully.', data: patient });
}
export async function unassign(req: Request, res: Response) {
  await unassignPatient(doctorId(req), patientId(req));
  res.status(200).json({ success: true, message: 'Patient unassigned.', data: null });
}

async function assignedId(req: Request) {
  const id = patientId(req);
  await assertAssignedPatient(doctorId(req), id);
  return id;
}
export async function daily(req: Request, res: Response) {
  res.status(200).json({ success: true, data: await getDailyReport(await assignedId(req), queryDate(req)) });
}
export async function monthToDate(req: Request, res: Response) {
  res.status(200).json({ success: true, data: await getMonthToDateReport(await assignedId(req), queryDate(req)) });
}
export async function monthly(req: Request, res: Response) {
  res.status(200).json({ success: true, data: await getPreviousMonthReport(await assignedId(req), queryDate(req)) });
}
export async function monthlyChart(req: Request, res: Response) {
  res.status(200).json({ success: true, data: await getMonthlyChart(await assignedId(req), queryDate(req)) });
}
