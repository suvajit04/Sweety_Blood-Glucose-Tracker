import { prisma } from '../config/prisma.js';
import { getCached } from '../config/redis.js';
import { formatDateOnly, monthToDateRange, parseDateOnly, previousMonthRange, todayInAppTimeZone } from '../utils/date.js';
import { summarizeReadings } from '../utils/report.js';

function selectedDateOrToday(value?: string): string {
  const selected = value ?? todayInAppTimeZone();
  parseDateOnly(selected);
  return selected;
}

export async function getDailyReport(userId: string, dateParam?: string) {
  const selectedDate = selectedDateOrToday(dateParam);
  return getCached(`reports:${userId}:daily:${selectedDate}`, async () => {
    const date = parseDateOnly(selectedDate);
    const readings = await prisma.reading.findMany({
      where: { userId, date },
      orderBy: { timeSlot: 'asc' },
      select: { id: true, date: true, timeSlot: true, value: true, createdAt: true, updatedAt: true },
    });
    return {
      type: 'daily' as const,
      date: selectedDate,
      dateRange: { start: selectedDate, end: selectedDate },
      ...summarizeReadings(readings),
      readings: readings.map((reading) => ({ ...reading, date: formatDateOnly(reading.date) })),
    };
  });
}

export async function getMonthToDateReport(userId: string, dateParam?: string) {
  const selectedDate = selectedDateOrToday(dateParam);
  return getCached(`reports:${userId}:month-to-date:${selectedDate}`, async () => {
    const range = monthToDateRange(selectedDate);
    const readings = await prisma.reading.findMany({ where: { userId, date: { gte: range.start, lte: range.end } } });
    return {
      type: 'month-to-date' as const,
      dateRange: { start: formatDateOnly(range.start), end: selectedDate },
      ...summarizeReadings(readings),
    };
  });
}

export async function getPreviousMonthReport(userId: string, dateParam?: string) {
  const selectedDate = selectedDateOrToday(dateParam);
  return getCached(`reports:${userId}:previous-month:${selectedDate}`, async () => {
    const range = previousMonthRange(selectedDate);
    const readings = await prisma.reading.findMany({ where: { userId, date: { gte: range.start, lte: range.end } } });
    return {
      type: 'previous-month' as const,
      dateRange: { start: formatDateOnly(range.start), end: formatDateOnly(range.end) },
      ...summarizeReadings(readings),
    };
  });
}

export async function getMonthlyChart(userId: string, dateParam?: string) {
  const selectedDate = selectedDateOrToday(dateParam);
  return getCached(`reports:${userId}:monthly-chart:${selectedDate.slice(0, 7)}`, async () => {
    const start = parseDateOnly(`${selectedDate.slice(0, 7)}-01`);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
    const readings = await prisma.reading.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { date: true, value: true },
      orderBy: { date: 'asc' },
    });
    const grouped = new Map<string, number[]>();
    for (const reading of readings) {
      const key = formatDateOnly(reading.date);
      const values = grouped.get(key) ?? [];
      values.push(reading.value);
      grouped.set(key, values);
    }
    const data = [...grouped.entries()].map(([date, values]) => ({
      date,
      average: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10,
      highest: Math.max(...values),
      lowest: Math.min(...values),
      count: values.length,
    }));
    return { month: selectedDate.slice(0, 7), data };
  });
}
