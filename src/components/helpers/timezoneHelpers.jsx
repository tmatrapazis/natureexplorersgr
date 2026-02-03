import moment from 'moment-timezone';

// Athens timezone constant
export const ATHENS_TIMEZONE = 'Europe/Athens';

/**
 * Get current date/time in Athens timezone
 */
export const getAthensNow = () => {
  return moment.tz(ATHENS_TIMEZONE);
};

/**
 * Convert any date to Athens timezone
 */
export const toAthensTime = (date) => {
  return moment.tz(date, ATHENS_TIMEZONE);
};

/**
 * Format date in Athens timezone
 */
export const formatAthensDate = (date, format = 'YYYY-MM-DD') => {
  return moment.tz(date, ATHENS_TIMEZONE).format(format);
};

/**
 * Format datetime in Athens timezone
 */
export const formatAthensDateTime = (date, format = 'YYYY-MM-DD HH:mm') => {
  return moment.tz(date, ATHENS_TIMEZONE).format(format);
};

/**
 * Get start of day in Athens timezone
 */
export const getAthensStartOfDay = (date) => {
  return moment.tz(date, ATHENS_TIMEZONE).startOf('day');
};

/**
 * Get end of day in Athens timezone
 */
export const getAthensEndOfDay = (date) => {
  return moment.tz(date, ATHENS_TIMEZONE).endOf('day');
};

/**
 * Check if date is in the past (Athens timezone)
 */
export const isInPastAthens = (date) => {
  return moment.tz(date, ATHENS_TIMEZONE).isBefore(getAthensNow());
};

/**
 * Check if date is today (Athens timezone)
 */
export const isTodayAthens = (date) => {
  return moment.tz(date, ATHENS_TIMEZONE).isSame(getAthensNow(), 'day');
};

/**
 * Get date input value in Athens timezone (YYYY-MM-DD format)
 */
export const getDateInputValue = (date) => {
  if (!date) return '';
  return moment.tz(date, ATHENS_TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Parse date input value to Athens timezone
 */
export const parseDateInput = (dateString) => {
  if (!dateString) return null;
  return moment.tz(dateString, 'YYYY-MM-DD', ATHENS_TIMEZONE).toDate();
};