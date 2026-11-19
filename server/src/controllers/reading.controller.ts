import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createReading, deleteReading, getReading, listReadings, updateReading } from '../services/reading.service.js';
import { readingQuerySchema } from '../validators/reading.validator.js';
import { AppError } from '../utils/app-error.js';

function userId(req: Request): string {
  const id = (req as AuthenticatedRequest).user?.id;
  if (!id) throw new AppError(401, 'Please log in to continue.');
  return id;
}

function parseId(value: string): string {
  const parsed = z.string().uuid().safeParse(value);
  if (!parsed.success) throw new AppError(400, 'Invalid reading ID.');
  return value;
}

export async function create(req: Request, res: Response) {
  const reading = await createReading(userId(req), req.body);
  res.status(201).json({ success: true, message: 'Reading created successfully.', data: reading });
}

export async function list(req: Request, res: Response) {
  const parsed = readingQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0]?.message ?? 'Invalid filters.', parsed.error.issues);
  const result = await listReadings(userId(req), parsed.data);
  res.status(200).json({ success: true, data: result.items, meta: result.pagination });
}

export async function getOne(req: Request, res: Response) {
  const reading = await getReading(userId(req), parseId(req.params.id));
  res.status(200).json({ success: true, data: reading });
}

export async function update(req: Request, res: Response) {
  const reading = await updateReading(userId(req), parseId(req.params.id), req.body);
  res.status(200).json({ success: true, message: 'Reading updated successfully.', data: reading });
}

export async function remove(req: Request, res: Response) {
  await deleteReading(userId(req), parseId(req.params.id));
  res.status(200).json({ success: true, message: 'Reading deleted successfully.', data: null });
}
