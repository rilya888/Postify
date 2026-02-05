/**
 * Add months to a date (calendar months).
 * Handles month boundaries (e.g. Jan 31 + 1 month = Feb 28/29).
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
