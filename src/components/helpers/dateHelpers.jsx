import { format, isSameDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Athens timezone (GMT+2 / GMT+3 in summer)
const ATHENS_TIMEZONE = 'Europe/Athens';

/**
 * Convert a date to Athens timezone
 */
export const toAthensTime = (date) => {
  return toZonedTime(date, ATHENS_TIMEZONE);
};

/**
 * Format a date range for display (DD/MM/YYYY format)
 */
export const formatDateRange = (start, end) => {
  if (!start) {
    return "Date not specified";
  }
  const startDate = toAthensTime(new Date(start));
  if (isNaN(startDate.getTime())) {
    return "Invalid date";
  }

  const endDate = end ? toAthensTime(new Date(end)) : startDate;
  if (isNaN(endDate.getTime())) {
    return format(startDate, "dd/MM/yyyy");
  }

  if (isSameDay(startDate, endDate)) {
    return format(startDate, "dd/MM/yyyy");
  }
  return `${format(startDate, "dd/MM")} - ${format(endDate, "dd/MM/yyyy")}`;
};