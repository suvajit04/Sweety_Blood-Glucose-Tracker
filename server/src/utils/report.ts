export interface NumericReading {
  value: number;
}

export function summarizeReadings(readings: NumericReading[]) {
  if (readings.length === 0) {
    return { highest: null, lowest: null, average: null, count: 0 };
  }
  const values = readings.map((reading) => reading.value);
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: Math.round((total / values.length) * 10) / 10,
    count: values.length,
  };
}
