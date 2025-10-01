// generate-rent-period.util.js
import dayjs from 'dayjs';

/**
 * Return DB-friendly string for storage (period_covered).
 * Example: "09/29/2025 - 10/28/2025"
 */
export function formatPeriodString(startDate, days = 30) {
  const s = dayjs(startDate);
  const e = s.add(days - 1, 'day');
  return `${s.format('MM/DD/YYYY')} - ${e.format('MM/DD/YYYY')}`;
}

/**
 * Return structured object for API / notifications.
 * { start: Date, end: Date }
 */
export function buildPeriodObject(startDate, days = 30) {
  const s = dayjs(startDate);
  const e = s.add(days - 1, 'day');
  return { start: s.toDate(), end: e.toDate() };
}
