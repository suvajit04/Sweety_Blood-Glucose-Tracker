import { TimeSlot } from '@prisma/client';
import { z } from 'zod';
import { isValidDateOnly } from '../utils/date.js';

const dateSchema = z.string().refine(isValidDateOnly, 'Please provide a valid date in YYYY-MM-DD format.');

export const readingSchema = z.object({
  date: dateSchema,
  timeSlot: z.nativeEnum(TimeSlot, { errorMap: () => ({ message: 'Please select a valid time slot.' }) }),
  value: z.number({ invalid_type_error: 'Please enter a glucose value.', required_error: 'Please enter a glucose value.' })
    .int('Value must be between 40 and 600 mg/dl.')
    .min(40, 'Value must be between 40 and 600 mg/dl.')
    .max(600, 'Value must be between 40 and 600 mg/dl.'),
});

export const readingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  date: dateSchema.optional(),
  timeSlot: z.nativeEnum(TimeSlot).optional(),
});
