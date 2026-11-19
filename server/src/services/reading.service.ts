import { Prisma, TimeSlot } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { invalidateUserReportCache } from '../config/redis.js';
import { AppError } from '../utils/app-error.js';
import { assertNotFutureDate, parseDateOnly } from '../utils/date.js';
import { readingSchema } from '../validators/reading.validator.js';

export interface ReadingInput {
  date: string;
  timeSlot: TimeSlot;
  value: number;
}

function validateInput(input: unknown): ReadingInput {
  const parsed = readingSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Please check the reading details.',
      parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })));
  }
  assertNotFutureDate(parsed.data.date);
  return parsed.data;
}

function slotLabel(slot: TimeSlot): string {
  return {
    MORNING_FASTING: 'Morning (fasting)',
    AFTER_BREAKFAST: 'After breakfast',
    AFTER_LUNCH: 'After lunch',
    AFTER_DINNER: 'After dinner',
  }[slot];
}

function duplicateSlotMessage(slot: TimeSlot): string {
  const label = slotLabel(slot);
  const article = label.startsWith('After') ? 'an' : 'a';
  return `You already have ${article} ${label} reading for this date.`;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function createReading(userId: string, body: unknown) {
  const input = validateInput(body);
  const date = parseDateOnly(input.date);

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Serializes writes for one user so concurrent requests cannot create a fifth entry.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const existingSlot = await tx.reading.findFirst({
        where: { userId, date, timeSlot: input.timeSlot },
        select: { id: true },
      });
      if (existingSlot) throw new AppError(409, duplicateSlotMessage(input.timeSlot));
      const count = await tx.reading.count({ where: { userId, date } });
      if (count >= 4) throw new AppError(409, 'You can add only 4 readings per day.');
      return tx.reading.create({ data: { userId, date, timeSlot: input.timeSlot, value: input.value } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    await invalidateUserReportCache(userId);
    return created;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, duplicateSlotMessage(input.timeSlot));
    }
    throw error;
  }
}

export async function listReadings(userId: string, options: {
  page: number; limit: number; date?: string; timeSlot?: TimeSlot;
}) {
  const where: Prisma.ReadingWhereInput = { userId };
  if (options.date) where.date = parseDateOnly(options.date);
  if (options.timeSlot) where.timeSlot = options.timeSlot;

  const [items, total] = await prisma.$transaction([
    prisma.reading.findMany({
      where,
      orderBy: [{ date: 'desc' }, { timeSlot: 'asc' }],
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.reading.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}

export async function getReading(userId: string, readingId: string) {
  const reading = await prisma.reading.findFirst({ where: { id: readingId, userId } });
  if (!reading) throw new AppError(404, 'Reading not found.');
  return reading;
}

export async function updateReading(userId: string, readingId: string, body: unknown) {
  const input = validateInput(body);
  const date = parseDateOnly(input.date);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const current = await tx.reading.findFirst({ where: { id: readingId, userId } });
      if (!current) throw new AppError(404, 'Reading not found.');

      const duplicate = await tx.reading.findFirst({
        where: { userId, date, timeSlot: input.timeSlot, NOT: { id: readingId } },
        select: { id: true },
      });
      if (duplicate) {
        throw new AppError(409, duplicateSlotMessage(input.timeSlot));
      }

      const count = await tx.reading.count({ where: { userId, date, NOT: { id: readingId } } });
      if (count >= 4) throw new AppError(409, 'You can add only 4 readings per day.');

      return tx.reading.update({
        where: { id: readingId },
        data: { date, timeSlot: input.timeSlot, value: input.value },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    await invalidateUserReportCache(userId);
    return updated;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, duplicateSlotMessage(input.timeSlot));
    }
    throw error;
  }
}

export async function deleteReading(userId: string, readingId: string) {
  const result = await prisma.reading.deleteMany({ where: { id: readingId, userId } });
  if (result.count === 0) throw new AppError(404, 'Reading not found.');
  await invalidateUserReportCache(userId);
  return { id: readingId };
}
