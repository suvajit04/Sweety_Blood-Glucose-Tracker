import { describe, expect, it } from 'vitest';
import { isValidDateOnly, monthToDateRange, previousMonthRange, formatDateOnly } from '../src/utils/date.js';

describe('date-only utilities', () => {
  it('accepts valid calendar dates and rejects impossible dates', () => {
    expect(isValidDateOnly('2024-02-29')).toBe(true);
    expect(isValidDateOnly('2025-02-29')).toBe(false);
    expect(isValidDateOnly('2026-13-01')).toBe(false);
    expect(isValidDateOnly('15-10-2026')).toBe(false);
  });

  it('creates an inclusive month-to-date range', () => {
    const range = monthToDateRange('2026-10-15');
    expect(formatDateOnly(range.start)).toBe('2026-10-01');
    expect(formatDateOnly(range.end)).toBe('2026-10-15');
  });

  it('handles previous month across a year boundary', () => {
    const range = previousMonthRange('2026-01-12');
    expect(formatDateOnly(range.start)).toBe('2025-12-01');
    expect(formatDateOnly(range.end)).toBe('2025-12-31');
  });
});
