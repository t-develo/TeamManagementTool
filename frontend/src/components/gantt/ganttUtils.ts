export const GANTT_CONFIG = { dayWidth: 32, rowHeight: 40, headerHeight: 72 };

export function diffInDays(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}
