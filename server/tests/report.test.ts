import { describe, expect, it } from 'vitest';
import { summarizeReadings } from '../src/utils/report.js';

describe('summarizeReadings', () => {
  it('returns highest, lowest, rounded average and count', () => {
    expect(summarizeReadings([{ value: 101 }, { value: 120 }, { value: 111 }])).toEqual({
      highest: 120, lowest: 101, average: 110.7, count: 3,
    });
  });

  it('returns null statistics for an empty period', () => {
    expect(summarizeReadings([])).toEqual({ highest: null, lowest: null, average: null, count: 0 });
  });
});
