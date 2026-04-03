/**
 * Calculate booking statistics for a trip
 */
export const getBookingStats = (allBookings, tripId, totalSlots) => {
  const confirmedBookings = allBookings.filter(b => b.trip_id === tripId && b.status === "confirmed");
  const bookedSlots = confirmedBookings.reduce((sum, b) => sum + (b.number_of_people || 0), 0);
  const availableSlots = totalSlots - bookedSlots;
  const percentageAvailable = totalSlots > 0 ? Math.round((availableSlots / totalSlots) * 100) : 0;
  
  return {
    availableSlots,
    bookedSlots,
    percentageAvailable,
    confirmedBookings
  };
};

/**
 * Get booking status configuration for display
 */
export const bookingStatusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending Approval" },
  confirmed: { color: "bg-emerald-100 text-emerald-800", label: "Confirmed" },
  declined: { color: "bg-red-100 text-red-800", label: "Declined" },
  cancelled: { color: "border-red-300 text-red-700", label: "Trip Cancelled" },
  completed: { variant: "outline", label: "Completed"},
};

/**
 * Get trip insights for organizers
 */
export const getTripInsights = (tripId, allBookings) => {
  const bookings = allBookings.filter(b => b.trip_id === tripId);
  return {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    paid: bookings.filter(b => b.status === 'paid').length,
    declined: bookings.filter(b => b.status === 'declined').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };
};