import { env } from '../config/env.js';
import { AppError } from './app-error.js';

export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day;
}

export function parseDateOnly(value: string): Date {
  if (!isValidDateOnly(value)) throw new AppError(400, 'Please provide a valid date in YYYY-MM-DD format.');
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function todayInAppTimeZone(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: env.APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function assertNotFutureDate(date: string): void {
  if (date > todayInAppTimeZone()) throw new AppError(400, 'Date cannot be in the future.');
}

export function previousMonthRange(selectedDate: string): { start: Date; end: Date } {
  const [year, month] = selectedDate.split('-').map(Number);
  const selectedMonthStart = new Date(Date.UTC(year!, month! - 1, 1));
  const start = new Date(Date.UTC(year!, month! - 2, 1));
  const end = new Date(selectedMonthStart.getTime() - 86_400_000);
  return { start, end };
}

export function monthToDateRange(selectedDate: string): { start: Date; end: Date } {
  const [year, month, day] = selectedDate.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year!, month! - 1, 1)),
    end: new Date(Date.UTC(year!, month! - 1, day!)),
  };
}
