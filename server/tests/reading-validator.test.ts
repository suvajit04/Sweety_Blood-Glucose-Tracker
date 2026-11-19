import { describe, expect, it } from 'vitest';
import { readingSchema } from '../src/validators/reading.validator.js';

describe('reading validation', () => {
  const valid = { date: '2026-10-15', timeSlot: 'AFTER_LUNCH', value: 112 };

  it('accepts a valid reading', () => {
    expect(readingSchema.safeParse(valid).success).toBe(true);
  });

  it('requires a whole-number value between 40 and 600', () => {
    expect(readingSchema.safeParse({ ...valid, value: undefined }).success).toBe(false);
    expect(readingSchema.safeParse({ ...valid, value: 39 }).success).toBe(false);
    expect(readingSchema.safeParse({ ...valid, value: 601 }).success).toBe(false);
    expect(readingSchema.safeParse({ ...valid, value: 90.5 }).success).toBe(false);
  });

  it('rejects invalid dates and invalid time slots', () => {
    expect(readingSchema.safeParse({ ...valid, date: '2026-02-30' }).success).toBe(false);
    expect(readingSchema.safeParse({ ...valid, timeSlot: 'MIDNIGHT' }).success).toBe(false);
  });
});
