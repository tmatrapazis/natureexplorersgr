/**
 * Shared app-wide constants.
 * Import from here instead of defining locally in multiple files.
 */

// Booking status badge styles — used in BookingCard.jsx and MyBookings.jsx
export const STATUS_STYLES = {
  pending:   'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid:      'bg-[#f0e3c7]/40 text-[#0c281c] border-[#0c281c]/20',
  declined:  'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-muted text-muted-foreground border-border',
};
