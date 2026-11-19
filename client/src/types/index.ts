export interface User {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR';
}

export type TimeSlot = 'MORNING_FASTING' | 'AFTER_BREAKFAST' | 'AFTER_LUNCH' | 'AFTER_DINNER';

export interface Reading {
  id: string;
  userId: string;
  date: string;
  timeSlot: TimeSlot;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  highest: number | null;
  lowest: number | null;
  average: number | null;
  count: number;
}

export interface DailyReport extends Summary {
  type: 'daily';
  date: string;
  dateRange: { start: string; end: string };
  readings: Reading[];
}

export interface PeriodReport extends Summary {
  type: 'month-to-date' | 'previous-month';
  dateRange: { start: string; end: string };
}

export const TIME_SLOTS: { value: TimeSlot; label: string }[] = [
  { value: 'MORNING_FASTING', label: 'Morning (fasting)' },
  { value: 'AFTER_BREAKFAST', label: 'After breakfast' },
  { value: 'AFTER_LUNCH', label: 'After lunch' },
  { value: 'AFTER_DINNER', label: 'After dinner' },
];

export function slotLabel(slot: TimeSlot): string {
  return TIME_SLOTS.find((item) => item.value === slot)?.label ?? slot;
}


export interface ChartPoint {
  date: string;
  average: number;
  highest: number;
  lowest: number;
  count: number;
}
