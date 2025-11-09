import { format, isSameDay } from "date-fns";

/**
 * Format a date range for display (DD/MM/YYYY format)
 */
export const formatDateRange = (start, end) => {
  if (!start) {
    return "Date not specified";
  }
  const startDate = new Date(start);
  if (isNaN(startDate.getTime())) {
    return "Invalid date";
  }

  const endDate = end ? new Date(end) : startDate;
  if (isNaN(endDate.getTime())) {
    return format(startDate, "dd/MM/yyyy");
  }

  if (isSameDay(startDate, endDate)) {
    return format(startDate, "dd/MM/yyyy");
  }
  return `${format(startDate, "dd/MM")} - ${format(endDate, "dd/MM/yyyy")}`;
};