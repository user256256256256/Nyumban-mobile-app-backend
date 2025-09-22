import dayjs from 'dayjs';

/**
 * Generate a billing period string like "09/01/2025 - 09/30/2025"
 * @param {Date} date - Any date within the target month
 * @returns {string}
 */
export function generatePeriodCovered(date) {
  const d = dayjs(date);
  if (!d.isValid()) {
    console.warn('[generatePeriodCovered] Invalid date:', date);
    return 'Invalid Period';
  }
  return `${d.startOf('month').format('MM/DD/YYYY')} - ${d.endOf('month').format('MM/DD/YYYY')}`;
}
