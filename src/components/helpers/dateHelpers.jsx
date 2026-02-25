import { format, isSameDay } from "date-fns";

/**
 * Parse a YYYY-MM-DD date string as local midnight (avoids UTC shift off-by-one bug)
 */
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Format a date range for display (DD/MM/YYYY format)
 */
export const formatDateRange = (start, end) => {
  if (!start) return "Date not specified";
  const startDate = parseLocalDate(start);
  if (!startDate || isNaN(startDate.getTime())) return "Invalid date";

  const endDate = end ? parseLocalDate(end) : startDate;
  if (!endDate || isNaN(endDate.getTime())) return format(startDate, "dd/MM/yyyy");

  if (isSameDay(startDate, endDate)) return format(startDate, "dd/MM/yyyy");
  return `${format(startDate, "dd/MM")} - ${format(endDate, "dd/MM/yyyy")}`;
};